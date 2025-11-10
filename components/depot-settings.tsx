"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Trash2, Save, MapPin } from "lucide-react"
import { toast } from "sonner"
import { saveDepot, clearDepot, type DepotData } from "@/lib/depot/actions"
import { AddressAutocomplete } from "./address-autocomplete"
import type { GeocodeResult } from "@/lib/mapbox/types"

interface DepotSettingsProps {
  initialDepot: DepotData | null
}

export function DepotSettings({ initialDepot }: DepotSettingsProps) {
  const [depot, setDepot] = useState({
    name: initialDepot?.depot_name || "",
    address: initialDepot?.depot_address || "",
    lat: initialDepot?.depot_lat || 0,
    lng: initialDepot?.depot_lng || 0,
  })
  const [saving, setSaving] = useState(false)

  const hasDepot = initialDepot?.depot_address

  const handleAddressSelect = (result: GeocodeResult) => {
    setDepot({
      ...depot,
      address: result.place_name,
      lat: result.center[1],
      lng: result.center[0],
    })
  }

  const handleSave = async () => {
    if (!depot.name || !depot.address) {
      toast.error("Please provide a depot name and address")
      return
    }

    setSaving(true)
    const result = await saveDepot(depot)
    setSaving(false)

    if (result.success) {
      toast.success("Depot saved successfully!")
    } else {
      toast.error(result.error || "Failed to save depot")
    }
  }

  const handleClear = async () => {
    setSaving(true)
    const result = await clearDepot()
    setSaving(false)

    if (result.success) {
      setDepot({ name: "", address: "", lat: 0, lng: 0 })
      toast.success("Depot cleared")
    } else {
      toast.error(result.error || "Failed to clear depot")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Depot Location</CardTitle>
          </div>
          {hasDepot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        <CardDescription>
          Save your depot location for quick access. This will be used as both the base and final destination.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="depot-name">Depot Name</Label>
          <Input
            id="depot-name"
            placeholder="e.g., Main Depot, Sydney Warehouse"
            value={depot.name}
            onChange={(e) => setDepot({ ...depot, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="depot-address">Depot Address</Label>
          <AddressAutocomplete
            value={depot.address}
            onSelect={handleAddressSelect}
            placeholder="Search for your depot address..."
            id="depot-address"
          />
          {depot.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{depot.address}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !depot.name || !depot.address}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : hasDepot ? "Update Depot" : "Save Depot"}
        </Button>
      </CardContent>
    </Card>
  )
}

