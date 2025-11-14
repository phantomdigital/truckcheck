import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Tool } from '../components/dashboard-menu';

interface CanvasState {
  activeTool: Tool;
  canvasZoom: number;
  canvasPosition: { x: number; y: number };

  // Actions
  setActiveTool: (tool: Tool) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  resetView: () => void;
}

const defaultState: Omit<CanvasState, keyof { [K in keyof CanvasState as CanvasState[K] extends (...args: any[]) => any ? never : K]: CanvasState[K] }> = {
  activeTool: 'select',
  canvasZoom: 1.0,
  canvasPosition: { x: 0, y: 0 },
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set) => ({
      ...defaultState,

      setActiveTool: (tool) =>
        set({ activeTool: tool }, false, 'setActiveTool'),

      setCanvasZoom: (zoom) =>
        set({ canvasZoom: zoom }, false, 'setCanvasZoom'),

      setCanvasPosition: (position) =>
        set({ canvasPosition: position }, false, 'setCanvasPosition'),

      resetView: () =>
        set(
          {
            activeTool: 'select',
            canvasZoom: 1.0,
            canvasPosition: { x: 0, y: 0 },
          },
          false,
          'resetView'
        ),
    }),
    { name: 'CanvasStore' }
  )
);

