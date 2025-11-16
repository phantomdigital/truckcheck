"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRight, Check } from "lucide-react"

interface BodyType {
  id: string
  name: string
  wallThickness: number // mm - for bodies with walls
}

const BODY_TYPES: BodyType[] = [
  {
    id: "pantech",
    name: "Pantech",
    wallThickness: 50,
  },
  {
    id: "refrigerated",
    name: "Refrigerated",
    wallThickness: 75,
  },
  {
    id: "curtainsider",
    name: "Curtainsider",
    wallThickness: 20,
  },
  {
    id: "flatbed",
    name: "Flatbed / Tray",
    wallThickness: 0,
  },
]

export function BodyTypeSelectionClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null)

  const manufacturerParam = searchParams.get("manufacturer")
  const modelParam = searchParams.get("model")

  const handleContinue = () => {
    if (selectedBodyType) {
      // Store selections in URL params and navigate to dashboard
      const params = new URLSearchParams()
      if (manufacturerParam) params.set("manufacturer", manufacturerParam)
      if (modelParam) params.set("model", modelParam)
      params.set("bodyType", selectedBodyType)
      
      router.push(`/dashboard?${params.toString()}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Body Types Table */}
      <div className="rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Body Type</TableHead>
              <TableHead className="text-right">Wall Thickness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BODY_TYPES.map((bodyType) => {
              const isSelected = selectedBodyType === bodyType.id

              return (
                <TableRow
                  key={bodyType.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedBodyType(bodyType.id)}
                >
                  <TableCell>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {bodyType.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {bodyType.wallThickness > 0 ? `${bodyType.wallThickness}mm` : "None"}
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
          <strong className="text-foreground">Wall thickness matters:</strong> Bodies with thicker walls reduce internal cargo space. 
          We'll account for this in your load calculations.
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
          disabled={!selectedBodyType}
          className="gap-2"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

