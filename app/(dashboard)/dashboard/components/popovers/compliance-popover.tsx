'use client';

import { DraggablePopover } from './draggable-popover';
import { cn } from '@/lib/utils';

interface CompliancePopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  frontAxleTotal: number; // kg
  rearAxleTotal: number; // kg
  gvmTotal: number; // kg
  frontAxleLimit: number; // kg
  rearAxleLimit: number; // kg
  gvmLimit: number; // kg
}

export function CompliancePopover({
  position,
  onPositionChange,
  onClose,
  frontAxleTotal,
  rearAxleTotal,
  gvmTotal,
  frontAxleLimit,
  rearAxleLimit,
  gvmLimit,
}: CompliancePopoverProps) {
  // Calculate percentages
  const frontPercentage = (frontAxleTotal / frontAxleLimit) * 100;
  const rearPercentage = (rearAxleTotal / rearAxleLimit) * 100;
  const gvmPercentage = (gvmTotal / gvmLimit) * 100;

  // Color coding (dark mode compatible)
  const getColor = (percentage: number) => {
    if (percentage > 100) return '#ef4444'; // Red - over limit
    if (percentage >= 90) return '#f59e0b'; // Amber - 90-100%
    return '#22c55e'; // Green - < 90%
  };

  const getStatusText = (percentage: number) => {
    if (percentage > 100) return 'OVER LIMIT';
    if (percentage >= 90) return 'WARNING';
    return 'OK';
  };

  const ComplianceBar = ({
    label,
    current,
    limit,
    percentage,
  }: {
    label: string;
    current: number;
    limit: number;
    percentage: number;
  }) => {
    const color = getColor(percentage);
    const statusText = getStatusText(percentage);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">{label}</span>
          <span className={cn('font-semibold', {
            'text-red-400': percentage > 100,
            'text-amber-400': percentage >= 90 && percentage <= 100,
            'text-green-400': percentage < 90,
          })}>
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[80px] text-right">
            {current.toLocaleString()} / {limit.toLocaleString()} kg
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {percentage.toFixed(1)}% of limit
        </p>
      </div>
    );
  };

  return (
    <DraggablePopover
      id="compliance"
      title="Compliance Summary"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
    >
      <div className="space-y-4">
        <ComplianceBar
          label="Front Axle"
          current={frontAxleTotal}
          limit={frontAxleLimit}
          percentage={frontPercentage}
        />

        <ComplianceBar
          label="Rear Axle"
          current={rearAxleTotal}
          limit={rearAxleLimit}
          percentage={rearPercentage}
        />

        <ComplianceBar
          label="GVM"
          current={gvmTotal}
          limit={gvmLimit}
          percentage={gvmPercentage}
        />

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            All values update in real-time as pallets move
          </p>
        </div>
      </div>
    </DraggablePopover>
  );
}

