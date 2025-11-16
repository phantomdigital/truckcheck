'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import type { TruckConfig } from '@/lib/load-calculator/truck-config';
import { mmToPx } from '@/lib/load-calculator/canvas-helpers';
import { useUIStore } from '../hooks/use-ui-store';

interface BodyDimensions {
  length: number; // mm
  width: number;  // mm
}

interface Pallet {
  id: string;
  x: number; // mm from front of truck
  y: number; // mm from centerline (relative to body top)
  length: number; // mm
  width: number; // mm
  weight: number; // kg
  name?: string; // Optional pallet name/identifier
}

import type { Tool } from './dashboard-menu';

interface TruckCanvasProps {
  truckConfig: TruckConfig;
  bodyDimensions: BodyDimensions;
  fromBackOfCab: number; // mm - spacing between cab and body
  wallThickness?: {
    front: number; // mm
    rear: number; // mm
    sides: number; // mm
  };
  pallets?: Pallet[];
  onUpdatePalletPosition?: (id: string, x: number, y: number) => void; // x, y in mm from front of truck
  onUpdatePalletPositions?: (updates: { id: string; x: number; y: number }[]) => void; // Batch update for multi-drag
  selectedPalletIds?: string[];
  onSelectPallet?: (id: string | null, mode?: 'single' | 'toggle' | 'range') => void;
  onSelectPallets?: (ids: string[]) => void; // Direct multi-select
  onDeletePallet?: (id: string) => void;
  onDeletePallets?: (ids: string[]) => void;
  onDoubleClickPallet?: (id: string) => void;
  activeTool?: Tool;
  onZoomChange?: (scale: number) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  canvasZoom?: number;
  canvasPosition?: { x: number; y: number };
  onOpenBodyConfig?: (focusField?: 'fromBackOfCab' | 'bodyLength' | 'bodyWidth') => void;
}

// Dark mode color palette as per load-doc.md
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
  },
};

