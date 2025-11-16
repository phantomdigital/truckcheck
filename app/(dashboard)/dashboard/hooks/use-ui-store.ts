import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface PopoverState {
  visible: boolean;
  collapsed: boolean;
  x: number;
  y: number;
}

interface UIState {
  // Popover visibility and positions
  popovers: {
    bodyConfig: PopoverState;
    compliance: PopoverState;
  };

  // Pallet edit popover
  palletEditPopover: {
    visible: boolean;
    palletId: string | null;
    x: number;
    y: number;
    collapsed: boolean;
  };

  // Add pallet popover
  addPalletPopover: {
    visible: boolean;
    x: number;
    y: number;
  };

  // Align popover
  alignPopover: {
    visible: boolean;
    x: number;
    y: number;
    collapsed: boolean;
  };

  autoFillPopover: {
    visible: boolean;
    x: number;
    y: number;
    collapsed: boolean;
  };

  // Selection area for drag-to-select
  selectionArea: {
    active: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };

  // Actions
  setPopoverVisible: (popoverId: keyof UIState['popovers'], visible: boolean) => void;
  setPopoverPosition: (popoverId: keyof UIState['popovers'], position: { x: number; y: number }) => void;
  setPopoverCollapsed: (popoverId: keyof UIState['popovers'], collapsed: boolean) => void;
  setPalletEditPopover: (state: Partial<UIState['palletEditPopover']>) => void;
  setAddPalletPopover: (state: Partial<UIState['addPalletPopover']>) => void;
  setAlignPopover: (state: Partial<UIState['alignPopover']>) => void;
  setAutoFillPopover: (state: Partial<UIState['autoFillPopover']>) => void;
  togglePopover: (popoverId: keyof UIState['popovers']) => void;
  setSelectionArea: (area: Partial<UIState['selectionArea']>) => void;
  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  endSelection: () => void;
}

const STACKABLE_POPOVER_IDS: Array<keyof UIState['popovers']> = ['bodyConfig'];
const SIDE_MENU_WIDTH = 140; // Dashboard menu width
const TOOLS_BAR_WIDTH = 40; // Tools bar width
const POPOVER_WIDTH = 320; // Approximate popover width
const PADDING = 10; // Padding from edges
const POPOVER_STACK_X = SIDE_MENU_WIDTH + TOOLS_BAR_WIDTH + PADDING; // Start after side menu
const POPOVER_STACK_START_Y = 50;
const COLLAPSED_POPOVER_HEIGHT = 56;
const POPOVER_STACK_SPACING = 12;

