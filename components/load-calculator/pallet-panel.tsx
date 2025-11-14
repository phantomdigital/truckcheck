"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Pallet } from "@/lib/load-calculator/types"
import { formatWeight, formatDimension } from "@/lib/load-calculator/physics"
import { Plus, Trash2, Edit2, Check, X, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface PalletPanelProps {
  pallets: Pallet[]
  onAddPallet: (pallet: Omit<Pallet, "id">) => void
  onDuplicatePallet: (id: string) => void
  onUpdatePallet: (id: string, pallet: Partial<Pallet>) => void
  onRemovePallet: (id: string) => void
  selectedPalletId?: string | null
  onSelectPallet?: (id: string | null) => void
}

// Common Australian pallet sizes
const COMMON_PALLET_SIZES = [
  { name: "Standard (1165×1165)", length: 1.165, width: 1.165 },
  { name: "Euro (1200×800)", length: 1.2, width: 0.8 },
  { name: "Half (600×800)", length: 0.6, width: 0.8 },
  { name: "Quarter (600×400)", length: 0.6, width: 0.4 },
]

export function PalletPanel({
  pallets,
  onAddPallet,
  onDuplicatePallet,
  onUpdatePallet,
  onRemovePallet,
  selectedPalletId,
  onSelectPallet,
}: PalletPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    length: 1.165,
    width: 1.165,
    weight: 500,
    color: "#60a5fa",
  })

  const handleAddPallet = () => {
    onAddPallet({
      ...formData,
      x: 0,
      y: 0,
    })
    setFormData({
      name: "",
      length: 1.165,
      width: 1.165,
      weight: 500,
      color: "#60a5fa",
    })
    setShowAddForm(false)
  }

  const handleQuickAdd = (size: { length: number; width: number }) => {
    onAddPallet({
      length: size.length,
      width: size.width,
      weight: 500,
      x: 0,
      y: 0,
      color: "#60a5fa",
    })
  }

  const totalWeight = pallets.reduce((sum, p) => sum + p.weight, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pallets</CardTitle>
          <Badge variant="secondary">{pallets.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Load Weight */}
        {pallets.length > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">
              Total Load: <span className="text-primary">{formatWeight(totalWeight)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click <Edit2 className="inline h-3 w-3" /> to edit weight/size
            </p>
          </div>
        )}

        {/* Pallet List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {pallets.map((pallet) => (
            <div
              key={pallet.id}
              className={cn(
                "p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted/50",
                selectedPalletId === pallet.id && "ring-2 ring-primary bg-muted/50"
              )}
              onClick={() => onSelectPallet?.(pallet.id)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: pallet.color || "#60a5fa" }}
                      />
                      <p className="text-sm font-medium truncate">
                        {pallet.name || `Pallet ${pallets.indexOf(pallet) + 1}`}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        {formatDimension(pallet.length)} × {formatDimension(pallet.width)}
                      </p>
                      <p>
                        Position: {pallet.x.toFixed(2)}m, {pallet.y.toFixed(2)}m
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(pallet.id === editingId ? null : pallet.id)
                      }}
                      className="h-8 w-8 flex-shrink-0"
                      title="Edit pallet"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicatePallet(pallet.id)
                      }}
                      className="h-8 w-8 flex-shrink-0"
                      title="Duplicate pallet"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemovePallet(pallet.id)
                      }}
                      className="h-8 w-8 flex-shrink-0"
                      title="Delete pallet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editingId === pallet.id && (
                  <div className="pl-6 space-y-2 pb-2">
                    <div className="space-y-1">
                      <Label htmlFor={`edit-weight-${pallet.id}`} className="text-xs">
                        Weight (kg)
                      </Label>
                      <Input
                        id={`edit-weight-${pallet.id}`}
                        type="number"
                        step="1"
                        value={pallet.weight}
                        onChange={(e) => {
                          const newWeight = parseFloat(e.target.value) || 0
                          onUpdatePallet(pallet.id, { weight: newWeight })
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`edit-length-${pallet.id}`} className="text-xs">
                          Length (m)
                        </Label>
                        <Input
                          id={`edit-length-${pallet.id}`}
                          type="number"
                          step="0.01"
                          value={pallet.length}
                          onChange={(e) => {
                            const newLength = parseFloat(e.target.value) || 0
                            onUpdatePallet(pallet.id, { length: newLength })
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-width-${pallet.id}`} className="text-xs">
                          Width (m)
                        </Label>
                        <Input
                          id={`edit-width-${pallet.id}`}
                          type="number"
                          step="0.01"
                          value={pallet.width}
                          onChange={(e) => {
                            const newWidth = parseFloat(e.target.value) || 0
                            onUpdatePallet(pallet.id, { width: newWidth })
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      className="w-full h-7 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Add Buttons */}
        {!showAddForm && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quick Add:</p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_PALLET_SIZES.map((size, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAdd(size)}
                  className="text-xs h-auto py-2"
                >
                  <Plus className="h-3 w-3" />
                  {size.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Pallet */}
        {showAddForm ? (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="text-sm font-medium">Add Custom Pallet</h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pallet-name" className="text-xs">
                  Name (optional)
                </Label>
                <Input
                  id="pallet-name"
                  placeholder="e.g., Frozen goods"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="pallet-length" className="text-xs">
                    Length (m)
                  </Label>
                  <Input
                    id="pallet-length"
                    type="number"
                    step="0.01"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pallet-width" className="text-xs">
                    Width (m)
                  </Label>
                  <Input
                    id="pallet-width"
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pallet-weight" className="text-xs">
                  Weight (kg)
                </Label>
                <Input
                  id="pallet-weight"
                  type="number"
                  step="1"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })
                  }
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pallet-color" className="text-xs">
                  Colour
                </Label>
                <div className="flex gap-2">
                  {["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f87171"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded border-2 transition-all",
                        formData.color === color
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddPallet}
                disabled={!formData.length || !formData.width || !formData.weight}
              >
                <Check className="h-4 w-4" />
                Add Pallet
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4" />
            Add Custom Pallet
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

