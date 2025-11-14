"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { BodyType, SuspensionType, type TruckProfileFormData } from "@/lib/load-calculator/types"
import { createTruckProfile } from "@/lib/load-calculator/actions"
import { 
  getManufacturers, 
  getTruckModelsByManufacturer,
  getTypicalTareDistribution,
  type TruckModelSpec 
} from "@/lib/load-calculator/truck-presets"
import { toast } from "sonner"
import { Loader2, Sparkles, Truck, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react"

type WizardStep = 1 | 2 | 3

export function TruckSetupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [loading, setLoading] = useState(false)
  const [usePreset, setUsePreset] = useState(true)
  
  // Preset selection
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<TruckModelSpec | null>(null)
  const [selectedWheelbase, setSelectedWheelbase] = useState<number | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<TruckProfileFormData>({
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
  })

  const manufacturers = getManufacturers()
  const availableModels = selectedManufacturer 
    ? getTruckModelsByManufacturer(selectedManufacturer)
    : []

  const updateField = <K extends keyof TruckProfileFormData>(
    field: K,
    value: TruckProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle model selection and auto-fill
  const handleModelSelect = (model: TruckModelSpec) => {
    setSelectedModel(model)
    
    // Auto-fill name
    const modelName = `${model.manufacturer} ${model.model}${model.series ? ` ${model.series}` : ""}`
    updateField("name", modelName)
    
    // Auto-fill typical values
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
  }

  // Handle wheelbase selection
  const handleWheelbaseSelect = (wheelbase: number) => {
    if (!selectedModel) return
    
    const wheelbaseIndex = selectedModel.wheelbase_options.indexOf(wheelbase)
    setSelectedWheelbase(wheelbase)
    updateField("wheelbase", wheelbase)
    
    // Set corresponding cab_to_axle value from spec sheet
    if (wheelbaseIndex >= 0 && selectedModel.cab_to_axle_options[wheelbaseIndex]) {
      const cabToAxle = selectedModel.cab_to_axle_options[wheelbaseIndex]
      updateField("cab_to_axle", cabToAxle)
      
      // Calculate body length from CA + ROH (more accurate than estimation)
      const bodyLength = cabToAxle + selectedModel.typical_rear_overhang
      updateField("body_length", bodyLength)
      updateField("rear_overhang", selectedModel.typical_rear_overhang)
    } else {
      // Fallback: estimate body length
      const estimatedBodyLength = wheelbase + formData.front_overhang + 1.5
      updateField("body_length", estimatedBodyLength)
    }
  }

  // Validation for each step
  const canProceedFromStep1 = () => {
    if (!usePreset) return true
    return !!(selectedManufacturer && selectedModel)
  }

  const canProceedFromStep2 = () => {
    if (!usePreset) return true
    return !!selectedWheelbase
  }

  const canProceedFromStep3 = () => {
    return !!(
      formData.name &&
      formData.body_length > 0 &&
      formData.body_width > 0 &&
      formData.wheelbase > 0 &&
      formData.gvm > 0 &&
      formData.front_axle_limit > 0 &&
      formData.rear_axle_limit > 0
    )
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleStartLoading = async () => {
    setLoading(true)
    try {
      // Save truck profile to database immediately
      const result = await createTruckProfile(formData)
      
      if (result.success && result.profile?.id) {
        toast.success("Truck profile created")
        // Redirect to dashboard with just the truck ID
        router.push(`/load-calculator/app?truck=${result.profile.id}`)
      } else {
        toast.error(result.error || "Failed to save truck profile")
        setLoading(false)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      setLoading(false)
    }
  }

  const progress = (currentStep / 3) * 100

  const steps = [
    { number: 1, title: "Select Truck", description: "Choose manufacturer & model" },
    { number: 2, title: "Wheelbase", description: "Select ADR wheelbase" },
    { number: 3, title: "Confirm", description: "Review & save" },
  ]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Step {currentStep} of 3</span>
          <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators - Desktop */}
        <div className="hidden md:flex items-center justify-between pt-2">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground hidden lg:block">{step.description}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Manufacturer & Model */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Quick Setup with Manufacturer Data</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUsePreset(!usePreset)
                    if (!usePreset) {
                      // Reset when switching back to presets
                      setSelectedManufacturer("")
                      setSelectedModel(null)
                      setSelectedWheelbase(null)
                    }
                  }}
                >
                  {usePreset ? "Enter manually" : "Use presets"}
                </Button>
              </div>

              {usePreset ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Select
                      id="manufacturer"
                      value={selectedManufacturer}
                      onChange={(e) => {
                        setSelectedManufacturer(e.target.value)
                        setSelectedModel(null)
                      }}
                      className="text-base"
                    >
                      <option value="">Select manufacturer...</option>
                      {manufacturers.map((mfr) => (
                        <option key={mfr} value={mfr}>
                          {mfr}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedManufacturer && (
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select
                        id="model"
                        value={selectedModel ? availableModels.indexOf(selectedModel).toString() : ""}
                        onChange={(e) => {
                          const model = availableModels[parseInt(e.target.value)]
                          if (model) {
                            handleModelSelect(model)
                            toast.success("Specifications pre-filled from manufacturer data")
                          }
                        }}
                        className="text-base"
                      >
                        <option value="">Select model...</option>
                        {availableModels.map((model, idx) => (
                          <option key={idx} value={idx}>
                            {model.model} {model.series && `(${model.series})`}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {selectedModel && (
                    <Alert>
                      <Truck className="h-4 w-4" />
                      <AlertTitle>Model Selected: {selectedModel.model}</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{selectedModel.notes || "Specifications loaded from manufacturer data."}</p>
                        <ul className="text-xs space-y-1">
                          <li>• GVM: {selectedModel.gvm_range.min.toLocaleString()} - {selectedModel.gvm_range.max.toLocaleString()} kg</li>
                          <li>• Available wheelbases: {selectedModel.wheelbase_options.join("m, ")}m</li>
                          {selectedModel.common_applications && (
                            <li>• Common uses: {selectedModel.common_applications.join(", ")}</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Manual Entry</AlertTitle>
                    <AlertDescription>
                      You'll need to enter all truck specifications manually. This is useful for older trucks or custom configurations.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manual-name">Truck Name</Label>
                    <Input
                      id="manual-name"
                      placeholder="e.g., Isuzu FRR500"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Wheelbase */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {usePreset && selectedModel ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>ADR Compliant Wheelbases</AlertTitle>
                    <AlertDescription>
                      These are the factory-specified wheelbases that comply with Australian Design Rules (ADR) for the {selectedModel.model}.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Select Wheelbase</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedModel.wheelbase_options.map((wb) => (
                        <button
                          key={wb}
                          type="button"
                          onClick={() => handleWheelbaseSelect(wb)}
                          className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                            selectedWheelbase === wb
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl font-bold">{wb.toFixed(3)}m</span>
                            <Badge variant="secondary">ADR</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {wb === selectedModel.wheelbase_options[0] && "Shorter wheelbase"}
                            {wb === selectedModel.wheelbase_options[selectedModel.wheelbase_options.length - 1] && 
                             wb !== selectedModel.wheelbase_options[0] && "Longer wheelbase"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-wheelbase">Wheelbase (metres)</Label>
                    <Input
                      id="manual-wheelbase"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 4.50"
                      value={formData.wheelbase || ""}
                      onChange={(e) => updateField("wheelbase", parseFloat(e.target.value) || 0)}
                      className="text-base"
                    />
                    <p className="text-sm text-muted-foreground">
                      Distance from front axle to rear axle
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>Confirm Truck Profile</AlertTitle>
                <AlertDescription>
                  This will create a truck profile template. Users will enter their actual axle weights when using it.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Truck Model</h3>
                  <p className="text-2xl font-bold">{formData.name}</p>
                  {selectedModel && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedModel.notes || selectedModel.common_applications?.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wizard-body-type">Body Type</Label>
                      <Select
                        id="wizard-body-type"
                        value={formData.body_type}
                        onChange={(e) => updateField("body_type", e.target.value as BodyType)}
                        className="text-base"
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
                      <Label htmlFor="wizard-suspension-type">Suspension Type</Label>
                      <Select
                        id="wizard-suspension-type"
                        value={formData.suspension_type}
                        onChange={(e) => updateField("suspension_type", e.target.value as SuspensionType)}
                        className="text-base"
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

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 text-sm">Specifications</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Wheelbase:</dt>
                        <dd className="font-medium">{formData.wheelbase.toFixed(2)}m</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Body:</dt>
                        <dd className="font-medium">{formData.body_length.toFixed(2)}m × {formData.body_width.toFixed(2)}m</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">GVM:</dt>
                        <dd className="font-medium">{formData.gvm.toLocaleString()} kg</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-sm">Axle Limits</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Front:</dt>
                        <dd className="font-medium">{formData.front_axle_limit.toLocaleString()} kg</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Rear:</dt>
                        <dd className="font-medium">{formData.rear_axle_limit.toLocaleString()} kg</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total:</dt>
                        <dd className="font-medium">{(formData.front_axle_limit + formData.rear_axle_limit).toLocaleString()} kg</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Next Step</AlertTitle>
                  <AlertDescription>
                    Click "Start Loading" to see the truck canvas. You'll enter axle weights and position pallets. The profile saves when you click "Save Calculation" later.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="min-w-[100px]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !canProceedFromStep1()) ||
              (currentStep === 2 && !canProceedFromStep2())
            }
            className="min-w-[100px]"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleStartLoading}
            disabled={!canProceedFromStep3()}
            className="min-w-[100px]"
          >
            <Truck className="h-4 w-4" />
            Start Loading
          </Button>
        )}
      </div>
    </div>
  )
}

