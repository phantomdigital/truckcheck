import { useEffect, useRef } from 'react';
import { useLoadsStore, type Load } from './use-loads-store';
import { useLoadsHistoryStore } from './use-loads-history';

/**
 * Combined hook that integrates loads store with undo/redo history
 * This provides a clean API for components to use loads with history management
 */
export function useLoadsWithHistory() {
  const loads = useLoadsStore((state) => state.loads);
  const selectedPalletIds = useLoadsStore((state) => state.selectedPalletIds);
  const setLoads = useLoadsStore((state) => state.setLoads);
  const addLoad = useLoadsStore((state) => state.addLoad);
  const updateLoadPosition = useLoadsStore((state) => state.updateLoadPosition);
  const updateLoadPositions = useLoadsStore((state) => state.updateLoadPositions);
  const updateLoadWeight = useLoadsStore((state) => state.updateLoadWeight);
  const deleteLoad = useLoadsStore((state) => state.deleteLoad);
  const deleteLoads = useLoadsStore((state) => state.deleteLoads);
  const duplicateLoad = useLoadsStore((state) => state.duplicateLoad);
  const duplicateLoads = useLoadsStore((state) => state.duplicateLoads);
  const selectPallet = useLoadsStore((state) => state.selectPallet);
  const selectPallets = useLoadsStore((state) => state.selectPallets);
  const selectAllPallets = useLoadsStore((state) => state.selectAllPallets);
  const clearSelection = useLoadsStore((state) => state.clearSelection);
  const copySelectedPallets = useLoadsStore((state) => state.copySelectedPallets);
  const pastePallets = useLoadsStore((state) => state.pastePallets);
  const clearLoads = useLoadsStore((state) => state.clearLoads);
  const getSelectedPallets = useLoadsStore((state) => state.getSelectedPallets);
  const hasSelection = useLoadsStore((state) => state.hasSelection);

  const pushToHistory = useLoadsHistoryStore((state) => state.pushToHistory);
  const undoHistory = useLoadsHistoryStore((state) => state.undo);
  const redoHistory = useLoadsHistoryStore((state) => state.redo);
  const canUndo = useLoadsHistoryStore((state) => state.canUndo());
  const canRedo = useLoadsHistoryStore((state) => state.canRedo());

  // Track if we're applying history to prevent infinite loops
  const isApplyingHistoryRef = useRef(false);
  const lastLoadsRef = useRef<Load[]>([]);

  // Initialize history with current loads if empty
  useEffect(() => {
    const history = useLoadsHistoryStore.getState().history;
    if (history.length === 0 && loads.length > 0) {
      pushToHistory(loads);
      lastLoadsRef.current = loads;
    }
  }, []); // Only run once on mount

  // Push to history when loads change (but not when applying history)
  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }

    // Only push if loads actually changed
    if (JSON.stringify(loads) !== JSON.stringify(lastLoadsRef.current)) {
      pushToHistory(loads);
      lastLoadsRef.current = loads;
    }
  }, [loads, pushToHistory]);

  // Wrapped actions that integrate with history
  const setLoadsWithHistory = (newLoads: Load[]) => {
    isApplyingHistoryRef.current = true;
    setLoads(newLoads);
  };

  const undo = () => {
    const previousLoads = undoHistory();
    if (previousLoads) {
      isApplyingHistoryRef.current = true;
      setLoads(previousLoads);
      lastLoadsRef.current = previousLoads;
    }
  };

  const redo = () => {
    const nextLoads = redoHistory();
    if (nextLoads) {
      isApplyingHistoryRef.current = true;
      setLoads(nextLoads);
      lastLoadsRef.current = nextLoads;
    }
  };

  return {
    loads,
    selectedPalletIds,
    setLoads: setLoadsWithHistory,
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
    clearLoads,
    getSelectedPallets,
    hasSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

