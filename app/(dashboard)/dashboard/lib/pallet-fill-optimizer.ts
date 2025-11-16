import type { TruckProfile, Pallet as PhysicsPallet, WeightDistribution } from '@/lib/load-calculator/types';
import { calculateWeightDistribution } from '@/lib/load-calculator/physics';
import type { Load } from '../hooks/use-loads-store';

const MM_IN_METER = 1000;

interface UsableDimensions {
  usableX: number;
  usableY: number;
  usableLength: number;
  usableWidth: number;
}

interface OptimiseInput {
  truckProfile: TruckProfile;
  bodyStartPosition: number; // mm from front of truck to body front
  usableDimensions: UsableDimensions; // mm
  palletLength: number; // mm
  palletWidth: number; // mm
  weights: number[];
  existingLoads: Load[];
  replaceExisting: boolean;
  maxPallets?: number;
}

export interface OptimiseResult {
  generatedLoads: Load[];
  unplacedWeights: number[];
  distribution?: WeightDistribution;
}

interface SlotInfo {
  x: number;
  y: number;
  row: number;
  column: number;
  relativeX: number;
  relativeY: number;
  side: 'left' | 'right' | 'center';
}

export function optimisePalletFill({
  truckProfile,
  bodyStartPosition,
  usableDimensions,
  palletLength,
  palletWidth,
  weights,
  existingLoads,
  replaceExisting,
  maxPallets,
}: OptimiseInput): OptimiseResult {
  const usableLength = usableDimensions.usableLength;
  const usableWidth = usableDimensions.usableWidth;

  const columns = Math.floor(usableLength / palletLength);
  const rows = Math.floor(usableWidth / palletWidth);

  if (columns <= 0 || rows <= 0) {
    return { generatedLoads: [], unplacedWeights: weights };
  }

  const totalSlots = columns * rows;
  const slotLimit = Math.min(
    totalSlots,
    maxPallets && maxPallets > 0 ? maxPallets : totalSlots,
  );

  if (slotLimit === 0) {
    return { generatedLoads: [], unplacedWeights: weights };
  }

  const slots = createSlots({
    columns,
    rows,
    palletLength,
    palletWidth,
    bodyStartPosition,
    usableDimensions,
  });

  const baseLoads = replaceExisting ? [] : existingLoads;
  const assignedLoads: Load[] = [];
  const assignedSlotIndices: number[] = [];
  const unplacedWeights: number[] = [];
  const usedSlots = new Set<number>();

  const weightsSorted = [...weights]
    .filter((weight) => weight > 0)
    .sort((a, b) => b - a)
    .slice(0, slotLimit);

  const baseDistribution = computeDistribution({
    truckProfile,
    bodyStartPosition,
    loads: baseLoads,
  });

  let bestDistribution = baseDistribution;

  for (const weight of weightsSorted) {
    let bestSlotIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestCandidateLoad: Load | undefined;
    let candidateDistribution: WeightDistribution | undefined;

    for (let index = 0; index < slots.length; index++) {
      if (usedSlots.has(index)) continue;
      const slot = slots[index];
      const newLoad = createLoad(weight, slot.x, slot.y, palletLength, palletWidth);
      const candidateLoads = [...assignedLoads, newLoad];

      const slotIndices = [...assignedSlotIndices, index];

      const distribution = computeDistribution({
        truckProfile,
        bodyStartPosition,
        loads: [...baseLoads, ...candidateLoads],
      });

      const score = calculatePenalty(distribution, truckProfile, {
        slot,
        slotIndices,
        slots,
      });

      if (score < bestScore) {
        bestScore = score;
        bestSlotIndex = index;
        bestCandidateLoad = newLoad;
        candidateDistribution = distribution;
      }
    }

    if (bestSlotIndex >= 0 && bestCandidateLoad) {
      usedSlots.add(bestSlotIndex);
      assignedLoads.push(bestCandidateLoad);
      assignedSlotIndices.push(bestSlotIndex);
      if (candidateDistribution) {
        bestDistribution = candidateDistribution;
      }
    } else {
      unplacedWeights.push(weight);
    }
  }

  return {
    generatedLoads: assignedLoads,
    unplacedWeights,
    distribution: bestDistribution,
  };
}

