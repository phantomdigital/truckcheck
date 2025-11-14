"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BodyType, SuspensionType, type TruckProfileFormData } from "@/lib/load-calculator/types"
import { DEFAULT_WALL_THICKNESS } from "@/lib/load-calculator/physics"
import { createTruckProfile, updateTruckProfile } from "@/lib/load-calculator/actions"
import { 
  getManufacturers, 
  getTruckModelsByManufacturer,
  getTypicalTareDistribution,
  type TruckModelSpec 
} from "@/lib/load-calculator/truck-presets"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

interface TruckProfileFormProps {
  initialData?: TruckProfileFormData
  truckId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function TruckProfileForm({
  initialData,
  truckId,
  onSuccess,
  onCancel,
}: TruckProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<TruckModelSpec | null>(null)
  const [selectedWheelbase, setSelectedWheelbase] = useState<number | null>(null)
  const [usePreset, setUsePreset] = useState(!truckId) // Use presets for new trucks
  const getDefaultWallThickness = (bodyType: BodyType) => {
    const defaults = DEFAULT_WALL_THICKNESS[bodyType]
    return {
      wall_thickness_front: defaults.front > 0 ? defaults.front : undefined,
      wall_thickness_rear: defaults.rear > 0 ? defaults.rear : undefined,
      wall_thickness_sides: defaults.sides > 0 ? defaults.sides : undefined,
    }
  }

  const [formData, setFormData] = useState<TruckProfileFormData>(
    initialData || {
      name: "",
      body_type: BodyType.TRAY,
      body_length: 0,
      body_width: 0,
      wheelbase: 0,
      tare_weight: 0,
      front_tare_weight: 0,
      rear_tare_weight: 0,
      gvm: 0,
      front_axle_limit: 0,
      rear_axle_limit: 0,
      front_overhang: 0,
      suspension_type: SuspensionType.STEEL,
      ...getDefaultWallThickness(BodyType.TRAY),
    }
  )

  const manufacturers = getManufacturers()
  const availableModels = selectedManufacturer 
    ? getTruckModelsByManufacturer(selectedManufacturer)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = truckId
        ? await updateTruckProfile(truckId, formData)
        : await createTruckProfile(formData)

      if (result.success) {
        toast.success(truckId ? "Truck profile updated" : "Truck profile created")
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to save truck profile")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateField = <K extends keyof TruckProfileFormData>(
    field: K,
    value: TruckProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle model selection and auto-fill
  const handleModelSelect = (modelIndex: number) => {
    const model = availableModels[modelIndex]
    if (!model) return

    setSelectedModel(model)
    
    // Auto-fill name
    const modelName = `${model.manufacturer} ${model.model}${model.series ? ` ${model.series}` : ""}`
    updateField("name", modelName)
    
    // Auto-fill typical values (user will verify actual weighbridge values)
    const midGvm = (model.gvm_range.min + model.gvm_range.max) / 2
    const midTare = (model.typical_tare_weight_range.min + model.typical_tare_weight_range.max) / 2
    const tareDistribution = getTypicalTareDistribution(model, midTare)
    
    updateField("gvm", midGvm)
    updateField("front_axle_limit", model.typical_front_axle_limit)
    updateField("rear_axle_limit", model.typical_rear_axle_limit)
    updateField("tare_weight", midTare)
    updateField("front_tare_weight", tareDistribution.front_tare_weight)
    updateField("rear_tare_weight", tareDistribution.rear_tare_weight)
    updateField("body_width", model.typical_body_width)
    updateField("front_overhang", model.typical_front_overhang)
    
    // Set first wheelbase option if available
    if (model.wheelbase_options.length > 0) {
      const firstWheelbase = model.wheelbase_options[0]
      setSelectedWheelbase(firstWheelbase)
      updateField("wheelbase", firstWheelbase)
      
      // Estimate body length based on wheelbase and overhangs
      const estimatedBodyLength = firstWheelbase + model.typical_front_overhang + 1.5 // 1.5m rear overhang estimate
      updateField("body_length", estimatedBodyLength)
    }

    toast.success("Specifications pre-filled from manufacturer data")
  }

  // Handle wheelbase selection
  const handleWheelbaseSelect = (wheelbase: number) => {
    if (!selectedModel) return
    
    setSelectedWheelbase(wheelbase)
    updateField("wheelbase", wheelbase)
    
    // Update body length estimate
    const estimatedBodyLength = wheelbase + formData.front_overhang + 1.5
    updateField("body_length", estimatedBodyLength)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{truckId ? "Edit Truck Profile" : "Create Truck Profile"}</CardTitle>
        <CardDescription>
          Enter your truck's specifications. All measurements should be accurate for correct weight calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Truck Presets */}
          {usePreset && !truckId && (
            <div className="space-y-4 p-4 border rounded-md bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium">Quick Setup with Manufacturer Data</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Select
                    id="manufacturer"
                    value={selectedManufacturer}
                    onChange={(e) => {
                      setSelectedManufacturer(e.target.value)
                      setSelectedModel(null)
                      setSelectedWheelbase(null)
                    }}
                  >
                    <option value="">Select manufacturer...</option>
                    {manufacturers.map((mfr) => (
                      <option key={mfr} value={mfr}>
                        {mfr}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    id="model"
                    value={selectedModel ? availableModels.indexOf(selectedModel).toString() : ""}
                    onChange={(e) => handleModelSelect(parseInt(e.target.value))}
                    disabled={!selectedManufacturer}
                  >
                    <option value="">Select model...</option>
                    {availableModels.map((model, idx) => (
                      <option key={idx} value={idx}>
                        {model.model} {model.series && `(${model.series})`}
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedModel && selectedModel.wheelbase_options.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="preset-wheelbase">
                      Wheelbase <Badge variant="secondary" className="ml-2">ADR Compliant</Badge>
                    </Label>
                    <Select
                      id="preset-wheelbase"
                      value={selectedWheelbase?.toString() || ""}
                      onChange={(e) => handleWheelbaseSelect(parseFloat(e.target.value))}
                    >
                      <option value="">Select wheelbase...</option>
                      {selectedModel.wheelbase_options.map((wb) => (
                        <option key={wb} value={wb}>
                          {wb.toFixed(3)}m
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Pre-fills typical specifications. You'll still need to enter actual tare weights from your weighbridge ticket.
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUsePreset(false)}
                className="text-xs"
              >
                Or enter manually
              </Button>
            </div>
          )}

          {!usePreset && !truckId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUsePreset(true)}
              className="w-full"
            >
              <Sparkles className="h-4 w-4" />
              Use manufacturer presets
            </Button>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Truck Name
                {selectedModel && <Badge variant="secondary" className="ml-2">Auto-filled</Badge>}
              </Label>
              <Input
                id="name"
                placeholder="e.g., Isuzu FRR500"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="body_type">Body Type</Label>
                <Select
                  id="body_type"
                  value={formData.body_type}
                  onChange={(e) => {
                    const newBodyType = e.target.value as BodyType
                    updateField("body_type", newBodyType)
                    // Set default wall thickness based on body type
                    const defaults = DEFAULT_WALL_THICKNESS[newBodyType]
                    updateField("wall_thickness_front", defaults.front > 0 ? defaults.front : undefined)
                    updateField("wall_thickness_rear", defaults.rear > 0 ? defaults.rear : undefined)
                    updateField("wall_thickness_sides", defaults.sides > 0 ? defaults.sides : undefined)
                  }}
                  required
                >
                  <option value={BodyType.TRAY}>Tray</option>
                  <option value={BodyType.PANTECH}>Pantech</option>
                  <option value={BodyType.CURTAINSIDER}>Curtainsider</option>
                  <option value={BodyType.REFRIGERATED}>Refrigerated</option>
                  <option value={BodyType.TIPPER}>Tipper</option>
                  <option value={BodyType.TANKER}>Tanker</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suspension_type">Suspension Type</Label>
                <Select
                  id="suspension_type"
                  value={formData.suspension_type}
                  onChange={(e) => updateField("suspension_type", e.target.value as SuspensionType)}
                  required
                >
                  <option value={SuspensionType.STEEL}>Steel (Leaf/Coil Spring)</option>
                  <option value={SuspensionType.AIRBAG}>Airbag (Air Suspension)</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Affects weight distribution calculations
                </p>
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              Body Dimensions
              {selectedModel && <Badge variant="secondary" className="ml-2 text-xs">Estimates - verify actual</Badge>}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="body_length">
                  Body Length (metres)
                  {selectedModel && <Badge variant="outline" className="ml-2 text-xs">Est.</Badge>}
                </Label>
                <Input
                  id="body_length"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 6.20"
                  value={formData.body_length || ""}
                  onChange={(e) => updateField("body_length", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_width">
                  Body Width (metres)
                  {selectedModel && <Badge variant="secondary" className="ml-2 text-xs">Typical</Badge>}
                </Label>
                <Input
                  id="body_width"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2.45"
                  value={formData.body_width || ""}
                  onChange={(e) => updateField("body_width", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wheelbase">
                  Wheelbase (metres)
                  {selectedModel && <Badge variant="secondary" className="ml-2 text-xs">ADR</Badge>}
                </Label>
                <Input
                  id="wheelbase"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 4.50"
                  value={formData.wheelbase || ""}
                  onChange={(e) => updateField("wheelbase", parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Distance from front axle to rear axle
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="front_overhang">Front Overhang (metres)</Label>
                <Input
                  id="front_overhang"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1.20"
                  value={formData.front_overhang || ""}
                  onChange={(e) =>
                    updateField("front_overhang", parseFloat(e.target.value) || 0)
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Distance from front of body to front axle
                </p>
              </div>
            </div>
          </div>

          {/* Wall Thickness */}
          {(() => {
            const defaults = DEFAULT_WALL_THICKNESS[formData.body_type]
            const hasWalls = defaults.front > 0 || defaults.rear > 0 || defaults.sides > 0
            
            if (!hasWalls) return null
            
            return (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Wall Thickness</h3>
                <p className="text-xs text-muted-foreground">
                  Wall thickness affects usable loading area. Defaults shown based on body type.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {defaults.front > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="wall_thickness_front">
                        Front Wall (metres)
                        <Badge variant="outline" className="ml-2 text-xs">
                          Default: {(defaults.front * 1000).toFixed(0)}mm
                        </Badge>
                      </Label>
                      <Input
                        id="wall_thickness_front"
                        type="number"
                        step="0.001"
                        placeholder={(defaults.front * 1000).toFixed(0)}
                        value={formData.wall_thickness_front !== undefined ? formData.wall_thickness_front : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value) || 0
                          updateField("wall_thickness_front", val)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Front wall thickness
                      </p>
                    </div>
                  )}
                  
                  {defaults.rear > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="wall_thickness_rear">
                        Rear Wall (metres)
                        <Badge variant="outline" className="ml-2 text-xs">
                          Default: {(defaults.rear * 1000).toFixed(0)}mm
                        </Badge>
                      </Label>
                      <Input
                        id="wall_thickness_rear"
                        type="number"
                        step="0.001"
                        placeholder={(defaults.rear * 1000).toFixed(0)}
                        value={formData.wall_thickness_rear !== undefined ? formData.wall_thickness_rear : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value) || 0
                          updateField("wall_thickness_rear", val)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Rear wall thickness
                      </p>
                    </div>
                  )}
                  
                  {defaults.sides > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="wall_thickness_sides">
                        Side Walls (metres)
                        <Badge variant="outline" className="ml-2 text-xs">
                          Default: {(defaults.sides * 1000).toFixed(0)}mm
                        </Badge>
                      </Label>
                      <Input
                        id="wall_thickness_sides"
                        type="number"
                        step="0.001"
                        placeholder={(defaults.sides * 1000).toFixed(0)}
                        value={formData.wall_thickness_sides !== undefined ? formData.wall_thickness_sides : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value) || 0
                          updateField("wall_thickness_sides", val)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Side wall thickness (both sides)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Weights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Weight Specifications</h3>
              {selectedModel && (
                <Badge variant="default" className="text-xs">
                  Manufacturer specs - verify actual weights
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tare_weight">
                  Tare Weight (kg)
                  {selectedModel && <Badge variant="destructive" className="ml-2 text-xs">Verify with weighbridge!</Badge>}
                </Label>
                <Input
                  id="tare_weight"
                  type="number"
                  step="1"
                  placeholder="e.g., 3500"
                  value={formData.tare_weight || ""}
                  onChange={(e) => updateField("tare_weight", parseFloat(e.target.value) || 0)}
                  required
                  className={selectedModel ? "border-orange-300 dark:border-orange-700" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedModel 
                    ? "⚠️ Use your actual weighbridge tare weight (this is an estimate)" 
                    : "Empty weight of truck"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gvm">GVM (kg)</Label>
                <Input
                  id="gvm"
                  type="number"
                  step="1"
                  placeholder="e.g., 8000"
                  value={formData.gvm || ""}
                  onChange={(e) => updateField("gvm", parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">Gross Vehicle Mass (maximum legal weight)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="front_tare_weight">
                  Front Axle Tare Weight (kg)
                  {selectedModel && <Badge variant="destructive" className="ml-2 text-xs">Verify!</Badge>}
                </Label>
                <Input
                  id="front_tare_weight"
                  type="number"
                  step="1"
                  placeholder="e.g., 2000"
                  value={formData.front_tare_weight || ""}
                  onChange={(e) =>
                    updateField("front_tare_weight", parseFloat(e.target.value) || 0)
                  }
                  required
                  className={selectedModel ? "border-orange-300 dark:border-orange-700" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedModel 
                    ? "⚠️ Use your actual weighbridge values" 
                    : "Front axle weight when empty"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rear_tare_weight">
                  Rear Axle Tare Weight (kg)
                  {selectedModel && <Badge variant="destructive" className="ml-2 text-xs">Verify!</Badge>}
                </Label>
                <Input
                  id="rear_tare_weight"
                  type="number"
                  step="1"
                  placeholder="e.g., 1500"
                  value={formData.rear_tare_weight || ""}
                  onChange={(e) =>
                    updateField("rear_tare_weight", parseFloat(e.target.value) || 0)
                  }
                  required
                  className={selectedModel ? "border-orange-300 dark:border-orange-700" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedModel 
                    ? "⚠️ Use your actual weighbridge values" 
                    : "Rear axle weight when empty"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="front_axle_limit">Front Axle Limit (kg)</Label>
                <Input
                  id="front_axle_limit"
                  type="number"
                  step="1"
                  placeholder="e.g., 3500"
                  value={formData.front_axle_limit || ""}
                  onChange={(e) =>
                    updateField("front_axle_limit", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rear_axle_limit">Rear Axle Limit (kg)</Label>
                <Input
                  id="rear_axle_limit"
                  type="number"
                  step="1"
                  placeholder="e.g., 5500"
                  value={formData.rear_axle_limit || ""}
                  onChange={(e) =>
                    updateField("rear_axle_limit", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {truckId ? "Update Profile" : "Create Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

