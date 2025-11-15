# TruckCheck Physics Model

## Overview

TruckCheck uses a moment-based physics model to calculate weight distribution between front and rear axles as loads are added and repositioned on a truck bed. The model accounts for suspension dynamics to provide accurate predictions of axle loads under various loading scenarios.

## Core Principles

### 1. Moment-Based Weight Distribution

The fundamental physics principle is moment equilibrium. For a static vehicle, the sum of moments about any point must equal zero.

Taking moments about the rear axle:

```
Front_Axle_Force × Wheelbase = Total_Load × Distance_from_Rear_Axle_to_COG
```

Where:
- `Wheelbase` = Distance from front axle to rear axle (meters)
- `Total_Load` = Sum of all pallet weights (kg)
- `Distance_from_Rear_Axle_to_COG` = Horizontal distance from rear axle to load center of gravity (meters)

This gives us:

```
Front_Axle_Load = (Total_Load × Distance_from_Rear_Axle_to_COG) / Wheelbase
Rear_Axle_Load = Total_Load - Front_Axle_Load
```

### 2. Center of Gravity Calculation

The load center of gravity (COG) is calculated as the weighted average of all pallet positions:

```
COG_x = Σ(Pallet_Weight_i × Pallet_Position_x_i) / Σ(Pallet_Weight_i)
```

Where each pallet's position is measured from the front of the truck body, and the pallet COG is at its geometric center:

```
Pallet_COG_x = Pallet_x + (Pallet_Length / 2)
```

### 3. Coordinate System

All positions are measured in meters:
- Origin (0m) = Front of truck body (loading area)
- X-axis = Horizontal, positive toward rear
- Front axle position = Typically negative (under cab, ahead of body)
- Rear axle position = CA (Cab-to-Axle distance)

Example for a typical medium-duty truck:
- Front axle: -0.98m (under cab)
- Body starts: 0.0m
- Rear axle: +3.68m
- Wheelbase: 4.66m

## Suspension Dynamics

The rigid-body moment calculation provides a baseline, but suspension compression under load affects weight distribution. This is especially significant with mixed suspension systems.

### Suspension Types

The model supports three suspension types, each with different compression characteristics:

**Taper-Leaf Springs**
- Typical application: Front axle on medium-duty trucks
- Compression rate: ~0.5mm per 100kg of axle load
- Maximum compression: ~20mm
- Stiffest of the three types

**Multi-Leaf Steel Springs**
- Typical application: Rear axle on light-duty trucks
- Compression rate: ~0.1mm per 100kg of axle load
- Maximum compression: ~10mm
- Medium stiffness

**Airbag Suspension**
- Typical application: Rear axle on medium/heavy-duty trucks
- Compression rate: ~0.8mm per 100kg of axle load (non-linear)
- Maximum compression: ~150mm
- Softest, with non-linear stiffening under heavy loads

### Suspension Compression Effect

When suspension compresses differentially between front and rear axles, it creates a pitch angle that shifts the vehicle's center of gravity horizontally. This shift redistributes weight between axles.

#### Step 1: Calculate Compression at Each Axle

```
Compression_Front = f(Front_Axle_Load, Front_Suspension_Type)
Compression_Rear = f(Rear_Axle_Load, Rear_Suspension_Type)
```

Each function applies the appropriate compression rate and maximum limits for that suspension type.

#### Step 2: Calculate Differential Compression

```
Differential_Compression = Compression_Rear - Compression_Front
```

When positive (typical), the rear compresses more than the front, creating a forward pitch.

#### Step 3: Calculate Pitch Angle

```
Pitch_Angle = atan(Differential_Compression / Wheelbase)
```

#### Step 4: Calculate COG Horizontal Shift

The pitch angle causes the vehicle's center of gravity to shift horizontally:

```
COG_Horizontal_Shift = COG_Height × sin(Pitch_Angle)
```

Where `COG_Height` is estimated based on load position and weight (typically 1.0-1.5m for loaded trucks).

#### Step 5: Calculate Weight Redistribution

The horizontal COG shift creates a moment that redistributes weight:

```
Compression_Ratio = |Differential_Compression| / Wheelbase
COG_Shift_Ratio = |COG_Horizontal_Shift| / Wheelbase
Weight_Shift_Ratio = (Compression_Ratio × 0.7) + (COG_Shift_Ratio × 0.3)
```

The shift is from front to rear when rear compression exceeds front compression:

```
Weight_Shift = Weight_Shift_Ratio × Total_Weight × 0.5
```

### Iterative Solver

Because suspension compression affects weight distribution, which in turn affects compression, the model uses an iterative solver to converge on accurate values:

1. Start with rigid-body weight distribution
2. Calculate suspension compression based on current axle loads
3. Calculate weight shift from compression
4. Update axle loads
5. Repeat until convergence (change < 0.1kg) or maximum iterations (5)

This typically converges in 2-4 iterations.

