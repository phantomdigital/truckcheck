"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Package,
  Scale,
  Truck,
  History,
  Settings,
  Save,
  Plus,
  Gauge,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  onClick: () => void
}

interface DashboardSidebarProps {
  palletCount: number
  onOpenPallets: () => void
  onOpenWeight: () => void
  onOpenAxleWeights: () => void
  onOpenTrucks: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
  onSave: () => void
  onNewTruck: () => void
}

export function DashboardSidebar({
  palletCount,
  onOpenPallets,
  onOpenWeight,
  onOpenAxleWeights,
  onOpenTrucks,
  onOpenHistory,
  onOpenSettings,
  onSave,
  onNewTruck,
}: DashboardSidebarProps) {
  const items: DashboardItem[] = [
    {
      id: "axle-weights",
      label: "Axle Weights",
      icon: Gauge,
      onClick: onOpenAxleWeights,
    },
    {
      id: "pallets",
      label: "Pallets",
      icon: Package,
      badge: palletCount,
      onClick: onOpenPallets,
    },
    {
      id: "weight",
      label: "Weight",
      icon: Scale,
      onClick: onOpenWeight,
    },
    {
      id: "trucks",
      label: "Trucks",
      icon: Truck,
      onClick: onOpenTrucks,
    },
    {
      id: "history",
      label: "History",
      icon: History,
      onClick: onOpenHistory,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: onOpenSettings,
    },
  ]

  return (
    <div className="w-20 h-full bg-muted/30 border-r border-border/50 flex flex-col items-center py-4 gap-2">
      {/* Logo/Title */}
      <div className="mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Truck className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Dashboard Items */}
      <div className="flex-1 flex flex-col gap-2 w-full px-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-14 flex flex-col items-center justify-center gap-1 relative",
                "hover:bg-primary/10 hover:text-primary transition-colors"
              )}
              onClick={item.onClick}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0 && (
                <Badge
                  variant="default"
                  className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full px-2 border-t border-border/50 pt-2">
        <Button
          variant="default"
          size="icon"
          className="w-full h-12 flex flex-col items-center justify-center gap-1"
          onClick={onNewTruck}
          title="New Truck"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-medium">New</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-full h-12 flex flex-col items-center justify-center gap-1"
          onClick={onSave}
          title="Save"
        >
          <Save className="h-5 w-5" />
          <span className="text-[10px] font-medium">Save</span>
        </Button>
      </div>
    </div>
  )
}

