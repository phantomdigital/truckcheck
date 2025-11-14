/**
 * Truck Presets - Manufacturer specifications
 * 
 * Future enhancement: Pre-populate truck specifications based on manufacturer data
 * 
 * KEY INSIGHT FROM USER:
 * - Modern trucks have manufacturer data readily available
 * - Trucks are tied to specific models (e.g., Isuzu FVR, FVD)
 * - ADR (Australian Design Rules) only allows trucks to have SPECIFIED wheelbases
 * - This means we can provide accurate wheelbase options per model
 * - Users can select their exact model and get pre-filled, ADR-compliant specs
 * 
 * WORKFLOW:
 * Users would select their truck model, then only need to verify/adjust:
 * - Tare weights (from their actual weighbridge ticket)
 * - Body-specific dimensions (if custom body fitted)
 * 
 * This significantly reduces data entry time and errors while ensuring compliance.
 */

import { BodyType } from "./types"

export interface TruckModelSpec {
  manufacturer: string
  model: string
  series?: string // e.g., "FVR 240-300", "FRR 500"
  
  // Standard specifications (from manufacturer)
  gvm_range: { min: number; max: number } // kg
  wheelbase_options: number[] // metres - WB: ADR compliant options
  typical_front_axle_limit: number // kg
  typical_rear_axle_limit: number // kg
  
  // Key manufacturer dimensions (from spec sheets)
  // FOH: Front Overhang - front of truck to front axle
  typical_front_overhang: number // metres (FOH)
  
  // CA: Cab to Axle - back of cab to rear axle (used to calculate body start position)
  // For each wheelbase option, there's typically a corresponding CA value
  cab_to_axle_options: number[] // metres (CA) - matches wheelbase_options array
  
  // ROH: Rear Overhang - rear axle to back of truck
  typical_rear_overhang: number // metres (ROH)
  
  // Typical dimensions (can vary with body type)
  typical_body_length_range: { min: number; max: number } // metres
  typical_body_width: number // metres (EXTERNAL width - includes walls for refrigerated/pantech)
  
  // Typical tare weights (guide only - user should verify with actual weighbridge)
  typical_tare_weight_range: { min: number; max: number } // kg
  typical_front_tare_weight_percentage: number // e.g., 0.60 = 60% on front axle
  
  compatible_body_types: BodyType[]
  
  // Additional info
  common_applications?: string[]
  notes?: string
}

/**
 * Database of common Australian truck models
 * Data sourced from manufacturer specifications and ADR compliance
 * 
 * TODO: Expand this database with more models
 * TODO: Consider storing in database for easier updates
 * TODO: Add data validation and versioning
 */
