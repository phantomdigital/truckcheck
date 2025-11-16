/**
 * Truck Configuration - Isuzu FVR/FVD 165-300 4x2
 * 
 * All dimensions in millimeters (mm) as per load-doc.md requirements
 * This matches the manufacturer specification exactly
 * Based on Isuzu FVR/FVD 165-300 4x2 specifications
 */

/**
 * Emissions standard for heavy vehicles
 */
export type EmissionsStandard = 'none' | 'euro5' | 'euro6'; // euro6 = ADR 80/04

/**
 * Vehicle classification for GML (General Mass Limits) determination
 */
export interface VehicleClassification {
  // Vehicle type
  isBus?: boolean;
  isEligible2AxleBus?: boolean;
  isEligible3AxleBus?: boolean;
  isUltraLowFloorBus?: boolean;
  isComplyingSteerAxleVehicle?: boolean;
  isBDouble?: boolean;
  isRoadTrain?: boolean;
  isPigTrailer?: boolean;
  isLowLoader?: boolean;
  
  // Emissions standard (ADR 80/04 = Euro VI)
  // If not specified, defaults to 'none' (pre-Euro V)
  emissionsStandard?: EmissionsStandard;
  
  // ADR 80/04 (Euro VI) eligibility criteria
  // These are required for ADR 80/04 increased mass limits
  // If not specified, vehicle is assumed to meet requirements if emissionsStandard === 'euro6'
  hasADR8004Engine?: boolean; // Engine complying with ADR 80/04 emissions
  hasFrontUnderrunProtection?: boolean; // Front underrun protection device (UN ECE Regulation No. 93 or ADR 84)
  hasCompliantCabin?: boolean; // Cabin complying with UN ECE Regulation No. 29 (for single steer axle vehicles)
  hasLoadSharingSuspension?: boolean; // Load-sharing suspension system (for twinsteer)
  minimumGVM?: number; // Minimum GVM in kg (must be >= 15t for ADR 80/04)
  
  // Axle configuration
  frontAxleType: 'steer' | 'twinsteer';
  rearAxleType: 'single' | 'tandem' | 'tri' | 'quad' | 'fiveOrMore';
  
  // Tyre configuration
  frontTyreType: 'single' | 'dual';
  frontTyreSectionWidth?: number; // mm - for single tyres
  // Minimum tyre section widths for ADR 80/04:
  // - Single steer (complying): 315mm
  // - Single steer (non-complying): 275mm
  // - Twinsteer: 275mm
  rearTyreType: 'single' | 'dual' | 'mixed'; // mixed = single on one axle, dual on other (tandem only)
  rearTyreSectionWidth?: number; // mm - for single tyres
  
  // Axle spacing (metres)
  axleSpacing?: number; // Distance between axles (for spacing < 2.5m rule)
  
  // Mass transfer allowance (ADR 80/04 only)
  // Up to 0.5t can be transferred from steer axle to drive axle group
  useMassTransferAllowance?: boolean; // If true, allows up to 0.5t transfer (default: false)
  massTransferAmount?: number; // Amount to transfer in kg (0-500kg, only if useMassTransferAllowance is true)
}

/**
 * GML (General Mass Limits) regulatory limits
 * Based on NHVR General Mass Limits regulations
 * All weights in kilograms (kg)
 * 
 * GVM is calculated as the minimum of:
 * 1. Table 1 overall vehicle limit (e.g., 42.5t for standard vehicles)
 * 2. Sum of axle limits (front + rear, after mass transfer if applicable)
 * 3. Axle spacing limit (15t if spacing < 2.5m)
 */
export interface GMLConfig {
  gvm: number;              // Gross Vehicle Mass limit (minimum of Table 1, sum of axles, and axle spacing)
  gvmTable1?: number;        // Table 1 overall vehicle limit (for reference/display)
  frontAxleLimit: number;   // Front axle limit (Table 2) - before mass transfer
  rearAxleLimit: number;    // Rear axle/axle group limit (Table 2) - before mass transfer
  
  // Additional constraints
  axleSpacingLimit?: number; // 15t limit if axle spacing < 2.5m
  
  // ADR 80/04 mass transfer allowance
  // Up to 0.5t can be transferred from steer axle to drive axle group
  massTransferApplied?: number; // Amount of mass transfer applied in kg (0-500kg)
  effectiveFrontAxleLimit?: number; // Front axle limit after mass transfer
  effectiveRearAxleLimit?: number; // Rear axle limit after mass transfer
}

