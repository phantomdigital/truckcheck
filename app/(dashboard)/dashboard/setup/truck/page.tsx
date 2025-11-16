import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ModelSelectionClient } from "./model-selection-client"
import { ISUZU_FVR_170_300, FUSO_SHOGUN_FS76 } from "@/lib/load-calculator/truck-config"

export const metadata: Metadata = {
  title: "Select Model | Load Calculator Setup",
  description: "Choose your truck model and wheelbase configuration.",
}

/**
 * Model Selection Page - Step 2 of setup (redirected from /setup/model)
 * Server Component
 */
export default async function ModelSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer?: string }>
}) {
  const params = await searchParams
  const manufacturer = params.manufacturer

  // Redirect if no manufacturer selected
  if (!manufacturer) {
    redirect("/dashboard/setup/manufacturer")
  }

  // Get available models for the manufacturer
  const availableModels = 
    manufacturer === "isuzu" ? [ISUZU_FVR_170_300] :
    manufacturer === "fuso" ? [FUSO_SHOGUN_FS76] :
    []

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <div className="w-full max-w-400 mx-auto px-4 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step 2 of 3</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Select Model & Wheelbase
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your truck model and wheelbase configuration. Specifications are pre-filled from manufacturer data.
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <ModelSelectionClient models={availableModels} manufacturer={manufacturer} />
        </div>
      </div>
    </div>
  )
}