export const TRUCK_MODEL_DATABASE: TruckModelSpec[] = [
  // Isuzu Light/Medium Duty
  {
    manufacturer: "Isuzu",
    model: "NLR",
    series: "45-150/55-150",
    gvm_range: { min: 4500, max: 5500 },
    wheelbase_options: [3.815, 4.475],
    cab_to_axle_options: [2.5, 3.2], // Estimated - needs manufacturer spec sheet
    typical_front_overhang: 1.2,
    typical_rear_overhang: 1.8, // Estimated
    typical_front_axle_limit: 2300,
    typical_rear_axle_limit: 3500,
    typical_body_length_range: { min: 3.5, max: 5.5 },
    typical_body_width: 2.5,
    typical_tare_weight_range: { min: 2200, max: 2800 },
    typical_front_tare_weight_percentage: 0.62,
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED],
    common_applications: ["Urban delivery", "Small tippers", "Refrigerated delivery"],
    notes: "Popular light duty truck for urban operations",
  },
  {
    manufacturer: "Isuzu",
    model: "NNR",
    series: "65-190",
    gvm_range: { min: 6500, max: 6500 },
    wheelbase_options: [3.815, 4.475],
    cab_to_axle_options: [2.5, 3.2], // Estimated - needs manufacturer spec sheet
    typical_front_overhang: 1.25,
    typical_rear_overhang: 1.9, // Estimated
    typical_front_axle_limit: 2500,
    typical_rear_axle_limit: 4500,
    typical_body_length_range: { min: 4.0, max: 6.2 },
    typical_body_width: 2.5,
    typical_tare_weight_range: { min: 2600, max: 3200 },
    typical_front_tare_weight_percentage: 0.60,
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER],
    common_applications: ["General freight", "Pantechs", "Small refrigerated bodies"],
  },
  {
    manufacturer: "Isuzu",
    model: "NQR",
    series: "87-190",
    gvm_range: { min: 8700, max: 8700 },
    wheelbase_options: [4.475, 5.2],
    cab_to_axle_options: [3.0, 3.8], // Estimated - needs manufacturer spec sheet
    typical_front_overhang: 1.3,
    typical_rear_overhang: 2.0, // Estimated
    typical_front_axle_limit: 3200,
    typical_rear_axle_limit: 5900,
    typical_body_length_range: { min: 5.0, max: 7.2 },
    typical_body_width: 2.45,
    typical_tare_weight_range: { min: 3200, max: 4000 },
    typical_front_tare_weight_percentage: 0.58,
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER],
    common_applications: ["Pantechs", "Refrigerated", "Furniture removal"],
  },
  {
    manufacturer: "Isuzu",
    model: "FRR",
    series: "110-260/500",
    gvm_range: { min: 11000, max: 11000 },
    wheelbase_options: [4.8, 5.5],
    cab_to_axle_options: [3.3, 4.0], // Estimated - needs manufacturer spec sheet
    typical_front_overhang: 1.4,
    typical_rear_overhang: 2.0, // Estimated
    typical_front_axle_limit: 3800,
    typical_rear_axle_limit: 7500,
    typical_body_length_range: { min: 6.0, max: 8.0 },
    typical_body_width: 2.45,
    typical_tare_weight_range: { min: 4000, max: 5000 },
    typical_front_tare_weight_percentage: 0.56,
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER, BodyType.TANKER],
    common_applications: ["Long distance freight", "Large pantechs", "Tipper operations"],
    notes: "Very popular medium duty model",
  },
  {
    manufacturer: "Isuzu",
    model: "FSD",
    series: "700/750",
    gvm_range: { min: 14000, max: 14000 },
    wheelbase_options: [4.8, 5.5, 6.1],
    cab_to_axle_options: [3.3, 4.0, 4.6], // Estimated - needs manufacturer spec sheet
    typical_front_overhang: 1.5,
    typical_rear_overhang: 2.1, // Estimated
    typical_front_axle_limit: 5000,
    typical_rear_axle_limit: 9500,
    typical_body_length_range: { min: 7.0, max: 9.0 },
    typical_body_width: 2.5,
    typical_tare_weight_range: { min: 5500, max: 7000 },
    typical_front_tare_weight_percentage: 0.54,
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER, BodyType.TANKER],
    common_applications: ["Heavy duty operations", "Long haul", "Large tippers"],
  },
  {
    manufacturer: "Isuzu",
    model: "FVR",
    series: "170-300",
    gvm_range: { min: 17000, max: 17000 }, // From spec sheet
    wheelbase_options: [4.660, 6.000], // WB: R47 and R60 from spec sheet
    cab_to_axle_options: [3.675, 5.015], // CA: from spec sheet - critical for body positioning
    typical_front_overhang: 1.255, // FOH: from spec sheet (front of truck to front axle)
    typical_rear_overhang: 2.095, // ROH: average of 2.090 (R47) and 2.100 (R60)
    typical_front_axle_limit: 7300, // From spec sheet (Loading Limit at ground)
    typical_rear_axle_limit: 10400, // From spec sheet (Loading Limit at ground)
    typical_body_length_range: { min: 5.765, max: 7.115 }, // CA + ROH (3.675+2.090 to 5.015+2.100)
    typical_body_width: 2.5, // External width (includes walls)
    typical_tare_weight_range: { min: 5561, max: 5697 }, // From spec sheet: R47=5,561kg, R60=5,697kg
    typical_front_tare_weight_percentage: 0.61, // Average from spec: 3,402/5,561 = 0.611 and 3,529/5,697 = 0.620
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER, BodyType.TANKER],
    common_applications: ["Long haul freight", "Large refrigerated bodies", "Heavy tippers"],
    notes: "Popular for long distance operations. OAL: 8.005m (R47/4.660WB) or 9.355m (R60/6.000WB)",
  },
  {
    manufacturer: "Isuzu",
    model: "FVD",
    series: "170-300",
    gvm_range: { min: 17000, max: 17000 }, // From spec sheet
    wheelbase_options: [4.660, 6.000, 6.950], // WB: R47, R60, R70 from spec sheet
    cab_to_axle_options: [3.675, 5.015, 5.965], // CA: from spec sheet
    typical_front_overhang: 1.255, // FOH: from spec sheet
    typical_rear_overhang: 2.275, // ROH: average of 2.090 (R47), 2.100 (R60), 2.635 (R70)
    typical_front_axle_limit: 7300, // From spec sheet
    typical_rear_axle_limit: 10400, // From spec sheet
    typical_body_length_range: { min: 5.765, max: 8.600 }, // CA + ROH (3.675+2.090 to 5.965+2.635)
    typical_body_width: 2.5, // External width
    typical_tare_weight_range: { min: 5449, max: 5732 }, // From spec: R47=5,449kg, R60=5,589kg, R70=5,732kg
    typical_front_tare_weight_percentage: 0.62, // Average from spec: ~3,400-3,600 front / ~5,500 total
    compatible_body_types: [BodyType.TRAY, BodyType.PANTECH, BodyType.TIPPER, BodyType.REFRIGERATED, BodyType.CURTAINSIDER, BodyType.TANKER],
    common_applications: ["Long haul freight", "Large refrigerated bodies", "Heavy tippers", "Extra long bodies"],
    notes: "Dual rear wheels version of FVR. OAL: 8.005m (R47), 9.355m (R60), or 10.840m (R70)",
  },

  // TODO: Add more manufacturers
  // - Hino (300 series, 500 series, 700 series)
  // - Fuso (Canter, Fighter, Heavy Duty)
  // - UD Trucks (Condor, Quon)
  // - Volvo (FM, FH series)
  // - Scania (G, P, R series)
  // - Mercedes-Benz (Atego, Axor, Actros)
  // - Kenworth, Mack, Western Star (for heavy duty)
]

