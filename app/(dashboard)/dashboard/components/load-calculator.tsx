'use client';

import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toast } from 'sonner';
import { DashboardMenu } from './dashboard-menu';
import { ToolsBar } from './tools-bar';
import { OrientationWarning } from './orientation-warning';
import { TruckCanvas } from './truck-canvas';
import { ISUZU_FVR_170_300 } from '@/lib/load-calculator/truck-config';
import { BodyConfigPopover } from './popovers/body-config-popover';
import { FixedCompliancePopover } from './popovers/fixed-compliance-popover';
import { PalletEditPopover } from './popovers/pallet-edit-popover';
import { AddPalletPopover } from './popovers/add-pallet-popover';
import { calculateWeightDistribution, getUsableDimensions } from '@/lib/load-calculator/physics';
import type { TruckProfile, Pallet } from '@/lib/load-calculator/types';
import { BodyType, SuspensionType } from '@/lib/load-calculator/types';
import { useLoadsWithHistory } from '../hooks/use-loads-with-history';
import { useLoadsStore } from '../hooks/use-loads-store';
import { useTruckConfigStore } from '../hooks/use-truck-config-store';
import { useUIStore } from '../hooks/use-ui-store';
import { useCanvasStore } from '../hooks/use-canvas-store';
import type { Load } from '../hooks/use-loads-store';

