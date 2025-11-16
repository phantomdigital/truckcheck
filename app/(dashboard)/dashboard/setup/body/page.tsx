import type { Metadata } from "next"
import { BodyTypeSelectionClient } from "./body-type-selection-client"
import { Suspense } from "react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Select Body Type | Load Calculator Setup",
  description: "Choose your truck body type: pantech, refrigerated, curtainsider, or flatbed.",
}

// Loading skeleton for body type selection
function BodyTypeSelectionSkeleton() {
  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Body Type</TableHead>
            <TableHead>Wall Thickness</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i} className="animate-pulse">
              <TableCell>
                <div className="w-4 h-4 bg-muted/50 rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-muted/50 rounded" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 bg-muted/50 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-muted/50 rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Body Type Selection Page - Step 3 of setup
 * Server Component
 */
export default function BodyTypeSelectionPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <div className="w-full max-w-400 mx-auto px-4 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step 3 of 3</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Select Your Body Type
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose the type of body on your truck. This affects wall thickness and available internal dimensions.
              </p>
            </div>
          </div>

          {/* Body Type Selection */}
          <Suspense fallback={<BodyTypeSelectionSkeleton />}>
            <BodyTypeSelectionClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