export interface TruckConfig {
  model: string;
  manufacturer: string;
  
  // Weight ratings (kg) - MANUFACTURER LIMITS
  gvm: number;              // Gross Vehicle Mass
  gcm: number;              // Gross Combination Mass
  frontAxleLimit: number;   // Front axle rating
  rearAxleLimit: number;    // Rear axle rating
  
  // Emissions standard
  isEuro6?: boolean;        // True if vehicle meets Euro VI (ADR 80/04) emissions standard
  
  // GML (General Mass Limits) regulatory overrides
  // If provided, these override manufacturer limits when more restrictive
  gml?: GMLConfig;
  
  // Vehicle classification for GML calculation
  // If not provided, GML will be calculated based on defaults
  vehicleClassification?: VehicleClassification;
  
  // Factory cab chassis weights (kg) - FOR REFERENCE ONLY
  // Users will input their ACTUAL weigh bridge readings instead
  cabChassisFront: number;  // Front axle tare weight (reference)
  cabChassisRear: number;   // Rear axle tare weight (reference)
  cabChassisTotal: number;  // Total tare weight (reference)
  
  // Dimensions (mm)
  wb: number;               // Wheelbase (front axle to rear axle)
  oal: number;              // Overall length
  foh: number;              // Front overhang (front to front axle)
  roh: number;              // Rear overhang (rear axle to back)
  ca: number;               // Cab to rear axle (Effective Axle - EA)
  
  // Calculated values for canvas
  frontAxlePosition: number;  // FOH (or center of front axle group for multi-axle)
  rearAxlePosition: number;   // FOH + WB (or center of rear axle group for multi-axle)
  cabEnd: number;              // FOH + WB - CA (where cab ends)
  bedStart: number;            // Same as cabEnd - this is where the body/tray starts
  maxBodyLength: number;       // OAL - bedStart (maximum available body length)
  defaultBodyWidth: number;    // Standard body width (user can adjust this)
  
  // Multi-axle support (optional - for twin steer, tandem, etc.)
  frontAxlePositions?: number[];  // Individual front axle positions (mm from front) - if multiple front axles
  rearAxlePositions?: number[];   // Individual rear axle positions (mm from front) - if multiple rear axles
}

/**
 * Check if vehicle is eligible for ADR 80/04 (Euro VI) increased mass limits
 * Based on ADR 80/04 eligibility criteria from NHVR information sheet
 */
function isEligibleForADR8004(classification: VehicleClassification): boolean {
  const emissionsStandard = classification.emissionsStandard || 'none';
  
  // Must be Euro VI (ADR 80/04)
  if (emissionsStandard !== 'euro6') {
    return false;
  }
  
  // Exclude buses and road trains
  if (classification.isBus || classification.isRoadTrain) {
    return false;
  }
  
  // Check eligibility criteria (if not explicitly set, assume true for Euro VI vehicles)
  const hasEngine = classification.hasADR8004Engine !== false; // Default to true if not specified
  const hasProtection = classification.hasFrontUnderrunProtection !== false; // Default to true if not specified
  
  // For single steer axle vehicles, need compliant cabin
  if (classification.frontAxleType === 'steer') {
    const hasCabin = classification.hasCompliantCabin !== false; // Default to true if not specified
    const minGVM = classification.minimumGVM || 0;
    const meetsGVM = minGVM >= 15000; // 15t minimum
    
    // Check tyre section width requirements
    const tyreWidth = classification.frontTyreSectionWidth || 0;
    const meetsTyreWidth = classification.isComplyingSteerAxleVehicle 
      ? tyreWidth >= 315  // Complying steer: 315mm minimum
      : tyreWidth >= 275; // Non-complying steer: 275mm minimum
    
    return hasEngine && hasProtection && hasCabin && meetsGVM && meetsTyreWidth;
  }
  
  // For twinsteer vehicles
  if (classification.frontAxleType === 'twinsteer') {
    const hasSuspension = classification.hasLoadSharingSuspension !== false; // Default to true if not specified
    const tyreWidth = classification.frontTyreSectionWidth || 0;
    const meetsTyreWidth = tyreWidth >= 275; // 275mm minimum for twinsteer
    
    return hasEngine && hasProtection && hasSuspension && meetsTyreWidth;
  }
  
  return false;
}

/**
 * Calculate GML (General Mass Limits) based on vehicle classification
 * Based on NHVR General Mass Limits regulations and ADR 80/04 (Euro VI) increases
 * Returns limits in kilograms (kg)
 */
