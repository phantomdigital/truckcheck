"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { validateCSVImport } from "@/lib/stripe/actions"
import type { GeocodeResult, Stop } from "@/lib/logbook/types"
import { geocodeAddress } from "@/lib/logbook/utils"
interface CSVImportModalProps {
  onImport: (baseLocation: GeocodeResult, stops: Stop[]) => void
  disabled?: boolean
  isPro?: boolean
}

interface ColumnMapping {
  baseLocation: number | null
  stops: number[]
}

export function CSVImportModal({ onImport, disabled, isPro = false }: CSVImportModalProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    baseLocation: null,
    stops: [],
  })
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const parseCSV = (csvText: string): { headers: string[]; rows: string[][] } => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      throw new Error("CSV file is empty")
    }

    const parsedRows: string[][] = []

    // Parse CSV line (handle quoted values)
    const parseLine = (line: string): string[] => {
      const values: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim())
      return values
    }

    // Check if first line is headers
    const firstLine = lines[0].toLowerCase()
    const hasHeaders =
      firstLine.includes("base") ||
      firstLine.includes("location") ||
      firstLine.includes("stop") ||
      firstLine.includes("address") ||
      firstLine.includes("destination")

    const headerLine = hasHeaders ? lines[0] : null
    const dataLines = hasHeaders ? lines.slice(1) : lines

    const parsedHeaders = headerLine ? parseLine(headerLine) : parseLine(dataLines[0] || "").map((_, i) => `Column ${i + 1}`)

    for (const line of dataLines) {
      if (!line.trim()) continue
      const values = parseLine(line)
      if (values.length > 0 && values.some((v) => v)) {
        parsedRows.push(values)
      }
    }

    return { headers: parsedHeaders, rows: parsedRows }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a CSV file")
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
    setColumnMapping({ baseLocation: null, stops: [] })

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string
        const { headers: parsedHeaders, rows: parsedRows } = parseCSV(csvText)
        
        if (parsedRows.length === 0) {
          setError("No valid data found in CSV file")
          return
        }

        setHeaders(parsedHeaders)
        setRows(parsedRows)

        // Auto-detect address columns by analyzing both headers and content
        const addressKeywords = [
          "address", "location", "city", "suburb", "town", "place", "destination",
          "stop", "waypoint", "delivery", "pickup", "drop", "site", "venue",
          "base", "origin", "start", "depot", "warehouse", "facility", "street",
          "road", "avenue", "drive", "state", "postcode", "postal", "zip"
        ]
        
        // Check if a value looks like an address
        const looksLikeAddress = (value: string): boolean => {
          if (!value || value.trim().length < 3) return false
          // Has letters (not just numbers or special chars)
          if (!/[A-Za-z]/.test(value)) return false
          // Common address patterns: contains city names, street names, or location words
          const addressPatterns = [
            /\d+\s+[A-Za-z]+/, // "123 Main Street"
            /[A-Za-z]+\s+[A-Za-z]+/, // "Sydney NSW" or "Melbourne Victoria"
            /(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)/i, // Australian states
            /\d{4}/, // Postcodes
          ]
          return addressPatterns.some(pattern => pattern.test(value)) || value.length > 5
        }
        
        const addressColumns = parsedHeaders
          .map((header, index) => {
            const headerLower = header.toLowerCase()
            const sampleValue = parsedRows[0]?.[index] || ""
            
            // Score based on header keywords
            const headerScore = addressKeywords.reduce((score, keyword) => {
              if (headerLower.includes(keyword)) {
                return score + 1
              }
              return score
            }, 0)
            
            // Score based on content analysis
            const contentScore = looksLikeAddress(sampleValue) ? 2 : 0
            
            return {
              index,
              header: headerLower,
              originalHeader: header,
              score: headerScore + contentScore,
              sampleValue,
            }
          })
          .filter(col => col.score > 0 || looksLikeAddress(col.sampleValue))
          .sort((a, b) => b.score - a.score)

        // Find base location (prioritize: base, origin, start, depot, warehouse)
        const baseKeywords = ["base", "origin", "start", "depot", "warehouse", "facility", "home"]
        const baseColumn = addressColumns.find(col => 
          baseKeywords.some(keyword => col.header.includes(keyword))
        ) || addressColumns[0] // Fallback to first address column

        // All other address columns become stops
        const stopColumns = addressColumns
          .filter(col => col.index !== baseColumn?.index)
          .map(col => col.index)

        if (baseColumn) {
          setColumnMapping({
            baseLocation: baseColumn.index,
            stops: stopColumns,
          })
        } else if (parsedHeaders.length > 0) {
          // If no address columns detected, check all columns for address-like content
          const allAddressColumns = parsedHeaders
            .map((header, index) => ({
              index,
              value: parsedRows[0]?.[index] || "",
            }))
            .filter(col => looksLikeAddress(col.value))
            .map(col => col.index)
          
          if (allAddressColumns.length > 0) {
            setColumnMapping({
              baseLocation: allAddressColumns[0],
              stops: allAddressColumns.slice(1),
            })
          } else {
            // Last resort: use first column as base, rest as stops
            setColumnMapping({
              baseLocation: 0,
              stops: parsedHeaders.slice(1).map((_, i) => i + 1),
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error parsing CSV file")
        setHeaders([])
        setRows([])
      }
    }
    reader.readAsText(selectedFile)
  }

  const toggleBaseLocation = (columnIndex: number) => {
    setColumnMapping((prev) => {
      if (prev.baseLocation === columnIndex) {
        return { ...prev, baseLocation: null }
      }
      // Remove from stops if it was there
      const newStops = prev.stops.filter((i) => i !== columnIndex)
      return { baseLocation: columnIndex, stops: newStops }
    })
  }

  const toggleStop = (columnIndex: number) => {
    setColumnMapping((prev) => {
      if (prev.baseLocation === columnIndex) {
        return prev // Can't be both base and stop
      }
      if (prev.stops.includes(columnIndex)) {
        return { ...prev, stops: prev.stops.filter((i) => i !== columnIndex) }
      }
      return { ...prev, stops: [...prev.stops, columnIndex] }
    })
  }

  const handleImport = async () => {
    // SECURITY: Server-side validation before allowing CSV import
    const validation = await validateCSVImport()
    if (!validation.success) {
      setError(validation.error || 'Pro subscription required to import CSV')
      return
    }
    
    if (rows.length === 0) {
      setError("No data to import")
      return
    }

    if (columnMapping.baseLocation === null) {
      setError("Please assign a base location column")
      return
    }

    if (columnMapping.stops.length === 0) {
      setError("Please assign at least one stop column")
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(false)

    try {
      // Use first row for import
      const row = rows[0]

      // Get base location
      const baseLocationValue = row[columnMapping.baseLocation]
      if (!baseLocationValue) {
        throw new Error("Base location is empty")
      }

      // Geocode base location
      const baseLocation = await geocodeAddress(baseLocationValue)

      // Geocode all stops
      const geocodedStops: Stop[] = []
      for (let i = 0; i < columnMapping.stops.length; i++) {
        const stopIndex = columnMapping.stops[i]
        const stopValue = row[stopIndex]
        if (!stopValue) continue

        try {
          const location = await geocodeAddress(stopValue)
          geocodedStops.push({
            id: `stop-${Date.now()}-${i}`,
            address: stopValue,
            location,
          })
        } catch (err) {
          throw new Error(`Could not geocode stop: ${stopValue}`)
        }
      }

      if (geocodedStops.length === 0) {
        throw new Error("No valid stops found")
      }

      // Call onImport callback
      onImport(baseLocation, geocodedStops)

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setFile(null)
        setHeaders([])
        setRows([])
        setColumnMapping({ baseLocation: null, stops: [] })
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error importing data")
    } finally {
      setImporting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closing
      setFile(null)
      setHeaders([])
      setRows([])
      setColumnMapping({ baseLocation: null, stops: [] })
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !isPro}
          className="gap-2"
          title={!isPro ? "Pro feature - Upgrade to unlock" : undefined}
        >
          <Upload className="h-4 w-4" />
          {!isPro ? "Import CSV (Pro)" : "Import CSV"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Routes from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and assign columns to base location and stops.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file" className="text-sm font-medium">
              Select CSV File
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                disabled={importing}
              />
            </div>
          </div>

          {headers.length > 0 && rows.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign Columns</Label>
                <div className="text-xs text-muted-foreground">
                  Click columns to assign them as base location or stops
                </div>
              </div>

              <div className="space-y-2">
                {headers.map((header, index) => {
                  const isBase = columnMapping.baseLocation === index
                  const isStop = columnMapping.stops.includes(index)
                  const sampleValue = rows[0]?.[index] || ""

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border border-border/50 transition-colors ${
                        isBase
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500/50"
                          : isStop
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500/50"
                          : "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              Column {index + 1}
                            </span>
                            <span className="text-sm font-semibold truncate">{header}</span>
                          </div>
                          {sampleValue && (
                            <div className="text-xs text-muted-foreground truncate">
                              Sample: {sampleValue}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            type="button"
                            variant={isBase ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleBaseLocation(index)}
                            className="text-xs h-7"
                            disabled={importing}
                          >
                            {isBase ? "Base" : "Set Base"}
                          </Button>
                          <Button
                            type="button"
                            variant={isStop ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleStop(index)}
                            className="text-xs h-7"
                            disabled={importing || isBase}
                          >
                            {isStop ? "Stop" : "Add Stop"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {columnMapping.baseLocation !== null && columnMapping.stops.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Base:</span>{" "}
                      {rows[0]?.[columnMapping.baseLocation]}
                    </div>
                    <div>
                      <span className="font-medium">Stops:</span> {columnMapping.stops.length} stop(s)
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {columnMapping.stops.map((stopIndex) => (
                          <li key={stopIndex}>{rows[0]?.[stopIndex]}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-300">
                Route imported successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={
                !file ||
                headers.length === 0 ||
                columnMapping.baseLocation === null ||
                columnMapping.stops.length === 0 ||
                importing
              }
            >
              {importing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
