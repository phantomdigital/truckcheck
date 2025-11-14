'use client';

import { useState, useEffect } from 'react';
import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface PalletEditPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  pallet?: {
    id: string;
    weight: number;
    x: number;
    y: number;
    length: number;
    width: number;
  };
  pallets?: Array<{
    id: string;
    weight: number;
    x: number;
    y: number;
    length: number;
    width: number;
  }>;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateWeights?: (updates: Array<{ id: string; weight: number }>) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onDuplicate?: (id: string) => void;
  onDuplicateMultiple?: (ids: string[]) => void;
}

export function PalletEditPopover({
  position,
  onPositionChange,
  onClose,
  pallet,
  pallets,
  onUpdateWeight,
  onUpdateWeights,
  onDelete,
  onDeleteMultiple,
  onDuplicate,
  onDuplicateMultiple,
}: PalletEditPopoverProps) {
  const isMultiEdit = pallets && pallets.length > 1;
  const currentPallet = pallet || (pallets && pallets[0]);
  
  // For multi-edit, show average weight or empty if weights differ
  const getInitialWeight = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.weight.toString() || '0';
    
    const weights = pallets.map(p => p.weight);
    const allSame = weights.every(w => w === weights[0]);
    return allSame ? weights[0].toString() : '';
  };

  const [weight, setWeight] = useState(getInitialWeight());

  useEffect(() => {
    setWeight(getInitialWeight());
  }, [pallet, pallets]);

  const handleSave = () => {
    const weightNum = parseFloat(weight);
    if (!isNaN(weightNum) && weightNum > 0) {
      if (isMultiEdit && pallets && onUpdateWeights) {
        // Update all selected pallets
        const updates = pallets.map(p => ({ id: p.id, weight: weightNum }));
        onUpdateWeights(updates);
      } else if (currentPallet) {
        // Update single pallet
        onUpdateWeight(currentPallet.id, weightNum);
      }
    }
  };

  const handleDelete = () => {
    if (isMultiEdit && pallets && onDeleteMultiple) {
      const count = pallets.length;
      if (window.confirm(`Delete ${count} selected pallets?`)) {
        onDeleteMultiple(pallets.map(p => p.id));
        onClose?.();
      }
    } else if (currentPallet) {
      if (window.confirm(`Delete pallet (${currentPallet.weight}kg)?`)) {
        onDelete(currentPallet.id);
        onClose?.();
      }
    }
  };

  const handleDuplicate = () => {
    if (isMultiEdit && pallets && onDuplicateMultiple) {
      onDuplicateMultiple(pallets.map(p => p.id));
      onClose?.();
    } else if (currentPallet && onDuplicate) {
      onDuplicate(currentPallet.id);
      onClose?.();
    }
  };

  const getTitle = () => {
    if (isMultiEdit && pallets) {
      return `${pallets.length} Pallets Selected`;
    }
    return currentPallet ? `Pallet ${currentPallet.id.slice(-6)}` : 'Pallet';
  };

  const getPositionInfo = () => {
    if (isMultiEdit && pallets) {
      return `${pallets.length} pallets selected`;
    }
    if (currentPallet) {
      return `Position: ${currentPallet.x.toFixed(0)}mm, ${currentPallet.y.toFixed(0)}mm`;
    }
    return '';
  };

  const getSizeInfo = () => {
    if (isMultiEdit && pallets) {
      const sizes = pallets.map(p => `${p.length}×${p.width}`);
      const uniqueSizes = [...new Set(sizes)];
      return uniqueSizes.length === 1 ? 
        `Size: ${uniqueSizes[0]}mm` : 
        `Mixed sizes (${uniqueSizes.length} different)`;
    }
    if (currentPallet) {
      return `Size: ${currentPallet.length}mm × ${currentPallet.width}mm`;
    }
    return '';
  };

  return (
    <DraggablePopover
      id="pallet-edit"
      title={getTitle()}
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pallet-weight" className="text-sm text-gray-300">
            Weight (kg) {isMultiEdit ? '(applies to all)' : ''}
          </Label>
          <Input
            id="pallet-weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            min={0}
            step={0.1}
            placeholder={isMultiEdit && weight === '' ? 'Mixed weights' : undefined}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>

        <div className="space-y-1 text-xs text-gray-400">
          <p>{getPositionInfo()}</p>
          <p>{getSizeInfo()}</p>
        </div>

        <div className="pt-2 border-t border-gray-700 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
            {(onDuplicate || onDuplicateMultiple) && (
              <Button
                onClick={handleDuplicate}
                size="sm"
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicate
              </Button>
            )}
          </div>
          <Button
            onClick={handleDelete}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            {isMultiEdit ? `Delete ${pallets?.length} Pallets` : 'Delete'}
          </Button>
        </div>
      </div>
    </DraggablePopover>
  );
}

