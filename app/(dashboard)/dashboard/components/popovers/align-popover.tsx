'use client';

import { DraggablePopover } from './draggable-popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AlignHorizontalJustifyStart, 
  AlignHorizontalJustifyCenter, 
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  MoveHorizontal,
  MoveVertical
} from 'lucide-react';

interface AlignPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  selectedPalletCount: number;
  // Distribute
  onDistributeHorizontal?: () => void;
  onDistributeVertical?: () => void;
  // Pack
  onPackHorizontal?: () => void;
  onPackVertical?: () => void;
  // Align to Body
  onAlignToLeft?: () => void;
  onAlignToRight?: () => void;
  onAlignToCenterX?: () => void;
  onAlignToTop?: () => void;
  onAlignToBottom?: () => void;
  onAlignToCenterY?: () => void;
}

export function AlignPopover({
  position,
  onPositionChange,
  onClose,
  collapsed,
  onCollapsedChange,
  selectedPalletCount,
  onDistributeHorizontal,
  onDistributeVertical,
  onPackHorizontal,
  onPackVertical,
  onAlignToLeft,
  onAlignToRight,
  onAlignToCenterX,
  onAlignToTop,
  onAlignToBottom,
  onAlignToCenterY,
}: AlignPopoverProps) {
  const canDistribute = selectedPalletCount >= 2;
  const canAlign = selectedPalletCount >= 1;

  return (
    <DraggablePopover
      id="align"
      title="Align & Distribute"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className="space-y-4 min-w-[280px]">
        
        {/* Align to Body Section */}
        {canAlign && (
          <div>
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Align to Body</span>
            </div>
            <div className="space-y-2">
              {/* Horizontal alignment to body */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToLeft}
                  disabled={!canAlign}
                  title="Align to Left Edge"
                >
                  <AlignHorizontalJustifyStart className="h-4 w-4" />
                  <span className="text-[9px]">Left</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToCenterX}
                  disabled={!canAlign}
                  title="Align to Center (X)"
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                  <span className="text-[9px]">Center</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToRight}
                  disabled={!canAlign}
                  title="Align to Right Edge"
                >
                  <AlignHorizontalJustifyEnd className="h-4 w-4" />
                  <span className="text-[9px]">Right</span>
                </Button>
              </div>
              {/* Vertical alignment to body */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToTop}
                  disabled={!canAlign}
                  title="Align to Top Edge"
                >
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                  <span className="text-[9px]">Top</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToCenterY}
                  disabled={!canAlign}
                  title="Align to Center (Y)"
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                  <span className="text-[9px]">Middle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex-1 h-9 flex flex-col items-center justify-center gap-1',
                    'hover:bg-gray-700 text-gray-300'
                  )}
                  onClick={onAlignToBottom}
                  disabled={!canAlign}
                  title="Align to Bottom Edge"
                >
                  <AlignVerticalJustifyEnd className="h-4 w-4" />
                  <span className="text-[9px]">Bottom</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Distribute Section */}
        {canDistribute && (
          <div className="pt-3 border-t border-gray-700">
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Distribute</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1 h-10 flex flex-col items-center justify-center gap-1',
                  'hover:bg-gray-700 text-gray-300'
                )}
                onClick={onDistributeHorizontal}
                disabled={!canDistribute}
                title="Distribute Horizontally with spacing (X)"
              >
                <MoveHorizontal className="h-4 w-4" />
                <span className="text-[9px]">Horizontal</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1 h-10 flex flex-col items-center justify-center gap-1',
                  'hover:bg-gray-700 text-gray-300'
                )}
                onClick={onDistributeVertical}
                disabled={!canDistribute}
                title="Distribute Vertically with spacing (Y)"
              >
                <MoveVertical className="h-4 w-4" />
                <span className="text-[9px]">Vertical</span>
              </Button>
            </div>
          </div>
        )}

        {/* Pack Section */}
        {canDistribute && (
          <div className="pt-3 border-t border-gray-700">
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Pack (No Gaps)</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1 h-10 flex flex-col items-center justify-center gap-1',
                  'hover:bg-gray-700 text-gray-300'
                )}
                onClick={onPackHorizontal}
                disabled={!canDistribute}
                title="Pack Horizontally - no gaps (X)"
              >
                <MoveHorizontal className="h-4 w-4" />
                <span className="text-[9px]">Horizontal</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1 h-10 flex flex-col items-center justify-center gap-1',
                  'hover:bg-gray-700 text-gray-300'
                )}
                onClick={onPackVertical}
                disabled={!canDistribute}
                title="Pack Vertically - no gaps (Y)"
              >
                <MoveVertical className="h-4 w-4" />
                <span className="text-[9px]">Vertical</span>
              </Button>
            </div>
          </div>
        )}

        {!canAlign && (
          <div className="text-center text-sm text-gray-400 py-4">
            Select pallets to use alignment options
          </div>
        )}
      </div>
    </DraggablePopover>
  );
}

