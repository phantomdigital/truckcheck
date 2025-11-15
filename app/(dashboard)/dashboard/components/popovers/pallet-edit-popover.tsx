'use client';

import { useState, useEffect } from 'react';
import { DraggablePopover } from './draggable-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

interface PalletEditPopoverProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  pallet?: {
    id: string;
    weight: number;
    x: number;
    y: number;
    length: number;
    width: number;
    name?: string;
  };
  pallets?: Array<{
    id: string;
    weight: number;
    x: number;
    y: number;
    length: number;
    width: number;
    name?: string;
  }>;
  onUpdateWeight: (id: string, weight: number) => void;
  onUpdateWeights?: (updates: Array<{ id: string; weight: number }>) => void;
  onUpdateDimensions?: (id: string, length: number, width: number) => void;
  onUpdateDimensionsMultiple?: (updates: Array<{ id: string; length: number; width: number }>) => void;
  onUpdateName?: (id: string, name: string) => void;
  onUpdateNames?: (updates: Array<{ id: string; name: string }>) => void;
  onUpdate?: (id: string, updates: { length?: number; width?: number; weight?: number; name?: string; x?: number; y?: number }) => void;
  onUpdateMultiple?: (updates: Array<{ id: string } & { length?: number; width?: number; weight?: number; name?: string; x?: number; y?: number }>) => void;
  onUpdatePosition?: (id: string, x: number, y: number) => void;
  onUpdatePositions?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onDuplicate?: (id: string) => void;
  onDuplicateMultiple?: (ids: string[]) => void;
}

