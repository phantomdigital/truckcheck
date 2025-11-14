# TruckCheck MVP - Cursor Prompt

I'm building TruckCheck, an Australian truck load compliance calculator. I need an MVP that lets users:
1. Input REAL weigh bridge readings (actual front/rear axle weights)
2. Configure body specifications (spacing from cab, body length/width)
3. Drag pallets onto a truck bed diagram
4. See real-time compliance with NHVR weight regulations

**ROUTE STRUCTURE:**
- Use Next.js route group: `app/(dashboard)/dashboard/`
- This prevents inheriting the main app's header and footer
- URL will be `/dashboard` (parentheses don't affect URL)
- Dashboard needs its own minimal layout.tsx with no header/footer

**UI LAYOUT:** 
- Fixed dashboard menu on the LEFT (icon-based navigation)
- Full canvas takes remaining space
- All controls are draggable popovers ON the canvas (using @dnd-kit/core)
- No fixed right panel - everything floats and is user-positionable

**IMPORTANT: The entire site uses dark mode. All canvas elements, strokes, text, and UI components must use light colors that are visible on dark backgrounds.**

## MOBILE & RESPONSIVE CONSIDERATIONS

**Landscape orientation on mobile:**
- Force landscape mode on mobile devices using CSS:
  ```css
  @media (max-width: 768px) and (orientation: portrait) {
    .dashboard-container::after {
      content: "Please rotate your device to landscape mode";
      /* Overlay message */
    }
  }
  ```
- Or use screen orientation API to suggest rotation
- Truck diagrams are naturally horizontal - landscape makes more sense

**Responsive UI adaptations:**

1. **Mobile (< 768px):**
   - Dashboard menu becomes bottom bar with horizontal icons
   - OR: Collapsible hamburger menu that slides in from left
   - Popovers automatically dock to bottom as drawer/sheets instead of floating
   - Simpler single-popover view (tabs to switch between Weigh Bridge, Body Config, Compliance)
   - Canvas fills entire screen minus menu bar
   - Touch-friendly larger tap targets (44px minimum)

2. **Tablet (768px - 1024px):**
   - Keep dashboard menu on left but narrower (~50px)
   - Popovers can still float but with constraints
   - Smaller default popover sizes

3. **Desktop (> 1024px):**
   - Full experience as described
   - Dashboard menu at ~60-80px
   - Freely draggable popovers

**Touch handling for Konva:**
- Enable touch events on Stage: `touchEnabled: true`
- Implement pinch-to-zoom for canvas on mobile (optional but nice)
- Larger pallet tap targets on mobile
- Consider snap-to-grid more aggressive on mobile (easier positioning)

**Recommendation:**
- **Primary target: Desktop/landscape tablet** - this is a professional tool
- **Mobile support: Landscape only, simplified UI** - force/suggest landscape rotation
- Use `@media (orientation: portrait)` to show rotation prompt on small screens
- Alternatively: Build mobile-first with bottom drawer UI, enhance for desktop

**Decision needed:** Should mobile be fully supported or just show a "best viewed on desktop" message?
- Option A: Full responsive support with bottom drawers and landscape mode
- Option B: Desktop-optimized with portrait blocker and landscape requirement
- **Recommendation: Option B** - Professional tools like TruckScience are desktop-focused

## TECH STACK
- Next.js 14+ (App Router)
- TypeScript
- Konva.js (react-konva) for canvas
- @dnd-kit/core for draggable popovers
- Tailwind CSS
- File naming: kebab-case

## FOLDER STRUCTURE
```
app/
├── (dashboard)/                    # Route group - doesn't inherit root layout
│   └── dashboard/
│       ├── page.tsx                # Server component wrapper
│       ├── loading.tsx             
│       ├── layout.tsx              # Minimal layout (no header/footer)
│       └── components/
│           ├── load-calculator.tsx     # Main client component (canvas + popovers)
│           ├── dashboard-menu.tsx      # Left sidebar navigation
│           ├── truck-canvas.tsx        # Konva canvas component
│           ├── pallet-shape.tsx        # Draggable pallet component (on canvas)
│           ├── orientation-warning.tsx # Portrait mode warning (mobile)
│           │
│           └── popovers/
│               ├── weigh-bridge-popover.tsx    # Draggable weigh bridge inputs
│               ├── body-config-popover.tsx     # Draggable body configuration
│               ├── compliance-popover.tsx      # Draggable compliance summary
│               └── truck-selector-popover.tsx  # Optional truck selection
│
├── lib/
│   ├── physics.ts                  # Weight calculations (KEEP EXISTING - already dialed in)
│   ├── truck-config.ts             # Truck specs (static for now)
│   ├── canvas-helpers.ts           # Coordinate conversion
│   └── truck-dimensions.ts         # Constants
│
└── types/
    └── truck.ts                    # TypeScript interfaces
```

**Important about route structure:**
- The `(dashboard)` folder is a route group - the parentheses mean it doesn't affect the URL
- URL will be `/dashboard` not `/(dashboard)/dashboard`
- This allows the dashboard to have its own layout.tsx without inheriting the main app header/footer
- The dashboard layout should be minimal - just a container for the full-screen canvas experience

## KEY REQUIREMENTS

### IMPORTANT: DO NOT MODIFY EXISTING FILES
- **lib/physics.ts** - Keep this file exactly as-is. The weight calculation logic is already dialed in and working correctly. Import and use the existing functions.

### 1. WEIGH BRIDGE WORKFLOW (CRITICAL)
This is the core of the app:

**User inputs:**
- ACTUAL front axle weight from weigh bridge (e.g., 3500kg)
- ACTUAL rear axle weight from weigh bridge (e.g., 2200kg)
- These real measured weights are the BASELINE/TARE for all calculations

**Calculation logic:**
- When pallets are added to the canvas, calculate weight distribution based on position
- For each pallet, use moment calculations to determine how much weight goes to each axle
- Final axle loads = weigh bridge baseline + calculated additional load from pallets
- Compare against manufacturer limits (7,300kg front, 10,400kg rear, 17,000kg GVM)

**Example:**
- User sets spacing from back of cab: 100mm
- User sets body dimensions: Length 5,000mm, Width 2,400mm
- Body starts at: 2,240mm + 100mm = 2,340mm
- Weigh bridge reading: Front 3,500kg, Rear 2,200kg (total 5,700kg)
- User adds 2,000kg pallet at position 4,000mm from front
- Calculate: This pallet adds 800kg to front, 1,200kg to rear (based on moment arm)
- New totals: Front 4,300kg / 7,300kg, Rear 3,400kg / 10,400kg, GVM 7,700kg / 17,000kg
- All values stay GREEN (compliant)
- If user increases spacing to 300mm, body now starts at 2,540mm
- Max body length reduces to 5,465mm (5,765 - 300)

### 2. COORDINATE SYSTEM
- All truck dimensions in millimeters (real world)
- Convert mm to pixels: SCALE = CANVAS_WIDTH_PX / TRUCK_OAL_MM
- Helper functions: mmToPx(mm), pxToMm(px)
- Always round to integers for crisp rendering

### 3. CANVAS RENDERING (like TruckScience)

**IMPORTANT: Site uses dark mode - adjust all colors accordingly**

- Konva Stage with `pixelRatio: window.devicePixelRatio || 2`
- Enable touch events: `touchEnabled: true` for mobile support
- Simple geometric shapes - no gradients or shadows

**Truck structure (rendered as separate elements):**
1. **Cab area** (0mm to 2,240mm):
   - Simple rectangle showing cab size
   - Dark grey fill (#374151 or similar) with light stroke (#6b7280)
   - Width: 2,240mm (cabEnd) - FIXED by chassis
   - Height: same as bodyDimensions.width
   - This is NOT a draggable area
   
2. **Gap/spacing** (2,240mm to 2,240mm + fromBackOfCab):
   - Empty space (no rectangle needed, or optional dotted outline)
   - This represents the spacing between cab and body
   - User adjustable, typically 0-500mm
   - This is NOT a draggable area
   
3. **Body/tray area** (2,240mm + fromBackOfCab to 2,240mm + fromBackOfCab + bodyDimensions.length):
   - Rectangle with 2px light stroke (#9ca3af or #d1d5db), darker fill (#1f2937 or #111827)
   - This is where pallets can be placed
   - Length: bodyDimensions.length (ADJUSTABLE by user)
   - Width: bodyDimensions.width (ADJUSTABLE by user)
   - Position: starts at (bedStart + fromBackOfCab)
   
**Key point:** Body position changes based on fromBackOfCab spacing. The body rectangle starts at `mmToPx(truckConfig.bedStart + fromBackOfCab)`

**Other elements:**
- Dimension lines: Light grey (#9ca3af) thin lines with arrows and measurements
- Dimension text: Light grey or white (#e5e7eb)
- Axle positions: Dashed vertical lines in light grey showing front axle (1,255mm) and rear axle (5,915mm)
- Pallets: Medium grey rectangles (#4b5563) with white centered weight labels

**Dark mode color palette:**
```javascript
const COLORS = {
  cab: {
    fill: '#374151',      // Dark grey - represents cab
    stroke: '#6b7280',
  },
  body: {
    fill: '#1f2937',      // Darker grey - draggable area
    stroke: '#9ca3af',
  },
  pallet: {
    fill: '#4b5563',      // Medium grey
    stroke: '#9ca3af',
    text: '#ffffff',
  },
  dimensions: {
    line: '#9ca3af',      // Light grey for dimension lines
    text: '#e5e7eb',      // Very light grey for text
  },
  axle: {
    line: '#6b7280',      // Dashed lines for axle positions
  }
};
```

**Visual zones on canvas:**
```
[CAB - dark grey] [GAP - empty/subtle] [BODY - darker grey with pallets]
0────2,240mm─────(2,240 + spacing)────(body end)──────8,005mm
```

**Critical calculation for bed positioning:**
```javascript
// Canvas container should have dark background
// bg-gray-900 or bg-gray-950 for Tailwind

// Cab ends at: FOH + WB - CA (fixed by chassis)
const cabEnd = truckConfig.foh + truckConfig.wb - truckConfig.ca; // 2,240mm

// Body starts after cab + spacing (user adjustable)
const bodyStartX = mmToPx(cabEnd + fromBackOfCab); // e.g., 2,240 + 100 = 2,340mm

// Body dimensions are user-adjustable
const bodyLength = mmToPx(bodyDimensions.length); // Variable
const bodyWidth = mmToPx(bodyDimensions.width);   // Variable

// Render body rectangle from bodyStartX with length=bodyLength
// Max available body length = (OAL - cabEnd - fromBackOfCab)
```

### 4. PALLET DRAGGING
- Standard AU pallet: 1165mm x 1165mm
- Snap to grid: 50mm increments (converted to pixels)
- **Hard boundary constraints: Pallets can ONLY be placed in the body area**
  - Body starts at: bedStart + fromBackOfCab (e.g., 2,240mm + 100mm = 2,340mm)
  - Minimum X position: bedStart + fromBackOfCab (cab and spacing are off-limits)
  - Maximum X position: (bedStart + fromBackOfCab + bodyDimensions.length) - pallet.length
  - Minimum Y position: reasonable margin from centerline
  - Maximum Y position: bodyDimensions.width - pallet.width
- Smooth dragging with grid snapping
- Real-time calculation updates as pallets move
- Show pallet position in mm from front of truck

**Boundary constraint code example:**
```javascript
// On drag move - boundaries depend on spacing + body dimensions
const bodyStartX = mmToPx(truckConfig.bedStart + fromBackOfCab); // Variable based on spacing
const bodyEndX = mmToPx(truckConfig.bedStart + fromBackOfCab + bodyDimensions.length);
const bodyWidth = mmToPx(bodyDimensions.width);
const palletWidth = mmToPx(PALLET_WIDTH_MM);
const palletLength = mmToPx(PALLET_LENGTH_MM);

// Clamp to current body area (not cab, not spacing, not beyond body end)
newX = Math.max(bodyStartX, Math.min(newX, bodyEndX - palletLength));
newY = Math.max(0, Math.min(newY, bodyWidth - palletWidth));

// When spacing or body dimensions change, re-validate all pallet positions
// Remove or reposition pallets that are now outside the new body bounds
```

### 5. TRUCK SPEC (Isuzu FVR 170-300 AT R47)
Use this exact manufacturer data:

```typescript
{
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
}
}
}
```

### 6. PHYSICS CALCULATIONS (lib/physics.ts)

**NOTE: This section is for reference only. Use the existing physics.ts file - do not recreate it.**

**The existing file contains logic like this:**
```typescript
// Input state
weighBridgeReadings: {
  frontAxle: number,  // User's actual weigh bridge reading
  rearAxle: number,   // User's actual weigh bridge reading
}

// For each pallet on canvas
function calculatePalletLoad(pallet: Load, truckConfig: TruckConfig) {
  const palletCenterX = pallet.x + (pallet.length / 2);
  
  // Distance from each axle to pallet center
  const distanceFromFront = palletCenterX;
  const distanceFromRear = Math.abs(truckConfig.rearAxlePosition - palletCenterX);
  
  // Moment arm calculations
  const momentArmFromRear = Math.abs(truckConfig.rearAxlePosition - palletCenterX);
  const momentArmFromFront = Math.abs(palletCenterX - truckConfig.frontAxlePosition);
  
  // Weight distribution based on moment arms
  const frontAxleLoad = (pallet.weight * momentArmFromRear) / truckConfig.wb;
  const rearAxleLoad = (pallet.weight * momentArmFromFront) / truckConfig.wb;
  
  return { frontAxleLoad, rearAxleLoad };
}

// Sum all pallets
function calculateTotalAxleLoads(
  pallets: Load[],
  weighBridgeReadings: { frontAxle: number, rearAxle: number },
  truckConfig: TruckConfig
) {
  let additionalFront = 0;
  let additionalRear = 0;
  
  pallets.forEach(pallet => {
    const loads = calculatePalletLoad(pallet, truckConfig);
    additionalFront += loads.frontAxleLoad;
    additionalRear += loads.rearAxleLoad;
  });
  
  return {
    frontAxleTotal: weighBridgeReadings.frontAxle + additionalFront,
    rearAxleTotal: weighBridgeReadings.rearAxle + additionalRear,
    gvmTotal: weighBridgeReadings.frontAxle + weighBridgeReadings.rearAxle + additionalFront + additionalRear,
  };
}

// Check compliance
function checkCompliance(axleLoads, truckConfig) {
  return {
    frontCompliant: axleLoads.frontAxleTotal <= truckConfig.frontAxleLimit,
    rearCompliant: axleLoads.rearAxleTotal <= truckConfig.rearAxleLimit,
    gvmCompliant: axleLoads.gvmTotal <= truckConfig.gvm,
  };
}
```

### 7. UI/UX LAYOUT

**Layout structure:**
```
+--------+-----------------------------------------------------+
| DASH   |                                                     |
| BOARD  |  FULL CANVAS (Konva + draggable popovers)          |
| MENU   |                                                     |
|        |  +------+--+---------------------+                 |
| Trucks |  | CAB  |  | BODY/TRAY           |                 |
| Tools  |  |      |  | [Pallet] [Pallet]   |                 |
| Save   |  +------+--+---------------------+                 |
| Load   |                                                     |
|        |  [Draggable Popover: Weigh Bridge]                 |
|        |  ┌─────────────────────────┐                       |
|        |  │ Weigh Bridge Readings   │ [×]                   |
|        |  │ Front: [3500] kg        │                       |
|        |  │ Rear:  [2200] kg        │                       |
|        |  └─────────────────────────┘                       |
|        |                                                     |
|        |  [Draggable Popover: Body Config]                  |
|        |  ┌─────────────────────────┐                       |
|        |  │ Body Configuration      │ [×]                   |
|        |  │ From Back of Cab: [0] mm│                       |
|        |  │ Length: [5765] mm       │                       |
|        |  │ Width:  [2400] mm       │                       |
|        |  │ [Add Pallet - 1000kg]   │                       |
|        |  └─────────────────────────┘                       |
|        |                                                     |
|        |  [Draggable Popover: Compliance]                   |
|        |  ┌─────────────────────────┐                       |
|        |  │ Compliance Summary      │ [×]                   |
|        |  │ Front: 4,300/7,300 kg   │ GREEN                 |
|        |  │ Rear:  3,400/10,400 kg  │ GREEN                 |
|        |  │ GVM:   7,700/17,000 kg  │ GREEN                 |
|        |  └─────────────────────────┘                       |
|        |                                                     |
+--------+-----------------------------------------------------+
```

**Left Dashboard Menu (fixed, not draggable):**
- Narrow sidebar (~60-80px wide)
- Fixed position, full height
- Dark background (#111827 or similar)
- Icon-based vertical navigation:
  - 🚛 Truck selector (opens truck selection popover/modal)
  - ➕ Add pallet (adds pallet to canvas at default position)
  - 👁️ Toggle popovers visibility (show/hide all popovers)
  - 💾 Save configuration (future feature)
  - 📂 Load configuration (future feature)
  - ⚙️ Settings (future feature)
- Icons with tooltips on hover
- Active/hover states in lighter color
- Vertical spacing between icons
- Icons should be clearly visible in dark mode (use light colors or white)

**Example dashboard menu structure:**
```tsx
<div className="fixed left-0 top-0 h-full w-20 bg-gray-900 border-r border-gray-800">
  <nav className="flex flex-col items-center gap-6 py-8">
    <button className="icon-button" title="Select Truck">
      {/* Truck icon */}
    </button>
    <button className="icon-button" title="Add Pallet">
      {/* Plus icon */}
    </button>
    {/* More buttons... */}
  </nav>
</div>
```

**Draggable Popovers (using @dnd-kit/core):**
All information panels are floating, draggable popovers ON the canvas:

1. **Weigh Bridge Readings Popover**
   - Title bar with drag handle
   - Close button (×)
   - Two number inputs: Front kg, Rear kg
   - Compact design
   - Semi-transparent dark background with border

2. **Body Configuration Popover**
   - Title bar with drag handle
   - Close button (×)
   - From Back of Cab input
   - Body Length input
   - Body Width input
   - Add Pallet button (with weight input)
   - Can be collapsed/minimized

3. **Compliance Summary Popover**
   - Title bar with drag handle
   - Close button (×)
   - Real-time color-coded compliance display
   - Progress bars or percentage indicators
   - Auto-updates as pallets move

4. **Truck Selector Popover** (optional, can be modal)
   - Shows available truck models
   - Displays key specs
   - Select button

**Popover behavior (using @dnd-kit/core):**
- Draggable by title bar only
- Stay on top of canvas
- Remember position (could use localStorage)
- Can be closed and reopened from dashboard menu
- Semi-transparent backgrounds so canvas is visible underneath
- Constrained to canvas bounds (don't let them drag off screen)

**Color coding (dark mode compatible):**
- Green: < 90% of limit (#10b981 or #22c55e)
- Amber: 90-100% of limit (#f59e0b or #fbbf24)
- Red: > 100% (over limit) (#ef4444 or #f87171)

### 8. DRAGGABLE POPOVERS (using @dnd-kit/core)

All UI controls are floating, draggable popovers that sit ON TOP of the canvas.

**Popover structure:**
```tsx
// Each popover is a draggable card/panel
<div className="popover-container absolute z-50">
  <div className="popover-header drag-handle cursor-move">
    <h3>Popover Title</h3>
    <button onClick={close}>×</button>
  </div>
  <div className="popover-content">
    {/* Inputs, displays, etc */}
  </div>
</div>
```

**Using @dnd-kit/core:**
```tsx
import { DndContext, useDraggable } from '@dnd-kit/core';

function DraggablePopover({ id, position, children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = {
    transform: transform 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)` 
      : undefined,
    left: position.x,
    top: position.y,
  };

  return (
    <div ref={setNodeRef} style={style} className="absolute z-50">
      <div {...listeners} {...attributes} className="drag-handle cursor-move">
        {/* Title bar - only this part is draggable */}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
```

**Popover styling (dark mode):**
- Background: semi-transparent dark (#1f2937 with 95% opacity or similar)
- Border: subtle light border (#374151)
- Shadow: soft shadow for depth
- Backdrop blur: optional `backdrop-blur-sm` for glass effect
- Title bar: slightly lighter background, clear drag affordance
- Close button: visible, hover state

**Popover behavior:**
- Only title bar is draggable (not entire popover)
- Constrain to viewport bounds (can't drag off screen)
- Save position to localStorage (persist between sessions)
- Z-index management: clicked popover comes to front
- Can be closed and reopened from dashboard menu
- Start with default positions that don't overlap too much

### 9. STATE MANAGEMENT

```typescript
// Main state in load-calculator.tsx
const [weighBridgeReadings, setWeighBridgeReadings] = useState({
  frontAxle: 0,
  rearAxle: 0,
});

const [loads, setLoads] = useState<Load[]>([]);

const [truckConfig] = useState<TruckConfig>(ISUZU_FVR_170_300);

// Spacing from back of cab to start of body (adjustable)
const [fromBackOfCab, setFromBackOfCab] = useState(0); // Default 0mm, can be 0-500mm
// Note: Real trucks often have spacing between cab and body for:
// - Cab tilt clearance
// - Crane mounting space
// - Toolbox/storage installation
// - Body type requirements (e.g., tippers need clearance)

// Body dimensions - adjustable independently from truck chassis
const [bodyDimensions, setBodyDimensions] = useState({
  length: 5765,  // Default to max available, but user can adjust
  width: 2400,   // Standard width, but user can adjust
});

// Popover visibility and positions (for draggable UI panels)
const [popovers, setPopovers] = useState({
  weighBridge: { visible: true, x: 50, y: 50 },
  bodyConfig: { visible: true, x: 50, y: 250 },
  compliance: { visible: true, x: 50, y: 500 },
  truckSelector: { visible: false, x: 50, y: 50 },
});

// Derived values
const bodyStartPosition = truckConfig.bedStart + fromBackOfCab; // Where body actually starts
const maxAvailableBodyLength = truckConfig.maxBodyLength - fromBackOfCab; // Reduced by spacing

// Derived state (calculated on every render)
const axleLoads = calculateTotalAxleLoads(loads, weighBridgeReadings, truckConfig, bodyDimensions, bodyStartPosition);
const compliance = checkCompliance(axleLoads, truckConfig);
```

**Important:** 
- **cabEnd** (2,240mm) = where cab physically ends (fixed by chassis)
- **fromBackOfCab** = spacing/gap between cab and body (user adjustable, typically 0-500mm)
- **bodyStartPosition** = cabEnd + fromBackOfCab = where body actually starts
- **Body dimensions** define actual body size installed
- **Max body length** is reduced by the spacing: (OAL - cabEnd - fromBackOfCab)
- **Popovers** are separate draggable UI elements that float on top of canvas

### 10. TYPES (types/truck.ts)

```typescript
export interface Load {
  id: string;
  x: number;        // Position in mm from front of truck
  y: number;        // Position in mm from centerline
  width: number;    // mm
  length: number;   // mm
  weight: number;   // kg
}

export interface TruckConfig {
  model: string;
  manufacturer: string;
  gvm: number;
  gcm: number;
  frontAxleLimit: number;
  rearAxleLimit: number;
  cabChassisFront: number;
  cabChassisRear: number;
  cabChassisTotal: number;
  wb: number;
  oal: number;
  foh: number;
  roh: number;
  ca: number;
  frontAxlePosition: number;
  rearAxlePosition: number;
  bedStart: number;
  maxBodyLength: number;      // Maximum available body length (OAL - bedStart)
  defaultBodyWidth: number;   // Default body width
}

export interface BodyDimensions {
  length: number;   // Actual installed body length (mm)
  width: number;    // Actual installed body width (mm)
}

export interface WeighBridgeReadings {
  frontAxle: number;
  rearAxle: number;
}

export interface AxleLoads {
  frontAxleTotal: number;
  rearAxleTotal: number;
  gvmTotal: number;
}

export interface ComplianceResult {
  frontCompliant: boolean;
  rearCompliant: boolean;
  gvmCompliant: boolean;
}

export interface PopoverState {
  visible: boolean;
  x: number;        // Position in pixels from left
  y: number;        // Position in pixels from top
}

export interface PopoversState {
  weighBridge: PopoverState;
  bodyConfig: PopoverState;
  compliance: PopoverState;
  truckSelector: PopoverState;
}
```

### 11. SPECIFIC IMPLEMENTATION NOTES

**Canvas rendering:**
- Use Konva.Group for each pallet (Rect + Text)
- Implement dragBoundFunc for smooth boundary constraints
- All shapes at integer pixel coordinates
- Stroke widths: 1-2px for clean technical drawing
- Font: Arial, 12-14px
- **Remember: All strokes and text must be light colors for dark mode visibility**

**Canvas container:**
- Takes full remaining space after dashboard menu (calc(100vw - 80px) or similar)
- Full height (100vh)
- Dark background (bg-gray-900 or bg-gray-950)
- Position relative for absolute-positioned popovers

**Dimension lines:**
- Show OAL (Overall Length) in light grey
- Show WB (Wheelbase) in light grey
- Show bed length in light grey
- Draw axle positions as dashed vertical lines with labels (light grey)
- All dimension text should be easily readable on dark background

**Weigh bridge inputs:**
- Must be clearly labeled
- Show reference weights from manufacturer (3,402kg / 2,159kg) as placeholders
- Validate: front + rear must be > 0
- Update calculations in real-time

## IMPLEMENTATION STEPS

1. Set up the folder structure with route group `(dashboard)` and all component files
2. **Create minimal layout.tsx in (dashboard)/dashboard/:**
   ```tsx
   // app/(dashboard)/dashboard/layout.tsx
   import type { Metadata, Viewport } from 'next';
   
   export const viewport: Viewport = {
     width: 'device-width',
     initialScale: 1,
     maximumScale: 1,
     userScalable: false, // Prevent zoom on mobile for better UX
   };
   
   export const metadata: Metadata = {
     title: 'TruckCheck Dashboard',
     description: 'Australian truck load compliance calculator',
   };
   
   export default function DashboardLayout({ children }: { children: React.ReactNode }) {
     return (
       <div className="h-screen w-screen overflow-hidden bg-gray-950">
         {children}
       </div>
     );
   }
   ```
   - No header, no footer, no navigation
   - Full screen container
   - Prevents scrolling (overflow-hidden)
   - Disables zoom/scaling for app-like experience
   - Dark background
3. **Import and use the existing lib/physics.ts file - do not modify or recreate it**
4. Install @dnd-kit/core: `npm install @dnd-kit/core`
5. Create truck-config.ts with the Isuzu FVR spec (use maxBodyLength and defaultBodyWidth)
5. Create truck-config.ts with the Isuzu FVR spec (use maxBodyLength and defaultBodyWidth)
6. Create canvas-helpers.ts with mmToPx/pxToMm functions
7. **Build dashboard-menu.tsx:**
   - Fixed left sidebar (~60-80px)
   - Icon navigation for: Trucks, Add Pallet, Toggle Popovers, Save/Load
   - Dark background, visible icons
8. **Build truck-canvas.tsx:**
   - Konva Stage that fills remaining space (minus sidebar)
   - Cab rectangle (fixed size based on chassis)
   - Optional gap visualization between cab and body
   - Body rectangle (position based on cabEnd + fromBackOfCab, size based on bodyDimensions)
   - Dynamic rendering that updates when spacing or bodyDimensions change
9. **Build draggable popovers in popovers/ folder:**
   - weigh-bridge-popover.tsx: Front/rear axle inputs with drag handle
   - body-config-popover.tsx: Spacing, length, width inputs, add pallet button
   - compliance-popover.tsx: Color-coded compliance display with real-time updates
   - truck-selector-popover.tsx: Optional truck selection UI
   - Each uses @dnd-kit/core useDraggable hook
   - Only title bar is draggable
   - Semi-transparent dark backgrounds
   - Close buttons to hide/show
10. **Implement pallet-shape.tsx:**
    - Konva Group for each pallet (on canvas, not a popover)
    - Dragging constrained to body area (starts at cabEnd + fromBackOfCab)
    - Validation when spacing or body dimensions change (remove out-of-bounds pallets)
11. **Wire everything together in load-calculator.tsx:**
    - Wrap in DndContext for popover dragging
    - Manage popover visibility/position state
    - Pass callbacks to update weighBridge, bodyDimensions, fromBackOfCab
    - Layout: Dashboard menu + Canvas container with popovers
12. **Create orientation-warning.tsx (optional but recommended):**
    ```tsx
    'use client';
    import { useEffect, useState } from 'react';
    
    export function OrientationWarning() {
      const [isPortrait, setIsPortrait] = useState(false);
      const [isMobile, setIsMobile] = useState(false);
      
      useEffect(() => {
        const checkOrientation = () => {
          setIsPortrait(window.innerHeight > window.innerWidth);
          setIsMobile(window.innerWidth < 768);
        };
        
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        
        return () => {
          window.removeEventListener('resize', checkOrientation);
          window.removeEventListener('orientationchange', checkOrientation);
        };
      }, []);
      
      if (!isMobile || !isPortrait) return null;
      
      return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center p-8">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400 animate-pulse" /* Rotate phone icon */>
            <p className="text-xl text-gray-300 mb-2">Please rotate your device</p>
            <p className="text-gray-500">TruckCheck works best in landscape mode</p>
          </div>
        </div>
      );
    }
    ```
    - Shows fullscreen overlay on portrait mobile
    - Detects orientation changes
    - Hides when device rotated to landscape
13. **Test scenarios:**
    - Verify no header/footer appears on /dashboard route
    - **Mobile: Test portrait mode shows rotation warning**
    - **Mobile: Test landscape mode shows full interface**
    - **Touch: Verify pallet dragging works on touch devices**
    - Drag popovers around, verify they stay on screen
    - Close and reopen popovers from dashboard menu
    - Add spacing and verify body shifts, pallets stay constrained
    - Change body dimensions with spacing active
    - Add pallets via popover, drag them on canvas
    - Verify compliance updates in real-time as pallets move
    - Test on various screen sizes (desktop, tablet landscape, mobile landscape)

## CRITICAL REMINDERS

- **ROUTE STRUCTURE: Use (dashboard) route group** so dashboard doesn't inherit main app header/footer
- **MOBILE: Force landscape orientation on mobile** - show rotation warning in portrait mode
- **TOUCH SUPPORT: Enable touchEnabled on Konva Stage** for mobile/tablet compatibility
- **DARK MODE: All canvas colors must be light/visible on dark backgrounds** (use greys #6b7280-#e5e7eb)
- **UI ARCHITECTURE: Dashboard menu on LEFT, draggable popovers ON canvas** (not fixed panels)
- **Use @dnd-kit/core for popover dragging** - only title bars are draggable
- **DO NOT modify lib/physics.ts - it is already working correctly**
- **Calculate cab end properly: FOH + WB - CA = 2,240mm** - this is where the cab ends
- **Cab rendering: Simple rectangle (0 to 2,240mm) with dark grey fill**
- **Spacing (fromBackOfCab) creates gap between cab and body** - adjustable 0-500mm
- **Body starts at: cabEnd + fromBackOfCab** (e.g., 2,240 + 100 = 2,340mm)
- **Body dimensions are ADJUSTABLE by user** - not fixed to chassis max length
- **Max body length dynamically reduces by spacing**: (5,765 - fromBackOfCab)mm
- **Pallets can only be placed in the body area** - constrained by spacing + bodyDimensions
- **When spacing or body dimensions change, validate and remove out-of-bounds pallets**
- **Popovers are semi-transparent and stay within viewport bounds**
- Use real weigh bridge readings as baseline, not manufacturer tare weights
- All coordinates in mm, convert to pixels for rendering
- Grid snap at 50mm increments
- Real-time updates on every change
- Clean, professional technical drawing aesthetic like TruckScience

Generate the complete implementation with working code for all files EXCEPT lib/physics.ts which already exists.