export function LoadCalculator() {
  // State for focus field in body config
  const [bodyConfigFocusField, setBodyConfigFocusField] = useState<'fromBackOfCab' | 'bodyLength' | 'bodyWidth' | undefined>();

  // Configure drag sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Zustand stores
  const {
    loads,
    selectedPalletIds,
    setLoads,
    addLoad,
    updateLoadPosition,
    updateLoadPositions,
    updateLoadWeight,
    deleteLoad,
    deleteLoads,
    duplicateLoad,
    duplicateLoads,
    selectPallet,
    selectPallets,
    selectAllPallets,
    clearSelection,
    copySelectedPallets,
    pastePallets,
    getSelectedPallets,
    hasSelection,
    undo: undoLoads,
    redo: redoLoads,
    canUndo: canUndoLoads,
    canRedo: canRedoLoads,
  } = useLoadsWithHistory();

  const weighBridgeReadings = useTruckConfigStore((state) => state.weighBridgeReadings);
  const setWeighBridgeReadings = useTruckConfigStore((state) => state.setWeighBridgeReadings);
  const fromBackOfCab = useTruckConfigStore((state) => state.fromBackOfCab);
  const setFromBackOfCabStore = useTruckConfigStore((state) => state.setFromBackOfCab);
  const bodyDimensions = useTruckConfigStore((state) => state.bodyDimensions);
  const setBodyLengthStore = useTruckConfigStore((state) => state.setBodyLength);
  const setBodyWidthStore = useTruckConfigStore((state) => state.setBodyWidth);
  const wallThickness = useTruckConfigStore((state) => state.wallThickness);
  const setWallThicknessStore = useTruckConfigStore((state) => state.setWallThickness);

  // No validation - let users change body dimensions freely
  // If pallets overflow, that's the user's responsibility to manage

  // Direct wrapper functions - no validation, user has full control
  const setFromBackOfCab = useCallback((value: number) => {
      setFromBackOfCabStore(value);
  }, [setFromBackOfCabStore]);

  const setBodyLength = useCallback((length: number) => {
      setBodyLengthStore(length);
  }, [setBodyLengthStore]);

  const setBodyWidth = useCallback((width: number) => {
      setBodyWidthStore(width);
  }, [setBodyWidthStore]);

  const setWallThickness = useCallback((thickness: { front: number; rear: number; sides: number }) => {
      setWallThicknessStore(thickness);
  }, [setWallThicknessStore]);

  const popovers = useUIStore((state) => state.popovers);
  const setPopoverVisible = useUIStore((state) => state.setPopoverVisible);
  const setPopoverPosition = useUIStore((state) => state.setPopoverPosition);
  const setPopoverCollapsed = useUIStore((state) => state.setPopoverCollapsed);
  const palletEditPopover = useUIStore((state) => state.palletEditPopover);
  const setPalletEditPopover = useUIStore((state) => state.setPalletEditPopover);
  const addPalletPopover = useUIStore((state) => state.addPalletPopover);
  const setAddPalletPopover = useUIStore((state) => state.setAddPalletPopover);

  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const canvasZoom = useCanvasStore((state) => state.canvasZoom);
  const setCanvasZoom = useCanvasStore((state) => state.setCanvasZoom);
  const canvasPosition = useCanvasStore((state) => state.canvasPosition);
  const setCanvasPosition = useCanvasStore((state) => state.setCanvasPosition);
  const resetView = useCanvasStore((state) => state.resetView);

  // Derived values
  const bodyStartPosition = ISUZU_FVR_170_300.bedStart + fromBackOfCab; // Where body actually starts
  const maxAvailableBodyLength = ISUZU_FVR_170_300.maxBodyLength - fromBackOfCab; // Reduced by spacing

  // Convert TruckConfig (mm) to TruckProfile (metres) for physics calculations
  const truckProfile: TruckProfile = useMemo(() => ({
    id: 'default',
    name: ISUZU_FVR_170_300.model,
    body_type: BodyType.TRAY,
    body_length: bodyDimensions.length / 1000, // mm to metres
    body_width: bodyDimensions.width / 1000, // mm to metres
    wheelbase: ISUZU_FVR_170_300.wb / 1000, // mm to metres
    tare_weight: weighBridgeReadings.frontAxle + weighBridgeReadings.rearAxle,
    front_tare_weight: weighBridgeReadings.frontAxle,
    rear_tare_weight: weighBridgeReadings.rearAxle,
    gvm: ISUZU_FVR_170_300.gvm,
    front_axle_limit: ISUZU_FVR_170_300.frontAxleLimit,
    rear_axle_limit: ISUZU_FVR_170_300.rearAxleLimit,
    front_overhang: ISUZU_FVR_170_300.foh / 1000, // mm to metres
    cab_to_axle: ISUZU_FVR_170_300.ca / 1000, // mm to metres
    rear_overhang: ISUZU_FVR_170_300.roh / 1000, // mm to metres
    suspension_type: SuspensionType.STEEL,
    wall_thickness_front: wallThickness.front / 1000, // mm to metres
    wall_thickness_rear: wallThickness.rear / 1000, // mm to metres
    wall_thickness_sides: wallThickness.sides / 1000, // mm to metres
  }), [bodyDimensions, weighBridgeReadings, wallThickness]);

  // Get usable dimensions accounting for wall thickness
  const usableDimensions = useMemo(() => {
    const { usableLength, usableWidth, usableX, usableY } = getUsableDimensions(truckProfile);
    return {
      usableLength: usableLength * 1000, // metres to mm
      usableWidth: usableWidth * 1000, // metres to mm
      usableX: usableX * 1000, // metres to mm (offset from body front)
      usableY: usableY * 1000, // metres to mm (offset from body left)
    };
  }, [truckProfile]);

  // Convert loads from mm to metres for physics calculations
  // Physics expects positions relative to body front (0m = front of body), not front of truck
  const palletsForPhysics: Pallet[] = useMemo(() => {
    const bodyStartMm = bodyStartPosition; // mm from front of truck
    return loads.map(load => ({
      id: load.id,
      x: (load.x - bodyStartMm) / 1000, // mm to metres, relative to body front
      y: load.y / 1000, // mm to metres (from centerline)
      length: load.length / 1000, // mm to metres
      width: load.width / 1000, // mm to metres
      weight: load.weight, // kg - no conversion needed
    }));
  }, [loads, bodyStartPosition]);

  // Calculate weight distribution using existing physics.ts
  const weightDistribution = useMemo(() => {
    return calculateWeightDistribution(truckProfile, palletsForPhysics);
  }, [truckProfile, palletsForPhysics]);

  // Handle drag end for popovers
  // Note: DraggablePopover handles its own position updates internally
  // This handler is kept for DndContext compatibility but doesn't need to do anything
  const handleDragEnd = (_event: DragEndEvent) => {
    // Position updates are handled by DraggablePopover's internal drag handling
  };

  // Handle add pallet (from popover with custom dimensions)
  const handleAddPallet = useCallback((pallet: { length: number; width: number; weight: number }) => {
    const bodyStartX = bodyStartPosition; // mm
    const usableStartX = bodyStartX + usableDimensions.usableX; // Account for front wall
    const newPallet: Load = {
      id: `pallet-${Date.now()}-${Math.random()}`,
      x: usableStartX, // Start at usable area start (after front wall)
      y: usableDimensions.usableY, // Start at usable area (after side wall)
      length: pallet.length,
      width: pallet.width,
      weight: pallet.weight,
    };
    addLoad(newPallet);
  }, [bodyStartPosition, usableDimensions, addLoad]);

  // Smart pallet duplication: find a free position next to the original
  const handleDuplicatePallet = useCallback((id: string) => {
    const originalLoad = loads.find(l => l.id === id);
    if (!originalLoad) return;

    // Calculate usable area boundaries
    const bodyStartX = bodyStartPosition;
    const usableStartX = bodyStartX + usableDimensions.usableX;
    const usableEndX = usableStartX + usableDimensions.usableLength;
    const usableStartY = usableDimensions.usableY;
    const usableEndY = usableStartY + usableDimensions.usableWidth;

    // Grid size for snapping (10mm)
    const gridSize = 10;

    // Helper function to check if a position overlaps with any existing pallet
    const checkOverlap = (x: number, y: number, length: number, width: number, excludeId?: string): boolean => {
      const newEndX = x + length;
      const newEndY = y + width;

      // Check bounds
      if (x < usableStartX || newEndX > usableEndX || y < usableStartY || newEndY > usableEndY) {
        return true; // Out of bounds = overlap
      }

      // Check overlap with other pallets
      return loads.some(load => {
        if (load.id === excludeId) return false;
        const loadEndX = load.x + load.length;
        const loadEndY = load.y + load.width;
        
        // Check if rectangles overlap
        return !(newEndX <= load.x || x >= loadEndX || newEndY <= load.y || y >= loadEndY);
      });
    };

    // Try positions in order: right, down, left, up
    const candidatePositions = [
      { x: originalLoad.x + originalLoad.length + gridSize, y: originalLoad.y }, // Right
      { x: originalLoad.x, y: originalLoad.y + originalLoad.width + gridSize }, // Down
      { x: originalLoad.x - originalLoad.length - gridSize, y: originalLoad.y }, // Left
      { x: originalLoad.x, y: originalLoad.y - originalLoad.width - gridSize }, // Up
    ];

    // Try each candidate position
    for (const candidate of candidatePositions) {
      // Snap to grid
      const snappedX = Math.round(candidate.x / gridSize) * gridSize;
      const snappedY = Math.round(candidate.y / gridSize) * gridSize;

      if (!checkOverlap(snappedX, snappedY, originalLoad.length, originalLoad.width, id)) {
        // Found a free position! Create duplicate
        const duplicatedLoad: Load = {
          ...originalLoad,
          id: `pallet-${Date.now()}-${Math.random()}`,
          x: snappedX,
          y: snappedY,
        };
        addLoad(duplicatedLoad);
        selectPallet(duplicatedLoad.id);
        return;
      }
    }

    // If no adjacent position found, try to find any free position
    // Search in a grid pattern starting from the original position
    const searchRadius = 2000; // Search up to 2m away
    const stepSize = gridSize;

    for (let offset = stepSize; offset <= searchRadius; offset += stepSize) {
      // Try positions in a spiral pattern
      const spiralPositions = [
        { x: originalLoad.x + offset, y: originalLoad.y }, // Right
        { x: originalLoad.x - offset, y: originalLoad.y }, // Left
        { x: originalLoad.x, y: originalLoad.y + offset }, // Down
        { x: originalLoad.x, y: originalLoad.y - offset }, // Up
      ];

      for (const candidate of spiralPositions) {
        const snappedX = Math.round(candidate.x / gridSize) * gridSize;
        const snappedY = Math.round(candidate.y / gridSize) * gridSize;

        if (!checkOverlap(snappedX, snappedY, originalLoad.length, originalLoad.width, id)) {
          // Found a free position!
          const duplicatedLoad: Load = {
            ...originalLoad,
            id: `pallet-${Date.now()}-${Math.random()}`,
            x: snappedX,
            y: snappedY,
          };
          addLoad(duplicatedLoad);
          selectPallet(duplicatedLoad.id);
          return;
        }
      }
    }

    // If we still can't find a free position, duplicate anyway with a small offset
    // (user can manually move it if needed)
    const duplicatedLoad: Load = {
      ...originalLoad,
      id: `pallet-${Date.now()}-${Math.random()}`,
      x: originalLoad.x + gridSize, // Small offset to the right
      y: originalLoad.y + gridSize, // Small offset down
    };
    addLoad(duplicatedLoad);
    selectPallet(duplicatedLoad.id);
  }, [loads, bodyStartPosition, usableDimensions, addLoad, selectPallet]);

  // Use refs to avoid dependency issues and prevent rapid-fire updates
  const selectedPalletIdsRef = useRef(selectedPalletIds);
  const loadsRef = useRef(loads);
  const canUndoLoadsRef = useRef(canUndoLoads);
  const canRedoLoadsRef = useRef(canRedoLoads);
  const activeToolRef = useRef(activeTool);

  // Keep refs in sync
  useEffect(() => {
    selectedPalletIdsRef.current = selectedPalletIds;
  }, [selectedPalletIds]);

  useEffect(() => {
    loadsRef.current = loads;
  }, [loads]);

  useEffect(() => {
    canUndoLoadsRef.current = canUndoLoads;
  }, [canUndoLoads]);

  useEffect(() => {
    canRedoLoadsRef.current = canRedoLoads;
  }, [canRedoLoads]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // Keyboard shortcuts - using refs to prevent dependency loops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete key: Remove selected pallets
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const currentSelectedIds = selectedPalletIdsRef.current;
        if (currentSelectedIds.length > 0 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (currentSelectedIds.length === 1) {
            deleteLoad(currentSelectedIds[0]);
          } else {
            deleteLoads(currentSelectedIds);
          }
          setPalletEditPopover({ visible: false, palletId: null, x: 0, y: 0 });
        }
        return;
      }

      // Escape key: Deselect all pallets
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        setPalletEditPopover({ visible: false, palletId: null, x: 0, y: 0 });
        return;
      }

      // Tool shortcuts - check FIRST before modifier key shortcuts to avoid conflicts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          setActiveTool('select');
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setActiveTool('pan');
          return;
        }
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            setActiveTool('zoom-out');
          } else {
            setActiveTool('zoom-in');
          }
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          resetView();
          return;
        }
      }

      // Undo: Ctrl+Z or Cmd+Z (check AFTER tool shortcuts to avoid conflict)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndoLoadsRef.current) {
          undoLoads();
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (canRedoLoadsRef.current) {
          redoLoads();
        }
        return;
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const currentSelectedIds = selectedPalletIdsRef.current;
        if (currentSelectedIds.length > 0) {
          copySelectedPallets();
        }
        return;
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        // Calculate bounds for pasting (in mm, relative to body front)
        const bounds = {
          minX: usableDimensions.usableX,
          maxX: usableDimensions.usableX + usableDimensions.usableLength,
          minY: usableDimensions.usableY,
          maxY: usableDimensions.usableY + usableDimensions.usableWidth,
        };
        pastePallets(0, 0, bounds); // Paste in exact same position
        return;
      }

      // Select All: Ctrl+A or Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllPallets();
        return;
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const currentSelectedIds = selectedPalletIdsRef.current;
        if (currentSelectedIds.length > 0) {
          if (currentSelectedIds.length === 1) {
            handleDuplicatePallet(currentSelectedIds[0]);
          } else {
            duplicateLoads(currentSelectedIds);
          }
        }
        return;
      }

      // Arrow keys: Move selected pallets precisely
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentSelectedIds = selectedPalletIdsRef.current;
        if (currentSelectedIds.length > 0) {
          e.preventDefault();
          
          // Movement step: 10mm for normal, 1mm for fine (with Shift), 50mm for coarse (with Ctrl)
          let step = 10; // Default 10mm
          if (e.shiftKey) step = 1; // Fine movement with Shift
          if (e.ctrlKey || e.metaKey) step = 50; // Coarse movement with Ctrl/Cmd
          
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -step;
              break;
            case 'ArrowDown':
              deltaY = step;
              break;
            case 'ArrowLeft':
              deltaX = -step;
              break;
            case 'ArrowRight':
              deltaX = step;
              break;
          }
          
          // Get current pallets and calculate new positions
          const currentLoads = loadsRef.current;
          const selectedPallets = currentLoads.filter(load => currentSelectedIds.includes(load.id));
          
          // Calculate bounds for movement validation
          const bounds = {
            minX: usableDimensions.usableX,
            maxX: usableDimensions.usableX + usableDimensions.usableLength,
            minY: usableDimensions.usableY,
            maxY: usableDimensions.usableY + usableDimensions.usableWidth,
          };
          
          // Check if ALL selected pallets can move to their intended positions
          let canMoveAll = true;
          const proposedUpdates = selectedPallets.map(pallet => {
            const newX = pallet.x + deltaX;
            const newY = pallet.y + deltaY;
            
            // Check if this pallet would be within bounds
            const wouldBeInBounds = 
              newX >= bounds.minX && 
              newX + pallet.length <= bounds.maxX &&
              newY >= bounds.minY && 
              newY + pallet.width <= bounds.maxY;
            
            if (!wouldBeInBounds) {
              canMoveAll = false;
            }
            
            return {
              id: pallet.id,
              x: newX,
              y: newY,
            };
          });
          
          // Only apply the movement if ALL pallets can move to valid positions
          if (canMoveAll) {
            updateLoadPositions(proposedUpdates);
          }
          // If any pallet would go out of bounds, don't move any of them
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLoads, redoLoads, resetView, deleteLoad, deleteLoads, duplicateLoads, clearSelection, copySelectedPallets, pastePallets, selectAllPallets, handleDuplicatePallet, setActiveTool, usableDimensions, updateLoadPositions]); // Minimal dependencies - use refs for current values

  // Note: We no longer remove out-of-bounds pallets automatically.
  // Instead, body config changes are validated before being applied to prevent pallets from going out of bounds.
  // This provides better UX - users can't accidentally lose their pallet configurations.

  return (
    <>
      <OrientationWarning />
      <div className="flex h-full w-full">
        {/* Left Dashboard Menu */}
        <DashboardMenu
          onOpenTrucks={() => {
            // Weigh bridge is now in compliance popover - no action needed
          }}
          onOpenWeighBridge={() => {
            // Weigh bridge is now in compliance popover - no action needed
          }}
          onOpenBodyConfig={() => {
            setPopoverVisible('bodyConfig', !popovers.bodyConfig.visible);
          }}
          onOpenCompliance={() => {
            setPopoverVisible('compliance', !popovers.compliance.visible);
          }}
          onAddPallet={() => {
            setAddPalletPopover({ visible: !addPalletPopover.visible });
          }}
          onTogglePopovers={() => {
            const allVisible = popovers.bodyConfig.visible;
            setPopoverVisible('bodyConfig', !allVisible);
          }}
          palletCount={loads.length}
          popoverStates={{
            weighBridge: false, // Always false since it's now in compliance
            bodyConfig: popovers.bodyConfig.visible,
            compliance: popovers.compliance.visible,
            addPallet: addPalletPopover.visible,
          }}
          onUndo={undoLoads}
          onRedo={redoLoads}
          onDuplicatePallet={() => {
            if (selectedPalletIds.length > 0) {
              if (selectedPalletIds.length === 1) {
                handleDuplicatePallet(selectedPalletIds[0]);
              } else {
                duplicateLoads(selectedPalletIds);
              }
            }
          }}
          canUndo={canUndoLoads}
          canRedo={canRedoLoads}
          hasSelectedPallet={selectedPalletIds.length > 0}
          onSave={() => {
            // TODO: Implement save functionality
            console.log('Save');
          }}
          onLoad={() => {
            // TODO: Implement load functionality
            console.log('Load');
          }}
          onSettings={() => {
            // TODO: Implement settings functionality
            console.log('Settings');
          }}
        />

        {/* Tools Bar - Next to Dashboard Menu */}
        <ToolsBar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onResetView={resetView}
        />

        {/* Full Canvas Area with DndContext */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex-1 relative overflow-hidden bg-gray-900" style={{ marginLeft: '160px' }}>
            <TruckCanvas
                      truckConfig={ISUZU_FVR_170_300}
                      bodyDimensions={bodyDimensions}
                      fromBackOfCab={fromBackOfCab}
                      wallThickness={wallThickness}
                      pallets={loads}
                      onUpdatePalletPosition={updateLoadPosition}
                      selectedPalletIds={selectedPalletIds}
                      activeTool={activeTool}
                      onZoomChange={setCanvasZoom}
                      onPositionChange={setCanvasPosition}
                      canvasZoom={canvasZoom}
                      canvasPosition={canvasPosition}
                      onUpdatePalletPositions={updateLoadPositions}
                      onSelectPallet={(id, mode = 'single') => {
                selectPallet(id, mode);
                // Open edit popover when pallets are selected (single or multiple)
                setTimeout(() => {
                  const currentSelected = selectedPalletIds.includes(id || '') ? 
                    (id ? [...selectedPalletIds.filter(sid => sid !== id), id] : selectedPalletIds) :
                    (id ? [id] : []);
                  
                  if (currentSelected.length > 0) {
                  setPalletEditPopover({
                    visible: true,
                      palletId: currentSelected.length === 1 ? currentSelected[0] : null,
                    x: palletEditPopover.x,
                    y: palletEditPopover.y,
                  });
                  } else {
                  setPalletEditPopover({ visible: false, palletId: null, x: 0, y: 0 });
                }
                }, 0);
              }}
              onSelectPallets={selectPallets}
              onDeletePallet={deleteLoad}
              onDeletePallets={deleteLoads}
              onDoubleClickPallet={(id) => {
                // Double-click also opens edit popover
                setPalletEditPopover({
                  visible: true,
                  palletId: id,
                  x: palletEditPopover.x,
                  y: palletEditPopover.y,
                });
              }}
              onOpenBodyConfig={(focusField) => {
                // Open body config popover and optionally focus a specific field
                setBodyConfigFocusField(focusField);
                setPopoverVisible('bodyConfig', true);
              }}
            />
          </div>

          {/* Draggable Popovers - Outside canvas container for free movement */}

            {popovers.bodyConfig.visible && (
              <BodyConfigPopover
                position={{ x: popovers.bodyConfig.x, y: popovers.bodyConfig.y }}
                collapsed={popovers.bodyConfig.collapsed}
                onPositionChange={(pos) => setPopoverPosition('bodyConfig', pos)}
                onCollapsedChange={(collapsed) => setPopoverCollapsed('bodyConfig', collapsed)}
                onClose={() => {
                  setPopoverVisible('bodyConfig', false);
                  setBodyConfigFocusField(undefined); // Clear focus field when closing
                }}
                fromBackOfCab={fromBackOfCab}
                bodyLength={bodyDimensions.length}
                bodyWidth={bodyDimensions.width}
                maxBodyLength={maxAvailableBodyLength}
                onFromBackOfCabChange={setFromBackOfCab}
                onBodyLengthChange={setBodyLength}
                onBodyWidthChange={setBodyWidth}
                wallThickness={wallThickness}
                onWallThicknessChange={setWallThickness}
                onAddPallet={() => {
                  setAddPalletPopover({ visible: true });
                }}
                focusField={bodyConfigFocusField}
              />
            )}

            {/* Add Pallet Popover */}
            {addPalletPopover.visible && (
              <AddPalletPopover
                position={addPalletPopover}
                onPositionChange={(pos) => setAddPalletPopover(pos)}
                onClose={() => setAddPalletPopover({ visible: false })}
                onAddPallet={handleAddPallet}
              />
            )}

            {/* Fixed Compliance Summary in top-right corner */}
            {popovers.compliance.visible && (
              <FixedCompliancePopover
                truckModel={ISUZU_FVR_170_300.model}
                frontAxleTotal={weightDistribution.front_axle_weight}
                rearAxleTotal={weightDistribution.rear_axle_weight}
                gvmTotal={weightDistribution.total_weight}
                frontAxleLimit={ISUZU_FVR_170_300.frontAxleLimit}
                rearAxleLimit={ISUZU_FVR_170_300.rearAxleLimit}
                gvmLimit={ISUZU_FVR_170_300.gvm}
                frontAxle={weighBridgeReadings.frontAxle}
                rearAxle={weighBridgeReadings.rearAxle}
                onFrontAxleChange={(value) => setWeighBridgeReadings({ ...weighBridgeReadings, frontAxle: value })}
                onRearAxleChange={(value) => setWeighBridgeReadings({ ...weighBridgeReadings, rearAxle: value })}
                referenceFront={ISUZU_FVR_170_300.cabChassisFront}
                referenceRear={ISUZU_FVR_170_300.cabChassisRear}
              />
            )}

            {/* Pallet Edit Popover */}
            {palletEditPopover.visible && (
              (() => {
                const selectedPallets = loads.filter(l => selectedPalletIds.includes(l.id));
                const singlePallet = palletEditPopover.palletId ? loads.find(l => l.id === palletEditPopover.palletId) : null;
                
                if (selectedPallets.length === 0 && !singlePallet) return null;
                
                return (
                  <PalletEditPopover
                    position={{ x: palletEditPopover.x, y: palletEditPopover.y }}
                    onPositionChange={(pos) => setPalletEditPopover(pos)}
                    onClose={() => setPalletEditPopover({ visible: false, palletId: null, x: 0, y: 0 })}
                    pallet={singlePallet || undefined}
                    pallets={selectedPallets.length > 1 ? selectedPallets : undefined}
                    onUpdateWeight={updateLoadWeight}
                    onUpdateWeights={(updates) => {
                      updates.forEach(({ id, weight }) => updateLoadWeight(id, weight));
                    }}
                    onDelete={deleteLoad}
                    onDeleteMultiple={deleteLoads}
                    onDuplicate={handleDuplicatePallet}
                    onDuplicateMultiple={duplicateLoads}
                  />
                );
              })()
            )}
        </DndContext>
      </div>
    </>
  );
}

