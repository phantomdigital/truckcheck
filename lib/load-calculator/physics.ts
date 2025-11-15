/**
 * Physics calculations for weight distribution
 * 
 * Basic principle:
 * - Calculate centre of gravity (COG) of all pallets
 * - Use moments to determine weight distribution between axles
 * - Moment = Force × Distance
 */

import type { TruckProfile, Pallet, WeightDistribution } from './types'
import { SuspensionType, BodyType } from './types'

/**
 * Default wall thickness based on body type (metres)
 * Used when wall thickness is not specified in truck profile
 */
export const DEFAULT_WALL_THICKNESS: Record<BodyType, { front: number; rear: number; sides: number }> = {
  [BodyType.TRAY]: { front: 0.0, rear: 0.0, sides: 0.0 }, // No walls
  [BodyType.PANTECH]: { front: 0.03, rear: 0.03, sides: 0.03 }, // Default 30mm walls
  [BodyType.CURTAINSIDER]: { front: 0.0, rear: 0.0, sides: 0.0 }, // Curtains, no walls
  [BodyType.REFRIGERATED]: { front: 0.03, rear: 0.03, sides: 0.03 }, // Default 30mm insulated walls (can be thicker)
  [BodyType.TIPPER]: { front: 0.03, rear: 0.0, sides: 0.03 }, // Default 30mm walls at front/sides
  [BodyType.TANKER]: { front: 0.0, rear: 0.0, sides: 0.0 }, // No walls (tank is the body)
}

/**
 * Minimum spacing between pallets (metres)
 * Reduced for more precise placement - allows pallets to be placed very close together
 * Accounts for:
 * - Pallet tolerance/overhang (typically 5-10mm)
 * - Small safety margin for realistic loading
 */
const MIN_PALLET_SPACING = 0.01 // 10mm minimum spacing (allows very tight placement)

/**
 * Calculate usable loading area dimensions accounting for wall thickness
 * Uses truck-specific wall thickness if provided, otherwise defaults based on body type
 */
export function getUsableDimensions(truck: TruckProfile): {
  usableLength: number
  usableWidth: number
  usableX: number // Offset from body front
  usableY: number // Offset from body left
} {
  const defaults = DEFAULT_WALL_THICKNESS[truck.body_type]
  
  // Use truck-specific values if provided, otherwise use defaults
  const walls = {
    front: truck.wall_thickness_front ?? defaults.front,
    rear: truck.wall_thickness_rear ?? defaults.rear,
    sides: truck.wall_thickness_sides ?? defaults.sides,
  }
  
  return {
    usableLength: truck.body_length - walls.front - walls.rear,
    usableWidth: truck.body_width - walls.sides * 2,
    usableX: walls.front,
    usableY: walls.sides,
  }
}

/**
 * Calculate the centre of gravity of all pallets
 * Returns distance from front of body (metres)
 */
export function calculateLoadCOG(pallets: Pallet[]): { x: number; y: number } {
  if (pallets.length === 0) {
    return { x: 0, y: 0 }
  }

  let totalWeight = 0
  let momentX = 0
  let momentY = 0

  for (const pallet of pallets) {
    // COG of pallet is at its centre
    const palletCogX = pallet.x + pallet.length / 2
    const palletCogY = pallet.y + pallet.width / 2

    momentX += pallet.weight * palletCogX
    momentY += pallet.weight * palletCogY
    totalWeight += pallet.weight
  }

  return {
    x: momentX / totalWeight,
    y: momentY / totalWeight,
  }
}

/**
 * Calculate suspension compression for a given axle load and suspension type
 * 
 * Returns compression in metres
 * 
 * @param axleLoad - Total axle load including tare (kg)
 * @param suspensionType - Type of suspension (TAPER_LEAF, STEEL, or AIRBAG)
 * @returns Compression in metres
 */
