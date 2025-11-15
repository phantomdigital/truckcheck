import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Load = {
  id: string;
  x: number; // mm from front of truck
  y: number; // mm from centerline
  length: number; // mm
  width: number; // mm
  weight: number; // kg
  name?: string; // Optional pallet name/identifier
};

interface LoadsState {
  loads: Load[];
  selectedPalletIds: string[]; // Changed from single to multiple selection
  copiedPallets: Load[]; // For copy/paste functionality
  
  // Actions
  setLoads: (loads: Load[]) => void;
  addLoad: (load: Load) => void;
  updateLoadPosition: (id: string, x: number, y: number) => void;
  updateLoadPositions: (updates: { id: string; x: number; y: number }[]) => void; // Batch update for multi-drag
  updateLoadWeight: (id: string, weight: number) => void;
  updateLoadDimensions: (id: string, length: number, width: number) => void;
  updateLoadName: (id: string, name: string) => void;
  updateLoad: (id: string, updates: Partial<Pick<Load, 'length' | 'width' | 'weight' | 'name' | 'x' | 'y'>>) => void; // General update function
  updateLoads: (updates: Array<{ id: string } & Partial<Pick<Load, 'length' | 'width' | 'weight' | 'name' | 'x' | 'y'>>>) => void; // Batch update
  deleteLoad: (id: string) => void;
  deleteLoads: (ids: string[]) => void; // Batch delete
  duplicateLoad: (id: string) => void;
  duplicateLoads: (ids: string[]) => void; // Batch duplicate
  selectPallet: (id: string | null, mode?: 'single' | 'toggle' | 'range') => void;
  selectPallets: (ids: string[]) => void; // Select multiple pallets directly
  selectAllPallets: () => void;
  clearSelection: () => void;
  copySelectedPallets: () => void;
  pastePallets: (offsetX?: number, offsetY?: number, bounds?: { minX: number; maxX: number; minY: number; maxY: number }) => void;
  clearLoads: () => void;
  
  // Computed getters
  getSelectedPallets: () => Load[];
  hasSelection: () => boolean;
}

