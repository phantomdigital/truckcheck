"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TruckConfig } from "@/lib/load-calculator/truck-config"
import { ArrowRight, Check } from "lucide-react"

interface ModelSelectionClientProps {
  models: TruckConfig[]
  manufacturer: string
}

export function ModelSelectionClient({ models, manufacturer }: ModelSelectionClientProps) {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const handleContinue = () => {
    if (selectedModel) {
      router.push(`/dashboard/setup/body?manufacturer=${manufacturer}&model=${encodeURIComponent(selectedModel)}`)
    }
  }

  if (models.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">No models available for this manufacturer yet.</p>
        </div>
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Models Table */}
      <div className="rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Wheelbase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => {
              const modelId = `${model.manufacturer}-${model.model}`.toLowerCase().replace(/\s+/g, "-")
              const isSelected = selectedModel === modelId

              return (
                <TableRow
                  key={modelId}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedModel(modelId)}
                >
                  <TableCell>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {model.manufacturer} {model.model}
                  </TableCell>
                  <TableCell className="text-right">
                    {model.wb}mm
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Select your model:</strong> All specifications are from manufacturer data. 
          You'll configure body type and weighbridge readings in the next steps.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={() => router.back()}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedModel}
          className="gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

