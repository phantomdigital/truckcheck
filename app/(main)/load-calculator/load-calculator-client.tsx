"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TruckCanvasKonva as TruckCanvas, PalletPanel, WeightPanel } from "@/components/load-calculator"
import { DashboardSidebar } from "@/components/load-calculator/dashboard-sidebar"
import { DraggableWindow } from "@/components/load-calculator/draggable-window"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import type { TruckProfile, Pallet, LoadCalculation, BodyType } from "@/lib/load-calculator/types"
import { SuspensionType } from "@/lib/load-calculator/types"
import { calculateWeightDistribution, findFreePosition } from "@/lib/load-calculator/physics"
import { getTruckProfiles, saveLoadCalculation, getLoadCalculations, createTruckProfile } from "@/lib/load-calculator/actions"
import { AlertCircle, Plus, Save, Truck, ExternalLink, History } from "lucide-react"
import { toast } from "sonner"

interface LoadCalculatorClientProps {
  initialProfiles?: TruckProfile[]
}

export default function LoadCalculatorClient({ initialProfiles = [] }: LoadCalculatorClientProps) {
  const searchParams = useSearchParams()
  const [truckProfiles, setTruckProfiles] = useState<TruckProfile[]>(initialProfiles)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null)
  const [newTruckData, setNewTruckData] = useState<TruckProfile | null>(null)
  const [pallets, setPallets] = useState<Pallet[]>([])
  const [selectedPalletId, setSelectedPalletId] = useState<string | null>(null)
  const [frontAxleWeight, setFrontAxleWeight] = useState<number>(0) // stored in kg
  const [rearAxleWeight, setRearAxleWeight] = useState<number>(0) // stored in kg
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [calculationName, setCalculationName] = useState("")
  const [calculationHistory, setCalculationHistory] = useState<LoadCalculation[]>([])
  const [loading, setLoading] = useState(false)
  const [openWindows, setOpenWindows] = useState<Set<string>>(new Set())
  const [windowPositions, setWindowPositions] = useState<Record<string, { x: number; y: number }>>({})

  // Load truck profiles and check for new truck from wizard
  useEffect(() => {
    if (initialProfiles.length === 0) {
      loadTruckProfiles()
    }
    
      // Check if coming from wizard with new truck data
      if (searchParams.get('new') === 'true') {
        const truckData: TruckProfile = {
          name: searchParams.get('name') || '',
          body_type: searchParams.get('body_type') as BodyType,
          body_length: parseFloat(searchParams.get('body_length') || '0'),
          body_width: parseFloat(searchParams.get('body_width') || '0'),
          wheelbase: parseFloat(searchParams.get('wheelbase') || '0'),
          front_overhang: parseFloat(searchParams.get('front_overhang') || '0'),
          gvm: parseFloat(searchParams.get('gvm') || '0'),
          front_axle_limit: parseFloat(searchParams.get('front_axle_limit') || '0'),
          rear_axle_limit: parseFloat(searchParams.get('rear_axle_limit') || '0'),
          tare_weight: 0, // Will be calculated from user input
          front_tare_weight: 0, // User will enter
          rear_tare_weight: 0, // User will enter
          suspension_type: (searchParams.get('suspension_type') as SuspensionType) || SuspensionType.STEEL,
        }
        
        // Add optional manufacturer dimensions if available (for accurate positioning)
        const cabToAxle = searchParams.get('cab_to_axle')
        if (cabToAxle) {
          truckData.cab_to_axle = parseFloat(cabToAxle)
        }
        
        const rearOverhang = searchParams.get('rear_overhang')
        if (rearOverhang) {
          truckData.rear_overhang = parseFloat(rearOverhang)
        }
        
        setNewTruckData(truckData)
        toast.info("Enter your axle weights below to start calculating")
      }
  }, [searchParams])

  const loadTruckProfiles = async () => {
    const result = await getTruckProfiles()
    if (result.success && result.profiles) {
      setTruckProfiles(result.profiles)
      if (result.profiles.length > 0 && !selectedTruckId) {
        setSelectedTruckId(result.profiles[0].id!)
      }
    }
  }

  const loadHistory = async () => {
    const result = await getLoadCalculations()
    if (result.success && result.calculations) {
      setCalculationHistory(result.calculations)
    }
  }

  const selectedTruck = newTruckData || truckProfiles.find((t) => t.id === selectedTruckId)

  // Update axle weights when truck changes (but only for truck selection, not newTruckData changes)
  useEffect(() => {
    if (selectedTruck && !newTruckData) {
      // Only auto-fill for existing trucks from database
      setFrontAxleWeight(selectedTruck.front_tare_weight)
      setRearAxleWeight(selectedTruck.rear_tare_weight)
    }
  }, [selectedTruckId]) // Only trigger on truck selection change, not newTruckData

  // Calculate weight distribution with user's actual axle weights
  const weightDistribution = selectedTruck
    ? calculateWeightDistribution(
        {
          ...selectedTruck,
          front_tare_weight: frontAxleWeight,
          rear_tare_weight: rearAxleWeight,
          tare_weight: frontAxleWeight + rearAxleWeight,
        },
        pallets
      )
    : null

  // Pallet management
  const handleAddPallet = (palletData: Omit<Pallet, "id">) => {
    if (!selectedTruck) return
    
    // Find a free position that doesn't overlap with existing pallets
    const freePosition = findFreePosition(palletData, pallets, selectedTruck)
    
    const newPallet: Pallet = {
      ...palletData,
      x: freePosition.x,
      y: freePosition.y,
      id: `pallet-${Date.now()}-${Math.random()}`,
    }
    setPallets([...pallets, newPallet])
    setSelectedPalletId(newPallet.id)
  }

  const handleDuplicatePallet = (id: string) => {
    if (!selectedTruck) return
    
    const originalPallet = pallets.find((p) => p.id === id)
    if (!originalPallet) return
    
    // Find a free position for the duplicate
    const freePosition = findFreePosition(originalPallet, pallets, selectedTruck)
    
    const duplicatePallet: Pallet = {
      ...originalPallet,
      x: freePosition.x,
      y: freePosition.y,
      id: `pallet-${Date.now()}-${Math.random()}`,
      name: originalPallet.name ? `${originalPallet.name} (Copy)` : undefined,
    }
    setPallets([...pallets, duplicatePallet])
    setSelectedPalletId(duplicatePallet.id)
    toast.success("Pallet duplicated")
  }

  const handleUpdatePalletPosition = (id: string, x: number, y: number) => {
    setPallets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    )
  }

  const handleUpdatePallet = (id: string, updates: Partial<Pallet>) => {
    setPallets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const handleRemovePallet = (id: string) => {
    setPallets((prev) => prev.filter((p) => p.id !== id))
    if (selectedPalletId === id) {
      setSelectedPalletId(null)
    }
  }

  // Save calculation (and truck profile if new)
  const handleSaveCalculation = async () => {
    if (!selectedTruck || !weightDistribution) {
      toast.error("Please select a truck and add some pallets")
      return
    }

    if (!calculationName.trim()) {
      toast.error("Please enter a name for this calculation")
      return
    }

    setLoading(true)
    
    try {
      let truckProfileId = selectedTruckId

      // If this is a new truck (from wizard), save it first
      if (newTruckData) {
        const truckResult = await createTruckProfile({
          ...newTruckData,
          tare_weight: frontAxleWeight + rearAxleWeight,
          front_tare_weight: frontAxleWeight,
          rear_tare_weight: rearAxleWeight,
        })

        if (truckResult.success && truckResult.profile) {
          truckProfileId = truckResult.profile.id!
          toast.success("Truck profile saved")
        } else {
          toast.error(truckResult.error || "Failed to save truck profile")
          setLoading(false)
          return
        }
      }

      // Now save the load calculation
      if (!truckProfileId) {
        toast.error("No truck profile ID")
        setLoading(false)
        return
      }

      const result = await saveLoadCalculation({
        truck_profile_id: truckProfileId,
        name: calculationName,
        pallets,
        weight_distribution: weightDistribution,
      })

      if (result.success) {
        toast.success("Load calculation saved")
        setShowSaveDialog(false)
        setCalculationName("")
        setNewTruckData(null)
        // Reload profiles to show the newly saved one
        loadTruckProfiles()
      } else {
        toast.error(result.error || "Failed to save calculation")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Load calculation from history
  const handleLoadCalculation = (calc: LoadCalculation) => {
    setSelectedTruckId(calc.truck_profile_id)
    setPallets(calc.pallets)
    setShowHistoryDialog(false)
    toast.success(`Loaded: ${calc.name}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Disclaimers */}
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important: Estimates Only</AlertTitle>
        <AlertDescription>
          These calculations are estimates based on basic physics and your truck's empty weights.
          Real-world factors like suspension type, tyre pressure, and road conditions affect actual
          weight distribution. Always verify with a weighbridge before travelling.
        </AlertDescription>
      </Alert>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <a
          href="https://www.nhvr.gov.au/safety-accreditation-compliance/mass-management"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          NHVR Mass Management
        </a>
        <span className="text-muted-foreground">•</span>
        <a
          href="https://www.nhvr.gov.au/safety-accreditation-compliance/mass-dimension-and-loading/loading-and-restraint"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Loading and Restraint Guidelines
        </a>
      </div>

      {/* Truck Selection / Creation */}
      {truckProfiles.length === 0 && !newTruckData ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Create your first truck profile to begin calculating loads.
            </p>
            <Button asChild>
              <a href="/load-calculator/setup">
                <Truck className="h-4 w-4" />
                Create Truck Profile
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 space-y-4">
          {!newTruckData && (
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="truck-select">Select Truck Profile</Label>
                <Select
                  id="truck-select"
                  value={selectedTruckId || ""}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                >
                  {truckProfiles.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.name} ({truck.body_type})
                    </option>
                  ))}
                </Select>
              </div>
              <Button variant="outline" asChild>
                <a href="/load-calculator/setup">
                  <Plus className="h-4 w-4" />
                  New Truck
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  loadHistory()
                  setShowHistoryDialog(true)
                }}
              >
                <History className="h-4 w-4" />
                Load History
              </Button>
              <Button
                onClick={() => setShowSaveDialog(true)}
                disabled={!selectedTruck || pallets.length === 0}
              >
                <Save className="h-4 w-4" />
                Save Calculation
              </Button>
            </div>
          )}

          {newTruckData && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Truck Setup</p>
                    <p className="text-xl font-bold">{newTruckData.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        loadHistory()
                        setShowHistoryDialog(true)
                      }}
                    >
                      <History className="h-4 w-4" />
                      Load History
                    </Button>
                    <Button
                      onClick={() => setShowSaveDialog(true)}
                      disabled={!selectedTruck || pallets.length === 0 || frontAxleWeight === 0 || rearAxleWeight === 0}
                    >
                      <Save className="h-4 w-4" />
                      Save Calculation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Axle Weights Input - Only fields users need to fill */}
          {selectedTruck && (
            <Card className={newTruckData ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-base">
                  {newTruckData ? "⚠️ Required: Enter Your Actual Axle Weights" : "Enter Your Actual Axle Weights"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {newTruckData 
                    ? "From your weighbridge ticket (empty truck) - Required to save"
                    : "From your weighbridge ticket (empty truck)"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="front-axle-weight" className="text-sm font-medium">
                      Front Axle Weight (tonnes)
                    </Label>
                    <Input
                      id="front-axle-weight"
                      type="number"
                      step="0.001"
                      placeholder="e.g., 3.402"
                      className="text-base"
                      value={frontAxleWeight ? (frontAxleWeight / 1000).toFixed(3) : ""}
                      onChange={(e) => {
                        const tonnes = parseFloat(e.target.value) || 0
                        setFrontAxleWeight(tonnes * 1000) // Convert tonnes to kg
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Typical: {(selectedTruck.front_tare_weight / 1000).toFixed(3)} t
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rear-axle-weight" className="text-sm font-medium">
                      Rear Axle Weight (tonnes)
                    </Label>
                    <Input
                      id="rear-axle-weight"
                      type="number"
                      step="0.001"
                      placeholder="e.g., 2.168"
                      className="text-base"
                      value={rearAxleWeight ? (rearAxleWeight / 1000).toFixed(3) : ""}
                      onChange={(e) => {
                        const tonnes = parseFloat(e.target.value) || 0
                        setRearAxleWeight(tonnes * 1000) // Convert tonnes to kg
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Typical: {(selectedTruck.rear_tare_weight / 1000).toFixed(3)} t
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs font-medium">
                    Total Tare Weight: {((frontAxleWeight + rearAxleWeight) / 1000).toFixed(3)} t ({(frontAxleWeight + rearAxleWeight).toLocaleString()} kg)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Enter your actual weights from weighbridge ticket (in tonnes). Calculations update in real-time.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dashboard Layout */}
      {selectedTruck && (
        <div className="fixed inset-0 flex" style={{ top: 0, height: "100vh" }}>
          {/* Left Dashboard Sidebar */}
          <DashboardSidebar
            palletCount={pallets.length}
            onOpenAxleWeights={() => setOpenWindows((prev) => new Set(prev).add("axle-weights"))}
            onOpenPallets={() => setOpenWindows((prev) => new Set(prev).add("pallets"))}
            onOpenWeight={() => setOpenWindows((prev) => new Set(prev).add("weight"))}
            onOpenTrucks={() => setOpenWindows((prev) => new Set(prev).add("trucks"))}
            onOpenHistory={() => {
              loadHistory()
              setShowHistoryDialog(true)
            }}
            onOpenSettings={() => setOpenWindows((prev) => new Set(prev).add("settings"))}
            onSave={() => setShowSaveDialog(true)}
            onNewTruck={() => window.location.href = "/load-calculator/setup"}
          />

          {/* Full-Screen Canvas Area */}
          <DndContext
            onDragEnd={(event: DragEndEvent) => {
              const { active, delta } = event
              const windowId = active.id.toString().replace("window-", "")
              if (windowId && delta) {
                setWindowPositions((prev) => {
                  const current = prev[windowId] || { x: 150, y: 100 }
                  return {
                    ...prev,
                    [windowId]: {
                      x: Math.max(0, current.x + delta.x),
                      y: Math.max(0, current.y + delta.y),
                    },
                  }
                })
              }
            }}
          >
            <div className="flex-1 relative overflow-hidden bg-muted/20">
              <TruckCanvas
                truck={selectedTruck}
                pallets={pallets}
                onUpdatePalletPosition={handleUpdatePalletPosition}
                selectedPalletId={selectedPalletId}
                onSelectPallet={setSelectedPalletId}
              />

              {/* Draggable Windows */}
              {openWindows.has("axle-weights") && selectedTruck && (
                <DraggableWindow
                  id="axle-weights"
                  title="Axle Weights"
                  defaultPosition={windowPositions["axle-weights"] || { x: 150, y: 50 }}
                  defaultSize={{ width: 500, height: 300 }}
                  onClose={() => setOpenWindows((prev) => {
                    const next = new Set(prev)
                    next.delete("axle-weights")
                    return next
                  })}
                >
                  <Card className="border-0 shadow-none">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="front-axle-weight" className="text-sm font-medium">
                            Front Axle Weight (tonnes)
                          </Label>
                          <Input
                            id="front-axle-weight"
                            type="number"
                            step="0.001"
                            placeholder="e.g., 3.402"
                            className="text-base"
                            value={frontAxleWeight ? (frontAxleWeight / 1000).toFixed(3) : ""}
                            onChange={(e) => {
                              const tonnes = parseFloat(e.target.value) || 0
                              setFrontAxleWeight(tonnes * 1000)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Typical: {(selectedTruck.front_tare_weight / 1000).toFixed(3)} t
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rear-axle-weight" className="text-sm font-medium">
                            Rear Axle Weight (tonnes)
                          </Label>
                          <Input
                            id="rear-axle-weight"
                            type="number"
                            step="0.001"
                            placeholder="e.g., 2.168"
                            className="text-base"
                            value={rearAxleWeight ? (rearAxleWeight / 1000).toFixed(3) : ""}
                            onChange={(e) => {
                              const tonnes = parseFloat(e.target.value) || 0
                              setRearAxleWeight(tonnes * 1000)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Typical: {(selectedTruck.rear_tare_weight / 1000).toFixed(3)} t
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium">
                          Total Tare Weight: {((frontAxleWeight + rearAxleWeight) / 1000).toFixed(3)} t ({(frontAxleWeight + rearAxleWeight).toLocaleString()} kg)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 Enter your actual weights from weighbridge ticket (in tonnes). Calculations update in real-time.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DraggableWindow>
              )}

              {openWindows.has("pallets") && (
              <DraggableWindow
                id="pallets"
                title={`Pallets (${pallets.length})`}
                defaultPosition={windowPositions["pallets"] || { x: 150, y: 100 }}
                defaultSize={{ width: 450, height: 600 }}
                onClose={() => setOpenWindows((prev) => {
                  const next = new Set(prev)
                  next.delete("pallets")
                  return next
                })}
              >
                <PalletPanel
                  pallets={pallets}
                  onAddPallet={handleAddPallet}
                  onDuplicatePallet={handleDuplicatePallet}
                  onUpdatePallet={handleUpdatePallet}
                  onRemovePallet={handleRemovePallet}
                  selectedPalletId={selectedPalletId}
                  onSelectPallet={setSelectedPalletId}
                />
              </DraggableWindow>
            )}

            {openWindows.has("weight") && weightDistribution && (
              <DraggableWindow
                id="weight"
                title="Weight Distribution"
                defaultPosition={windowPositions["weight"] || { x: 600, y: 100 }}
                defaultSize={{ width: 400, height: 500 }}
                onClose={() => setOpenWindows((prev) => {
                  const next = new Set(prev)
                  next.delete("weight")
                  return next
                })}
              >
                <WeightPanel 
                  distribution={weightDistribution} 
                  frontTareWeight={frontAxleWeight}
                  rearTareWeight={rearAxleWeight}
                  frontAxleLimit={selectedTruck.front_axle_limit}
                  rearAxleLimit={selectedTruck.rear_axle_limit}
                />
              </DraggableWindow>
            )}

            {openWindows.has("trucks") && (
              <DraggableWindow
                id="trucks"
                title="Truck Profiles"
                defaultPosition={windowPositions["trucks"] || { x: 200, y: 150 }}
                defaultSize={{ width: 500, height: 400 }}
                onClose={() => setOpenWindows((prev) => {
                  const next = new Set(prev)
                  next.delete("trucks")
                  return next
                })}
              >
                <Card className="border-0 shadow-none">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {truckProfiles.map((profile) => (
                        <Button
                          key={profile.id}
                          variant={selectedTruckId === profile.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedTruckId(profile.id!)}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          {profile.name}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.location.href = "/load-calculator/setup"}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Truck
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DraggableWindow>
            )}
            </div>
          </DndContext>
        </div>
      )}

      {/* Save Calculation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Load Calculation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="calc-name">Calculation Name</Label>
              <Input
                id="calc-name"
                placeholder="e.g., Friday Perth Run"
                value={calculationName}
                onChange={(e) => setCalculationName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCalculation} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Calculation History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            {calculationHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No saved calculations yet
              </p>
            ) : (
              calculationHistory.map((calc) => (
                <Card
                  key={calc.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleLoadCalculation(calc)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{calc.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {calc.truck_profile?.name} • {calc.pallets.length} pallets •{" "}
                      {new Date(calc.created_at!).toLocaleDateString()}
                    </p>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