/**
 * Get truck models by manufacturer
 */
export function getTruckModelsByManufacturer(manufacturer: string): TruckModelSpec[] {
  return TRUCK_MODEL_DATABASE.filter(
    (spec) => spec.manufacturer.toLowerCase() === manufacturer.toLowerCase()
  )
}

/**
 * Get all manufacturers
 */
export function getManufacturers(): string[] {
  const manufacturers = new Set(TRUCK_MODEL_DATABASE.map((spec) => spec.manufacturer))
  return Array.from(manufacturers).sort()
}

/**
 * Search truck models by name
 */
export function searchTruckModels(query: string): TruckModelSpec[] {
  const lowerQuery = query.toLowerCase()
  return TRUCK_MODEL_DATABASE.filter(
    (spec) =>
      spec.manufacturer.toLowerCase().includes(lowerQuery) ||
      spec.model.toLowerCase().includes(lowerQuery) ||
      spec.series?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get typical tare weight distribution
 * Returns estimated front and rear tare weights based on percentage
 */
export function getTypicalTareDistribution(
  spec: TruckModelSpec,
  actualTareWeight: number
): {
  front_tare_weight: number
  rear_tare_weight: number
} {
  const front_tare_weight = actualTareWeight * spec.typical_front_tare_weight_percentage
  const rear_tare_weight = actualTareWeight - front_tare_weight

  return {
    front_tare_weight: Math.round(front_tare_weight),
    rear_tare_weight: Math.round(rear_tare_weight),
  }
}