function calculateSuspensionCompression(
  axleLoad: number,
  suspensionType: SuspensionType
): number {
  switch (suspensionType) {
    case SuspensionType.TAPER_LEAF:
      // Taper-leaf springs (typically front axle - FVD: Meritor FG941)
      // Stiffer than multi-leaf: ~0.05mm per 100kg
      // Max compression: ~20mm (0.02m)
      const TAPER_LEAF_RATE = 0.0005 // 0.5mm per 100kg
      const taperCompression = (axleLoad / 100) * TAPER_LEAF_RATE
      return Math.min(taperCompression, 0.02) // Max 20mm
      
    case SuspensionType.STEEL:
      // Multi-leaf steel springs (typically rear axle)
      // Medium stiffness: ~0.1mm per 100kg
      // Max compression: ~10mm (0.01m)
      const STEEL_RATE = 0.0001 // 0.1mm per 100kg
      const steelCompression = (axleLoad / 100) * STEEL_RATE
      return Math.min(steelCompression, 0.01) // Max 10mm
      
    case SuspensionType.AIRBAG:
      // Airbag suspension (FVD rear: Hendrickson HAS230)
      // Softest, non-linear: ~0.8mm per 100kg base rate
      // Non-linear: compression rate increases by 10% per 2000kg
      // (airbags become stiffer as they compress)
      // Max compression: ~150mm (0.15m)
      const BASE_AIRBAG_RATE = 0.0008 // 0.8mm per 100kg
      const nonLinearFactor = 1 + (axleLoad / 2000) * 0.1
      const airbagRate = BASE_AIRBAG_RATE * nonLinearFactor
      const airbagCompression = (axleLoad / 100) * airbagRate
      return Math.min(airbagCompression, 0.15) // Max 150mm
      
    default:
      return 0
  }
}

/**
 * Calculate mixed suspension effect on weight distribution (FVD-specific)
 * 
 * For mixed suspension setups (e.g., taper-leaf front + airbag rear):
 * 1. Front suspension compresses under front axle load
 * 2. Rear suspension compresses under rear axle load  
 * 3. Differential compression creates pitch angle
 * 4. Pitch angle shifts COG horizontally, redistributing weight
 * 
 * This models the REAL FVD setup:
 * - Front: Meritor FG941 taper-leaf (6,600kg capacity, stiffer)
 * - Rear: Hendrickson HAS230 airbag (10,400kg capacity, softer)
 * 
 * @param frontAxleLoad - Total front axle load including tare (kg)
 * @param rearAxleLoad - Total rear axle load including tare (kg)
 * @param frontSuspension - Front suspension type
 * @param rearSuspension - Rear suspension type
 * @param wheelbase - Wheelbase distance (m)
 * @param loadCOGHeight - Estimated center of gravity height (m)
 * @returns Weight shift amount from front to rear in kg
 */
function calculateMixedSuspensionEffect(
  frontAxleLoad: number,
  rearAxleLoad: number,
  frontSuspension: SuspensionType,
  rearSuspension: SuspensionType,
  wheelbase: number,
  loadCOGHeight: number = 1.2
): number {
  // Calculate compression at each axle
  const frontCompression = calculateSuspensionCompression(frontAxleLoad, frontSuspension)
  const rearCompression = calculateSuspensionCompression(rearAxleLoad, rearSuspension)
  
  // Calculate differential compression
  // Positive = rear compresses more than front (typical with rear load)
  // Negative = front compresses more than rear (rare, front-heavy load)
  const differentialCompression = rearCompression - frontCompression
  
  // Calculate pitch angle from differential compression
  // tan(pitch) = differential_compression / wheelbase
  const pitchAngle = Math.atan(differentialCompression / wheelbase)
  
  // Calculate COG horizontal shift due to pitch
  // When rear compresses more: body tilts forward, COG moves rearward
  // When front compresses more: body tilts back, COG moves forward
  const cogHorizontalShift = loadCOGHeight * Math.sin(pitchAngle)
  
  // Calculate weight redistribution from COG shift
  // Using moment analysis: shift creates moment that redistributes weight
  // Positive shift (rearward) = more weight to rear axle
  // Weight shift proportional to (cogShift / wheelbase) ratio
  const compressionRatio = Math.abs(differentialCompression) / wheelbase
  const cogShiftRatio = Math.abs(cogHorizontalShift) / wheelbase
  
  // Combined effect: differential compression + COG shift
  // Physics: weight redistributes proportional to the pitch angle created
  const weightShiftRatio = compressionRatio * 0.7 + cogShiftRatio * 0.3
  
  // Apply sign: positive shift = weight from front to rear
  // (differentialCompression > 0 means rear compresses more)
  const weightShiftSign = differentialCompression >= 0 ? 1 : -1
  
  // For FVD typical loading (rear airbag compresses ~100mm, front taper-leaf ~5mm):
  // - Differential = ~95mm over 4.66m wheelbase
  // - Pitch angle = ~1.17 degrees
  // - Weight shift = ~2-5% of total load to rear
  
  return weightShiftRatio * weightShiftSign * (frontAxleLoad + rearAxleLoad) * 0.5 // Apply to total weight
}