export function calculateGML(classification: VehicleClassification): GMLConfig {
  // Convert tonnes to kilograms
  const t = (tonnes: number) => tonnes * 1000;
  
  const emissionsStandard = classification.emissionsStandard || 'none';
  const isEuroVI = emissionsStandard === 'euro6';
  const isADR8004Eligible = isEligibleForADR8004(classification);
  
  // Table 1: Overall vehicle mass limits (GVM)
  let gvm = t(42.5); // Default: "vehicle that is not mentioned above and that is neither a B-double nor a road train"
  
  if (classification.isBDouble || classification.isRoadTrain) {
    // B-doubles and road trains have different limits (not covered in basic GML)
    // Keep default for now
  } else if (classification.isComplyingSteerAxleVehicle) {
    if (isADR8004Eligible) {
      gvm = t(43.5); // ADR 80/04 (Euro VI) vehicle (complying steer axle) that is not a B-double
    } else {
      gvm = t(43.0); // Complying steer axle vehicle that is neither a B-double nor a road train
    }
  } else if (isADR8004Eligible) {
    if (classification.frontAxleType === 'twinsteer' && classification.rearAxleType === 'tri') {
      gvm = t(47.0); // ADR 80/04 (Euro VI) vehicle (twinsteer) that is a prime mover with a twinsteer axle group towing a tri-axle semitrailer
    } else if (classification.frontAxleType === 'steer') {
      gvm = t(43.0); // ADR 80/04 (Euro VI) vehicle (single steer axle) that is not a B-double
    }
  } else if (classification.frontAxleType === 'twinsteer' && classification.rearAxleType === 'tri') {
    gvm = t(46.5); // Prime mover with a twinsteer axle group towing a tri-axle semitrailer
  } else if (classification.isBus) {
    if (classification.isEligible2AxleBus) {
      gvm = t(18.0);
    } else if (classification.isEligible3AxleBus) {
      gvm = t(22.0);
    } else if (classification.isUltraLowFloorBus && !classification.isEligible2AxleBus) {
      gvm = t(16.0);
    } else {
      // Complying bus without a trailer
      if (classification.rearAxleType === 'tandem') {
        // Check if mixed tyres (single on one axle, dual on other)
        if (classification.rearTyreType === 'mixed') {
          gvm = t(20.0);
        } else {
          gvm = t(22.5); // Dual tyres on all axles
        }
      } else {
        gvm = t(16.0); // Only 2 axles but not eligible 2-axle bus
      }
    }
  }
  
  // Table 2: Front axle limits (including ADR 80/04 increases)
  let frontAxleLimit = t(6.0); // Default: "another motor vehicle"
  
  if (classification.frontAxleType === 'steer') {
    if (classification.isComplyingSteerAxleVehicle) {
      if (isADR8004Eligible) {
        frontAxleLimit = t(7.0); // ADR 80/04 (Euro VI) vehicle (complying steer axle) - increased from 6.5t
      } else {
        frontAxleLimit = t(6.5); // Complying steer axle vehicle (pre-ADR 80/04)
      }
    } else if (isADR8004Eligible) {
      frontAxleLimit = t(6.5); // ADR 80/04 (Euro VI) vehicle (non-complying steer axle) - increased from 6.0t
    } else if (classification.isBus) {
      if (classification.isEligible2AxleBus) {
        frontAxleLimit = t(7.0); // Eligible 2-axle bus
      } else if (classification.isEligible3AxleBus) {
        frontAxleLimit = t(6.5); // Eligible 3-axle bus
      } else {
        frontAxleLimit = t(6.5); // Complying bus that is not eligible
      }
    } else if (classification.isRoadTrain) {
      // Road train hauling unit or prime mover
      const tyreWidth = classification.frontTyreSectionWidth || 0;
      if (tyreWidth >= 375) {
        frontAxleLimit = t(7.1); // At least 375mm
      } else if (tyreWidth >= 295) {
        frontAxleLimit = t(6.5); // At least 295mm
      }
    }
  } else if (classification.frontAxleType === 'twinsteer') {
    if (isADR8004Eligible) {
      frontAxleLimit = t(11.5); // ADR 80/04 (Euro VI) vehicle (twinsteer) - increased from 11.0t
    } else if (classification.hasLoadSharingSuspension) {
      frontAxleLimit = t(11.0); // Twinsteer with load-sharing suspension
    } else {
      frontAxleLimit = t(10.0); // Twinsteer without load-sharing suspension
    }
  }
  
  // Table 2: Rear axle/axle group limits
  let rearAxleLimit = t(9.0); // Default: single axle with dual tyres on "another vehicle"
  
  if (classification.rearAxleType === 'single') {
    if (classification.rearTyreType === 'single') {
      const tyreWidth = classification.rearTyreSectionWidth || 0;
      if (tyreWidth >= 450) {
        rearAxleLimit = t(7.0); // At least 450mm
      } else if (tyreWidth >= 375) {
        rearAxleLimit = t(6.7); // At least 375mm but less than 450mm
      } else {
        rearAxleLimit = t(6.0); // Less than 375mm
      }
    } else if (classification.rearTyreType === 'dual') {
      if (classification.isPigTrailer) {
        rearAxleLimit = t(8.5); // Pig trailer
      } else if (classification.isBus) {
        if (classification.isEligible2AxleBus) {
          rearAxleLimit = t(12.0); // Eligible 2-axle bus
        } else if (classification.isUltraLowFloorBus && !classification.isEligible2AxleBus) {
          rearAxleLimit = t(11.0); // Ultra-low floor bus
        } else {
          rearAxleLimit = t(10.0); // Complying bus
        }
      } else {
        rearAxleLimit = t(9.0); // Another vehicle
      }
    }
  } else if (classification.rearAxleType === 'tandem') {
    if (classification.rearTyreType === 'single') {
      const tyreWidth = classification.rearTyreSectionWidth || 0;
      if (tyreWidth >= 450) {
        rearAxleLimit = t(14.0); // At least 450mm
      } else if (tyreWidth >= 375) {
        rearAxleLimit = t(13.3); // At least 375mm but less than 450mm
      } else {
        rearAxleLimit = t(11.0); // Less than 375mm
      }
    } else if (classification.rearTyreType === 'mixed') {
      // Single tyres on 1 axle and dual tyres on the other
      if (classification.isBus) {
        if (classification.isEligible3AxleBus) {
          const tyreWidth = classification.rearTyreSectionWidth || 0;
          if (tyreWidth >= 295) {
            rearAxleLimit = t(15.5); // Eligible 3-axle bus with tyres >= 295mm
          } else {
            rearAxleLimit = t(14.0); // Complying bus that is not eligible 3-axle bus
          }
        } else {
          rearAxleLimit = t(14.0); // Complying bus that is not eligible 3-axle bus
        }
      } else {
        rearAxleLimit = t(13.0); // Another motor vehicle
      }
    } else if (classification.rearTyreType === 'dual') {
      if (classification.isPigTrailer) {
        rearAxleLimit = t(15.0); // Pig trailer
      } else {
        rearAxleLimit = t(16.5); // Another vehicle
      }
    }
  } else if (classification.rearAxleType === 'tri') {
    if (classification.isPigTrailer) {
      // Check tyre configuration
      const hasWideTyres = classification.rearTyreSectionWidth && classification.rearTyreSectionWidth >= 375;
      const hasDualTyres = classification.rearTyreType === 'dual' || classification.rearTyreType === 'mixed';
      
      if (hasWideTyres || hasDualTyres) {
        rearAxleLimit = t(18.0); // Single tyres >= 375mm or dual tyres
      } else {
        rearAxleLimit = t(15.0); // Single tyres < 375mm
      }
    } else {
      // Vehicle other than pig trailer
      const hasWideTyres = classification.rearTyreSectionWidth && classification.rearTyreSectionWidth >= 375;
      const hasDualTyres = classification.rearTyreType === 'dual' || classification.rearTyreType === 'mixed';
      
      if (hasWideTyres || hasDualTyres) {
        rearAxleLimit = t(20.0); // Single tyres >= 375mm or dual tyres
      } else {
        rearAxleLimit = t(15.0); // Single tyres < 375mm
      }
    }
  } else if (classification.rearAxleType === 'quad') {
    const hasWideTyres = classification.rearTyreSectionWidth && classification.rearTyreSectionWidth >= 375;
    const hasDualTyres = classification.rearTyreType === 'dual';
    
    if (hasWideTyres || hasDualTyres) {
      rearAxleLimit = t(20.0); // Single tyres >= 375mm or dual tyres
    } else {
      rearAxleLimit = t(15.0); // Single tyres < 375mm
    }
  } else if (classification.rearAxleType === 'fiveOrMore') {
    if (classification.isLowLoader) {
      const hasWideTyres = classification.rearTyreSectionWidth && classification.rearTyreSectionWidth >= 375;
      const hasDualTyres = classification.rearTyreType === 'dual';
      
      if (hasWideTyres || hasDualTyres) {
        rearAxleLimit = t(20.0); // Any other rear group of 5 or more axles on a low loader
      } else {
        rearAxleLimit = t(15.0); // Rear group of 5 or more axles on a low loader with single tyres < 375mm
      }
    }
  }
  
  // Axle spacing rule: if spacing < 2.5m, limit is 15t
  let axleSpacingLimit: number | undefined;
  if (classification.axleSpacing !== undefined && classification.axleSpacing < 2.5) {
    axleSpacingLimit = t(15.0);
  }
  
  // ADR 80/04 mass transfer allowance
  // Up to 0.5t (500kg) can be transferred from steer axle to drive axle group
  let massTransferApplied = 0;
  let effectiveFrontAxleLimit = frontAxleLimit;
  let effectiveRearAxleLimit = rearAxleLimit;
  
  if (isADR8004Eligible && classification.useMassTransferAllowance) {
    // Mass transfer is only available for ADR 80/04 vehicles
    // Must have a steer axle subject to ADR 80/04 limits (7.0t for complying, 6.5t for non-complying, or 11.5t for twinsteer)
    const canTransfer = 
      (classification.frontAxleType === 'steer' && (frontAxleLimit >= t(6.5))) ||
      (classification.frontAxleType === 'twinsteer' && frontAxleLimit >= t(11.0));
    
    if (canTransfer) {
      // Determine transfer amount (0-500kg)
      const requestedTransfer = classification.massTransferAmount || 0;
      const maxTransfer = t(0.5); // 0.5t maximum
      massTransferApplied = Math.max(0, Math.min(requestedTransfer, maxTransfer));
      
      // Apply transfer: reduce front axle limit, increase rear axle limit
      effectiveFrontAxleLimit = frontAxleLimit - massTransferApplied;
      effectiveRearAxleLimit = rearAxleLimit + massTransferApplied;
    }
  }
  
  // GVM calculation under GML:
  // For single rear axle trucks: GVM = sum of axle limits (front + rear)
  // For vehicles with multiple axle groups: GVM = minimum of Table 1 limit and sum of axle limits
  // Also constrained by axle spacing limit if applicable (< 2.5m = 15t)
  const sumOfAxleLimits = effectiveFrontAxleLimit + effectiveRearAxleLimit;
  
  // Determine final GVM based on vehicle configuration
  let finalGvm: number;
  
  // For single rear axle vehicles, GVM is simply the sum of axles
  if (classification.rearAxleType === 'single') {
    finalGvm = Math.min(
      sumOfAxleLimits, // Sum of axle limits
      axleSpacingLimit || Infinity // Axle spacing limit (if applicable)
    );
  } else {
    // For vehicles with tandem/tri/quad axles, GVM is minimum of Table 1 and sum of axles
    finalGvm = Math.min(
      gvm, // Table 1 limit
      sumOfAxleLimits, // Sum of axle limits
      axleSpacingLimit || Infinity // Axle spacing limit (if applicable)
    );
  }
  
  return {
    gvm: finalGvm, // Final GVM
    gvmTable1: classification.rearAxleType !== 'single' ? gvm : undefined, // Table 1 limit (only relevant for multi-axle vehicles)
    frontAxleLimit,
    rearAxleLimit,
    axleSpacingLimit,
    massTransferApplied: massTransferApplied > 0 ? massTransferApplied : undefined,
    effectiveFrontAxleLimit: massTransferApplied > 0 ? effectiveFrontAxleLimit : undefined,
    effectiveRearAxleLimit: massTransferApplied > 0 ? effectiveRearAxleLimit : undefined,
  };
}