function createSlots({
  columns,
  rows,
  palletLength,
  palletWidth,
  bodyStartPosition,
  usableDimensions,
}: {
  columns: number;
  rows: number;
  palletLength: number;
  palletWidth: number;
  bodyStartPosition: number;
  usableDimensions: UsableDimensions;
}): SlotInfo[] {
  const slots: SlotInfo[] = [];
  const originX = bodyStartPosition + usableDimensions.usableX;
  const originY = usableDimensions.usableY;

  // No horizontal padding - place pallets against front headboard
  const horizontalPadding = 0;
  
  // Center pallets vertically (left-right) for load balance
  const verticalPadding = Math.max(
    0,
    (usableDimensions.usableWidth - rows * palletWidth) / 2,
  );

  const halfWidth = usableDimensions.usableWidth / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = originX + horizontalPadding + col * palletLength;
      const y = originY + verticalPadding + row * palletWidth;
      const relativeX = (x - originX) / Math.max(1, usableDimensions.usableLength);
      const relativeY = (y - originY) / Math.max(1, usableDimensions.usableWidth);
      const centerLine = originY + halfWidth;
      const slotCenterY = y + palletWidth / 2;
      const side =
        Math.abs(slotCenterY - centerLine) < palletWidth / 4
          ? 'center'
          : slotCenterY < centerLine
            ? 'left'
            : 'right';

      slots.push({
        x,
        y,
        row,
        column: col,
        relativeX,
        relativeY,
        side,
      });
    }
  }

  return slots;
}

function createLoad(
  weight: number,
  x: number,
  y: number,
  length: number,
  width: number,
): Load {
  return {
    id: `autofill-${Date.now()}-${Math.random()}`,
    x,
    y,
    length,
    width,
    weight,
  };
}

function computeDistribution({
  truckProfile,
  bodyStartPosition,
  loads,
}: {
  truckProfile: TruckProfile;
  bodyStartPosition: number;
  loads: Load[];
}): WeightDistribution {
  const pallets: PhysicsPallet[] = loads.map((load) => ({
    id: load.id,
    length: load.length / MM_IN_METER,
    width: load.width / MM_IN_METER,
    weight: load.weight,
    x: (load.x - bodyStartPosition) / MM_IN_METER,
    y: load.y / MM_IN_METER,
  }));

  return calculateWeightDistribution(truckProfile, pallets);
}

interface PenaltyContext {
  slot: SlotInfo;
  slotIndices: number[];
  slots: SlotInfo[];
}

function calculatePenalty(
  distribution: WeightDistribution,
  truck: TruckProfile,
  context?: PenaltyContext,
) {
  const frontOver = Math.max(
    0,
    distribution.front_axle_weight - truck.front_axle_limit,
  );
  const rearOver = Math.max(
    0,
    distribution.rear_axle_weight - truck.rear_axle_limit,
  );
  const gvmOver = Math.max(0, distribution.total_weight - truck.gvm);
  const balanceDelta = Math.abs(
    distribution.front_axle_percentage - distribution.rear_axle_percentage,
  );

  const overPenalty =
    frontOver * 1000 + rearOver * 1000 + gvmOver * 500;

  let penalty = overPenalty + balanceDelta;

  const frontRelief = Math.max(0, distribution.front_axle_percentage - 85);
  penalty += frontRelief * 10;

  if (context) {
    const { slot, slotIndices, slots } = context;

    // Encourage filling towards the front wall (smaller relativeX)
    penalty += slot.relativeX * 50;

    // Prefer passenger/left side (smaller relativeY)
    if (slot.side === 'right') {
      penalty += 30;
    } else if (slot.side === 'center') {
      penalty += 10;
    }

    // Symmetry penalty: discourage large difference between sides
    let leftCount = 0;
    let rightCount = 0;
    slotIndices.forEach((index) => {
      const s = slots[index];
      if (s.side === 'left') leftCount += 1;
      else if (s.side === 'right') rightCount += 1;
    });

    const asymmetry = Math.max(0, Math.abs(leftCount - rightCount) - 1);
    penalty += asymmetry * 40;
  }

  return penalty;
}

