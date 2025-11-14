'use client';

import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeighBridgePopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  frontAxle: number;
  rearAxle: number;
  onFrontAxleChange: (value: number) => void;
  onRearAxleChange: (value: number) => void;
  referenceFront?: number; // Reference weight from manufacturer
  referenceRear?: number; // Reference weight from manufacturer
}

export function WeighBridgePopover({
  position,
  onPositionChange,
  onClose,
  collapsed,
  onCollapsedChange,
  frontAxle,
  rearAxle,
  onFrontAxleChange,
  onRearAxleChange,
  referenceFront,
  referenceRear,
}: WeighBridgePopoverProps) {
  return (
    <DraggablePopover
      id="weigh-bridge"
      title="Weigh Bridge Readings"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="front-axle" className="text-sm text-gray-300">
            Front Axle Weight (kg)
          </Label>
          <Input
            id="front-axle"
            type="number"
            value={frontAxle || ''}
            onChange={(e) => onFrontAxleChange(parseFloat(e.target.value) || 0)}
            placeholder={referenceFront ? `${referenceFront} (reference)` : '0'}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
          {referenceFront && (
            <p className="text-xs text-gray-400">
              Reference: {referenceFront} kg
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rear-axle" className="text-sm text-gray-300">
            Rear Axle Weight (kg)
          </Label>
          <Input
            id="rear-axle"
            type="number"
            value={rearAxle || ''}
            onChange={(e) => onRearAxleChange(parseFloat(e.target.value) || 0)}
            placeholder={referenceRear ? `${referenceRear} (reference)` : '0'}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
          {referenceRear && (
            <p className="text-xs text-gray-400">
              Reference: {referenceRear} kg
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Total Tare: {(frontAxle + rearAxle).toLocaleString()} kg
          </p>
        </div>
      </div>
    </DraggablePopover>
  );
}