/**
 * Get effective weight limits (minimum of manufacturer vs GML)
 * Returns the most restrictive limits to ensure legal compliance
 */
export function getEffectiveLimits(config: TruckConfig): {
  gvm: number;
  frontAxleLimit: number;
  rearAxleLimit: number;
} {
  // Start with manufacturer limits
  let gvm = config.gvm;
  let frontAxleLimit = config.frontAxleLimit;
  let rearAxleLimit = config.rearAxleLimit;
  
  // If GML is provided, use the more restrictive (lower) limit
  if (config.gml) {
    gvm = Math.min(gvm, config.gml.gvm);
    // Use effective limits (after mass transfer) if available, otherwise use base limits
    const gmlFrontLimit = config.gml.effectiveFrontAxleLimit ?? config.gml.frontAxleLimit;
    const gmlRearLimit = config.gml.effectiveRearAxleLimit ?? config.gml.rearAxleLimit;
    frontAxleLimit = Math.min(frontAxleLimit, gmlFrontLimit);
    rearAxleLimit = Math.min(rearAxleLimit, gmlRearLimit);
    
    // Apply axle spacing limit if applicable
    if (config.gml.axleSpacingLimit) {
      gvm = Math.min(gvm, config.gml.axleSpacingLimit);
    }
  } else if (config.vehicleClassification) {
    // Calculate GML from classification if not provided
    const gml = calculateGML(config.vehicleClassification);
    gvm = Math.min(gvm, gml.gvm);
    // Use effective limits (after mass transfer) if available, otherwise use base limits
    const gmlFrontLimit = gml.effectiveFrontAxleLimit ?? gml.frontAxleLimit;
    const gmlRearLimit = gml.effectiveRearAxleLimit ?? gml.rearAxleLimit;
    frontAxleLimit = Math.min(frontAxleLimit, gmlFrontLimit);
    rearAxleLimit = Math.min(rearAxleLimit, gmlRearLimit);
    
    if (gml.axleSpacingLimit) {
      gvm = Math.min(gvm, gml.axleSpacingLimit);
    }
  }
  
  return {
    gvm,
    frontAxleLimit,
    rearAxleLimit,
  };
}