/**
 * Calculate weight distribution between front and rear axles
 * 
 * Physics:
 * - Taking moments about the rear axle:
 * - Front axle force × wheelbase = Total load × distance from rear axle to COG
 * 
 * Key concept from manufacturer specs:
 * - Body coordinates: 0m = front of body (loading area), body_length = rear of body
 * - Front axle is UNDER THE CAB, which is BEFORE the body (negative position)
 * - CA (Cab to Axle) = distance from back of cab (= front of body) to rear axle
 * - FOH (Front Overhang) = distance from front of truck to front axle
 * - WB (Wheelbase) = distance from front axle to rear axle
 * - Cab length = (FOH + WB) - CA
 * - Front axle position from body front = CA - WB (e.g., 3.675 - 4.660 = -0.985m)
 * - Rear axle position from body front = CA (e.g., 3.675m)
 */
export function calculateWeightDistribution(
  truck: TruckProfile,
  pallets: Pallet[]
): WeightDistribution {
  // Calculate total load weight
  const loadWeight = pallets.reduce((sum, p) => sum + p.weight, 0)
  const totalWeight = truck.tare_weight + loadWeight

  // Calculate load COG
  const loadCOG = calculateLoadCOG(pallets)

  // If no load, return tare weights
  if (loadWeight === 0) {
    return {
      total_weight: truck.tare_weight,
      front_axle_weight: truck.front_tare_weight,
      rear_axle_weight: truck.rear_tare_weight,
      total_capacity_remaining: truck.gvm - truck.tare_weight,
      front_axle_capacity_remaining: truck.front_axle_limit - truck.front_tare_weight,
      rear_axle_capacity_remaining: truck.rear_axle_limit - truck.rear_tare_weight,
      gvm_percentage: (truck.tare_weight / truck.gvm) * 100,
      front_axle_percentage: (truck.front_tare_weight / truck.front_axle_limit) * 100,
      rear_axle_percentage: (truck.rear_tare_weight / truck.rear_axle_limit) * 100,
      is_overweight: false,
      is_front_overweight: false,
      is_rear_overweight: false,
      load_cog_x: 0,
    }
  }

  // Calculate actual axle positions relative to body front (0m)
  let frontAxlePos: number
  let rearAxlePos: number
  
  if (truck.cab_to_axle) {
    // Use accurate manufacturer dimensions (CA = Cab to Axle)
    // Rear axle is CA distance from front of body (back of cab)
    rearAxlePos = truck.cab_to_axle
    // Front axle is wheelbase distance before rear axle
    frontAxlePos = rearAxlePos - truck.wheelbase
  } else {
    // Fallback: estimate based on typical cab length
    // Front axle is under the cab, before the body starts
    const TYPICAL_CAB_LENGTH = 2.0 // metres
    frontAxlePos = -TYPICAL_CAB_LENGTH + truck.front_overhang // e.g., -2.0 + 1.5 = -0.5m
    // Rear axle is wheelbase distance from front axle
    rearAxlePos = frontAxlePos + truck.wheelbase // e.g., -0.5 + 5.2 = 4.7m
  }

  // Distance from COG to rear axle
  // Positive = COG is in front of rear axle, Negative = COG is behind rear axle
  const cogToRearAxle = rearAxlePos - loadCOG.x

  // Distance from COG to front axle
  // Positive = COG is behind front axle, Negative = COG is in front of front axle
  const cogToFrontAxle = loadCOG.x - frontAxlePos

  // Calculate initial load distribution using moments (rigid body assumption)
  // Taking moments about rear axle:
  // frontAxleLoad × wheelbase = totalLoad × cogToRearAxle
  // 
  // This works correctly in BOTH directions:
  // 
  // 1. When COG is IN FRONT of rear axle (cogToRearAxle > 0):
  //    - Positive moment distributes weight between front and rear axles
  //    - More weight goes to front axle as COG moves forward
  //    - Formula: loadOnFrontAxle = (loadWeight * cogToRearAxle) / wheelbase
  // 
  // 2. When COG is BEHIND rear axle (cogToRearAxle < 0):
  //    - Negative moment means front axle would need to lift (negative load)
  //    - Physically, front axle load goes to 0, and all load weight goes to rear axle
  //    - The further back the COG, the more negative the moment becomes
  //    - This creates additional rear axle load through the overhang moment
  //    - Formula still applies: loadOnFrontAxle = (loadWeight * cogToRearAxle) / wheelbase (negative)
  // 
  // 3. When COG is VERY FAR FORWARD (beyond front axle):
  //    - All load weight goes to front axle
  // 
  // 4. When COG is VERY FAR BACK (behind rear axle):
  //    - Front axle lifts off (0 load), all load weight on rear axle
  //    - The overhang moment increases rear axle load beyond just the load weight
  //    - This is accounted for by the negative cogToRearAxle creating a larger moment
  // Calculate load distribution using moment equation
  // This correctly accounts for weight transfer in BOTH directions
  let loadOnFrontAxle = (loadWeight * cogToRearAxle) / truck.wheelbase
  let loadOnRearAxle = loadWeight - loadOnFrontAxle
  
  // Note: We intentionally allow loadOnFrontAxle/loadOnRearAxle to be negative.
  // Negative load indicates that axle's tare weight is being transferred to the other axle.
  // Final axle weights are clamped to >= 0 after adding tare weights, ensuring realism
  // while still showing the reduction in front axle load as pallets move past the rear axle.

  // Apply dynamic suspension correction based on suspension type
  // This calculates actual compression and geometry changes based on load weight and position
  if (loadWeight > 0) {
    // Estimate COG height based on typical loaded truck characteristics
    // Higher loads and more rearward COG = higher effective COG
    // Typical range: 1.0m (low, front-loaded) to 1.5m (high, rear-loaded)
    // Handle negative cogToRearAxle (COG behind rear axle) by using absolute value for height factor
    const cogHeightFactor = Math.max(0.3, Math.min(0.7, Math.abs(cogToRearAxle) / truck.wheelbase)) // 0.3-0.7 based on COG position
    const estimatedCOGHeight = 1.0 + (cogHeightFactor * 0.5) // 1.0m to 1.5m
    
    // Determine effective suspension types for front and rear
    // If specific suspension types are provided, use them; otherwise fall back to legacy suspension_type
    const frontSuspension = truck.front_suspension_type ?? truck.suspension_type
    const rearSuspension = truck.rear_suspension_type ?? truck.suspension_type
    
    // Use iterative solver for accurate weight distribution with suspension effects
    // This accounts for the fact that compression changes load distribution,
    // which changes compression, etc. (converges in 2-4 iterations)
    const MAX_ITERATIONS = 5
    const CONVERGENCE_THRESHOLD = 0.1 // kg - stop when change is less than 0.1kg
    
    let currentFrontLoad = loadOnFrontAxle
    
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const currentRearLoad = loadWeight - currentFrontLoad
      const totalFrontAxleLoad = truck.front_tare_weight + currentFrontLoad
      const totalRearAxleLoad = truck.rear_tare_weight + currentRearLoad
      
      // Calculate weight shift from mixed suspension effect
      const weightShift = calculateMixedSuspensionEffect(
        totalFrontAxleLoad,
        totalRearAxleLoad,
        frontSuspension,
        rearSuspension,
        truck.wheelbase,
        estimatedCOGHeight
      )
      
      // Weight shift is from front to rear (positive = more weight to rear)
      const newFrontLoad = currentFrontLoad - weightShift
      
      // Check for convergence
      const frontChange = Math.abs(newFrontLoad - currentFrontLoad)
      if (frontChange < CONVERGENCE_THRESHOLD) {
        currentFrontLoad = newFrontLoad
        break
      }
      
      currentFrontLoad = newFrontLoad
    }
    
    loadOnFrontAxle = currentFrontLoad
    loadOnRearAxle = loadWeight - loadOnFrontAxle
  }

  // Add to tare weights and clamp to physical limits (no negative axle loads)
  let frontAxleWeight = truck.front_tare_weight + loadOnFrontAxle
  let rearAxleWeight = truck.rear_tare_weight + loadOnRearAxle

  if (frontAxleWeight < 0) {
    rearAxleWeight += frontAxleWeight
    frontAxleWeight = 0
  }

  if (rearAxleWeight < 0) {
    frontAxleWeight += rearAxleWeight
    rearAxleWeight = 0
  }

  // Calculate remaining capacities
  const totalCapacityRemaining = truck.gvm - totalWeight
  const frontCapacityRemaining = truck.front_axle_limit - frontAxleWeight
  const rearCapacityRemaining = truck.rear_axle_limit - rearAxleWeight

  // Calculate percentages
  const gvmPercentage = (totalWeight / truck.gvm) * 100
  const frontPercentage = (frontAxleWeight / truck.front_axle_limit) * 100
  const rearPercentage = (rearAxleWeight / truck.rear_axle_limit) * 100

  // Check for overweight conditions
  const isOverweight = totalWeight > truck.gvm
  const isFrontOverweight = frontAxleWeight > truck.front_axle_limit
  const isRearOverweight = rearAxleWeight > truck.rear_axle_limit

  return {
    total_weight: totalWeight,
    front_axle_weight: frontAxleWeight,
    rear_axle_weight: rearAxleWeight,
    total_capacity_remaining: totalCapacityRemaining,
    front_axle_capacity_remaining: frontCapacityRemaining,
    rear_axle_capacity_remaining: rearCapacityRemaining,
    gvm_percentage: gvmPercentage,
    front_axle_percentage: frontPercentage,
    rear_axle_percentage: rearPercentage,
    is_overweight: isOverweight,
    is_front_overweight: isFrontOverweight,
    is_rear_overweight: isRearOverweight,
    load_cog_x: loadCOG.x,
  }
}