export function PalletEditPopover({
  position,
  onPositionChange,
  onClose,
  collapsed,
  onCollapsedChange,
  pallet,
  pallets,
  onUpdateWeight,
  onUpdateWeights,
  onUpdateDimensions,
  onUpdateDimensionsMultiple,
  onUpdateName,
  onUpdateNames,
  onUpdatePosition,
  onUpdatePositions,
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

  // For multi-edit, show length/width if all same, otherwise empty
  const getInitialLength = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.length.toString() || '0';
    
    const lengths = pallets.map(p => p.length);
    const allSame = lengths.every(l => l === lengths[0]);
    return allSame ? lengths[0].toString() : '';
  };

  const getInitialWidth = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.width.toString() || '0';
    
    const widths = pallets.map(p => p.width);
    const allSame = widths.every(w => w === widths[0]);
    return allSame ? widths[0].toString() : '';
  };

  const getInitialName = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.name || '';
    
    const names = pallets.map(p => p.name || '').filter(n => n);
    if (names.length === 0) return '';
    const allSame = names.every(n => n === names[0]);
    return allSame ? names[0] : '';
  };

  const getInitialX = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.x.toString() || '0';
    
    const xs = pallets.map(p => p.x);
    const allSame = xs.every(x => x === xs[0]);
    return allSame ? xs[0].toString() : '';
  };

  const getInitialY = () => {
    if (!isMultiEdit || !pallets) return currentPallet?.y.toString() || '0';
    
    const ys = pallets.map(p => p.y);
    const allSame = ys.every(y => y === ys[0]);
    return allSame ? ys[0].toString() : '';
  };

  const [weight, setWeight] = useState(getInitialWeight());
  const [length, setLength] = useState(getInitialLength());
  const [width, setWidth] = useState(getInitialWidth());
  const [x, setX] = useState(getInitialX());
  const [y, setY] = useState(getInitialY());

  useEffect(() => {
    setWeight(getInitialWeight());
    setLength(getInitialLength());
    setWidth(getInitialWidth());
    setX(getInitialX());
    setY(getInitialY());
  }, [pallet, pallets]);

  const handleFieldChange = (field: 'weight' | 'length' | 'width' | 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    
    if (field === 'weight') {
      if (!isNaN(numValue) && numValue > 0) {
        if (isMultiEdit && pallets && onUpdateWeights) {
          const updates = pallets.map(p => ({ id: p.id, weight: numValue }));
          onUpdateWeights(updates);
        } else if (currentPallet) {
          onUpdateWeight(currentPallet.id, numValue);
        }
      }
    } else if (field === 'length' || field === 'width') {
      // Use current pallet values if state is empty/invalid
      const otherValue = field === 'length' ? width : length;
      const otherNum = parseFloat(otherValue);
      const otherPalletValue = currentPallet ? (field === 'length' ? currentPallet.width : currentPallet.length) : 0;
      const finalOtherValue = (!isNaN(otherNum) && otherNum > 0) ? otherNum : otherPalletValue;
      
      if (!isNaN(numValue) && numValue > 0 && finalOtherValue > 0) {
        if (isMultiEdit && pallets && onUpdateDimensionsMultiple) {
          const updates = pallets.map(p => ({ 
            id: p.id, 
            length: field === 'length' ? numValue : p.length,
            width: field === 'width' ? numValue : p.width
          }));
          onUpdateDimensionsMultiple(updates);
        } else if (currentPallet && onUpdateDimensions) {
          onUpdateDimensions(
            currentPallet.id, 
            field === 'length' ? numValue : currentPallet.length,
            field === 'width' ? numValue : currentPallet.width
          );
        }
      }
    } else if (field === 'x' || field === 'y') {
      // Use current pallet values if state is empty/invalid
      const otherValue = field === 'x' ? y : x;
      const otherNum = parseFloat(otherValue);
      const otherPalletValue = currentPallet ? (field === 'x' ? currentPallet.y : currentPallet.x) : 0;
      const finalOtherValue = (!isNaN(otherNum)) ? otherNum : otherPalletValue;
      
      if (!isNaN(numValue)) {
        if (isMultiEdit && pallets && onUpdatePositions) {
          const updates = pallets.map(p => ({ 
            id: p.id, 
            x: field === 'x' ? numValue : p.x,
            y: field === 'y' ? numValue : p.y
          }));
          onUpdatePositions(updates);
        } else if (currentPallet && onUpdatePosition) {
          onUpdatePosition(
            currentPallet.id,
            field === 'x' ? numValue : currentPallet.x,
            field === 'y' ? numValue : currentPallet.y
          );
        }
      }
    }
  };

  const handleNameChange = (newName: string) => {
    const trimmedName = newName.trim();
    // For single pallet, always update
    if (currentPallet && onUpdateName) {
      // Pass the trimmed name (empty string will be converted to undefined in store)
      onUpdateName(currentPallet.id, trimmedName);
    }
    // For multi-edit, update all selected pallets
    if (isMultiEdit && pallets && onUpdateNames) {
      const updates = pallets.map(p => ({ id: p.id, name: trimmedName }));
      onUpdateNames(updates);
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
      // Don't close - let parent handle opening edit for new pallets
      // The store will select the new pallets, so parent can open edit popover
    } else if (currentPallet && onDuplicate) {
      onDuplicate(currentPallet.id);
      // Don't close - let parent handle opening edit for new pallet
      // The store will select the new pallet, so parent can open edit popover
    }
  };

  const getTitle = () => {
    if (isMultiEdit && pallets) {
      return `${pallets.length} Pallets Selected`;
    }
    if (currentPallet?.name) {
      return currentPallet.name;
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
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      editableTitle={!isMultiEdit}
      onTitleChange={handleNameChange}
      titlePlaceholder="Enter pallet name"
    >
      <div className="space-y-4">

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pallet-length" className="text-sm text-gray-300">
              Length (mm) {isMultiEdit ? '(all)' : ''}
            </Label>
            <Input
              id="pallet-length"
              type="number"
              value={length}
              onChange={(e) => {
                setLength(e.target.value);
                handleFieldChange('length', e.target.value);
              }}
              min={0}
              step={1}
              placeholder={isMultiEdit && length === '' ? 'Mixed' : undefined}
              className="bg-gray-900/50 border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pallet-width" className="text-sm text-gray-300">
              Width (mm) {isMultiEdit ? '(all)' : ''}
            </Label>
            <Input
              id="pallet-width"
              type="number"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                handleFieldChange('width', e.target.value);
              }}
              min={0}
              step={1}
              placeholder={isMultiEdit && width === '' ? 'Mixed' : undefined}
              className="bg-gray-900/50 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="pallet-weight" className="text-sm text-gray-300">
            Weight (kg) {isMultiEdit ? '(applies to all)' : ''}
          </Label>
          <Input
            id="pallet-weight"
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              handleFieldChange('weight', e.target.value);
            }}
            min={0}
            step={0.1}
            placeholder={isMultiEdit && weight === '' ? 'Mixed weights' : undefined}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pallet-x" className="text-sm text-gray-300">
              X Position (mm) {isMultiEdit ? '(all)' : ''}
            </Label>
            <Input
              id="pallet-x"
              type="number"
              value={x}
              onChange={(e) => {
                setX(e.target.value);
                handleFieldChange('x', e.target.value);
              }}
              min={0}
              step={1}
              placeholder={isMultiEdit && x === '' ? 'Mixed' : undefined}
              className="bg-gray-900/50 border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pallet-y" className="text-sm text-gray-300">
              Y Position (mm) {isMultiEdit ? '(all)' : ''}
            </Label>
            <Input
              id="pallet-y"
              type="number"
              value={y}
              onChange={(e) => {
                setY(e.target.value);
                handleFieldChange('y', e.target.value);
              }}
              min={0}
              step={1}
              placeholder={isMultiEdit && y === '' ? 'Mixed' : undefined}
              className="bg-gray-900/50 border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-400">
          {!isMultiEdit && <p>{getSizeInfo()}</p>}
        </div>

        <div className="pt-2 border-t border-gray-700 flex items-center justify-end gap-2">
          {(onDuplicate || onDuplicateMultiple) && (
            <Button
              onClick={handleDuplicate}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
              title="Duplicate pallet"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            onClick={handleDelete}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-gray-400 hover:text-red-400 hover:bg-red-900/20"
            title={isMultiEdit ? `Delete ${pallets?.length} pallets` : 'Delete pallet'}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </DraggablePopover>
  );
}

