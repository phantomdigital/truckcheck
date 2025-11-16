import type { Metadata } from "next"
import { ManufacturerSelectionClient } from "./manufacturer-selection-client"

export const metadata: Metadata = {
  title: "Select Manufacturer | Load Calculator Setup",
  description: "Choose your truck manufacturer brand.",
}

/**
 * Manufacturer Selection Page - Step 1 of setup
 * Server Component
 */
export default function ManufacturerSelectionPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <div className="w-full max-w-400 mx-auto px-4 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step 1 of 3</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Select Your Truck Brand
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your truck manufacturer to see available models.
              </p>
            </div>
          </div>

          {/* Manufacturer Selection */}
          <ManufacturerSelectionClient />
        </div>
      </div>
    </div>
  )
}