/**
 * Isuzu FVD 165-260 MWB - Default truck configuration
 * All dimensions in millimeters (mm)
 * Based on Isuzu FVR/FVD 165-300 4x2 DXF engineering drawings
 * 
 * Weighbridge data: Actual FVD 165-260 MWB with 5000mm refrigerated body,
 * Thermo King T1000 unit, and Anteo F3 tailgate
 * - Front axle: 4140 kg
 * - Rear axle: 4260 kg
 * - Total tare: 8400 kg
 * 
 * GML Classification:
 * - 2-axle vehicle (single steer + single rear with dual tyres)
 * - Not a bus, not B-double, not road train
 * - Standard motor vehicle
 */
export const ISUZU_FVR_170_300: TruckConfig = {
  model: 'FVD 165-260 MWB',
  manufacturer: 'Isuzu',
  
  // Weight ratings (kg) - MANUFACTURER LIMITS
  gvm: 16500,              // Gross Vehicle Mass
  gcm: 32000,              // Gross Combination Mass
  frontAxleLimit: 6600,    // Front axle rating
  rearAxleLimit: 10400,    // Rear axle rating
  
  // Emissions standard
  isEuro6: false,          // Not Euro VI (ADR 80/04) compliant
  
  // GML (General Mass Limits) regulatory overrides
  // For Isuzu FVR 165-300 4x2 (single rear axle):
  // - GVM = sum of axle limits: 6.0t + 9.0t = 15.0t (15000kg)
  // - Front axle (steer): 6.0t (6000kg) - GML is more restrictive than manufacturer (6.6t)
  // - Rear axle (single with dual tyres): 9.0t (9000kg) - GML is more restrictive than manufacturer (10.4t)
  // Note: Table 1 42.5t limit doesn't apply to single rear axle vehicles - GVM is sum of axles
  gml: {
    gvm: 15000,            // 15.0t - sum of front (6.0t) + rear (9.0t) axle limits
    frontAxleLimit: 6000,  // 6.0t - MORE RESTRICTIVE than manufacturer (6.6t)
    rearAxleLimit: 9000,   // 9.0t - MORE RESTRICTIVE than manufacturer (10.4t)
  },
  
  // Vehicle classification for GML calculation
  vehicleClassification: {
    frontAxleType: 'steer',
    rearAxleType: 'single',
    frontTyreType: 'single',
    rearTyreType: 'dual',
  },
  
  // Factory cab chassis weights (kg) - FOR REFERENCE ONLY
  // Users will input their ACTUAL weigh bridge readings instead
  // Updated with actual FVD 165-260 MWB weighbridge readings (with body, fridge, tailgate)
  cabChassisFront: 4140,   // Front axle tare weight (actual weighbridge)
  cabChassisRear: 4260,    // Rear axle tare weight (actual weighbridge)
  cabChassisTotal: 8400,   // Total tare weight (actual weighbridge)
  
  // Dimensions (mm)
  wb: 4250,                // Wheelbase (front axle to rear axle)
  oal: 7405,               // Overall length
  foh: 1440,               // Front overhang (front to front axle)
  roh: 1715,               // Rear overhang (rear axle to back)
  ca: 3624,                // Cab to rear axle (Effective Axle - EA) - from DXF engineering drawings
  
  // Calculated values for canvas
  frontAxlePosition: 1440,              // FOH
  rearAxlePosition: 5690,               // FOH + WB = 1440 + 4250
  cabEnd: 2066,                         // FOH + WB - CA = 1440 + 4250 - 3624 (where cab ends, matches BBC)
  bedStart: 2066,                       // Same as cabEnd - this is where the body/tray starts (default, user can add gap)
  maxBodyLength: 5339,                  // OAL - bedStart = 7405 - 2066 (maximum available body length)
  defaultBodyWidth: 2400,               // Standard body width (user can adjust this)
};

