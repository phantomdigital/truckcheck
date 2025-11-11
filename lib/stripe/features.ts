import { 
  Sparkles, 
  MapPin, 
  History, 
  FileSpreadsheet, 
  FileDown, 
  Archive,
  EyeOff,
  LucideIcon
} from "lucide-react"

export interface ProFeature {
  title: string
  description: string
  icon: LucideIcon
  shortLabel?: string
}

/**
 * Pro features with detailed descriptions for the success page
 */
export const PRO_FEATURES: ProFeature[] = [
  {
    title: "Unlimited Stops",
    description: "Add as many stops as you need to your route",
    icon: MapPin,
    shortLabel: "Multiple Stops",
  },
  {
    title: "Calculation History",
    description: "Save and access your previous calculations anytime",
    icon: History,
    shortLabel: "Calculation History (90 days)",
  },
  {
    title: "CSV Import/Export",
    description: "Bulk import stops and export your routes",
    icon: FileSpreadsheet,
    shortLabel: "CSV Batch Import",
  },
  {
    title: "PDF Reports",
    description: "Generate professional PDF reports with maps",
    icon: FileDown,
    shortLabel: "PDF Export",
  },
  {
    title: "Recent Searches",
    description: "Quick access to your frequently used depots",
    icon: Archive,
    shortLabel: "Recent Searches",
  },
  {
    title: "Ad-Free Experience",
    description: "Enjoy TruckCheck without any advertisements",
    icon: EyeOff,
    shortLabel: "Ad-free Experience",
  },
]

/**
 * Simple feature labels for the pricing page
 */
export const PRO_FEATURE_LABELS = [
  "Everything in Free",
  "100km Radius Map Overlay",
  ...PRO_FEATURES.map(f => f.shortLabel || f.title),
]