export function TruckCanvas({
  truckConfig,
  bodyDimensions,
  fromBackOfCab,
  wallThickness = { front: 0, rear: 0, sides: 0 },
  pallets = [],
  onUpdatePalletPosition,
  onUpdatePalletPositions,
  selectedPalletIds = [],
  onSelectPallet,
  onSelectPallets,
  onDeletePallet,
  onDeletePallets,
  onDoubleClickPallet,
  activeTool = 'select',
  onZoomChange,
  onPositionChange,
  canvasZoom: externalZoom,
  canvasPosition: externalPosition,
  onOpenBodyConfig,
}: TruckCanvasProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [pixelRatio, setPixelRatio] = useState(2); // Default for SSR
  
  // Zoom and pan state
  const [stageScale, setStageScale] = useState(1.0); // Current zoom level (1.0 = default)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 }); // Pan position
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Track last notified values to prevent unnecessary callbacks
  const lastNotifiedZoomRef = useRef(1.0);
  const lastNotifiedPositionRef = useRef({ x: 0, y: 0 });
  const lastExternalZoomRef = useRef<number | undefined>(undefined);
  const lastExternalPositionRef = useRef<{ x: number; y: number } | undefined>(undefined);
  
  // Store initial positions for group dragging
  const initialPositionsRef = useRef<{ [key: string]: { x: number; y: number } }>({});
  
  // Track initial Y position for horizontal constraint (Shift key)
  const initialDragYRef = useRef<{ [key: string]: number }>({});
  
  // Track initial X position for vertical constraint (Alt key)
  const initialDragXRef = useRef<{ [key: string]: number }>({});
  
  // Track Shift key state for horizontal constraint
  const shiftKeyPressedRef = useRef(false);
  
  // Track Alt key state for vertical constraint
  const altKeyPressedRef = useRef(false);
  
  // Track which mouse button is currently pressed
  const [mouseButtonPressed, setMouseButtonPressed] = useState<number | null>(null);
  const mouseButtonPressedRef = useRef<number | null>(null);
  
  // Track modifier keys (Shift for horizontal, Alt for vertical)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = true;
        // Don't prevent default for Shift - it's used for multi-select too
      } else if (e.key === 'Alt') {
        altKeyPressedRef.current = true;
        // Prevent Alt from triggering browser menu bar
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = false;
      } else if (e.key === 'Alt') {
        altKeyPressedRef.current = false;
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Selection area state
  const selectionArea = useUIStore((state) => state.selectionArea);
  const startSelection = useUIStore((state) => state.startSelection);
  const updateSelection = useUIStore((state) => state.updateSelection);
  const endSelection = useUIStore((state) => state.endSelection);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionUpdateRef = useRef<number | null>(null);
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionEndRef = useRef<{ x: number; y: number } | null>(null);
  const selectionCompletedRef = useRef(false);
  
  // Helper to convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - stagePosition.x) / stageScale,
      y: (screenY - stagePosition.y) / stageScale,
    };
  }, [stagePosition, stageScale]);
  
  // Cleanup effect for selection updates
  useEffect(() => {
    return () => {
      if (selectionUpdateRef.current !== null) {
        cancelAnimationFrame(selectionUpdateRef.current);
      }
    };
  }, []);
  
  // Zoom limits
  const MIN_ZOOM = 0.5; // Can zoom out to 50%
  const MAX_ZOOM = 1.0; // Can't zoom in beyond 100% (current level)

  // Set pixel ratio on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPixelRatio(window.devicePixelRatio || 2);
    }
  }, []);

  // Reset view when zoom/position are reset externally (only when explicitly different)
  // Don't reset if pan tool is active to avoid conflicts
  useEffect(() => {
    if (activeTool === 'pan') return; // Don't reset zoom when pan tool is active
    // Only sync if external zoom actually changed (not just different from current stageScale)
    if (externalZoom !== undefined && externalZoom !== lastExternalZoomRef.current) {
      lastExternalZoomRef.current = externalZoom;
      if (externalZoom !== stageScale) {
        setStageScale(externalZoom);
        lastNotifiedZoomRef.current = externalZoom;
      }
    }
  }, [externalZoom, activeTool, stageScale]);

  useEffect(() => {
    if (activeTool === 'pan') return; // Don't reset position when pan tool is active
    // Only sync if external position actually changed
    if (externalPosition) {
      const posChanged = !lastExternalPositionRef.current ||
        externalPosition.x !== lastExternalPositionRef.current.x ||
        externalPosition.y !== lastExternalPositionRef.current.y;
      
      if (posChanged) {
        lastExternalPositionRef.current = externalPosition;
        // Use functional update to avoid dependency on stagePosition
        setStagePosition(prevPos => {
          if (prevPos.x !== externalPosition.x || prevPos.y !== externalPosition.y) {
            lastNotifiedPositionRef.current = externalPosition;
            return externalPosition;
          }
          return prevPos;
        });
      }
    }
  }, [externalPosition, activeTool]); // Removed stagePosition from deps to prevent loops

  // Notify parent of zoom/position changes (only when value actually changed)
  // Skip notifications while panning to prevent loops
  // Also skip if the change came from external sync (check if it matches lastExternal value)
  useEffect(() => {
    if (isPanning) return; // Don't notify while actively panning
    // Don't notify if this change matches the external value (it came from external sync)
    if (externalZoom !== undefined && stageScale === externalZoom && stageScale === lastNotifiedZoomRef.current) {
      return; // This is a sync from external, don't notify back
    }
    if (stageScale !== lastNotifiedZoomRef.current) {
      lastNotifiedZoomRef.current = stageScale;
      onZoomChange?.(stageScale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageScale, isPanning, externalZoom]);

  useEffect(() => {
    if (isPanning) return; // Don't notify while actively panning
    // Don't notify if this change matches the external value (it came from external sync)
    if (externalPosition && 
        stagePosition.x === externalPosition.x && 
        stagePosition.y === externalPosition.y &&
        stagePosition.x === lastNotifiedPositionRef.current.x &&
        stagePosition.y === lastNotifiedPositionRef.current.y) {
      return; // This is a sync from external, don't notify back
    }
    if (stagePosition.x !== lastNotifiedPositionRef.current.x || 
        stagePosition.y !== lastNotifiedPositionRef.current.y) {
      lastNotifiedPositionRef.current = stagePosition;
      onPositionChange?.(stagePosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagePosition, isPanning, externalPosition]);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      // Canvas fills remaining space (minus 160px for dashboard menu + tools bar)
      const width = window.innerWidth - 160;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate scale with padding (zoom out slightly for better readability)
  // Use 85% of canvas width to leave 7.5% padding on each side
  const PADDING_RATIO = 0.85;
  const scale = useMemo(() => {
    return (canvasSize.width * PADDING_RATIO) / truckConfig.oal;
  }, [canvasSize.width, truckConfig.oal]);

  // Convert mm to pixels using the padded scale
  // IMPORTANT: Use the same scale calculation as mmToPx helper for consistency
  const mmToPxLocal = useMemo(() => {
    const paddedWidth = canvasSize.width * PADDING_RATIO;
    return (mm: number) => mmToPx(mm, paddedWidth, truckConfig.oal);
  }, [canvasSize.width, truckConfig.oal]);

  // Convert pixels to mm using the padded scale
  const pxToMmLocal = useMemo(() => {
    const paddedWidth = canvasSize.width * PADDING_RATIO;
    const scale = paddedWidth / truckConfig.oal;
    return (px: number) => px / scale;
  }, [canvasSize.width, truckConfig.oal]);

  // Calculate positions
  const cabEnd = truckConfig.cabEnd; // 2,240mm - fixed by chassis
  const bodyStartX = cabEnd + fromBackOfCab; // Where body actually starts
  const bodyEndX = bodyStartX + bodyDimensions.length;

  // Calculate usable area (accounting for wall thickness)
  const usableStartX = bodyStartX + wallThickness.front;
  const usableEndX = bodyEndX - wallThickness.rear;
  const usableLength = usableEndX - usableStartX;
  const usableStartY = wallThickness.sides;
  const usableWidth = bodyDimensions.width - (wallThickness.sides * 2);

  // Calculate horizontal offset to center truck with padding
  const truckWidthPx = mmToPxLocal(truckConfig.oal);
  const horizontalOffset = (canvasSize.width - truckWidthPx) / 2;

  // Convert to pixels for rendering
  const cabEndPx = mmToPxLocal(cabEnd) + horizontalOffset;
  const bodyStartPx = mmToPxLocal(bodyStartX) + horizontalOffset;
  const bodyLengthPx = mmToPxLocal(bodyDimensions.length);
  const bodyWidthPx = mmToPxLocal(bodyDimensions.width);
  const usableStartPx = mmToPxLocal(usableStartX) + horizontalOffset;
  const usableLengthPx = mmToPxLocal(usableLength);
  const usableWidthPx = mmToPxLocal(usableWidth);
  const frontAxlePx = mmToPxLocal(truckConfig.frontAxlePosition) + horizontalOffset;
  const rearAxlePx = mmToPxLocal(truckConfig.rearAxlePosition) + horizontalOffset;

  // Fixed cab width (standard Australian truck cab width)
  const cabWidthMm = 2400; // mm - standard cab width (fixed, doesn't change)
  const cabWidthPx = mmToPxLocal(cabWidthMm);

  // Position vertically - slightly below center for better visibility
  const verticalOffset = 80; // Offset down from center (pixels)
  const centerY = canvasSize.height / 2 + verticalOffset;
  const bodyTopY = centerY - bodyWidthPx / 2;
  const cabTopY = centerY - cabWidthPx / 2; // Center cab vertically
  const usableTopY = bodyTopY + mmToPxLocal(wallThickness.sides);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If a drag-selection just completed, skip this click to prevent immediate deselect
    if (selectionCompletedRef.current) {
      selectionCompletedRef.current = false;
      return;
    }

    // If clicking on stage (not a pallet), deselect
    if (e.target === e.target.getStage()) {
      onSelectPallet?.(null);
    }
  };

  // Handle mouse wheel zoom - always enabled except when panning
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    // Don't zoom when pan tool is active OR when actively panning
    if (activeTool === 'pan' || isPanning) {
      e.evt.preventDefault(); // Still prevent default scroll
      return;
    }

    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Determine zoom direction
    const deltaY = e.evt.deltaY;
    const scaleBy = 1.1;
    
    // Calculate new scale based on scroll direction
    let newScale: number;
    if (deltaY > 0) {
      // Scroll down: zoom out (decrease scale)
      newScale = Math.max(oldScale / scaleBy, MIN_ZOOM);
    } else {
      // Scroll up: zoom in (increase scale)
      newScale = Math.min(oldScale * scaleBy, MAX_ZOOM);
    }

    // If zoom didn't change (hit limit), don't update
    if (Math.abs(newScale - oldScale) < 0.001) return;

    // Calculate new position to zoom toward pointer
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // Update scale and position atomically to avoid loops
    setStageScale(newScale);
    setStagePosition(newPos);
  };

  // Handle pan start (pan tool active OR middle mouse button) and selection area start
  const handlePanStart = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Track which mouse button was pressed (update both state and ref immediately)
    setMouseButtonPressed(e.evt.button);
    mouseButtonPressedRef.current = e.evt.button;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const isMiddleButton = e.evt.button === 1;
    const isLeftButton = e.evt.button === 0;
    const clickedOnStage = e.target === stage;
    
    // Middle mouse button always pans, even over pallets
    if (isMiddleButton) {
      setIsPanning(true);
      setLastPanPoint(pointer);
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }
    
    // Check if we clicked on a pallet - if target is not stage and has a draggable parent
    // This check is only for left-click to prevent interfering with pallet dragging
    let clickedOnPallet = false;
    if (!clickedOnStage) {
      let node: Konva.Node | null = e.target;
      let depth = 0;
      while (node && node !== stage && depth < 10) { // Limit depth to prevent infinite loops
        // Check if this is a Group that's draggable (pallets are Groups)
        if (node.getType && node.getType() === 'Group' && node.draggable && typeof node.draggable === 'function' && node.draggable()) {
          clickedOnPallet = true;
          break;
        }
        node = node.getParent();
        depth++;
      }
    }

    // CRITICAL: If left-clicking on a pallet, let Konva's drag system handle it - don't interfere at all
    if (clickedOnPallet && isLeftButton) {
      return; // Let Konva handle pallet dragging completely
    }

    // Start selection area if left-clicking on empty stage with select tool
    // Only start selection if we're NOT clicking on a pallet
    if (isLeftButton && activeTool === 'select' && !clickedOnPallet) {
      // Validate pointer position - must be within stage bounds
      if (!pointer || !isFinite(pointer.x) || !isFinite(pointer.y)) {
        return; // Invalid pointer position
      }
      
      setIsSelecting(true);
      const worldPos = screenToWorld(pointer.x, pointer.y);
      
      // Validate world coordinates
      if (!isFinite(worldPos.x) || !isFinite(worldPos.y)) {
        setIsSelecting(false);
        return; // Invalid world coordinates
      }
      
      selectionStartRef.current = worldPos;
      selectionEndRef.current = worldPos;
      startSelection(worldPos.x, worldPos.y);
      e.evt.preventDefault();
      return;
    }

    // Pan with middle mouse button (button 1) OR when pan tool is active with left button
    // Don't interfere if clicking on pallet
    if (!clickedOnPallet) {
      const isPanToolWithLeftButton = activeTool === 'pan' && isLeftButton;
      
      if (isMiddleButton || isPanToolWithLeftButton) {
        setIsPanning(true);
        setLastPanPoint(pointer);
        e.evt.preventDefault();
        e.evt.stopPropagation();
      }
    }
  };

  // Handle pan move and selection area updates
  const handlePanMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Update selection area if selecting (throttled for performance)
    // Selection takes priority - allow it to continue even if overlapping with pallets
    if (isSelecting) {
      // Validate pointer position
      if (!pointer || !isFinite(pointer.x) || !isFinite(pointer.y)) {
        return; // Invalid pointer, skip update
      }
      
      // Store the latest pointer position in ref and update end position immediately
      latestPointerRef.current = { x: pointer.x, y: pointer.y };
      const worldPos = screenToWorld(pointer.x, pointer.y);
      
      // Validate world coordinates before storing
      if (isFinite(worldPos.x) && isFinite(worldPos.y)) {
        selectionEndRef.current = worldPos; // Update immediately for reliable access
        
        // Throttle Zustand state updates for performance
        if (selectionUpdateRef.current === null) {
          selectionUpdateRef.current = requestAnimationFrame(() => {
            if (selectionEndRef.current && 
                isFinite(selectionEndRef.current.x) && 
                isFinite(selectionEndRef.current.y)) {
              updateSelection(selectionEndRef.current.x, selectionEndRef.current.y);
            }
            selectionUpdateRef.current = null;
          });
        }
      }
      e.evt.preventDefault();
      return;
    }

    // Handle panning
    if (isPanning) {
      const deltaX = pointer.x - lastPanPoint.x;
      const deltaY = pointer.y - lastPanPoint.y;

      // Use functional update to avoid stale state and prevent loops
      setStagePosition(prevPos => ({
        x: prevPos.x + deltaX,
        y: prevPos.y + deltaY,
      }));

      setLastPanPoint(pointer);
      e.evt.preventDefault(); // Prevent default to avoid conflicts
    }
  };

  // Handle pan end and selection area completion
  const handlePanEnd = () => {
    // Handle selection area completion
    if (isSelecting) {
      setIsSelecting(false);
      
      // Flush any pending selection updates first
      if (selectionUpdateRef.current !== null) {
        cancelAnimationFrame(selectionUpdateRef.current);
        selectionUpdateRef.current = null;
      }
      
      // Ensure we have the latest end position
      if (latestPointerRef.current) {
        const worldPos = screenToWorld(latestPointerRef.current.x, latestPointerRef.current.y);
        // Only update if coordinates are valid
        if (isFinite(worldPos.x) && isFinite(worldPos.y)) {
          selectionEndRef.current = worldPos;
        }
      }
      
      // If we don't have valid end coordinates, use start coordinates (click, not drag)
      if (!selectionEndRef.current && selectionStartRef.current) {
        selectionEndRef.current = selectionStartRef.current;
      }
      
      // Use refs for reliable coordinate access (don't rely on Zustand state which might be stale)
      if (selectionStartRef.current && selectionEndRef.current && onSelectPallets) {
        const { x: startX, y: startY } = selectionStartRef.current;
        const { x: endX, y: endY } = selectionEndRef.current;
        
        // Validate coordinates (check for NaN, Infinity, or invalid values)
        if (!isFinite(startX) || !isFinite(startY) || !isFinite(endX) || !isFinite(endY)) {
          // Invalid coordinates, skip selection
          latestPointerRef.current = null;
          selectionStartRef.current = null;
          selectionEndRef.current = null;
          endSelection();
          return;
        }
        
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        // Check if selection area is too small (less than 5px) - might be accidental click
        const selectionWidth = maxX - minX;
        const selectionHeight = maxY - minY;
        if (selectionWidth < 5 && selectionHeight < 5) {
          // Too small, treat as click not drag
          latestPointerRef.current = null;
          selectionStartRef.current = null;
          selectionEndRef.current = null;
          endSelection();
          return;
        }
        
        // Find pallets that intersect with the selection area (all coordinates are in world space)
        const selectedPalletIds: string[] = [];
        pallets.forEach((pallet) => {
          const palletX = mmToPxLocal(pallet.x) + horizontalOffset;
          const palletY = bodyTopY + mmToPxLocal(pallet.y);
          const palletEndX = palletX + mmToPxLocal(pallet.length);
          const palletEndY = palletY + mmToPxLocal(pallet.width);

          // Check if pallet intersects with selection rectangle (both in world coordinates)
          // Use proper intersection check: rectangles overlap if one's min < other's max and vice versa
          if (palletX < maxX && palletEndX > minX && palletY < maxY && palletEndY > minY) {
            selectedPalletIds.push(pallet.id);
          }
        });

        // Select the pallets directly using the batch function
        if (selectedPalletIds.length > 0) {
          onSelectPallets(selectedPalletIds);
          // Prevent the following click event from clearing the selection we just made
          selectionCompletedRef.current = true;
        }
      }
      
      // Clean up refs
      latestPointerRef.current = null;
      selectionStartRef.current = null;
      selectionEndRef.current = null;
      
      endSelection();
    }

    // Handle panning
    if (isPanning) {
      setIsPanning(false);
      // Notify parent of final position after pan ends (use a small delay to ensure state is updated)
      setTimeout(() => {
        const currentPos = stagePosition;
        lastNotifiedPositionRef.current = currentPos;
        onPositionChange?.(currentPos);
      }, 0);
    }
    
    // Clear mouse button tracking
    setMouseButtonPressed(null);
  };

  // Handle click for zoom tools
  const handleZoomClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'zoom-in' && activeTool !== 'zoom-out') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stageScale;
    const scaleBy = 1.2;
    
    // Calculate new scale based on tool
    let newScale: number;
    if (activeTool === 'zoom-in') {
      // Zoom in: increase scale (but can't exceed MAX_ZOOM)
      newScale = Math.min(oldScale * scaleBy, MAX_ZOOM);
    } else {
      // Zoom out: decrease scale (but can't go below MIN_ZOOM)
      newScale = Math.max(oldScale / scaleBy, MIN_ZOOM);
    }

    // If scale didn't change (hit limit), don't update
    if (Math.abs(newScale - oldScale) < 0.001) return;

    // Calculate new position to zoom toward pointer
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  };

  // Handle touch gestures for mobile (two-finger pan)
  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    // Only pan with two fingers
    if (e.evt.touches.length === 2) {
      setIsPanning(true);
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      setLastPanPoint({ x: midX, y: midY });
      e.evt.preventDefault();
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!isPanning || e.evt.touches.length !== 2) return;

    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const midX = (touch1.clientX + touch2.clientX) / 2;
    const midY = (touch1.clientY + touch2.clientY) / 2;

    const deltaX = midX - lastPanPoint.x;
    const deltaY = midY - lastPanPoint.y;

    setStagePosition({
      x: stagePosition.x + deltaX,
      y: stagePosition.y + deltaY,
    });

    setLastPanPoint({ x: midX, y: midY });
    e.evt.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Helper function to draw CAD-style dimension line with arrowheads
  const drawDimensionLine = (
    startX: number,
    endX: number,
    y: number,
    label: string,
    extensionLines: boolean = true,
    extensionLineLength: number = 15,
    badgeBelowLine: boolean = false,
    onClick?: () => void
  ) => {
    const arrowSize = 8;
    const arrowAngle = Math.PI / 6; // 30 degrees
    
    // Extension lines (vertical lines at start and end)
    const extensionLinesElements = extensionLines ? (
      <>
        <Line
          points={[startX, y - extensionLineLength, startX, y]}
          stroke={COLORS.dimensions.line}
          strokeWidth={1}
        />
        <Line
          points={[endX, y - extensionLineLength, endX, y]}
          stroke={COLORS.dimensions.line}
          strokeWidth={1}
        />
      </>
    ) : null;

    // Main dimension line (shortened to make room for arrowheads)
    const arrowOffset = arrowSize * 0.8;
    const dimensionLine = (
      <Line
        points={[startX + arrowOffset, y, endX - arrowOffset, y]}
        stroke={COLORS.dimensions.line}
        strokeWidth={1}
        onMouseEnter={(e) => {
          if (onClick) {
            const target = e.target as any;
            target.stroke('#d1d5db'); // Lighter line on hover
            const stage = e.target.getStage();
            if (stage?.container()) {
              (stage.container() as HTMLDivElement).style.cursor = 'pointer';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            const target = e.target as any;
            target.stroke(COLORS.dimensions.line); // Reset line color
            const stage = e.target.getStage();
            if (stage?.container()) {
              (stage.container() as HTMLDivElement).style.cursor = 'default';
            }
          }
        }}
        onClick={onClick}
        onTap={onClick}
      />
    );

    // Arrowheads pointing inward (toward the dimension line)
    // Left arrowhead (pointing right)
    const leftArrowPoints = [
      startX, y,
      startX + arrowSize * Math.cos(arrowAngle), y - arrowSize * Math.sin(arrowAngle),
      startX + arrowSize * Math.cos(arrowAngle), y + arrowSize * Math.sin(arrowAngle),
      startX, y
    ];
    const leftArrow = (
      <Line
        points={leftArrowPoints}
        stroke={COLORS.dimensions.line}
        fill={COLORS.dimensions.line}
        strokeWidth={1}
        closed={true}
      />
    );
    
    // Right arrowhead (pointing left)
    const rightArrowPoints = [
      endX, y,
      endX - arrowSize * Math.cos(arrowAngle), y - arrowSize * Math.sin(arrowAngle),
      endX - arrowSize * Math.cos(arrowAngle), y + arrowSize * Math.sin(arrowAngle),
      endX, y
    ];
    const rightArrow = (
      <Line
        points={rightArrowPoints}
        stroke={COLORS.dimensions.line}
        fill={COLORS.dimensions.line}
        strokeWidth={1}
        closed={true}
      />
    );

    const midX = (startX + endX) / 2;
    const valueTextWidth = getDimensionBadgeWidth(label);
    const valueBgHeight = DIMENSION_FONT_SIZE + DIMENSION_VERTICAL_PADDING;
    const valueBgX = midX - valueTextWidth / 2 - DIMENSION_HORIZONTAL_PADDING / 2;
    
    // Position badge below line if requested, otherwise center on line
    const valueBgY = badgeBelowLine 
      ? y + 20  // Position well below the line with more spacing
      : y - valueBgHeight / 2;  // Center on the line
    
    const valueBgWidth = valueTextWidth + DIMENSION_HORIZONTAL_PADDING;

    const valueBackground = (
      <Rect
        x={valueBgX}
        y={valueBgY}
        width={valueBgWidth}
        height={valueBgHeight}
        fill="#0f172a"
        stroke={COLORS.dimensions.line}
        strokeWidth={1}
        cornerRadius={3}
      />
    );

    const valueLabel = (
      <Text
        x={valueBgX}
        y={valueBgY + (valueBgHeight - DIMENSION_FONT_SIZE) / 2}
        width={valueBgWidth}
        text={label}
        fontSize={DIMENSION_FONT_SIZE}
        fill={COLORS.dimensions.text}
        fontFamily="Arial"
        align="center"
      />
    );

    // Wrap badge in a clickable group if onClick is provided
    const badgeElements = onClick ? (
      <Group
        onClick={onClick}
        onTap={onClick}
        onMouseEnter={(e) => {
          // Find the background rect and text in this group
          const group = e.target as any;
          const children = group.children || group.getChildren?.() || [];
          
          children.forEach((child: any) => {
            if (child.className === 'Rect') {
              child.fill('#1e293b'); // Lighter background on hover
              child.stroke('#d1d5db'); // Lighter stroke on hover
            } else if (child.className === 'Text') {
              child.fill('#ffffff'); // Brighter text on hover
            }
          });
          
          const stage = e.target.getStage();
          if (stage?.container()) {
            (stage.container() as HTMLDivElement).style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          // Find the background rect and text in this group
          const group = e.target as any;
          const children = group.children || group.getChildren?.() || [];
          
          children.forEach((child: any) => {
            if (child.className === 'Rect') {
              child.fill('#0f172a'); // Reset background
              child.stroke(COLORS.dimensions.line); // Reset stroke
            } else if (child.className === 'Text') {
              child.fill(COLORS.dimensions.text); // Reset text color
            }
          });
          
          const stage = e.target.getStage();
          if (stage?.container()) {
            (stage.container() as HTMLDivElement).style.cursor = 'default';
          }
        }}
      >
        {valueBackground}
        {valueLabel}
      </Group>
    ) : (
      <>
        {valueBackground}
        {valueLabel}
      </>
    );

    return (
      <Group key={`dim-${startX}-${endX}-${y}`}>
        {extensionLinesElements}
        {dimensionLine}
        {leftArrow}
        {rightArrow}
        {badgeElements}
      </Group>
    );
  };

  // Determine cursor style based on active tool and panning state
  const DIMENSION_FONT_SIZE = 13; // Increased from 11 to 13 for better readability
  const DIMENSION_CHAR_WIDTH = DIMENSION_FONT_SIZE * 0.55;
  const DIMENSION_MIN_BADGE_WIDTH = 48;
  const DIMENSION_HORIZONTAL_PADDING = 12;
  const DIMENSION_VERTICAL_PADDING = 6;

  const getDimensionBadgeWidth = (text: string) => {
    // More accurate width calculation - account for padding
    const textWidth = text.length * DIMENSION_CHAR_WIDTH;
    return Math.max(DIMENSION_MIN_BADGE_WIDTH, textWidth + DIMENSION_HORIZONTAL_PADDING);
  };

  const computeDimensionStack = (
    dimensions: { id: string; startX: number; endX: number; label: string }[],
    startY: number,
    spacing: number,
    direction: 1 | -1
  ) => {
    const positions: Record<string, number> = {};
    let currentY = startY;

    dimensions.forEach((dimension, index) => {
      const spanWidth = Math.abs(dimension.endX - dimension.startX);
      const badgeWidth = getDimensionBadgeWidth(dimension.label);
      const needsExtraSpace = badgeWidth > spanWidth;

      positions[dimension.id] = currentY;

      // If badge is wider than span, add significant extra spacing to avoid overlap
      let totalSpacing = spacing;
      if (needsExtraSpace) {
        // Add extra spacing proportional to how much the badge overflows
        const overflowRatio = badgeWidth / Math.max(spanWidth, 1);
        totalSpacing = spacing * Math.max(2, overflowRatio * 0.8);
      }
      currentY += totalSpacing * direction;
    });

    return positions;
  };

  const topDimensionsData = [
    {
      id: 'oal',
      startX: horizontalOffset,
      endX: horizontalOffset + mmToPxLocal(truckConfig.oal),
      label: `OAL ${truckConfig.oal}mm`,
    },
    {
      id: 'wb',
      startX: frontAxlePx,
      endX: rearAxlePx,
      label: `WB ${truckConfig.wb}mm`,
    },
    {
      id: 'bodyLength',
      startX: bodyStartPx,
      endX: bodyStartPx + bodyLengthPx,
      label: `Body ${bodyDimensions.length}mm`,
    },
  ];

  // Calculate AC (Axle to Cab): front axle to back of cab
  const ac = truckConfig.wb - truckConfig.ca;

  const bottomDimensionsData = [
    {
      id: 'foh',
      startX: horizontalOffset,
      endX: frontAxlePx,
      label: `FOH ${truckConfig.foh}mm`,
    },
    {
      id: 'ac',
      startX: frontAxlePx,
      endX: cabEndPx,
      label: `AC ${ac}mm`,
    },
    {
      id: 'roh',
      startX: rearAxlePx,
      endX: horizontalOffset + mmToPxLocal(truckConfig.oal),
      label: `ROH ${truckConfig.roh}mm`,
    },
    {
      id: 'ca',
      startX: cabEndPx,
      endX: rearAxlePx,
      label: `CA ${truckConfig.ca}mm`,
    },
    {
      id: 'cabBody',
      startX: cabEndPx,
      endX: bodyStartPx,
      label: `FBoC ${fromBackOfCab}mm`,
    },
  ];

  const activeBottomDimensions =
    fromBackOfCab > 0
      ? bottomDimensionsData
      : bottomDimensionsData.filter((dimension) => dimension.id !== 'cabBody');

  const topDimensionPositions = computeDimensionStack(
    topDimensionsData,
    bodyTopY - 120, // Reduced from -260 to -120 to bring closer to truck
    28, // Reduced spacing from 32 to 28
    -1
  );

  const bottomDimensionPositions = computeDimensionStack(
    activeBottomDimensions,
    bodyTopY + bodyWidthPx + 40,
    28, // Reduced spacing from 32 to 28
    1
  );

  const cursorStyle = useMemo(() => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'zoom-in') return 'zoom-in';
    if (activeTool === 'zoom-out') return 'zoom-out';
    return 'default';
  }, [activeTool, isPanning]);

  return (
    <div style={{ cursor: cursorStyle, width: '100%', height: '100%' }}>
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        pixelRatio={pixelRatio}
        touchEnabled={true}
        onClick={(e) => {
          if (activeTool === 'zoom-in' || activeTool === 'zoom-out') {
            handleZoomClick(e);
          } else {
            handleStageClick(e);
          }
        }}
        onTap={(e) => {
          // Tap is for touch devices, treat as click
          if (activeTool === 'zoom-in' || activeTool === 'zoom-out') {
            // Zoom tools don't work well with tap, skip
          } else {
            // For select tool, handle tap as click - use same logic as handleStageClick
            // Check if a drag-selection just completed, skip this tap to prevent immediate deselect
            if (selectionCompletedRef.current) {
              selectionCompletedRef.current = false; // Reset flag so next tap works normally
              return;
            }
            
            // If tapping on stage (not a pallet), deselect
            const stage = e.target.getStage();
            if (stage && e.target === stage) {
              onSelectPallet?.(null);
            }
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
      >
      <Layer>
        {/* Cab area (0mm to 2,240mm) - fixed width */}
        <Rect
          x={horizontalOffset}
          y={cabTopY}
          width={cabEndPx - horizontalOffset}
          height={cabWidthPx}
          fill={COLORS.cab.fill}
          stroke={COLORS.cab.stroke}
          strokeWidth={2}
        />

        {/* Gap/spacing area (optional dotted outline) */}
        {fromBackOfCab > 0 && (
          <Line
            points={[cabEndPx, bodyTopY, cabEndPx, bodyTopY + bodyWidthPx]}
            stroke={COLORS.dimensions.line}
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.5}
          />
        )}

        {/* Body/tray area (starts at cabEnd + fromBackOfCab) */}
        <Rect
          x={bodyStartPx}
          y={bodyTopY}
          width={bodyLengthPx}
          height={bodyWidthPx}
          fill={COLORS.body.fill}
          stroke={COLORS.body.stroke}
          strokeWidth={2}
        />

        {/* Usable loading area (body minus walls) - shown as solid overlay */}
        {(wallThickness.front > 0 || wallThickness.rear > 0 || wallThickness.sides > 0) && (
          <Rect
            x={usableStartPx}
            y={usableTopY}
            width={usableLengthPx}
            height={usableWidthPx}
            fill="transparent"
            stroke="#6b7280"
            strokeWidth={1}
            opacity={0.8}
          />
        )}

        {/* Front axle position - dashed vertical line */}
        <Line
          points={[frontAxlePx, 0, frontAxlePx, canvasSize.height]}
          stroke={COLORS.axle.line}
          strokeWidth={1}
          dash={[10, 5]}
          opacity={0.6}
        />
        <Text
          x={frontAxlePx + 5}
          y={10}
          text="Front Axle"
          fontSize={12}
          fill={COLORS.dimensions.text}
          fontFamily="Arial"
        />

        {/* Rear axle position - dashed vertical line */}
        <Line
          points={[rearAxlePx, 0, rearAxlePx, canvasSize.height]}
          stroke={COLORS.axle.line}
          strokeWidth={1}
          dash={[10, 5]}
          opacity={0.6}
        />
        <Text
          x={rearAxlePx + 5}
          y={10}
          text="Rear Axle"
          fontSize={12}
          fill={COLORS.dimensions.text}
          fontFamily="Arial"
        />

        {/* CAD-Style Dimension Lines - Stacked from top to bottom with proper spacing */}
        {/* Level 1: OAL (Overall Length) - Top level */}
        {(() => {
          const startX = horizontalOffset;
          const endX = horizontalOffset + mmToPxLocal(truckConfig.oal);
          const label = `OAL ${truckConfig.oal}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, topDimensionPositions.oal, label, true, 15, badgeWidth > spanWidth);
        })()}

        {/* Level 2: Major dimensions - WB (Wheelbase) and Body Length */}
        {/* WB - positioned between axles */}
        {(() => {
          const startX = frontAxlePx;
          const endX = rearAxlePx;
          const label = `WB ${truckConfig.wb}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, topDimensionPositions.wb, label, true, 15, badgeWidth > spanWidth);
        })()}
        {/* Body Length - positioned below WB to avoid overlap */}
        {(() => {
          const startX = bodyStartPx;
          const endX = bodyStartPx + bodyLengthPx;
          const label = `Body ${bodyDimensions.length}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          const onClick = () => onOpenBodyConfig?.('bodyLength');
          return drawDimensionLine(startX, endX, topDimensionPositions.bodyLength, label, true, 15, badgeWidth > spanWidth, onClick);
        })()}

        {/* Level 3: Detail dimensions - FOH, AC, ROH, CA, Cab-Body spacing */}
        {/* FOH - Front Overhang */}
        {(() => {
          const startX = horizontalOffset;
          const endX = frontAxlePx;
          const label = `FOH ${truckConfig.foh}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, bottomDimensionPositions.foh, label, true, 15, badgeWidth > spanWidth);
        })()}
        {/* AC - Axle to Cab */}
        {(() => {
          const startX = frontAxlePx;
          const endX = cabEndPx;
          const label = `AC ${ac}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, bottomDimensionPositions.ac, label, true, 15, badgeWidth > spanWidth);
        })()}
        {/* ROH - Rear Overhang - offset slightly to avoid overlap */}
        {(() => {
          const startX = rearAxlePx;
          const endX = horizontalOffset + mmToPxLocal(truckConfig.oal);
          const label = `ROH ${truckConfig.roh}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, bottomDimensionPositions.roh, label, true, 15, badgeWidth > spanWidth);
        })()}
        {/* CA - Cab to Axle */}
        {(() => {
          const startX = cabEndPx;
          const endX = rearAxlePx;
          const label = `CA ${truckConfig.ca}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          return drawDimensionLine(startX, endX, bottomDimensionPositions.ca, label, true, 15, badgeWidth > spanWidth);
        })()}
        {/* Cab-Body spacing - only if > 0 */}
        {fromBackOfCab > 0 && (() => {
          const startX = cabEndPx;
          const endX = bodyStartPx;
          const label = `FBoC ${fromBackOfCab}mm`;
          const spanWidth = Math.abs(endX - startX);
          const badgeWidth = getDimensionBadgeWidth(label);
          const onClick = () => onOpenBodyConfig?.('fromBackOfCab');
          // Force FBoC badge below line since it's typically a short measurement
          return drawDimensionLine(startX, endX, bottomDimensionPositions.cabBody, label, true, 15, true, onClick);
        })()}

        {/* Pallets - draggable */}
        {pallets.map((pallet) => {
          const palletX = mmToPxLocal(pallet.x) + horizontalOffset;
          const palletY = bodyTopY + mmToPxLocal(pallet.y);
          const palletLengthPx = mmToPxLocal(pallet.length);
          const palletWidthPx = mmToPxLocal(pallet.width);
          const isSelected = selectedPalletIds.includes(pallet.id);

          // Usable area boundaries in pixels (relative to canvas origin, in world coordinates)
          // Pallets can only be placed in the usable area (body minus walls)
          const usableStartX = usableStartPx;
          const usableEndX = usableStartPx + usableLengthPx;
          const usableStartY = usableTopY;
          const usableEndY = usableTopY + usableWidthPx;

          const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
            // Capture the ACTUAL position from Konva at drag start
            // This is the most reliable source as it's what's actually being rendered
            const actualX = e.target.x();
            const actualY = e.target.y();
            
            // Store these exact positions for constraints
            initialDragXRef.current[pallet.id] = actualX;
            initialDragYRef.current[pallet.id] = actualY;
            
            // Prevent dragging with middle mouse button - should only pan
            // Check both the tracked state and the event's button property
            if (mouseButtonPressed === 1 || e.evt.button === 1) {
              // Don't stop propagation - let the event bubble to stage for panning
              // Just prevent the drag from happening
              e.evt.preventDefault();
              // Force the node to stay in place
              e.target.setPosition({ x: actualX, y: actualY });
              // Return false to prevent drag, but don't stop propagation so stage can pan
              return false;
            }

            // If this pallet is part of a multi-selection, store initial positions of all selected pallets
            if (selectedPalletIds.length > 1 && selectedPalletIds.includes(pallet.id)) {
              initialPositionsRef.current = {};
              // Store the dragged pallet's initial position (using mm from pallet data)
              initialPositionsRef.current[pallet.id] = {
                x: pallet.x,
                y: pallet.y
              };
              
              // Store initial positions for ALL selected pallets
              selectedPalletIds.forEach(id => {
                if (id !== pallet.id) {
                  const selectedPallet = pallets.find(p => p.id === id);
                  if (selectedPallet) {
                    initialPositionsRef.current[id] = {
                      x: selectedPallet.x,
                      y: selectedPallet.y
                    };
                    // Store initial pixel positions for each selected pallet
                    const selectedPalletY = bodyTopY + mmToPxLocal(selectedPallet.y);
                    const selectedPalletX = mmToPxLocal(selectedPallet.x) + horizontalOffset;
                    initialDragYRef.current[id] = selectedPalletY;
                    initialDragXRef.current[id] = selectedPalletX;
                  }
                }
              });
            }
          };

          const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
            // Prevent drag move if middle mouse button is pressed OR we're panning (should pan instead)
            if (mouseButtonPressed === 1 || isPanning) {
              // Reset position to prevent any movement
              const initialX = initialDragXRef.current[pallet.id];
              const initialY = initialDragYRef.current[pallet.id];
              if (initialX !== undefined && initialY !== undefined) {
                e.target.setPosition({ x: initialX, y: initialY });
              }
              return;
            }
            
            // Get initial positions - must be set by handleDragStart
            const initialPixelX = initialDragXRef.current[pallet.id];
            const initialPixelY = initialDragYRef.current[pallet.id];
            
            if (initialPixelX === undefined || initialPixelY === undefined) {
              return; // Skip update if positions not initialized
            }
            
            // Konva's drag system handles the Stage transform automatically
            // e.target.x() and e.target.y() are in world coordinates (already constrained by dragBoundFunc)
            const newWorldX = e.target.x();
            const newWorldY = e.target.y();

            // Calculate deltas in PIXELS first (more accurate), then convert to mm
            // This delta accounts for any constraints applied by dragBoundFunc (Shift/Alt locks)
            const deltaXPx = newWorldX - initialPixelX;
            const deltaYPx = newWorldY - initialPixelY;
            const deltaXMm = pxToMmLocal(deltaXPx);
            const deltaYMm = pxToMmLocal(deltaYPx);

            // If multiple pallets are selected and this is one of them, move all selected pallets
            if (selectedPalletIds.length > 1 && selectedPalletIds.includes(pallet.id) && onUpdatePalletPositions) {
              const initialPos = initialPositionsRef.current[pallet.id];
              
              if (initialPos) {
                // Calculate new positions for all selected pallets, preserving their relative spacing
                const updates = selectedPalletIds.map(id => {
                  const initialPalletPos = initialPositionsRef.current[id];
                  if (initialPalletPos) {
                    return {
                      id,
                      x: initialPalletPos.x + deltaXMm,
                      y: initialPalletPos.y + deltaYMm,
                    };
                  }
                  return null;
                }).filter(Boolean) as { id: string; x: number; y: number }[];

                onUpdatePalletPositions(updates);
              }
            } else if (onUpdatePalletPosition) {
              // Single pallet movement - convert to mm coordinates
              const newXMm = pxToMmLocal(newWorldX - horizontalOffset);
              const newYMm = pxToMmLocal(newWorldY - bodyTopY);
              onUpdatePalletPosition(pallet.id, newXMm, newYMm);
            }
          };

          const handleDragEnd = () => {
            // Final position update handled in dragMove
            // Clean up initial position refs (both X and Y)
            if (selectedPalletIds.length > 1 && selectedPalletIds.includes(pallet.id)) {
              // Clean up all selected pallets
              selectedPalletIds.forEach(id => {
                delete initialDragYRef.current[id];
                delete initialDragXRef.current[id];
              });
            } else {
              // Clean up single pallet
              delete initialDragYRef.current[pallet.id];
              delete initialDragXRef.current[pallet.id];
            }
          };

          const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            // Ignore middle-clicks (button 1) - those should pan, not select
            if (e.evt.button === 1) {
              return;
            }
            
            e.cancelBubble = true;
            
            // Determine selection mode based on modifier keys
            let mode: 'single' | 'toggle' | 'range' = 'single';
            if (e.evt.ctrlKey || e.evt.metaKey) {
              mode = 'toggle'; // Ctrl/Cmd+click toggles selection
            } else if (e.evt.shiftKey) {
              mode = 'range'; // Shift+click for range selection (for now, just adds to selection)
            }
            
            onSelectPallet?.(pallet.id, mode);
          };

          const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            onDoubleClickPallet?.(pallet.id);
          };

          const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            // For middle-clicks, update state immediately to prevent drag from starting
            if (e.evt.button === 1) {
              setMouseButtonPressed(1);
              mouseButtonPressedRef.current = 1;
              // Don't cancel bubble - let event bubble to stage for panning
              return; // Let event bubble to stage
            }
            // For other buttons, update state
            setMouseButtonPressed(e.evt.button);
            mouseButtonPressedRef.current = e.evt.button;
          };

          const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
            e.evt.preventDefault();
            e.cancelBubble = true;
            
            // If multiple pallets are selected and this pallet is one of them, delete all selected
            if (selectedPalletIds.length > 1 && selectedPalletIds.includes(pallet.id)) {
              if (onDeletePallets && window.confirm(`Delete ${selectedPalletIds.length} selected pallets?`)) {
                onDeletePallets(selectedPalletIds);
              }
            } else {
              // Single pallet deletion
              if (onDeletePallet && window.confirm(`Delete pallet (${pallet.weight}kg)?`)) {
                onDeletePallet(pallet.id);
              }
            }
          };

          return (
            <Group
              key={pallet.id}
              x={palletX}
              y={palletY}
              draggable={!!onUpdatePalletPosition && activeTool === 'select' && !isPanning}
              dragDistance={mouseButtonPressedRef.current === 1 || isPanning ? 10000 : 5}
              onMouseDown={handleMouseDown}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
              onTap={handleClick}
              onDblClick={handleDoubleClick}
              onDblTap={handleDoubleClick}
              onContextMenu={handleContextMenu}
              dragBoundFunc={(pos) => {
                // If middle mouse button is pressed OR we're panning, prevent any pallet movement (should pan instead)
                if (mouseButtonPressed === 1 || isPanning) {
                  // Return the initial position to lock the pallet in place
                  // This prevents the pallet from interfering with panning
                  return {
                    x: initialDragXRef.current[pallet.id] ?? pos.x,
                    y: initialDragYRef.current[pallet.id] ?? pos.y
                  };
                }
                
                // Get initial positions - these should ALWAYS be set by handleDragStart
                // If somehow not set, don't apply constraints (just use current position)
                const initialX = initialDragXRef.current[pallet.id];
                const initialY = initialDragYRef.current[pallet.id];
                
                if (initialX === undefined || initialY === undefined) {
                  // Positions not initialized - skip constraints
                  return pos;
                }
                
                // Check if Shift or Alt keys are held for constrained movement
                const isShiftHeld = shiftKeyPressedRef.current;
                const isAltHeld = altKeyPressedRef.current;
                
                // If Shift is held (horizontal only) or Alt is held (vertical only), lock the perpendicular axis FIRST
                let targetX = pos.x;
                let targetY = pos.y;
                
                if (isShiftHeld) {
                  // Lock Y to initial position, only allow X movement
                  targetY = initialY;
                } else if (isAltHeld) {
                  // Lock X to initial position, only allow Y movement
                  targetX = initialX;
                }
                
                // Apply grid snapping (10mm grid for better precision)
                const gridSizePx = mmToPxLocal(10);
                const snappedX = Math.round(targetX / gridSizePx) * gridSizePx;
                const snappedY = Math.round(targetY / gridSizePx) * gridSizePx;
                
                // Apply boundary constraints ONLY if no Shift/Alt constraints are active
                // When user holds Shift/Alt, they want perfect alignment and should be able to move freely
                let finalX = snappedX;
                let finalY = snappedY;
                
                if (!isShiftHeld && !isAltHeld) {
                  // Normal drag - apply boundary constraints to both axes
                  finalX = Math.max(usableStartX, Math.min(snappedX, usableEndX - palletLengthPx));
                  finalY = Math.max(usableStartY, Math.min(snappedY, usableEndY - palletWidthPx));
                }
                
                // Double-check: if Shift/Alt is held, ensure the locked axis is EXACTLY at initial position
                if (isShiftHeld) {
                  finalY = initialY;
                }
                if (isAltHeld) {
                  finalX = initialX;
                }
                
                return { x: finalX, y: finalY };
              }}
            >
              {/* Main pallet fill */}
              <Rect
                x={0}
                y={0}
                width={palletLengthPx}
                height={palletWidthPx}
                fill={isSelected ? 'rgba(75, 85, 99, 0.3)' : 'rgba(75, 85, 99, 0.6)'}
              />
              {/* Inner stroke - drawn inside the pallet boundaries */}
              <Rect
                x={isSelected ? 1 : 0.5} // Half stroke width inset
                y={isSelected ? 1 : 0.5} // Half stroke width inset  
                width={palletLengthPx - (isSelected ? 2 : 1)} // Reduce by full stroke width
                height={palletWidthPx - (isSelected ? 2 : 1)} // Reduce by full stroke width
                fill="transparent"
                stroke={isSelected ? '#ffffff' : COLORS.pallet.stroke}
                strokeWidth={isSelected ? 2 : 1}
                strokeScaleEnabled={false}
              />
              <Text
                x={palletLengthPx / 2}
                y={palletWidthPx / 2}
                text={pallet.name || `${pallet.weight}kg`}
                fontSize={pallet.name ? 11 : 12}
                fill={COLORS.pallet.text}
                fontFamily="Arial"
                align="center"
                verticalAlign="middle"
                offsetX={pallet.name ? 30 : 20}
                offsetY={6}
              />
              {pallet.name && (
                <Text
                  x={palletLengthPx / 2}
                  y={palletWidthPx / 2 + 14}
                  text={`${pallet.weight}kg`}
                  fontSize={10}
                  fill={COLORS.pallet.text}
                  fontFamily="Arial"
                  align="center"
                  verticalAlign="middle"
                  offsetX={20}
                  offsetY={3}
                  opacity={0.8}
                />
              )}
            </Group>
          );
        })}

        {/* Selection Area Rectangle */}
        {selectionArea.active && (
          <Rect
            x={Math.min(selectionArea.startX, selectionArea.endX)}
            y={Math.min(selectionArea.startY, selectionArea.endY)}
            width={Math.abs(selectionArea.endX - selectionArea.startX)}
            height={Math.abs(selectionArea.endY - selectionArea.startY)}
            fill="rgba(59, 130, 246, 0.1)" // Blue with low opacity
            stroke="#3b82f6" // Blue border
            strokeWidth={1}
            dash={[5, 5]} // Dashed border
            listening={false} // Don't interfere with mouse events
          />
        )}
      </Layer>
    </Stage>
    </div>
  );
}

