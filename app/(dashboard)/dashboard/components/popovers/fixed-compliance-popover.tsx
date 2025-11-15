'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GMLConfig, VehicleClassification } from '@/lib/load-calculator/truck-config';

type LimitType = 'manufacturer' | 'gml';

interface FixedCompliancePopoverProps {
  truckModel: string; // e.g., "Isuzu FVR 170-300 AT R47"
  frontAxleTotal: number; // kg
  rearAxleTotal: number; // kg
  gvmTotal: number; // kg
  frontAxleLimit: number; // kg - effective limit (manufacturer vs GML)
  rearAxleLimit: number; // kg - effective limit (manufacturer vs GML)
  gvmLimit: number; // kg - effective limit (manufacturer vs GML)
  // Manufacturer limits for comparison
  manufacturerFrontAxleLimit?: number; // kg
  manufacturerRearAxleLimit?: number; // kg
  manufacturerGvm?: number; // kg
  // GML information
  gmlConfig?: GMLConfig;
  vehicleClassification?: VehicleClassification;
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
  manufacturerFrontAxleLimit,
  manufacturerRearAxleLimit,
  manufacturerGvm,
  gmlConfig,
  vehicleClassification,
  frontAxle,
  rearAxle,
  onFrontAxleChange,
  onRearAxleChange,
  referenceFront,
  referenceRear,
}: FixedCompliancePopoverProps) {
  const [weighBridgeExpanded, setWeighBridgeExpanded] = useState(false);
  const [showRegulatoryInfo, setShowRegulatoryInfo] = useState(false);
  const [limitType, setLimitType] = useState<LimitType>('manufacturer');
  
  const hasGML = gmlConfig !== undefined;
  const emissionsStandard = vehicleClassification?.emissionsStandard || 'none';
  const isADR8004 = emissionsStandard === 'euro6' && gmlConfig;
  const hasMassTransfer = gmlConfig?.massTransferApplied && gmlConfig.massTransferApplied > 0;
  
  // Determine which limits to use based on selection
  const activeLimits = useMemo(() => {
    if (limitType === 'manufacturer') {
      return {
        front: manufacturerFrontAxleLimit || frontAxleLimit,
        rear: manufacturerRearAxleLimit || rearAxleLimit,
        gvm: manufacturerGvm || gvmLimit,
      };
    } else {
      // GML mode
      if (!gmlConfig) {
        // Fallback to manufacturer if GML not available
        return {
          front: manufacturerFrontAxleLimit || frontAxleLimit,
          rear: manufacturerRearAxleLimit || rearAxleLimit,
          gvm: manufacturerGvm || gvmLimit,
        };
      }
      const gmlFront = gmlConfig.effectiveFrontAxleLimit || gmlConfig.frontAxleLimit;
      const gmlRear = gmlConfig.effectiveRearAxleLimit || gmlConfig.rearAxleLimit;
      // GML GVM is already calculated as minimum of Table 1, sum of axles, and axle spacing
      // So we use the GML GVM directly (it's already the correct value)
      return {
        front: gmlFront,
        rear: gmlRear,
        gvm: gmlConfig.gvm, // Use the calculated GML GVM (already accounts for sum of axles constraint)
      };
    }
  }, [limitType, manufacturerFrontAxleLimit, manufacturerRearAxleLimit, manufacturerGvm, frontAxleLimit, rearAxleLimit, gvmLimit, gmlConfig]);
  
  // Calculate percentages based on selected limit type
  const frontPercentage = useMemo(() => (frontAxleTotal / activeLimits.front) * 100, [frontAxleTotal, activeLimits.front]);
  const rearPercentage = useMemo(() => (rearAxleTotal / activeLimits.rear) * 100, [rearAxleTotal, activeLimits.rear]);
  const gvmPercentage = useMemo(() => (gvmTotal / activeLimits.gvm) * 100, [gvmTotal, activeLimits.gvm]);
  
  // Determine which limits are being applied (manufacturer vs GML)
  const isGMLRestrictive = {
    front: manufacturerFrontAxleLimit && activeLimits.front < manufacturerFrontAxleLimit,
    rear: manufacturerRearAxleLimit && activeLimits.rear < manufacturerRearAxleLimit,
    gvm: manufacturerGvm && activeLimits.gvm < manufacturerGvm,
  };
  
  const isManufacturerRestrictive = {
    front: gmlConfig && activeLimits.front < gmlConfig.frontAxleLimit,
    rear: gmlConfig && activeLimits.rear < gmlConfig.rearAxleLimit,
    gvm: gmlConfig && activeLimits.gvm < gmlConfig.gvm,
  };

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
    limitType,
    manufacturerLimit,
    gmlLimit,
  }: {
    label: string;
    current: number;
    limit: number;
    percentage: number;
    limitType: LimitType;
    manufacturerLimit?: number;
    gmlLimit?: number;
  }) => {
    const color = getColor(percentage);
    const statusText = getStatusText(percentage);

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-mono font-semibold', {
              'text-red-400': percentage > 100,
              'text-amber-400': percentage >= 90 && percentage <= 100,
              'text-green-400': percentage < 90,
            })}>
              {percentage.toFixed(1)}%
            </span>
            <span className={cn('font-bold text-xs min-w-[35px] text-right', {
              'text-red-400': percentage > 100,
              'text-amber-400': percentage >= 90 && percentage <= 100,
              'text-green-400': percentage < 90,
            })}>
              {statusText}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3.5 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[75px] text-right font-mono">
            {current.toFixed(0)}/{limit.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg border border-gray-700 shadow-xl bg-gray-800/95 backdrop-blur-sm min-w-[280px] max-w-[320px]">
      {/* Title bar - not draggable */}
      <div className="px-4 py-2 bg-gray-700/50 rounded-t-lg border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Compliance</h3>
            <p className="text-xs text-gray-400 mt-0.5">{truckModel}</p>
          </div>
          {hasGML && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
              onClick={() => setShowRegulatoryInfo(!showRegulatoryInfo)}
              title="Regulatory information"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isADR8004 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded border border-blue-700/50">
              ADR 80/04 (Euro VI)
            </span>
            {hasMassTransfer && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded border border-purple-700/50">
                Mass Transfer: {(gmlConfig?.massTransferApplied || 0) / 1000}t
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 text-gray-200 space-y-3.5">
        {/* Limit Type Selector */}
        {hasGML && (
          <div className="space-y-1.5">
            <Tabs value={limitType} onValueChange={(value) => setLimitType(value as LimitType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 h-8">
                <TabsTrigger 
                  value="manufacturer" 
                  className="text-xs data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                >
                  MFG
                </TabsTrigger>
                <TabsTrigger 
                  value="gml" 
                  className="text-xs data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                >
                  GML
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {limitType === 'manufacturer' && (
              <p className="text-xs text-gray-500 leading-tight">
                Manufacturer specifications
              </p>
            )}
            {limitType === 'gml' && (
              <p className="text-xs text-gray-500 leading-tight">
                NHVR General Mass Limits (GML) - regulatory limits for road use
              </p>
            )}
          </div>
        )}
        
        {/* Compliance Bars */}
        <div className="space-y-2.5">
          <ComplianceBar
            label="Front"
            current={frontAxleTotal}
            limit={activeLimits.front}
            percentage={frontPercentage}
            limitType={limitType}
            manufacturerLimit={manufacturerFrontAxleLimit}
            gmlLimit={gmlConfig?.effectiveFrontAxleLimit || gmlConfig?.frontAxleLimit}
          />

          <ComplianceBar
            label="Rear"
            current={rearAxleTotal}
            limit={activeLimits.rear}
            percentage={rearPercentage}
            limitType={limitType}
            manufacturerLimit={manufacturerRearAxleLimit}
            gmlLimit={gmlConfig?.effectiveRearAxleLimit || gmlConfig?.rearAxleLimit}
          />

          <ComplianceBar
            label="GVM"
            current={gvmTotal}
            limit={activeLimits.gvm}
            percentage={gvmPercentage}
            limitType={limitType}
            manufacturerLimit={manufacturerGvm}
            gmlLimit={gmlConfig?.gvm}
          />
        </div>
        
        {/* Regulatory Information */}
        {showRegulatoryInfo && (
          <div className="pt-2.5 border-t border-gray-700 space-y-1.5">
            {limitType === 'manufacturer' ? (
              <>
                <p className="text-xs font-semibold text-gray-300">Manufacturer Specifications</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Front Axle:</span>
                    <span className="font-mono">
                      {(manufacturerFrontAxleLimit || frontAxleLimit).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rear Axle:</span>
                    <span className="font-mono">
                      {(manufacturerRearAxleLimit || rearAxleLimit).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GVM:</span>
                    <span className="font-mono">
                      {(manufacturerGvm || gvmLimit).toLocaleString()} kg
                    </span>
                  </div>
                </div>
              </>
            ) : hasGML ? (
              <>
                <p className="text-xs font-semibold text-gray-300">Regulatory Limits (GML)</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Front Axle:</span>
                    <span className="font-mono text-right">
                      {gmlConfig.frontAxleLimit.toLocaleString()} kg
                      {gmlConfig.effectiveFrontAxleLimit && gmlConfig.effectiveFrontAxleLimit !== gmlConfig.frontAxleLimit && (
                        <span className="text-purple-400 ml-1.5">
                          ({gmlConfig.effectiveFrontAxleLimit.toLocaleString()} kg after transfer)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rear Axle:</span>
                    <span className="font-mono text-right">
                      {gmlConfig.rearAxleLimit.toLocaleString()} kg
                      {gmlConfig.effectiveRearAxleLimit && gmlConfig.effectiveRearAxleLimit !== gmlConfig.rearAxleLimit && (
                        <span className="text-purple-400 ml-1.5">
                          ({gmlConfig.effectiveRearAxleLimit.toLocaleString()} kg after transfer)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GVM (final):</span>
                    <span className="font-mono font-semibold text-gray-300">
                      {gmlConfig.gvm.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-xs">
                    <span>Sum of axles:</span>
                    <span className="font-mono">
                      {((gmlConfig.effectiveFrontAxleLimit || gmlConfig.frontAxleLimit) + (gmlConfig.effectiveRearAxleLimit || gmlConfig.rearAxleLimit)).toLocaleString()} kg
                    </span>
                  </div>
                  {gmlConfig.gvmTable1 && (
                    <div className="flex justify-between items-center text-gray-500 text-xs">
                      <span>Table 1 limit:</span>
                      <span className="font-mono">
                        {gmlConfig.gvmTable1.toLocaleString()} kg
                      </span>
                    </div>
                  )}
                  {emissionsStandard !== 'none' && (
                    <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                      <span>Emissions Standard: </span>
                      <span className="font-medium text-blue-400">
                        {emissionsStandard === 'euro6' ? 'Euro VI (ADR 80/04)' : emissionsStandard === 'euro5' ? 'Euro V' : 'None'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Weigh Bridge Section */}
        <div className="pt-2.5 border-t border-gray-700">
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
            <div className="mt-2.5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="front-axle" className="text-sm text-gray-300">
                  Front Axle Weight (kg)
                </Label>
                <Input
                  id="front-axle"
                  type="number"
                  value={frontAxle || ''}
                  onChange={(e) => onFrontAxleChange(parseFloat(e.target.value) || 0)}
                  placeholder={referenceFront ? `${referenceFront} (reference)` : '0'}
                  className="bg-gray-900/50 border-gray-600 text-white h-8 text-sm"
                />
                {referenceFront && (
                  <p className="text-xs text-gray-500">
                    Reference: {referenceFront} kg
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rear-axle" className="text-sm text-gray-300">
                  Rear Axle Weight (kg)
                </Label>
                <Input
                  id="rear-axle"
                  type="number"
                  value={rearAxle || ''}
                  onChange={(e) => onRearAxleChange(parseFloat(e.target.value) || 0)}
                  placeholder={referenceRear ? `${referenceRear} (reference)` : '0'}
                  className="bg-gray-900/50 border-gray-600 text-white h-8 text-sm"
                />
                {referenceRear && (
                  <p className="text-xs text-gray-500">
                    Reference: {referenceRear} kg
                  </p>
                )}
              </div>

              <div className="pt-1.5 border-t border-gray-700">
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

