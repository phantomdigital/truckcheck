/**
 * Truck Configuration - Isuzu FVR 170-300 AT R47
 * 
 * All dimensions in millimeters (mm) as per load-doc.md requirements
 * This matches the manufacturer specification exactly
 */

export interface TruckConfig {
  model: string;
  manufacturer: string;
  
  // Weight ratings (kg) - MANUFACTURER LIMITS
  gvm: number;              // Gross Vehicle Mass
  gcm: number;              // Gross Combination Mass
  frontAxleLimit: number;   // Front axle rating
  rearAxleLimit: number;    // Rear axle rating
  
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
  ca: number;               // Cab to rear axle
  
  // Calculated values for canvas
  frontAxlePosition: number;  // FOH
  rearAxlePosition: number;   // FOH + WB
  cabEnd: number;              // FOH + WB - CA (where cab ends)
  bedStart: number;            // Same as cabEnd - this is where the body/tray starts
  maxBodyLength: number;       // OAL - bedStart (maximum available body length)
  defaultBodyWidth: number;    // Standard body width (user can adjust this)
}

/**
 * Isuzu FVR 170-300 AT R47 - Default truck configuration
 * All dimensions in millimeters (mm)
 */
export const ISUZU_FVR_170_300: TruckConfig = {
  model: 'FVR 170-300 AT R47',
  manufacturer: 'Isuzu',
  
  // Weight ratings (kg) - MANUFACTURER LIMITS
  gvm: 17000,              // Gross Vehicle Mass
  gcm: 32000,              // Gross Combination Mass
  frontAxleLimit: 7300,    // Front axle rating
  rearAxleLimit: 10400,    // Rear axle rating
  
  // Factory cab chassis weights (kg) - FOR REFERENCE ONLY
  // Users will input their ACTUAL weigh bridge readings instead
  cabChassisFront: 3402,   // Front axle tare weight (reference)
  cabChassisRear: 2159,    // Rear axle tare weight (reference)
  cabChassisTotal: 5561,   // Total tare weight (reference)
  
  // Dimensions (mm)
  wb: 4660,                // Wheelbase (front axle to rear axle)
  oal: 8005,               // Overall length
  foh: 1255,               // Front overhang (front to front axle)
  roh: 2090,               // Rear overhang (rear axle to back)
  ca: 3675,                // Cab to rear axle
  
  // Calculated values for canvas
  frontAxlePosition: 1255,              // FOH
  rearAxlePosition: 5915,               // FOH + WB = 1255 + 4660
  cabEnd: 2240,                         // FOH + WB - CA = 1255 + 4660 - 3675 (where cab ends)
  bedStart: 2240,                       // Same as cabEnd - this is where the body/tray starts
  maxBodyLength: 5765,                  // OAL - bedStart = 8005 - 2240 (maximum available body length)
  defaultBodyWidth: 2400,               // Standard body width (user can adjust this)
};

