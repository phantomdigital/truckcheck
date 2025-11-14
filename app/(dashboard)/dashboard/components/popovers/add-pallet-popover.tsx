'use client';

import { useState, useEffect } from 'react';
import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Select } from '@/components/ui/select';

// Standard AU pallet sizes (mm)
const STANDARD_PALLET_SIZES = {
  'AU Standard': { length: 1165, width: 1165 },
  'AU Half': { length: 1165, width: 580 },
  'EU Standard': { length: 1200, width: 800 },
  'US Standard': { length: 1219, width: 1016 },
  'Custom': { length: 0, width: 0 },
} as const;

interface AddPalletPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  onAddPallet: (pallet: {
    length: number; // mm
    width: number; // mm
    weight: number; // kg
  }) => void;
}

export function AddPalletPopover({
  position,
  onPositionChange,
  onClose,
  onAddPallet,
}: AddPalletPopoverProps) {
  const [palletSize, setPalletSize] = useState<keyof typeof STANDARD_PALLET_SIZES>('AU Standard');
  const [customLength, setCustomLength] = useState(1165);
  const [customWidth, setCustomWidth] = useState(1165);
  const [weight, setWeight] = useState(1000);
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

  const handleAdd = () => {
    const length = isCustom ? customLength : STANDARD_PALLET_SIZES[palletSize].length;
    const width = isCustom ? customWidth : STANDARD_PALLET_SIZES[palletSize].width;

    if (length > 0 && width > 0 && weight > 0) {
      onAddPallet({ length, width, weight });
      // Reset to defaults
      setPalletSize('AU Standard');
      setWeight(1000);
      setCustomLength(1165);
      setCustomWidth(1165);
      setIsCustom(false);
      onClose?.();
    }
  };

  const currentLength = isCustom ? customLength : STANDARD_PALLET_SIZES[palletSize].length;
  const currentWidth = isCustom ? customWidth : STANDARD_PALLET_SIZES[palletSize].width;

  return (
    <DraggablePopover
      id="add-pallet"
      title="Add Pallet"
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
    >
      <div className="space-y-4">
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

        {isCustom && (
          <>
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
          </>
        )}

        {!isCustom && (
          <div className="text-xs text-gray-400 space-y-1">
            <p>Length: {currentLength}mm</p>
            <p>Width: {currentWidth}mm</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pallet-weight" className="text-sm text-gray-300">
            Weight (kg)
          </Label>
          <Input
            id="pallet-weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
            className="bg-gray-900/50 border-gray-600 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
        </div>

        <div className="pt-2 border-t border-gray-700">
          <Button
            onClick={handleAdd}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={currentLength <= 0 || currentWidth <= 0 || weight <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pallet
          </Button>
        </div>
      </div>
    </DraggablePopover>
  );
}

