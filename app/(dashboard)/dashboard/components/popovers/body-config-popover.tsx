'use client';

import { useEffect, useRef } from 'react';
import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BodyConfigPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  fromBackOfCab: number; // mm
  bodyLength: number; // mm
  bodyWidth: number; // mm
  maxBodyLength: number; // mm
  wallThickness: {
    front: number; // mm
    rear: number; // mm
    sides: number; // mm
  };
  onFromBackOfCabChange: (value: number) => void;
  onBodyLengthChange: (value: number) => void;
  onBodyWidthChange: (value: number) => void;
  onWallThicknessChange: (thickness: { front: number; rear: number; sides: number }) => void;
  onAddPallet: () => void;
  focusField?: 'fromBackOfCab' | 'bodyLength' | 'bodyWidth';
}

export function BodyConfigPopover({
  position,
  onPositionChange,
  onClose,
  collapsed,
  onCollapsedChange,
  fromBackOfCab,
  bodyLength,
  bodyWidth,
  maxBodyLength,
  wallThickness,
  onFromBackOfCabChange,
  onBodyLengthChange,
  onBodyWidthChange,
  onWallThicknessChange,
  onAddPallet,
  focusField,
}: BodyConfigPopoverProps) {
  const fromBackOfCabRef = useRef<HTMLInputElement>(null);
  const bodyLengthRef = useRef<HTMLInputElement>(null);
  const bodyWidthRef = useRef<HTMLInputElement>(null);

  // Focus the specified field when the popover opens
  useEffect(() => {
    if (focusField && !collapsed) {
      const timeout = setTimeout(() => {
        switch (focusField) {
          case 'fromBackOfCab':
            fromBackOfCabRef.current?.focus();
            fromBackOfCabRef.current?.select();
            break;
          case 'bodyLength':
            bodyLengthRef.current?.focus();
            bodyLengthRef.current?.select();
            break;
          case 'bodyWidth':
            bodyWidthRef.current?.focus();
            bodyWidthRef.current?.select();
            break;
        }
      }, 100); // Small delay to ensure popover is fully rendered
      return () => clearTimeout(timeout);
    }
  }, [focusField, collapsed]);

  return (
    <DraggablePopover
      id="body-config"
      title="Body Configuration"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="from-back-of-cab" className="text-sm text-gray-300">
            From Back of Cab (mm)
          </Label>
          <Input
            ref={fromBackOfCabRef}
            id="from-back-of-cab"
            type="number"
            value={fromBackOfCab}
            onChange={(e) => onFromBackOfCabChange(parseInt(e.target.value) || 0)}
            min={0}
            max={500}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">Spacing between cab and body (0-500mm)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body-length" className="text-sm text-gray-300">
            Body Length (mm)
          </Label>
          <Input
            ref={bodyLengthRef}
            id="body-length"
            type="number"
            value={bodyLength}
            onChange={(e) => onBodyLengthChange(parseInt(e.target.value) || 0)}
            min={0}
            max={maxBodyLength}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Max available: {maxBodyLength.toLocaleString()} mm
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body-width" className="text-sm text-gray-300">
            Body Width (mm)
          </Label>
          <Input
            ref={bodyWidthRef}
            id="body-width"
            type="number"
            value={bodyWidth}
            onChange={(e) => onBodyWidthChange(parseInt(e.target.value) || 0)}
            min={0}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">External body width (typically 2400-2600mm)</p>
        </div>

        <div className="pt-4 border-t border-gray-700 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-gray-300 font-semibold">
              Wall Thickness (mm)
            </Label>
            <div className="space-y-2 pl-2">
              <div className="space-y-1">
                <Label htmlFor="wall-front" className="text-xs text-gray-400">
                  Front Wall
                </Label>
                <Input
                  id="wall-front"
                  type="number"
                  value={wallThickness.front}
                  onChange={(e) => onWallThicknessChange({
                    ...wallThickness,
                    front: parseInt(e.target.value) || 0,
                  })}
                  min={0}
                  className="bg-gray-900/50 border-gray-600 text-white h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wall-rear" className="text-xs text-gray-400">
                  Rear Wall
                </Label>
                <Input
                  id="wall-rear"
                  type="number"
                  value={wallThickness.rear}
                  onChange={(e) => onWallThicknessChange({
                    ...wallThickness,
                    rear: parseInt(e.target.value) || 0,
                  })}
                  min={0}
                  className="bg-gray-900/50 border-gray-600 text-white h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wall-sides" className="text-xs text-gray-400">
                  Side Walls (each)
                </Label>
                <Input
                  id="wall-sides"
                  type="number"
                  value={wallThickness.sides}
                  onChange={(e) => onWallThicknessChange({
                    ...wallThickness,
                    sides: parseInt(e.target.value) || 0,
                  })}
                  min={0}
                  className="bg-gray-900/50 border-gray-600 text-white h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Use the "Add Pallet" button in the menu to add pallets with custom sizing
          </p>
        </div>
      </div>
    </DraggablePopover>
  );
}

