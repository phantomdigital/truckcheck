import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Load } from './use-loads-store';

interface LoadsHistoryState {
  history: Load[][];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  pushToHistory: (loads: Load[]) => void;
  undo: () => Load[] | null;
  redo: () => Load[] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useLoadsHistoryStore = create<LoadsHistoryState>()(
  devtools(
    (set, get) => ({
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,

      pushToHistory: (loads) => {
        const { history, historyIndex, maxHistorySize } = get();
        
        // Remove any history after current index (when undoing and then making new changes)
        const newHistory = history.slice(0, historyIndex + 1);
        
        // Add new state
        newHistory.push(JSON.parse(JSON.stringify(loads))); // Deep clone
        
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        } else {
          set({ historyIndex: newHistory.length - 1 });
        }
        
        set({ history: newHistory }, false, 'pushToHistory');
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ historyIndex: newIndex }, false, 'undo');
          return JSON.parse(JSON.stringify(history[newIndex])); // Deep clone
        }
        return null;
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({ historyIndex: newIndex }, false, 'redo');
          return JSON.parse(JSON.stringify(history[newIndex])); // Deep clone
        }
        return null;
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      clearHistory: () =>
        set({ history: [], historyIndex: -1 }, false, 'clearHistory'),
    }),
    { name: 'LoadsHistoryStore' }
  )
);

