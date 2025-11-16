/**
 * Load Calculator Types
 * All measurements in SI units (metres, kilograms)
 * Convert to display units only in UI layer
 */

// Enum for body types
export enum BodyType {
  TRAY = 'TRAY',
  PANTECH = 'PANTECH',
  CURTAINSIDER = 'CURTAINSIDER',
  REFRIGERATED = 'REFRIGERATED',
  TIPPER = 'TIPPER',
  TANKER = 'TANKER',
}

// Enum for suspension types
export enum SuspensionType {
  STEEL = 'STEEL', // Leaf spring or coil spring suspension
  AIRBAG = 'AIRBAG', // Air suspension (rear airbags)
  TAPER_LEAF = 'TAPER_LEAF', // Taper-leaf springs (typically front axle - stiffer than multi-leaf)
}

// Color mapping for body types
export const BODY_TYPE_COLORS: Record<BodyType, string> = {
  [BodyType.TRAY]: '#94a3b8', // slate-400
  [BodyType.PANTECH]: '#60a5fa', // blue-400
  [BodyType.CURTAINSIDER]: '#34d399', // green-400
  [BodyType.REFRIGERATED]: '#93c5fd', // blue-300
  [BodyType.TIPPER]: '#fbbf24', // amber-400
  [BodyType.TANKER]: '#a78bfa', // violet-400
}

// Truck configuration
export interface TruckProfile {
  id?: string
  user_id?: string
  name: string
  body_type: BodyType
  
  // Physical dimensions (metres)
  body_length: number
  body_width: number
  wheelbase: number // WB: Distance from front axle to rear axle
  
  // Weights (kilograms)
  tare_weight: number // Empty weight
  front_tare_weight: number // Front axle weight when empty
  rear_tare_weight: number // Rear axle weight when empty
  gvm: number // Gross Vehicle Mass (maximum legal weight)
  front_axle_limit: number // Front axle weight limit
  rear_axle_limit: number // Rear axle weight limit
  
  // Key manufacturer dimensions for accurate positioning
  front_overhang: number // FOH: Distance from front of truck to front axle (metres)
  cab_to_axle?: number // CA: Distance from back of cab to rear axle (metres) - used to calculate body start
  rear_overhang?: number // ROH: Distance from rear axle to back of truck (metres)
  
  // Suspension type affects weight distribution calculations
  // For mixed suspension (e.g., steel front + airbag rear), specify both
  suspension_type: SuspensionType // STEEL, AIRBAG, or TAPER_LEAF (legacy - applies to both axles)
  front_suspension_type?: SuspensionType // Front axle suspension (overrides suspension_type if specified)
  rear_suspension_type?: SuspensionType // Rear axle suspension (overrides suspension_type if specified)
  
  // Wall thickness (metres) - affects usable loading area
  // Defaults: 0.03m (30mm) for pantech/refrigerated, 0 for tray/curtainsider
  wall_thickness_front?: number // Front wall thickness (metres)
  wall_thickness_rear?: number // Rear wall thickness (metres)
  wall_thickness_sides?: number // Side wall thickness (metres) - applies to both sides
  
  created_at?: string
  updated_at?: string
}

// Pallet on the truck
export interface Pallet {
  id: string
  
  // Physical properties
  length: number // metres
  width: number // metres
  weight: number // kilograms
  
  // Position on truck (metres from front-left corner of body)
  x: number
  y: number
  
  // Display
  name?: string
  color?: string
}

// Calculated weight distribution
export interface WeightDistribution {
  // Total weights (kg)
  total_weight: number
  front_axle_weight: number  // Total weight on front axle group
  rear_axle_weight: number   // Total weight on rear axle group
  
  // Individual axle weights (for multi-axle configurations)
  front_axle_weights?: number[]  // Weight on each front axle (kg) - if multiple front axles
  rear_axle_weights?: number[]   // Weight on each rear axle (kg) - if multiple rear axles
  
  // Available capacity remaining (kg)
  total_capacity_remaining: number
  front_axle_capacity_remaining: number
  rear_axle_capacity_remaining: number
  
  // Percentages of limits
  gvm_percentage: number
  front_axle_percentage: number
  rear_axle_percentage: number
  
  // Warnings
  is_overweight: boolean
  is_front_overweight: boolean
  is_rear_overweight: boolean
  
  // Centre of gravity (metres from front of body)
  load_cog_x: number
}

// Load calculation (saved calculation history)
export interface LoadCalculation {
  id?: string
  user_id?: string
  truck_profile_id: string
  truck_profile?: TruckProfile // Embedded for display
  
  name: string // User-friendly name for this calculation
  pallets: Pallet[]
  
  // Calculated results
  weight_distribution: WeightDistribution
  
  created_at?: string
  updated_at?: string
}

// Form data for creating/updating truck profile
export interface TruckProfileFormData {
  name: string
  body_type: BodyType
  body_length: number
  body_width: number
  wheelbase: number
  tare_weight: number
  front_tare_weight: number
  rear_tare_weight: number
  gvm: number
  front_axle_limit: number
  rear_axle_limit: number
  front_overhang: number
  cab_to_axle?: number // CA: From spec sheet - used to calculate body start position
  rear_overhang?: number // ROH: From spec sheet
  suspension_type: SuspensionType // STEEL, AIRBAG, or TAPER_LEAF (legacy - applies to both axles)
  front_suspension_type?: SuspensionType // Front axle suspension (overrides suspension_type if specified)
  rear_suspension_type?: SuspensionType // Rear axle suspension (overrides suspension_type if specified)
  wall_thickness_front?: number // Front wall thickness (metres), default 0.03
  wall_thickness_rear?: number // Rear wall thickness (metres), default 0.03
  wall_thickness_sides?: number // Side wall thickness (metres), default 0.03
}

// Validation result
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

