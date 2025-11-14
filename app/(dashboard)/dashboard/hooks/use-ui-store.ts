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
  };

  // Add pallet popover
  addPalletPopover: {
    visible: boolean;
    x: number;
    y: number;
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
          x: 300,
          y: 100,
        },
        addPalletPopover: {
          visible: false,
          x: 300,
          y: 150,
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
            (prev) => ({
              palletEditPopover: { ...prev.palletEditPopover, ...state },
            }),
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
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

