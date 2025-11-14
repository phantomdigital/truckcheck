/**
 * Canvas Helper Functions
 * 
 * Coordinate conversion between real-world dimensions (mm) and canvas pixels
 * All truck dimensions are in millimeters (real world)
 * Convert mm to pixels: SCALE = CANVAS_WIDTH_PX / TRUCK_OAL_MM
 * Always round to integers for crisp rendering
 */

/**
 * Convert millimeters to pixels
 * @param mm - Distance in millimeters
 * @param canvasWidthPx - Canvas width in pixels
 * @param truckOalMm - Truck overall length in millimeters
 * @returns Distance in pixels (rounded to integer)
 */
export function mmToPx(mm: number, canvasWidthPx: number, truckOalMm: number): number {
  const scale = canvasWidthPx / truckOalMm;
  return Math.round(mm * scale);
}

/**
 * Convert pixels to millimeters
 * @param px - Distance in pixels
 * @param canvasWidthPx - Canvas width in pixels
 * @param truckOalMm - Truck overall length in millimeters
 * @returns Distance in millimeters
 */
export function pxToMm(px: number, canvasWidthPx: number, truckOalMm: number): number {
  const scale = canvasWidthPx / truckOalMm;
  return px / scale;
}

/**
 * Snap a value to a grid
 * @param value - Value to snap
 * @param gridSize - Grid size (in same units as value)
 * @returns Snapped value
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

