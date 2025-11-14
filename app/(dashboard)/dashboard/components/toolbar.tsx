'use client';

import { Hand, MousePointer2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DraggablePopover } from './popovers/draggable-popover';

export type Tool = 'select' | 'pan' | 'zoom-in' | 'zoom-out';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onResetView?: () => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const TOOLS: Array<{
  id: Tool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}> = [
  {
    id: 'select',
    label: 'Select',
    icon: MousePointer2,
    shortcut: 'V',
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: Hand,
    shortcut: 'H',
  },
  {
    id: 'zoom-in',
    label: 'Zoom In',
    icon: ZoomIn,
    shortcut: 'Z',
  },
  {
    id: 'zoom-out',
    label: 'Zoom Out',
    icon: ZoomOut,
    shortcut: 'Shift+Z',
  },
  {
    id: 'reset',
    label: 'Reset View',
    icon: RotateCcw,
    shortcut: '0',
  },
];

export function Toolbar({ 
  activeTool, 
  onToolChange, 
  onResetView,
  position = { x: 100, y: 50 },
  onPositionChange,
}: ToolbarProps) {
  return (
    <DraggablePopover
      id="toolbar"
      title="Tools"
      position={position}
      onPositionChange={onPositionChange || (() => {})}
      className="w-auto"
    >
      <div className="flex flex-col gap-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start gap-2 h-9 px-3',
                'hover:bg-gray-700 text-gray-300',
                isActive && 'bg-gray-700 text-white',
                tool.id === 'reset' && 'mt-2 border-t border-gray-700 pt-2'
              )}
              onClick={() => {
                if (tool.id === 'reset') {
                  onResetView?.();
                } else {
                  onToolChange(tool.id as Tool);
                }
              }}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{tool.label}</span>
              {tool.shortcut && (
                <span className="ml-auto text-xs text-gray-400">{tool.shortcut}</span>
              )}
            </Button>
          );
        })}
      </div>
    </DraggablePopover>
  );
}

