'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FixedCompliancePopoverProps {
  truckModel: string; // e.g., "Isuzu FVR 170-300 AT R47"
  frontAxleTotal: number; // kg
  rearAxleTotal: number; // kg
  gvmTotal: number; // kg
  frontAxleLimit: number; // kg
  rearAxleLimit: number; // kg
  gvmLimit: number; // kg
  // Weigh bridge props
  frontAxle: number;
  rearAxle: number;
  onFrontAxleChange: (value: number) => void;
  onRearAxleChange: (value: number) => void;
  referenceFront?: number;
  referenceRear?: number;
}

export function FixedCompliancePopover({
  truckModel,
  frontAxleTotal,
  rearAxleTotal,
  gvmTotal,
  frontAxleLimit,
  rearAxleLimit,
  gvmLimit,
  frontAxle,
  rearAxle,
  onFrontAxleChange,
  onRearAxleChange,
  referenceFront,
  referenceRear,
}: FixedCompliancePopoverProps) {
  const [weighBridgeExpanded, setWeighBridgeExpanded] = useState(false);
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
    if (percentage > 100) return 'OVER';
    if (percentage >= 90) return 'WARN';
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
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">{label}</span>
          <span className={cn('font-bold text-xs', {
            'text-red-400': percentage > 100,
            'text-amber-400': percentage >= 90 && percentage <= 100,
            'text-green-400': percentage < 90,
          })}>
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[70px] text-right font-mono">
            {current.toFixed(1)}/{limit.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg border border-gray-700 shadow-xl bg-gray-800/95 backdrop-blur-sm min-w-[280px] max-w-[320px]">
      {/* Title bar - not draggable */}
      <div className="px-4 py-2 bg-gray-700/50 rounded-t-lg border-b border-gray-600">
        <h3 className="text-sm font-semibold text-gray-200">Compliance</h3>
        <p className="text-xs text-gray-400 mt-0.5">{truckModel}</p>
      </div>

      {/* Content */}
      <div className="p-4 text-gray-200 space-y-3">
        <ComplianceBar
          label="Front"
          current={frontAxleTotal}
          limit={frontAxleLimit}
          percentage={frontPercentage}
        />

        <ComplianceBar
          label="Rear"
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

        {/* Weigh Bridge Section */}
        <div className="pt-3 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-700 p-2"
            onClick={() => setWeighBridgeExpanded(!weighBridgeExpanded)}
          >
            <span className="text-sm font-medium">Weigh Bridge Readings</span>
            {weighBridgeExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {weighBridgeExpanded && (
            <div className="mt-3 space-y-4">
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
          )}
        </div>
      </div>
    </div>
  );
}

