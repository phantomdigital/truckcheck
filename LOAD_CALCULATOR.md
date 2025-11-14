# Load Calculator - Implementation Documentation

## Overview

The Load Calculator is a web application for planning truck loads and calculating weight distribution across axles. It helps truck operators ensure compliance with NHVR (National Heavy Vehicle Regulator) mass management guidelines.

## Phase 1 Features (MVP) 

### 1. Truck Profile Management
- Create, update, and delete truck profiles
- Store truck specifications:
  - Body type (Tray, Pantech, Curtainsider, Refrigerated, Tipper, Tanker)
  - Physical dimensions (body length, width, wheelbase, front overhang)
  - Weight specifications (tare weight, GVM, axle limits)
- Validation of truck data (tare weight must sum to axle weights, etc.)

### 2. Visual Load Planning
- Interactive top-down canvas view of truck body
- Grid lines at 1-metre intervals for reference
- Axle positions marked in red
- Wheelbase measurement annotation
- Colour-coded body types

### 3. Pallet Management
- Add pallets via quick-add buttons (common Australian sizes):
  - Standard pallet (1165×1165mm)
  - Euro pallet (1200×800mm)
  - Half pallet (600×800mm)
  - Quarter pallet (600×400mm)
- Add custom pallets with specific dimensions and weight
- Drag-and-drop positioning on truck canvas
- Visual colour coding for different pallets
- Auto-constraint to truck body boundaries

### 4. Real-time Physics Calculations
- Calculates weight distribution using moment physics
- Shows:
  - Total weight and GVM percentage
  - Front axle weight and percentage of limit
  - Rear axle weight and percentage of limit
  - Remaining capacity for each
  - Load centre of gravity position
- Visual progress bars with colour-coded warnings:
  - Green: < 85%
  - Yellow: 85-95%
  - Orange: 95-100%
  - Red: > 100% (overweight)

### 5. Load Calculation History
- Save load calculations with custom names
- View calculation history
- Load previous calculations
- Auto-saves truck profile with each calculation

### 6. Safety & Compliance
- Prominent disclaimers about estimates vs. real-world factors
- Links to NHVR resources:
  - Mass Management guidelines
  - Loading and Restraint guidelines
- Australian English spelling throughout (metre, tonne)
- All calculations in SI units (metres, kilograms)

## Technical Architecture

### Database Schema

#### `truck_profiles` table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (text) - User-friendly name
- `body_type` (text) - Enum: TRAY, PANTECH, CURTAINSIDER, etc.
- `body_length` (decimal) - metres
- `body_width` (decimal) - metres
- `wheelbase` (decimal) - metres
- `front_overhang` (decimal) - metres
- `tare_weight` (decimal) - kg
- `front_tare_weight` (decimal) - kg
- `rear_tare_weight` (decimal) - kg
- `gvm` (decimal) - kg
- `front_axle_limit` (decimal) - kg
- `rear_axle_limit` (decimal) - kg
- `created_at`, `updated_at` (timestamp)

#### `load_calculations` table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `truck_profile_id` (UUID, foreign key to truck_profiles)
- `name` (text) - User-friendly name for calculation
- `pallets` (JSONB) - Array of pallet objects
- `weight_distribution` (JSONB) - Calculated results
- `created_at`, `updated_at` (timestamp)

### Physics Engine (`lib/load-calculator/physics.ts`)

The weight distribution calculation uses basic moment physics:

1. **Calculate Load Centre of Gravity (COG)**
   - For each pallet, calculate COG at its centre
   - Sum moments: `Moment = Weight × Distance`
   - Load COG = `Total Moment / Total Weight`

2. **Calculate Axle Loads**
   - Taking moments about rear axle:
   - `Front Axle Load × Wheelbase = Total Load × (Distance from COG to Rear Axle)`
   - `Rear Axle Load = Total Load - Front Axle Load`
   - Add to tare weights for final axle weights

3. **Check Limits**
   - Compare against GVM and axle limits
   - Calculate percentages and remaining capacity
   - Flag overweight conditions

### Components

#### `TruckProfileForm`
- Form for creating/editing truck profiles
- Real-time validation
- Grouped fields (dimensions, weights)
- Helper text for each field

#### `TruckCanvas`
- HTML5 Canvas for visual representation
- 800×600px canvas with padding
- Grid rendering (1m squares)
- Truck body with body-type colour
- Axle lines and annotations
- Pallet rendering with drag-and-drop
- Click selection with visual feedback

#### `PalletPanel`
- List of pallets with details
- Quick-add buttons for common sizes
- Custom pallet form
- Delete functionality
- Total load weight display

#### `WeightPanel`
- Real-time weight distribution display
- Progress bars for each limit
- Colour-coded status indicators
- Warnings for overweight conditions
- Load COG display

#### `LoadCalculatorClient`
- Main orchestrator component
- State management for trucks and pallets
- Dialog management (truck form, save, history)
- Integration with server actions

### File Structure

```
lib/load-calculator/
├── types.ts           # TypeScript interfaces
├── physics.ts         # Weight distribution calculations
├── actions.ts         # Server actions (CRUD)
├── truck-presets.ts   # Manufacturer specifications database (Phase 2)
└── index.ts          # Public API exports

components/load-calculator/
├── truck-profile-form.tsx
├── truck-canvas.tsx
├── pallet-panel.tsx
├── weight-panel.tsx
└── index.ts

app/load-calculator/
├── page.tsx                    # Server component wrapper
└── load-calculator-client.tsx  # Client-side main component

supabase/migrations/
├── 20251114000319_create_truck_profiles_table.sql
└── 20251114000339_create_load_calculations_table.sql
```

## Phase 2 Features (Future)

