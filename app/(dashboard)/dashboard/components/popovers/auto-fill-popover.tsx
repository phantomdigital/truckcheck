'use client';

import { useState, useEffect } from 'react';
import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Loader2, Zap } from 'lucide-react';

// Standard AU pallet sizes (mm)
const STANDARD_PALLET_SIZES = {
  'AU Standard': { length: 1165, width: 1165 },
  'AU Half': { length: 1165, width: 580 },
  'EU Standard': { length: 1200, width: 800 },
  'US Standard': { length: 1219, width: 1016 },
  'Custom': { length: 0, width: 0 },
} as const;

interface AutoFillPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onAutoFillBody?: (config: {
    length: number;
    width: number;
    mode: 'uniform' | 'custom';
    uniformWeight?: number;
    customWeights?: number[];
    maxPallets?: number;
    replaceExisting: boolean;
    limitType: 'mfg' | 'gml' | 'effective';
  }) => Promise<void>;
}

export function AutoFillPopover({
  position,
  onPositionChange,
  onClose,
  collapsed,
  onCollapsedChange,
  onAutoFillBody,
}: AutoFillPopoverProps) {
  const [palletSize, setPalletSize] = useState<keyof typeof STANDARD_PALLET_SIZES>('AU Standard');
  const [customLength, setCustomLength] = useState(1165);
  const [customWidth, setCustomWidth] = useState(1165);
  const [mode, setMode] = useState<'uniform' | 'custom'>('uniform');
  const [uniformWeight, setUniformWeight] = useState(1000);
  const [customWeightsText, setCustomWeightsText] = useState('');
  const [maxPallets, setMaxPallets] = useState<number | undefined>(undefined);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [limitType, setLimitType] = useState<'mfg' | 'gml' | 'effective'>('effective');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (palletSize === 'Custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const size = STANDARD_PALLET_SIZES[palletSize];
      setCustomLength(size.length);
      setCustomWidth(size.width);
    }
  }, [palletSize]);

  const currentLength = isCustom ? customLength : STANDARD_PALLET_SIZES[palletSize].length;
  const currentWidth = isCustom ? customWidth : STANDARD_PALLET_SIZES[palletSize].width;

  const parseCustomWeights = (text: string): number[] => {
    return text
      .split(/[,\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseFloat(s))
      .filter(n => !isNaN(n) && n > 0);
  };

  const customWeights = parseCustomWeights(customWeightsText);

  const canFill = currentLength > 0 && currentWidth > 0 && (
    (mode === 'uniform' && uniformWeight > 0) ||
    (mode === 'custom' && customWeights.length > 0)
  );

  const handleAutoFill = async () => {
    if (!canFill || !onAutoFillBody) return;

    setIsAutoFilling(true);
    try {
      await onAutoFillBody({
        length: currentLength,
        width: currentWidth,
        mode,
        uniformWeight: mode === 'uniform' ? uniformWeight : undefined,
        customWeights: mode === 'custom' ? customWeights : undefined,
        maxPallets,
        replaceExisting,
        limitType,
      });
      onClose?.();
    } catch (error) {
      // Error handling is done in parent via toast
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <DraggablePopover
      id="auto-fill-popover"
      title="Auto Fill Body"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      className="w-[320px]"
    >
      <div className="space-y-4">
        {/* Pallet Size Selection */}
        <div className="space-y-2">
          <Label htmlFor="pallet-size" className="text-sm text-gray-300">
            Pallet Size
          </Label>
          <Select
            id="pallet-size"
            value={palletSize}
            onChange={(e) => setPalletSize(e.target.value as keyof typeof STANDARD_PALLET_SIZES)}
            className="bg-gray-900/50 border-gray-600 text-white"
          >
            {Object.keys(STANDARD_PALLET_SIZES).map((size) => (
              <option key={size} value={size} className="bg-gray-800 text-white">
                {size}
                {size !== 'Custom' && (
                  ` (${STANDARD_PALLET_SIZES[size as keyof typeof STANDARD_PALLET_SIZES].length} × ${STANDARD_PALLET_SIZES[size as keyof typeof STANDARD_PALLET_SIZES].width}mm)`
                )}
              </option>
            ))}
          </Select>
        </div>

        {/* Custom Dimensions */}
        {isCustom && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="custom-length" className="text-sm text-gray-300">
                  Length (mm)
                </Label>
                <Input
                  id="custom-length"
                  type="number"
                  value={customLength}
                  onChange={(e) => setCustomLength(parseInt(e.target.value) || 0)}
                  min={100}
                  max={3000}
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-width" className="text-sm text-gray-300">
                  Width (mm)
                </Label>
                <Input
                  id="custom-width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  min={100}
                  max={3000}
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
            </div>
          </>
        )}

        {/* Dimensions Display */}
        {!isCustom && (
          <div className="text-xs text-gray-400 space-y-1">
            <p>Length: {currentLength}mm</p>
            <p>Width: {currentWidth}mm</p>
          </div>
        )}

        {/* Weight Mode */}
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-300">Weight Mode</Label>
            <div className="flex items-center space-x-2">
              <span className={`text-xs ${mode === 'uniform' ? 'text-white' : 'text-gray-400'}`}>
                Uniform
              </span>
              <Switch
                checked={mode === 'custom'}
                onCheckedChange={(checked) => setMode(checked ? 'custom' : 'uniform')}
              />
              <span className={`text-xs ${mode === 'custom' ? 'text-white' : 'text-gray-400'}`}>
                Custom
              </span>
            </div>
          </div>

          {mode === 'uniform' ? (
            <div className="space-y-2">
              <Label htmlFor="uniform-weight" className="text-sm text-gray-300">
                Weight per Pallet (kg)
              </Label>
              <Input
                id="uniform-weight"
                type="number"
                value={uniformWeight}
                onChange={(e) => setUniformWeight(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.1}
                className="bg-gray-900/50 border-gray-600 text-white"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="custom-weights" className="text-sm text-gray-300">
                Pallet Weights (kg, comma or line separated)
              </Label>
              <textarea
                id="custom-weights"
                value={customWeightsText}
                onChange={(e) => setCustomWeightsText(e.target.value)}
                placeholder="1000, 800, 1200&#10;900&#10;750"
                rows={3}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {customWeights.length > 0 && (
                <p className="text-xs text-gray-400">
                  {customWeights.length} weights parsed: {customWeights.slice(0, 3).join(', ')}
                  {customWeights.length > 3 && '...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 border-t border-gray-700 pt-4">
          <div className="space-y-2">
            <Label htmlFor="limit-type" className="text-sm text-gray-300">
              Weight Limits
            </Label>
            <Select
              id="limit-type"
              value={limitType}
              onChange={(e) => setLimitType(e.target.value as 'mfg' | 'gml' | 'effective')}
              className="bg-gray-900/50 border-gray-600 text-white"
            >
              <option value="effective" className="bg-gray-800 text-white">
                Effective (Most Restrictive)
              </option>
              <option value="mfg" className="bg-gray-800 text-white">
                Manufacturer (MFG) Limits
              </option>
              <option value="gml" className="bg-gray-800 text-white">
                Regulatory (GML) Limits
              </option>
            </Select>
            <p className="text-xs text-gray-400">
              {limitType === 'effective' && 'Uses the most restrictive limits between manufacturer and regulatory'}
              {limitType === 'mfg' && 'Uses manufacturer-specified weight ratings'}
              {limitType === 'gml' && 'Uses Australian General Mass Limits (NHVR regulations)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-pallets" className="text-sm text-gray-300">
              Max Pallets (optional)
            </Label>
            <Input
              id="max-pallets"
              type="number"
              value={maxPallets || ''}
              onChange={(e) => setMaxPallets(e.target.value ? parseInt(e.target.value) : undefined)}
              min={1}
              placeholder="No limit"
              className="bg-gray-900/50 border-gray-600 text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-300">Replace Existing Pallets</Label>
            <Switch
              checked={replaceExisting}
              onCheckedChange={setReplaceExisting}
            />
          </div>
        </div>

        {/* Fill Button */}
        <div className="pt-2 border-t border-gray-700">
          <Button
            onClick={handleAutoFill}
            disabled={!canFill || isAutoFilling}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimising...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Fill Body
              </>
            )}
          </Button>
        </div>
      </div>
    </DraggablePopover>
  );
}