/**
 * Validate truck profile data
 */
export function validateTruckProfile(truck: Partial<TruckProfile>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!truck.name?.trim()) {
    errors.push('Truck name is required')
  }

  if (!truck.body_type) {
    errors.push('Body type is required')
  }

  if (!truck.suspension_type) {
    errors.push('Suspension type is required')
  }

  // Positive dimensions
  if (!truck.body_length || truck.body_length <= 0) {
    errors.push('Body length must be greater than 0')
  }

  if (!truck.body_width || truck.body_width <= 0) {
    errors.push('Body width must be greater than 0')
  }

  if (!truck.wheelbase || truck.wheelbase <= 0) {
    errors.push('Wheelbase must be greater than 0')
  }

  // Weights
  if (!truck.tare_weight || truck.tare_weight <= 0) {
    errors.push('Tare weight must be greater than 0')
  }

  if (!truck.front_tare_weight || truck.front_tare_weight <= 0) {
    errors.push('Front tare weight must be greater than 0')
  }

  if (!truck.rear_tare_weight || truck.rear_tare_weight <= 0) {
    errors.push('Rear tare weight must be greater than 0')
  }

  if (!truck.gvm || truck.gvm <= 0) {
    errors.push('GVM must be greater than 0')
  }

  if (!truck.front_axle_limit || truck.front_axle_limit <= 0) {
    errors.push('Front axle limit must be greater than 0')
  }

  if (!truck.rear_axle_limit || truck.rear_axle_limit <= 0) {
    errors.push('Rear axle limit must be greater than 0')
  }

  // Logical checks
  if (truck.front_tare_weight && truck.rear_tare_weight && truck.tare_weight) {
    const sumAxles = truck.front_tare_weight + truck.rear_tare_weight
    // Allow 1% tolerance for rounding
    if (Math.abs(sumAxles - truck.tare_weight) > truck.tare_weight * 0.01) {
      errors.push(
        `Front and rear tare weights (${sumAxles.toFixed(0)} kg) must sum to tare weight (${truck.tare_weight.toFixed(0)} kg)`
      )
    }
  }

  if (truck.tare_weight && truck.gvm && truck.tare_weight >= truck.gvm) {
    errors.push('Tare weight must be less than GVM')
  }

  if (
    truck.front_tare_weight &&
    truck.front_axle_limit &&
    truck.front_tare_weight > truck.front_axle_limit
  ) {
    errors.push('Front tare weight exceeds front axle limit')
  }

  if (
    truck.rear_tare_weight &&
    truck.rear_axle_limit &&
    truck.rear_tare_weight > truck.rear_axle_limit
  ) {
    errors.push('Rear tare weight exceeds rear axle limit')
  }

  if (
    truck.front_axle_limit &&
    truck.rear_axle_limit &&
    truck.gvm &&
    truck.front_axle_limit + truck.rear_axle_limit < truck.gvm
  ) {
    errors.push('Sum of axle limits must be at least equal to GVM')
  }

  if (truck.wheelbase && truck.body_length && truck.wheelbase > truck.body_length) {
    errors.push('Wheelbase cannot exceed body length')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if pallet fits on truck body (accounting for wall thickness)
 */
export function palletFitsOnTruck(
  pallet: Pallet,
  truck: TruckProfile
): boolean {
  const usable = getUsableDimensions(truck)
  
  return (
    pallet.x >= usable.usableX &&
    pallet.y >= usable.usableY &&
    pallet.x + pallet.length <= usable.usableX + usable.usableLength &&
    pallet.y + pallet.width <= usable.usableY + usable.usableWidth
  )
}

/**
 * Check if two pallets overlap (accounting for minimum spacing)
 */
export function palletsOverlap(pallet1: Pallet, pallet2: Pallet): boolean {
  // Add spacing buffer - pallets must be at least MIN_PALLET_SPACING apart
  return !(
    pallet1.x + pallet1.length + MIN_PALLET_SPACING <= pallet2.x ||
    pallet2.x + pallet2.length + MIN_PALLET_SPACING <= pallet1.x ||
    pallet1.y + pallet1.width + MIN_PALLET_SPACING <= pallet2.y ||
    pallet2.y + pallet2.width + MIN_PALLET_SPACING <= pallet1.y
  )
}

/**
 * Find a free position for a new pallet on the truck
 * Returns a position that doesn't overlap with existing pallets
 * Accounts for wall thickness and minimum spacing
 */
export function findFreePosition(
  newPallet: Omit<Pallet, 'id' | 'x' | 'y'> & Partial<Pick<Pallet, 'x' | 'y'>>,
  existingPallets: Pallet[],
  truck: TruckProfile
): { x: number; y: number } {
  const usable = getUsableDimensions(truck)
  const gridStep = 0.1 // 10cm grid for positioning

  // Try positions starting from the front of usable area
  for (let x = usable.usableX; x <= usable.usableX + usable.usableLength - newPallet.length; x += gridStep) {
    for (let y = usable.usableY; y <= usable.usableY + usable.usableWidth - newPallet.width; y += gridStep) {
      const testPallet: Pallet = {
        ...newPallet,
        id: 'test',
        x,
        y,
      }

      // Check if this position fits and doesn't overlap
      if (palletFitsOnTruck(testPallet, truck)) {
        const hasOverlap = existingPallets.some((existing) =>
          palletsOverlap(testPallet, existing)
        )

        if (!hasOverlap) {
          return { x, y }
        }
      }
    }
  }

  // If no free position found, return usable area start position
  return { x: usable.usableX, y: usable.usableY }
}

/**
 * Format weight for display (convert to tonnes for heavy weights)
 */
export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t`
  }
  return `${kg.toFixed(0)} kg`
}

/**
 * Format dimension for display (convert to mm for small dimensions)
 */
export function formatDimension(metres: number): string {
  if (metres < 1) {
    return `${(metres * 1000).toFixed(0)} mm`
  }
  return `${metres.toFixed(2)} m`
}

