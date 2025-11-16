'use client';

import { useState } from 'react';
import { Truck, Plus, Eye, EyeOff, Save, FolderOpen, Settings, Scale, Gauge, Package, Undo2, Redo2, Copy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Tool = 'select' | 'pan' | 'zoom-in' | 'zoom-out';

interface DashboardMenuProps {
  onOpenTrucks: () => void;
  onOpenBodyConfig: () => void;
  onOpenCompliance: () => void;
  onAddPallet: () => void;
  onAutoFillBody: () => void;
  onTogglePopovers: () => void;
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  palletCount?: number;
  popoverStates?: {
    bodyConfig: boolean;
    compliance: boolean;
    addPallet: boolean;
    autoFillBody: boolean;
  };
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicatePallet?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelectedPallet?: boolean;
}

interface DashboardItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function DashboardMenu({
  onOpenTrucks,
  onOpenBodyConfig,
  onOpenCompliance,
  onAddPallet,
  onAutoFillBody,
  onTogglePopovers,
  onSave,
  onLoad,
  onSettings,
  palletCount = 0,
  popoverStates = { bodyConfig: false, compliance: true, addPallet: false, autoFillBody: false },
  onUndo,
  onRedo,
  onDuplicatePallet,
  canUndo = false,
  canRedo = false,
  hasSelectedPallet = false,
}: DashboardMenuProps) {
  const [popoversVisible, setPopoversVisible] = useState(true);

  const handleTogglePopovers = () => {
    setPopoversVisible(!popoversVisible);
    onTogglePopovers();
  };

  const items: DashboardItem[] = [
    {
      id: 'auto-fill-body',
      label: 'Auto Fill',
      icon: Zap,
      onClick: onAutoFillBody,
      isActive: popoverStates.autoFillBody,
    },
    {
      id: 'add-pallet',
      label: 'Add Pallet',
      icon: Plus,
      onClick: onAddPallet,
      isActive: popoverStates.addPallet,
    },
    {
      id: 'duplicate-pallet',
      label: 'Duplicate',
      icon: Copy,
      onClick: onDuplicatePallet || (() => {}),
      disabled: !hasSelectedPallet,
    },
    {
      id: 'body-config',
      label: 'Body Config',
      icon: Settings,
      onClick: onOpenBodyConfig,
      isActive: popoverStates.bodyConfig,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Scale,
      onClick: onOpenCompliance,
      isActive: popoverStates.compliance,
    },
    {
      id: 'toggle-popovers',
      label: 'Toggle',
      icon: popoversVisible ? Eye : EyeOff,
      onClick: handleTogglePopovers,
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-gray-900 border-r border-gray-800 z-50 shrink-0">
      <div className="flex flex-col items-center py-4 gap-2 h-full">
        {/* Logo/Title */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <Truck className="h-6 w-6 text-blue-400" />
          </div>
        </div>

        {/* Dashboard Items */}
        <div className="flex-1 flex flex-col gap-2 w-full px-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="icon"
                className={cn(
                  'w-full h-14 flex flex-col items-center justify-center gap-1 relative',
                  'hover:bg-gray-800 hover:text-white transition-colors',
                  item.isActive && 'bg-gray-800 text-white',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium text-gray-300">{item.label}</span>
                {item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0 && (
                  <Badge
                    variant="default"
                    className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-blue-600"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.disabled && (
                  <div className="absolute inset-0 bg-gray-900/50 rounded" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Undo/Redo Buttons */}
        <div className="flex flex-col gap-2 w-full px-2 border-t border-gray-700 pt-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "flex-1 h-10 flex flex-col items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 hover:text-white",
                !canUndo && "opacity-50 cursor-not-allowed"
              )}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
              <span className="text-[9px] font-medium text-gray-300">Undo</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "flex-1 h-10 flex flex-col items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 hover:text-white",
                !canRedo && "opacity-50 cursor-not-allowed"
              )}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
              <span className="text-[9px] font-medium text-gray-300">Redo</span>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full px-2 border-t border-gray-700 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="w-full h-12 flex flex-col items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 hover:text-white"
            onClick={onSave}
            title="Save"
          >
            <Save className="h-5 w-5" />
            <span className="text-[10px] font-medium text-gray-300">Save</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-full h-12 flex flex-col items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 hover:text-white"
            onClick={onLoad}
            title="Load"
          >
            <FolderOpen className="h-5 w-5" />
            <span className="text-[10px] font-medium text-gray-300">Load</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