/**
 * Fuso Shogun FS76 8x4 - Twin steer heavy-duty truck configuration
 * All dimensions in millimeters (mm)
 * 8x4 configuration: Twin steer front axle group + Tandem rear axle group
 * 
 * GML Classification:
 * - 4-axle vehicle (twin steer + tandem rear with dual tyres)
 * - Twin steer axle group with load-sharing suspension
 * - Not a bus, not B-double, not road train
 * - Heavy-duty motor vehicle
 */
export const FUSO_SHOGUN_FS76: TruckConfig = {
  model: 'Shogun FS76 8x4',
  manufacturer: 'Fuso',
  
  // Weight ratings (kg) - MANUFACTURER LIMITS
  gvm: 30800,              // Gross Vehicle Mass (from spec sheet)
  gcm: 53000,              // Gross Combination Mass
  frontAxleLimit: 14200,   // Front twin steer axle group rating (from spec sheet)
  rearAxleLimit: 21600,    // Rear tandem axle group rating (from spec sheet)
  
  // Emissions standard
  isEuro6: false,          // Not Euro VI (ADR 80/04) compliant (older model)
  
  // GML (General Mass Limits) regulatory overrides
  // For Fuso Shogun 8x4 (twin steer + tandem rear):
  // - GVM = minimum of Table 1 (42.5t) and sum of axle limits (11.0t + 16.5t = 27.5t)
  // - Front axle (twin steer with load-sharing): 11.0t (11000kg) - GML is MORE RESTRICTIVE than manufacturer (14.2t)
  // - Rear axle (tandem with dual tyres): 16.5t (16500kg) - GML is MORE RESTRICTIVE than manufacturer (21.6t)
  gml: {
    gvm: 27500,            // 27.5t - minimum of Table 1 (42.5t) and sum of axles (11.0t + 16.5t)
    gvmTable1: 42500,      // Table 1 limit for standard vehicle (not applicable as sum of axles is more restrictive)
    frontAxleLimit: 11000, // 11.0t - Twin steer with load-sharing suspension - MORE RESTRICTIVE than manufacturer (14.2t)
    rearAxleLimit: 16500,  // 16.5t - Tandem with dual tyres - MORE RESTRICTIVE than manufacturer (21.6t)
  },
  
  // Vehicle classification for GML calculation
  vehicleClassification: {
    frontAxleType: 'twinsteer',
    rearAxleType: 'tandem',
    frontTyreType: 'dual',     // Twin steer typically has dual tyres on each axle
    rearTyreType: 'dual',      // Tandem with dual tyres
    hasLoadSharingSuspension: true, // Modern twin steer typically has load-sharing suspension
  },
  
  // Factory cab chassis weights (kg) - FOR REFERENCE ONLY
  // Users will input their ACTUAL weigh bridge readings instead
  // Estimated typical tare weights for 8x4 cab chassis
  cabChassisFront: 6500,   // Front twin steer axle group tare weight (estimated)
  cabChassisRear: 4500,    // Rear tandem axle group tare weight (estimated)
  cabChassisTotal: 11000,  // Total tare weight (estimated for 8x4 cab chassis)
  
  // Dimensions (mm) - From Fuso Shogun FS76 specification sheet and TruckScience diagram
  // TruckScience diagram shows actual loaded configuration with body
  // Key differences from base spec sheet:
  // - OAL: 10,720mm (TruckScience) vs 10,140mm (base spec) - includes body overhang
  // - ROH: 3,200mm (TruckScience) vs 2,900mm (base spec) - body extends beyond frame
  // - Front axle spacing: 1,860mm (TruckScience) vs estimated 1,300mm
  // - Distance from front of cab to Axle 1: 930mm (TruckScience)
  // 
  // Base spec sheet dimensions:
  // D - Wheelbase: 5870mm (A B configuration)
  // B - Extreme Axle Spacing: 6530mm (A B configuration)
  // F - Rear Axle Spacing: 1320mm
  // C - Front Overhang: 1370mm
  // G - Front Axle to Rear of Cab: 700mm
  // I - Rearmost Item Behind Cab to Rear Axle: 5025mm (A B)
  // J - Frame, Rear Axle to End: 2900mm (A B)
  //
  // Using TruckScience actual measurements (more accurate for loaded configuration):
  wb: 5870,                // Wheelbase (D) - matches spec sheet
  oal: 10720,              // Overall length - TruckScience shows 10,720mm (with body)
  foh: 1370,               // Front overhang (C) - matches spec sheet
  roh: 3200,               // Rear overhang - TruckScience shows 3,200mm (body extends beyond frame)
  ca: 5170,                // Cab to rear axle - distance from front of BODY (back of cab) to rear axle group center
                          // Calculated: rear axle group center (7240mm) - bedStart (2070mm) = 5170mm
                          // NOTE: Spec sheet "I" (5025mm) is measured to cab end, not body front!
  
  // Calculated values for canvas
  // Using TruckScience diagram measurements (more accurate):
  // - Front axle spacing: 1,860mm (TruckScience shows distance between Axle 1 and Axle 2)
  // - Distance from front of cab to Axle 1: 930mm
  // - AC (Front Axle to Cab Front): 700mm
  // - So: front of cab = 1370 - 700 = 670mm from front of truck
  // - And: Axle 1 = 670 + 930 = 1600mm from front of truck
  //
  // Wait, let me recalculate based on TruckScience:
  // - FOH = 1,370mm (front of truck to frontmost axle)
  // - Distance from front of cab to Axle 1 = 930mm
  // - AC = 700mm (front axle to cab front)
  // - If AC is measured from frontmost axle: front of cab = 1370 - 700 = 670mm
  // - But TruckScience shows 930mm from front of cab to Axle 1
  // - This suggests: Axle 1 position = 670 + 930 = 1600mm from front
  //
  // Actually, looking at TruckScience more carefully:
  // - Front axle spacing (Axle 1 to Axle 2) = 1,860mm
  // - If Axle 1 is at 1,370mm (FOH), then Axle 2 = 1,370 + 1,860 = 3,230mm
  // - Front axle group center = (1,370 + 3,230) / 2 = 2,300mm
  //
  // Rear axle calculations (from spec sheet, matches TruckScience):
  // Rear axle group center = FOH + WB = 1370 + 5870 = 7240mm
  // Rear tandem axles (spaced 1320mm, centered at 7240mm):
  //   Rear axle 1: 7240 - 660 = 6580mm
  //   Rear axle 2: 7240 + 660 = 7900mm (rearmost)
  //
  // But wait - if frontmost axle is at 1370mm and rearmost is at 7900mm:
  // Extreme spacing = 7900 - 1370 = 6530mm ✓ (matches spec sheet)
  //
  // Using TruckScience front axle spacing of 1,860mm:
  frontAxlePosition: 2300,              // Front axle group center: (1370 + 3230) / 2 = 2300mm
  rearAxlePosition: 7240,               // FOH + WB = 1370 + 5870 - center of rear tandem axle group
  cabEnd: 2070,                         // FOH + G = 1370 + 700 (where cab ends)
  bedStart: 2070,                       // Same as cabEnd - this is where the body/tray starts (default, user can add gap)
  maxBodyLength: 8650,                  // OAL - bedStart = 10720 - 2070 (maximum available body length with TruckScience OAL)
  defaultBodyWidth: 2500,               // Standard body width for heavy-duty (user can adjust this)
  
  // Multi-axle positions (8x4: twin steer front + tandem rear)
  // Using TruckScience measurements:
  // Front twin steer: spacing 1,860mm (from TruckScience diagram)
  frontAxlePositions: [1370, 3230],      // Front axle 1: 1370mm (frontmost, FOH), Front axle 2: 3230mm (1860mm spacing)
  // Tandem rear: spaced 1320mm apart (F from spec sheet, matches TruckScience), centered at 7240mm
  rearAxlePositions: [6580, 7900],     // Rear axle 1: 6580mm, Rear axle 2: 7900mm (rearmost)
};