const defaultPopoverState: PopoverState = {
  visible: false,
  collapsed: false,
  x: POPOVER_STACK_X,
  y: POPOVER_STACK_START_Y,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        popovers: {
          bodyConfig: { ...defaultPopoverState, y: POPOVER_STACK_START_Y + COLLAPSED_POPOVER_HEIGHT + POPOVER_STACK_SPACING },
          compliance: { visible: true, collapsed: false, x: 0, y: 0 }, // Fixed position
        },
        palletEditPopover: {
          visible: false,
          palletId: null,
          x: POPOVER_STACK_X,
          y: POPOVER_STACK_START_Y,
          collapsed: false,
        },
        addPalletPopover: {
          visible: false,
          x: 300,
          y: 150,
        },
        alignPopover: {
          visible: false,
          x: 300,
          y: 200,
          collapsed: false,
        },
        autoFillPopover: {
          visible: false,
          x: 350,
          y: 250,
          collapsed: false,
        },
        selectionArea: {
          active: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
        },

        setPopoverVisible: (popoverId, visible) =>
          set(
            (state) => ({
              popovers: (() => {
                const nextPopovers = { ...state.popovers };
                const targetPopover = nextPopovers[popoverId];

                if (!targetPopover) {
                  return nextPopovers;
                }

                if (visible && STACKABLE_POPOVER_IDS.includes(popoverId)) {
                  // Check if this popover has been moved from its default position
                  const hasBeenMoved = targetPopover.x !== POPOVER_STACK_X || 
                    (targetPopover.y !== POPOVER_STACK_START_Y && 
                     targetPopover.y !== POPOVER_STACK_START_Y + COLLAPSED_POPOVER_HEIGHT + POPOVER_STACK_SPACING);

                  if (hasBeenMoved) {
                    // If user has moved it before, just show it at the saved position
                    nextPopovers[popoverId] = {
                      ...targetPopover,
                      visible: true,
                      collapsed: false,
                    };
                  } else {
                    // Smart positioning for popovers that haven't been moved
                    const visiblePopovers = STACKABLE_POPOVER_IDS
                      .filter((id) => id !== popoverId && nextPopovers[id]?.visible)
                      .map((id) => ({
                        id,
                        popover: nextPopovers[id]!,
                      }))
                      .sort((a, b) => a.popover.x - b.popover.x);

                    let newX = POPOVER_STACK_X;
                    let newY = POPOVER_STACK_START_Y;

                    if (visiblePopovers.length > 0) {
                      const rightmostPopover = visiblePopovers[visiblePopovers.length - 1];
                      newX = rightmostPopover.popover.x + POPOVER_WIDTH + 20;
                      newY = rightmostPopover.popover.y;
                      
                      if (typeof window !== 'undefined' && newX > window.innerWidth - POPOVER_WIDTH - PADDING) {
                        newX = POPOVER_STACK_X;
                        const lowestY = Math.max(...visiblePopovers.map(p => p.popover.y));
                        newY = lowestY + 300;
                      }
                    }

                    nextPopovers[popoverId] = {
                      ...targetPopover,
                      visible: true,
                      collapsed: false,
                      x: newX,
                      y: newY,
                    };
                  }
                } else {
                  nextPopovers[popoverId] = {
                    ...targetPopover,
                    visible,
                    collapsed: visible ? targetPopover.collapsed : false,
                  };
                }

                return nextPopovers;
              })(),
            }),
            false,
            'setPopoverVisible'
          ),

        setPopoverPosition: (popoverId, position) =>
          set(
            (state) => ({
              popovers: {
                ...state.popovers,
                [popoverId]: { ...state.popovers[popoverId], x: position.x, y: position.y },
              },
            }),
            false,
            'setPopoverPosition'
          ),

        setPopoverCollapsed: (popoverId, collapsed) =>
          set(
            (state) => ({
              popovers: {
                ...state.popovers,
                [popoverId]: { ...state.popovers[popoverId], collapsed },
              },
            }),
            false,
            'setPopoverCollapsed'
          ),

        setPalletEditPopover: (state) =>
          set(
            (prev) => {
              const nextState = { ...prev.palletEditPopover, ...state };
              
              // Smart positioning when opening the popover
              if (state.visible && !prev.palletEditPopover.visible) {
                // Collect all visible popovers from different sources with their heights
                const allVisiblePopovers: Array<{ x: number; y: number; height: number }> = [];
                
                // Add stackable popovers (bodyConfig, etc.)
                STACKABLE_POPOVER_IDS.forEach((id) => {
                  const popover = prev.popovers[id];
                  if (popover?.visible) {
                    const height = popover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 350;
                    allVisiblePopovers.push({ x: popover.x, y: popover.y, height });
                  }
                });
                
                // Add compliance popover if visible (it's fixed position but we should still avoid it)
                if (prev.popovers.compliance?.visible) {
                  const height = prev.popovers.compliance.collapsed ? COLLAPSED_POPOVER_HEIGHT : 350;
                  allVisiblePopovers.push({ 
                    x: prev.popovers.compliance.x, 
                    y: prev.popovers.compliance.y,
                    height
                  });
                }
                
                // Add add pallet popover if visible (assume expanded)
                if (prev.addPalletPopover.visible) {
                  allVisiblePopovers.push({ 
                    x: prev.addPalletPopover.x, 
                    y: prev.addPalletPopover.y,
                    height: 350 // Add pallet popover doesn't have collapsed state
                  });
                }
                
                // Check if current position overlaps with any visible popover
                const NEW_POPOVER_HEIGHT = 350; // Height of the new pallet edit popover (expanded)
                const POPOVER_SPACING = 20;
                const currentX = prev.palletEditPopover.x;
                const currentY = prev.palletEditPopover.y;
                
                // Check for overlaps with existing popovers using their actual heights
                const hasOverlap = allVisiblePopovers.some((popover) => {
                  const horizontalOverlap = 
                    currentX < popover.x + POPOVER_WIDTH + POPOVER_SPACING &&
                    currentX + POPOVER_WIDTH + POPOVER_SPACING > popover.x;
                  const verticalOverlap = 
                    currentY < popover.y + popover.height + POPOVER_SPACING &&
                    currentY + NEW_POPOVER_HEIGHT + POPOVER_SPACING > popover.y;
                  return horizontalOverlap && verticalOverlap;
                });
                
                // Also check for old default positions (x: 300, y: 100) that should be reset
                const isOldDefault = prev.palletEditPopover.x === 300 && prev.palletEditPopover.y === 100;
                
                // Validate current position is within boundaries
                const minX = POPOVER_STACK_X;
                const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                const minY = PADDING;
                const maxY = typeof window !== 'undefined' ? window.innerHeight - 100 - PADDING : Infinity;
                
                const isValidPosition = prev.palletEditPopover.x >= minX && 
                                       prev.palletEditPopover.x <= maxX &&
                                       prev.palletEditPopover.y >= minY && 
                                       prev.palletEditPopover.y <= maxY;

                // Always use smart positioning if there's an overlap, invalid position, or old default
                // Otherwise, respect the user's previous position if it's valid and doesn't overlap
                if (hasOverlap || !isValidPosition || isOldDefault) {
                  // Smart positioning - place next to ALL visible popovers
                  // Sort by x position, then by y
                  allVisiblePopovers.sort((a, b) => {
                    if (Math.abs(a.x - b.x) < POPOVER_WIDTH + 20) {
                      // Same column, sort by y
                      return a.y - b.y;
                    }
                    return a.x - b.x;
                  });

                  let newX = POPOVER_STACK_X;
                  let newY = POPOVER_STACK_START_Y;

                  if (allVisiblePopovers.length > 0) {
                    // Try to place to the right of the rightmost popover
                    const rightmostPopover = allVisiblePopovers[allVisiblePopovers.length - 1];
                    let candidateX = rightmostPopover.x + POPOVER_WIDTH + POPOVER_SPACING;
                    let candidateY = rightmostPopover.y;
                    
                    // Check if this position would go off screen
                    if (typeof window !== 'undefined' && candidateX > window.innerWidth - POPOVER_WIDTH - PADDING) {
                      // Start a new row - find the lowest y position (including height)
                      const lowestBottom = Math.max(...allVisiblePopovers.map(p => p.y + p.height));
                      candidateX = POPOVER_STACK_X;
                      candidateY = lowestBottom + POPOVER_SPACING;
                    }
                    
                    // Check for overlaps with existing popovers using their actual heights
                    const candidateHasOverlap = allVisiblePopovers.some((popover) => {
                      const horizontalOverlap = 
                        candidateX < popover.x + POPOVER_WIDTH + POPOVER_SPACING &&
                        candidateX + POPOVER_WIDTH + POPOVER_SPACING > popover.x;
                      const verticalOverlap = 
                        candidateY < popover.y + popover.height + POPOVER_SPACING &&
                        candidateY + NEW_POPOVER_HEIGHT + POPOVER_SPACING > popover.y;
                      return horizontalOverlap && verticalOverlap;
                    });
                    
                    if (candidateHasOverlap) {
                      // If there's an overlap, try placing below the lowest popover
                      const lowestBottom = Math.max(...allVisiblePopovers.map(p => p.y + p.height));
                      candidateX = POPOVER_STACK_X;
                      candidateY = lowestBottom + POPOVER_SPACING;
                    }
                    
                    newX = candidateX;
                    newY = candidateY;
                  }

                  nextState.x = newX;
                  nextState.y = newY;
                } else {
                  // Position is valid, doesn't overlap, and has been moved - keep it but clamp to boundaries
                  nextState.x = Math.max(minX, Math.min(prev.palletEditPopover.x, maxX));
                  nextState.y = Math.max(minY, Math.min(prev.palletEditPopover.y, maxY));
                }
              } else if (state.x !== undefined || state.y !== undefined) {
                // When position is being updated, validate boundaries
                const minX = POPOVER_STACK_X;
                const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                const minY = PADDING;
                const maxY = typeof window !== 'undefined' ? window.innerHeight - 100 - PADDING : Infinity;
                
                if (nextState.x !== undefined) {
                  nextState.x = Math.max(minX, Math.min(nextState.x, maxX));
                }
                if (nextState.y !== undefined) {
                  nextState.y = Math.max(minY, Math.min(nextState.y, maxY));
                }
              }
              
              return { palletEditPopover: nextState };
            },
            false,
            'setPalletEditPopover'
          ),

        setAddPalletPopover: (state) =>
          set(
            (prev) => ({
              addPalletPopover: { ...prev.addPalletPopover, ...state },
            }),
            false,
            'setAddPalletPopover'
          ),

        setAlignPopover: (state) =>
          set(
            (prev) => {
              const nextState = { ...prev.alignPopover, ...state };
              
              // Apply smart positioning when opening the popover (visible changing to true)
              if (state.visible === true && !prev.alignPopover.visible) {
                // Collect all visible popovers to avoid overlaps
                const allVisiblePopovers: Array<{ x: number; y: number; height: number }> = [];
                
                // Add stackable popovers (bodyConfig, etc.)
                STACKABLE_POPOVER_IDS.forEach((id) => {
                  const popover = prev.popovers[id];
                  if (popover?.visible) {
                    const height = popover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 350;
                    allVisiblePopovers.push({ x: popover.x, y: popover.y, height });
                  }
                });
                
                // Add compliance popover if visible
                if (prev.popovers.compliance?.visible) {
                  const height = prev.popovers.compliance.collapsed ? COLLAPSED_POPOVER_HEIGHT : 350;
                  allVisiblePopovers.push({ 
                    x: prev.popovers.compliance.x, 
                    y: prev.popovers.compliance.y,
                    height
                  });
                }
                
                // Add add pallet popover if visible
                if (prev.addPalletPopover.visible) {
                  allVisiblePopovers.push({ 
                    x: prev.addPalletPopover.x, 
                    y: prev.addPalletPopover.y,
                    height: 350
                  });
                }
                
                // Add pallet edit popover if visible
                if (prev.palletEditPopover.visible) {
                  const height = prev.palletEditPopover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 350;
                  allVisiblePopovers.push({ 
                    x: prev.palletEditPopover.x, 
                    y: prev.palletEditPopover.y,
                    height
                  });
                }
                
                // Check if current position overlaps with any visible popover
                const ALIGN_POPOVER_HEIGHT = nextState.collapsed ? COLLAPSED_POPOVER_HEIGHT : 450; // Align popover is taller
                const POPOVER_SPACING = 20;
                const currentX = prev.alignPopover.x;
                const currentY = prev.alignPopover.y;
                
                // Check for overlaps with existing popovers
                const hasOverlap = allVisiblePopovers.some((popover) => {
                  const horizontalOverlap = 
                    currentX < popover.x + POPOVER_WIDTH + POPOVER_SPACING &&
                    currentX + POPOVER_WIDTH + POPOVER_SPACING > popover.x;
                  const verticalOverlap = 
                    currentY < popover.y + popover.height + POPOVER_SPACING &&
                    currentY + ALIGN_POPOVER_HEIGHT + POPOVER_SPACING > popover.y;
                  return horizontalOverlap && verticalOverlap;
                });
                
                // Validate current position is within boundaries
                const minX = POPOVER_STACK_X;
                const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                const minY = PADDING;
                const maxY = typeof window !== 'undefined' ? window.innerHeight - 100 - PADDING : Infinity;
                
                const isValidPosition = prev.alignPopover.x >= minX && 
                                       prev.alignPopover.x <= maxX &&
                                       prev.alignPopover.y >= minY && 
                                       prev.alignPopover.y <= maxY;

                // Use smart positioning if there's an overlap or invalid position
                if (hasOverlap || !isValidPosition) {
                  // Smart positioning - place next to ALL visible popovers
                  allVisiblePopovers.sort((a, b) => {
                    if (Math.abs(a.x - b.x) < POPOVER_WIDTH + 20) {
                      return a.y - b.y;
                    }
                    return a.x - b.x;
                  });

                  let newX = POPOVER_STACK_X;
                  let newY = POPOVER_STACK_START_Y;

                  if (allVisiblePopovers.length > 0) {
                    // Try to place to the right of the rightmost popover
                    const rightmostPopover = allVisiblePopovers[allVisiblePopovers.length - 1];
                    let candidateX = rightmostPopover.x + POPOVER_WIDTH + POPOVER_SPACING;
                    let candidateY = rightmostPopover.y;
                    
                    // Check if this position would go off screen
                    if (typeof window !== 'undefined' && candidateX > window.innerWidth - POPOVER_WIDTH - PADDING) {
                      // Start a new row - find the lowest y position
                      const lowestBottom = Math.max(...allVisiblePopovers.map(p => p.y + p.height));
                      candidateX = POPOVER_STACK_X;
                      candidateY = lowestBottom + POPOVER_SPACING;
                    }
                    
                    // Check for overlaps with the candidate position
                    const candidateHasOverlap = allVisiblePopovers.some((popover) => {
                      const horizontalOverlap = 
                        candidateX < popover.x + POPOVER_WIDTH + POPOVER_SPACING &&
                        candidateX + POPOVER_WIDTH + POPOVER_SPACING > popover.x;
                      const verticalOverlap = 
                        candidateY < popover.y + popover.height + POPOVER_SPACING &&
                        candidateY + ALIGN_POPOVER_HEIGHT + POPOVER_SPACING > popover.y;
                      return horizontalOverlap && verticalOverlap;
                    });
                    
                    if (candidateHasOverlap) {
                      // If there's an overlap, place below the lowest popover
                      const lowestBottom = Math.max(...allVisiblePopovers.map(p => p.y + p.height));
                      candidateX = POPOVER_STACK_X;
                      candidateY = lowestBottom + POPOVER_SPACING;
                    }
                    
                    newX = candidateX;
                    newY = candidateY;
                  }

                  nextState.x = newX;
                  nextState.y = newY;
                } else {
                  // Position is valid and doesn't overlap - keep it but clamp to boundaries
                  nextState.x = Math.max(minX, Math.min(prev.alignPopover.x, maxX));
                  nextState.y = Math.max(minY, Math.min(prev.alignPopover.y, maxY));
                }
              } else if (state.x !== undefined || state.y !== undefined) {
                // When position is being updated (dragging), validate boundaries
                const minX = POPOVER_STACK_X;
                const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                const minY = PADDING;
                const maxY = typeof window !== 'undefined' ? window.innerHeight - 100 - PADDING : Infinity;
                
                if (nextState.x !== undefined) {
                  nextState.x = Math.max(minX, Math.min(nextState.x, maxX));
                }
                if (nextState.y !== undefined) {
                  nextState.y = Math.max(minY, Math.min(nextState.y, maxY));
                }
              }
              
              return { alignPopover: nextState };
            },
            false,
            'setAlignPopover'
          ),

        setAutoFillPopover: (state) =>
          set(
            (prev) => {
              const nextState = { ...prev.autoFillPopover, ...state };
              
              // Apply smart positioning when opening the popover (visible changing to true)
              if (state.visible === true && !prev.autoFillPopover.visible) {
                // Collect all visible popovers to avoid overlaps
                const allVisiblePopovers: Array<{ x: number; y: number; height: number }> = [];
                
                // Check other popovers
                if (prev.palletEditPopover.visible) {
                  const height = prev.palletEditPopover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 400;
                  allVisiblePopovers.push({ x: prev.palletEditPopover.x, y: prev.palletEditPopover.y, height });
                }
                
                if (prev.addPalletPopover.visible) {
                  allVisiblePopovers.push({ x: prev.addPalletPopover.x, y: prev.addPalletPopover.y, height: 350 });
                }
                
                if (prev.alignPopover.visible) {
                  const height = prev.alignPopover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 450;
                  allVisiblePopovers.push({ x: prev.alignPopover.x, y: prev.alignPopover.y, height });
                }
                
                // Check stackable popovers
                Object.entries(prev.popovers).forEach(([key, popover]) => {
                  if (popover.visible) {
                    allVisiblePopovers.push({ x: popover.x, y: popover.y, height: popover.collapsed ? COLLAPSED_POPOVER_HEIGHT : 400 });
                  }
                });
                
                const AUTO_FILL_POPOVER_HEIGHT = nextState.collapsed ? COLLAPSED_POPOVER_HEIGHT : 500; // Auto fill popover is tall
                const POPOVER_SPACING = 20;
                const currentX = prev.autoFillPopover.x;
                const currentY = prev.autoFillPopover.y;
                
                // Check for overlaps and apply smart positioning
                let hasOverlap = false;
                for (const visiblePopover of allVisiblePopovers) {
                  const overlapX = currentX < visiblePopover.x + POPOVER_WIDTH + POPOVER_SPACING && 
                                  currentX + POPOVER_WIDTH + POPOVER_SPACING > visiblePopover.x;
                  const overlapY = currentY < visiblePopover.y + visiblePopover.height + POPOVER_SPACING && 
                                  currentY + AUTO_FILL_POPOVER_HEIGHT + POPOVER_SPACING > visiblePopover.y;
                  
                  if (overlapX && overlapY) {
                    hasOverlap = true;
                    break;
                  }
                }
                
                if (hasOverlap) {
                  // Find the rightmost popover
                  const rightmostX = allVisiblePopovers.reduce((max, p) => Math.max(max, p.x + POPOVER_WIDTH), 0);
                  
                  // Try to place to the right
                  let newX = rightmostX + POPOVER_SPACING;
                  let newY = currentY;
                  
                  // Check if it fits on screen
                  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
                  if (newX + POPOVER_WIDTH > screenWidth - PADDING) {
                    // No room on right, place below all popovers
                    const bottommostY = allVisiblePopovers.reduce((max, p) => Math.max(max, p.y + p.height), 0);
                    newX = POPOVER_STACK_X;
                    newY = bottommostY + POPOVER_SPACING;
                  }
                  
                  // Validate final position is within screen boundaries
                  const minX = POPOVER_STACK_X;
                  const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                  const minY = PADDING;
                  const maxY = typeof window !== 'undefined' ? window.innerHeight - AUTO_FILL_POPOVER_HEIGHT - PADDING : Infinity;
                  
                  newX = Math.max(minX, Math.min(newX, maxX));
                  newY = Math.max(minY, Math.min(newY, maxY));
                  
                  nextState.x = newX;
                  nextState.y = newY;
                } else {
                  // Position is valid, doesn't overlap, and has been moved - keep it but clamp to boundaries
                  const minX = POPOVER_STACK_X;
                  const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                  const minY = PADDING;
                  const maxY = typeof window !== 'undefined' ? window.innerHeight - AUTO_FILL_POPOVER_HEIGHT - PADDING : Infinity;
                  
                  nextState.x = Math.max(minX, Math.min(prev.autoFillPopover.x, maxX));
                  nextState.y = Math.max(minY, Math.min(prev.autoFillPopover.y, maxY));
                }
              } else if (state.x !== undefined || state.y !== undefined) {
                // When position is being updated, validate boundaries
                const minX = POPOVER_STACK_X;
                const maxX = typeof window !== 'undefined' ? window.innerWidth - POPOVER_WIDTH - PADDING : Infinity;
                const minY = PADDING;
                const maxY = typeof window !== 'undefined' ? window.innerHeight - 100 - PADDING : Infinity;
                
                if (nextState.x !== undefined) {
                  nextState.x = Math.max(minX, Math.min(nextState.x, maxX));
                }
                if (nextState.y !== undefined) {
                  nextState.y = Math.max(minY, Math.min(nextState.y, maxY));
                }
              }
              
              return { autoFillPopover: nextState };
            },
            false,
            'setAutoFillPopover'
          ),

        togglePopover: (popoverId) =>
          set(
            (state) => ({
              popovers: {
                ...state.popovers,
                [popoverId]: {
                  ...state.popovers[popoverId],
                  visible: !state.popovers[popoverId].visible,
                },
              },
            }),
            false,
            'togglePopover'
          ),

        setSelectionArea: (area) =>
          set(
            (state) => ({
              selectionArea: { ...state.selectionArea, ...area },
            }),
            false,
            'setSelectionArea'
          ),

        startSelection: (x, y) =>
          set(
            () => ({
              selectionArea: {
                active: true,
                startX: x,
                startY: y,
                endX: x,
                endY: y,
              },
            }),
            false,
            'startSelection'
          ),

        updateSelection: (x, y) =>
          set(
            (state) => ({
              selectionArea: {
                ...state.selectionArea,
                endX: x,
                endY: y,
              },
            }),
            false,
            'updateSelection'
          ),

        endSelection: () =>
          set(
            (state) => ({
              selectionArea: {
                ...state.selectionArea,
                active: false,
              },
            }),
            false,
            'endSelection'
          ),
      }),
      {
        name: 'truckcheck-ui-storage',
        partialize: (state) => ({
          popovers: state.popovers,
          palletEditPopover: state.palletEditPopover,
          addPalletPopover: state.addPalletPopover,
          autoFillPopover: state.autoFillPopover,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

