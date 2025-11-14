import { useState, useCallback, useRef, useEffect } from 'react';

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistorySize = 50, debounceMs = 0 } = options;
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<T[]>(history);
  const historyIndexRef = useRef(historyIndex);

  // Keep refs in sync
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addToHistory = useCallback(
    (newState: T) => {
      if (debounceMs > 0) {
        // Debounce rapid changes
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          setHistory((prev) => {
            // Remove any "future" history if we're not at the end
            const newHistory = prev.slice(0, historyIndexRef.current + 1);
            // Add new state
            const updated = [...newHistory, newState];
            // Limit history size
            const finalHistory = updated.length > maxHistorySize 
              ? updated.slice(-maxHistorySize) 
              : updated;
            historyRef.current = finalHistory;
            return finalHistory;
          });
          setHistoryIndex((prev) => {
            const newIndex = prev + 1;
            // Adjust if we hit max size
            const finalIndex = Math.min(newIndex, maxHistorySize - 1);
            historyIndexRef.current = finalIndex;
            return finalIndex;
          });
        }, debounceMs);
      } else {
        // Immediate update
        setHistory((prev) => {
          // Remove any "future" history if we're not at the end
          const newHistory = prev.slice(0, historyIndexRef.current + 1);
          // Add new state
          const updated = [...newHistory, newState];
          // Limit history size
          const finalHistory = updated.length > maxHistorySize 
            ? updated.slice(-maxHistorySize) 
            : updated;
          historyRef.current = finalHistory;
          return finalHistory;
        });
        setHistoryIndex((prev) => {
          const newIndex = prev + 1;
          // Adjust if we hit max size
          const finalIndex = Math.min(newIndex, maxHistorySize - 1);
          historyIndexRef.current = finalIndex;
          return finalIndex;
        });
      }
      setState(newState);
    },
    [historyIndex, maxHistorySize, debounceMs]
  );

  const undo = useCallback(() => {
    setHistoryIndex((prev) => {
      if (prev <= 0) return prev;
      const newIndex = prev - 1;
      // Use ref to get latest history
      const currentHistory = historyRef.current;
      setState(currentHistory[newIndex]);
      historyIndexRef.current = newIndex;
      return newIndex;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => {
      // Use ref to get latest history
      const currentHistory = historyRef.current;
      if (prev >= currentHistory.length - 1) return prev;
      const newIndex = prev + 1;
      setState(currentHistory[newIndex]);
      historyIndexRef.current = newIndex;
      return newIndex;
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState(newState);
    const newHistory = [newState];
    setHistory(newHistory);
    setHistoryIndex(0);
    historyRef.current = newHistory;
    historyIndexRef.current = 0;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  return {
    state,
    setState: addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}

