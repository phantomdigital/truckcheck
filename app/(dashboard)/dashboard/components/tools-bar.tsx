'use client';

import { Hand, MousePointer2, ZoomIn, ZoomOut, RotateCcw, AlignHorizontalSpaceBetween } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tool } from './dashboard-menu';

interface ToolsBarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onResetView?: () => void;
  selectedPalletCount?: number;
  onOpenAlign?: () => void;
}

const TOOLS: Array<{
  id: Tool | 'reset';
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
    label: 'Reset',
    icon: RotateCcw,
    shortcut: '0',
  },
];

export function ToolsBar({
  activeTool,
  onToolChange,
  onResetView,
  selectedPalletCount = 0,
  onOpenAlign,
}: ToolsBarProps) {
  const canAlign = selectedPalletCount >= 1;

  return (
    <div className="fixed left-20 top-0 h-full w-20 bg-gray-900 border-r border-gray-800 z-50 shrink-0">
      <div className="flex flex-col items-center py-4 gap-1 h-full">
        {/* Tools Title */}
        <div className="mb-2 px-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tools</span>
        </div>

        {/* Tools */}
        <div className="flex flex-col gap-1 w-full px-2 flex-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.id !== 'reset' && activeTool === tool.id;
            
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                className={cn(
                  'w-full h-12 flex flex-col items-center justify-center gap-1 relative',
                  'hover:bg-gray-800 hover:text-white transition-colors',
                  isActive && 'bg-gray-800 text-white',
                  tool.id === 'reset' && 'mt-auto'
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
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium text-gray-300">{tool.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Align Button - Opens alignment popover */}
        {canAlign && (
          <div className="w-full px-2 border-t border-gray-700 pt-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'w-full h-12 flex flex-col items-center justify-center gap-1',
                'hover:bg-gray-800 hover:text-white transition-colors'
              )}
              onClick={onOpenAlign}
              title="Align & Distribute"
            >
              <AlignHorizontalSpaceBetween className="h-5 w-5" />
              <span className="text-[10px] font-medium text-gray-300">Align</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