## Weighbridge Data Foundation

Unlike specification-based systems, TruckCheck uses actual weighbridge data as the foundation for all calculations:

**Tare Weight Input:**
- Front axle tare weight (actual measured, kg)
- Rear axle tare weight (actual measured, kg)
- Total tare weight (sum of front + rear)

**Axle Limits:**
- Front axle limit (regulatory, kg)
- Rear axle limit (regulatory, kg)
- GVM (Gross Vehicle Mass limit, kg)

### Why Weighbridge Data is Critical

Weighbridge measurements capture the actual vehicle state including:
- Real cab and chassis weight (not manufacturer estimates)
- Actual body weight (not body maker's nominal values)
- All accessories, modifications, and fittings
- Fuel, fluids, and operational equipment
- Suspension and tyre compression at tare weight

This eliminates the compounding errors present in specification-based systems where each component's weight is estimated.

## Load Calculations

### Adding a Pallet

When a pallet is added or repositioned:

1. Calculate new total load weight
2. Calculate new load COG position
3. Apply moment equation for rigid-body distribution
4. Run iterative solver for suspension effects
5. Add load distribution to tare weights
6. Clamp negative values (physically impossible)
7. Calculate compliance percentages

### Physical Constraints

The model enforces physical reality:
- No axle can have negative weight
- If front axle would go negative, transfer to rear
- If rear axle would go negative, transfer to front

This handles extreme loading scenarios (e.g., load entirely behind rear axle).

### Usable Loading Area

The model accounts for wall thickness in different body types:
- Tray: No walls (0mm)
- Pantech: Typical 30mm walls
- Curtainsider: No side walls (0mm)
- Refrigerated: Typical 30-80mm insulated walls
- Tipper: Front and side walls only
- Tanker: No walls (tank is body)

Usable area = Body dimensions - Wall thickness

## Compliance Checking

For each loading scenario, the model calculates:

**Weight Metrics:**
- Front axle weight (kg and percentage of limit)
- Rear axle weight (kg and percentage of limit)
- Total weight (kg and percentage of GVM)
- Remaining capacity on each axle and total

**Compliance Flags:**
- Front axle overweight (exceeds limit)
- Rear axle overweight (exceeds limit)
- Total overweight (exceeds GVM)

## Accuracy and Validation

The model has been validated against real-world weighbridge measurements showing:
- Rigid-body calculations alone: ~5-10% error vs actual
- With suspension modeling: ~2-5% error vs actual
- Primarily limited by COG height estimation accuracy

Comparison against specification-based systems shows TruckCheck more accurately predicts actual axle loads, typically within 50-100kg of weighbridge readings, versus 400-600kg errors in specification-based systems.

## Model Limitations

**Assumptions:**
- Static loading (not accounting for dynamic effects during transit)
- Uniform load distribution within each pallet
- COG height estimated from load position (not measured)
- Suspension compression follows linear/simple non-linear models
- No lateral (side-to-side) weight distribution modeling

**Not Modeled:**
- Individual tyre loads (only total axle loads)
- Tyre compression (negligible ~5mm vs suspension ~50-150mm)
- Dynamic loads from acceleration, braking, cornering
- Road surface effects
- Temperature effects on suspension

These simplifications are justified because:
1. Axle-level loads are what regulatory compliance requires
2. Tyre compression is <5% of suspension compression
3. Static load compliance is the legal requirement
4. The weighbridge data already captures tyre effects at tare

## Calculation Flow Summary

```
1. Input: Weighbridge tare weights, truck geometry, axle limits
2. Input: Pallet positions, dimensions, weights
3. Calculate: Load center of gravity
4. Calculate: Rigid-body weight distribution (moment equation)
5. Iterate:
   a. Calculate suspension compression (front and rear)
   b. Calculate pitch angle from differential compression
   c. Calculate COG shift from pitch
   d. Calculate weight redistribution from COG shift
   e. Update axle loads
   f. Check convergence
6. Add load distribution to tare weights
7. Clamp to physical limits (no negative axle loads)
8. Calculate compliance percentages
9. Flag overweight conditions
10. Output: Front axle, rear axle, total weights and compliance
```

## Technical Implementation Notes

All calculations use SI units internally:
- Distances: meters (m)
- Weights: kilograms (kg)
- Angles: radians (rad)

Conversion to display units (mm, tonnes, degrees) occurs only in the UI layer.

Numerical precision:
- Weight convergence threshold: 0.1 kg
- Distance precision: 0.001 m (1mm)
- Maximum solver iterations: 5

## Conclusion

The TruckCheck physics model balances accuracy with simplicity by:
- Using proven moment-based mechanics
- Incorporating suspension dynamics for realism
- Building on actual weighbridge data rather than estimates
- Focusing on regulatory compliance requirements

This approach provides operators with reliable load planning that matches real-world weighbridge results, avoiding the systematic errors inherent in specification-based systems.