### Truck Model Database
- **Pre-populated manufacturer specifications**
  - Select truck by manufacturer and model (e.g., "Isuzu FVR 240-300")
  - Auto-fill dimensions, wheelbase, axle limits from manufacturer specs
  - ADR-compliant wheelbase options for each model
  - Typical tare weight ranges as starting point
  - User only needs to verify/adjust actual tare weights from weighbridge ticket
- **Benefits:**
  - Much faster truck profile creation
  - Reduces user input errors
  - Educational (users can see typical specs for their truck)
  - Ensures ADR-compliant wheelbases are used

### Other Phase 2 Features
- Load templates (save common pallet configurations)
- Export PDF of load plan
- Share load plan via link
- Multi-truck comparison
- History search and filtering

## Phase 3 Features (Future)

### Enhanced Truck Database
- Expand manufacturer database (Hino, Fuso, UD, Volvo, Scania, Mercedes-Benz, Kenworth, Mack)
- Historical model data (older trucks still in service)
- Custom modifications tracking (chassis extensions, body swaps)
- Integration with truck VIN decoder (future API)
- Community-contributed specifications with verification

### Other Phase 3 Features
- Pre-set pallet library with dimensions and typical weights
- Rotation of pallets (portrait/landscape)
- Bulk loads (non-palletized cargo like gravel in tipper)
- 3D visualization
- Load restraint recommendations
- Mobile app for on-site load planning

## Usage

### Creating a Truck Profile

1. Navigate to `/load-calculator`
2. Click "Create Truck Profile"
3. Follow the 5-step wizard:
   - **Step 1:** Select manufacturer & model (or choose manual entry)
   - **Step 2:** Select ADR-compliant wheelbase
   - **Step 3:** Verify/adjust body dimensions
   - **Step 4:** Enter actual weighbridge weights (CRITICAL)
   - **Step 5:** Review and save
4. Profile is created and ready to use

The wizard is mobile-optimized with clear progress indicators and can be accessed directly at `/load-calculator/setup`.

### Planning a Load

1. Select truck from dropdown
2. Add pallets:
   - Click quick-add buttons for common sizes
   - Or click "Add Custom Pallet" for specific dimensions/weight
3. Drag pallets on canvas to position them
4. Watch weight distribution update in real-time
5. Adjust positions until weight is within limits
6. Click "Save Calculation" to store for later

### Loading a Previous Calculation

1. Click "Load History"
2. Click on a saved calculation
3. Canvas and pallets will be restored
4. Continue editing or save as new calculation

## Important Notes

### Accuracy & Limitations

The calculator provides **estimates only** based on:
- Static weight distribution calculations
- Assumes rigid body (no suspension compression)
- Uniform weight distribution within each pallet
- Level ground

Real-world factors not accounted for:
- Suspension type and stiffness
- Tyre pressure and deflection
- Road camber and gradients
- Load shift during transit
- Fuel weight changes
- Dynamic loads (acceleration, braking, cornering)

**Always verify with a weighbridge** before travelling with a loaded vehicle.

### Data Accuracy Requirements

For accurate calculations, ensure:
1. Tare weights are from a recent weighbridge ticket
2. Front and rear tare weights sum to total tare weight
3. Dimensions are measured accurately (±10mm acceptable)
4. Wheelbase is measured from axle centre to axle centre
5. Front overhang is from front of body to front axle centre

### Compliance

This tool is designed to assist with load planning but does not guarantee compliance with:
- NHVR mass limits
- State-specific regulations
- Bridge formula requirements
- Special permits or exemptions

Operators are responsible for ensuring legal compliance.

## Development

### Running Migrations

```bash
supabase db reset
# or
supabase migration up
```

### Future: Truck Presets Implementation

When implementing the truck model database (Phase 2):

1. **Enhanced Truck Profile Form**
   - Add manufacturer dropdown (Isuzu, Hino, Fuso, etc.)
   - Add model dropdown (filtered by manufacturer)
   - Add wheelbase selector (shows only ADR-compliant options)
   - Pre-fill all specifications from database
   - Show "typical" badges on pre-filled fields
   - Allow user to override any field

2. **Database Structure**
   - Consider moving `truck-presets.ts` to database table
   - Add admin interface for managing truck specifications
   - Version control for specification updates
   - Source attribution (manufacturer data sheets, ADR compliance docs)

3. **User Experience Flow**
   ```
   1. Select manufacturer → "Isuzu"
   2. Select model → "FVR 240-300"
   3. Select wheelbase → "6.0m" (from ADR options)
   4. Auto-fills:
      - GVM: 16,500 kg
      - Front axle limit: 5,500 kg
      - Rear axle limit: 11,500 kg
      - Typical body dimensions
      - Typical tare weight: ~7,000 kg (guide only)
   5. User enters actual tare weights from their weighbridge ticket
   6. Save profile
   ```

4. **Data Sources**
   - Manufacturer specification sheets
   - ADR compliance documents
   - NHVR mass and dimension guidelines
   - Community verification (with moderation)

5. **Data Accuracy**
   - All manufacturer data marked as "typical" or "maximum"
   - Clear disclaimers that actual weights must come from weighbridge
   - Version tracking for specification updates
   - Regular audits against current ADR regulations

### Testing

Test with various scenarios:
1. Empty truck (should show tare weights)
2. Single pallet at front (front axle should increase)
3. Single pallet at rear (rear axle should increase)
4. Overweight scenarios (should show warnings)
5. Multiple pallets (should calculate combined COG)

### TypeScript Strict Mode

All code uses strict TypeScript:
- All types explicitly defined
- No `any` types (except for Supabase query results)
- Enum for body types
- Interfaces for all data structures

## Support

For issues or feature requests, contact support or file a GitHub issue.

## License

Proprietary - TruckCheck © 2024