export const useLoadsStore = create<LoadsState>()(
  devtools(
    persist(
      (set, get) => ({
        loads: [],
        selectedPalletIds: [],
        copiedPallets: [],

        setLoads: (loads) => set({ loads }, false, 'setLoads'),

        addLoad: (load) =>
          set(
            (state) => ({
              loads: [...state.loads, load],
              selectedPalletIds: [load.id], // Select the newly added pallet
            }),
            false,
            'addLoad'
          ),

        updateLoadPosition: (id, x, y) =>
          set(
            (state) => ({
              loads: state.loads.map((load) =>
                load.id === id ? { ...load, x, y } : load
              ),
            }),
            false,
            'updateLoadPosition'
          ),

        updateLoadPositions: (updates) =>
          set(
            (state) => ({
              loads: state.loads.map((load) => {
                const update = updates.find(u => u.id === load.id);
                return update ? { ...load, x: update.x, y: update.y } : load;
              }),
            }),
            false,
            'updateLoadPositions'
          ),

        updateLoadWeight: (id, weight) =>
          set(
            (state) => ({
              loads: state.loads.map((load) =>
                load.id === id ? { ...load, weight } : load
              ),
            }),
            false,
            'updateLoadWeight'
          ),

        updateLoadDimensions: (id, length, width) =>
          set(
            (state) => ({
              loads: state.loads.map((load) =>
                load.id === id ? { ...load, length, width } : load
              ),
            }),
            false,
            'updateLoadDimensions'
          ),

        updateLoadName: (id, name) =>
          set(
            (state) => ({
              loads: state.loads.map((load) =>
                load.id === id ? { ...load, name: name || undefined } : load
              ),
            }),
            false,
            'updateLoadName'
          ),

        updateLoad: (id, updates) =>
          set(
            (state) => ({
              loads: state.loads.map((load) =>
                load.id === id ? { ...load, ...updates } : load
              ),
            }),
            false,
            'updateLoad'
          ),

        updateLoads: (updates) =>
          set(
            (state) => ({
              loads: state.loads.map((load) => {
                const update = updates.find(u => u.id === load.id);
                return update ? { ...load, ...update } : load;
              }),
            }),
            false,
            'updateLoads'
          ),

        deleteLoad: (id) =>
          set(
            (state) => ({
              loads: state.loads.filter((load) => load.id !== id),
              selectedPalletIds: state.selectedPalletIds.filter(selectedId => selectedId !== id),
            }),
            false,
            'deleteLoad'
          ),

        deleteLoads: (ids) =>
          set(
            (state) => ({
              loads: state.loads.filter((load) => !ids.includes(load.id)),
              selectedPalletIds: state.selectedPalletIds.filter(selectedId => !ids.includes(selectedId)),
            }),
            false,
            'deleteLoads'
          ),

        duplicateLoad: (id) =>
          set(
            (state) => {
              const load = state.loads.find((l) => l.id === id);
              if (!load) return state;

              const duplicatedLoad: Load = {
                ...load,
                id: `pallet-${Date.now()}-${Math.random()}`,
                x: load.x + 50, // Offset slightly to the right
                y: load.y + 50, // Offset slightly down
              };

              return {
                loads: [...state.loads, duplicatedLoad],
                selectedPalletIds: [duplicatedLoad.id],
              };
            },
            false,
            'duplicateLoad'
          ),

        duplicateLoads: (ids) =>
          set(
            (state) => {
              const loadsToDuplicate = state.loads.filter(load => ids.includes(load.id));
              if (loadsToDuplicate.length === 0) return state;

              const duplicatedLoads = loadsToDuplicate.map(load => ({
                ...load,
                id: `pallet-${Date.now()}-${Math.random()}-${load.id}`,
                x: load.x + 50,
                y: load.y + 50,
              }));

              return {
                loads: [...state.loads, ...duplicatedLoads],
                selectedPalletIds: duplicatedLoads.map(load => load.id),
              };
            },
            false,
            'duplicateLoads'
          ),

        selectPallet: (id, mode = 'single') =>
          set(
            (state) => {
              if (!id) return { selectedPalletIds: [] };

              switch (mode) {
                case 'single':
                  return { selectedPalletIds: [id] };
                case 'toggle':
                  return {
                    selectedPalletIds: state.selectedPalletIds.includes(id)
                      ? state.selectedPalletIds.filter(selectedId => selectedId !== id)
                      : [...state.selectedPalletIds, id]
                  };
                case 'range':
                  // For range selection, we'd need to implement based on pallet positions
                  // For now, just add to selection
                  return {
                    selectedPalletIds: state.selectedPalletIds.includes(id)
                      ? state.selectedPalletIds
                      : [...state.selectedPalletIds, id]
                  };
                default:
                  return { selectedPalletIds: [id] };
              }
            },
            false,
            'selectPallet'
          ),

        selectPallets: (ids) =>
          set(
            () => ({ selectedPalletIds: ids }),
            false,
            'selectPallets'
          ),

        selectAllPallets: () =>
          set(
            (state) => ({ selectedPalletIds: state.loads.map(load => load.id) }),
            false,
            'selectAllPallets'
          ),

        clearSelection: () =>
          set({ selectedPalletIds: [] }, false, 'clearSelection'),

        copySelectedPallets: () =>
          set(
            (state) => {
              const selectedLoads = state.loads.filter(load => 
                state.selectedPalletIds.includes(load.id)
              );
              return { copiedPallets: selectedLoads };
            },
            false,
            'copySelectedPallets'
          ),

        pastePallets: (offsetX = 100, offsetY = 100, bounds) =>
          set(
            (state) => {
              if (state.copiedPallets.length === 0) return state;

              const pastedLoads = state.copiedPallets.map(load => {
                let newX = load.x + offsetX;
                let newY = load.y + offsetY;

                // Constrain to bounds if provided
                if (bounds) {
                  newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - load.length));
                  newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - load.width));
                }

                return {
                  ...load,
                  id: `pallet-${Date.now()}-${Math.random()}-${load.id}`,
                  x: newX,
                  y: newY,
                };
              });

              return {
                loads: [...state.loads, ...pastedLoads],
                selectedPalletIds: pastedLoads.map(load => load.id),
              };
            },
            false,
            'pastePallets'
          ),

        clearLoads: () =>
          set({ loads: [], selectedPalletIds: [], copiedPallets: [] }, false, 'clearLoads'),

        // Computed getters
        getSelectedPallets: () => {
          const state = get();
          return state.loads.filter(load => state.selectedPalletIds.includes(load.id));
        },

        hasSelection: () => {
          const state = get();
          return state.selectedPalletIds.length > 0;
        },
      }),
      {
        name: 'truckcheck-loads-storage',
        partialize: (state) => ({ loads: state.loads }), // Only persist loads, not selection or copied pallets
      }
    ),
    { name: 'LoadsStore' }
  )
);

