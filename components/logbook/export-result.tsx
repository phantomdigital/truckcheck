"use client"

import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { Printer, Lock, Download } from "lucide-react"
import { PrintResult } from "@/components/logbook/print-result"
import { FeatureGate } from "@/components/feature-gate"
import { validatePDFExport, validateCSVExport } from "@/lib/stripe/actions"
import { toast } from "sonner"
import type { CalculationResult } from "@/lib/logbook/types"
import type mapboxgl from "mapbox-gl"

interface ExportResultProps {
  result: CalculationResult
  isPro?: boolean
}

// Type definitions for extended map container
interface ExtendedMap extends mapboxgl.Map {
  resetToOriginalBounds?: () => Promise<void>
}

interface MapContainerElement extends HTMLElement {
  __mapInstance?: ExtendedMap
}

export function ExportResult({ result, isPro = false }: ExportResultProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string>()
  const [isCapturing, setIsCapturing] = useState(false)

  const handleCSVExport = async () => {
    // SECURITY: Server-side validation before allowing CSV export
    const validation = await validateCSVExport()
    if (!validation.success) {
      toast.error(validation.error || 'Pro subscription required to export CSV')
      return
    }

    try {
      // Create CSV content
      const csvData = [
        ['Field', 'Value'],
        ['Base Location', result.baseLocation.placeName],
        ['Stops', result.stops.map(s => s.address).join(' → ')],
        ['Distance (km)', result.distance.toString()],
        ['Driving Distance (km)', result.drivingDistance?.toString() || 'N/A'],
        ['Max Distance from Base (km)', result.maxDistanceFromBase?.toString() || 'N/A'],
        ['Logbook Required', result.logbookRequired ? 'Yes' : 'No'],
        ['Calculated At', new Date().toISOString()],
      ]

      // Convert to CSV string
      const csvContent = csvData
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `logbook-calculation-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }
  
  const captureMap = async (): Promise<string | null> => {
    // Find the entire map container (not just canvas, to include markers)
    const mapContainer = document.querySelector('[data-map-container]') as MapContainerElement | null
    if (!mapContainer) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Map container not found')
      }
      return null
    }

    try {
      // Get the map instance stored on the container
      const mapInstance = mapContainer.__mapInstance
      
      console.log('Map capture - checking for map instance:', {
        hasMapInstance: !!mapInstance,
        hasResetMethod: !!mapInstance?.resetToOriginalBounds,
        containerElement: !!mapContainer,
      })
      
      if (mapInstance?.resetToOriginalBounds) {
          console.log('Resetting map to original bounds...')
        
        // Reset map to original position first - this will wait for map to finish moving
        await mapInstance.resetToOriginalBounds()
        
        // Additional small delay to ensure map tiles are fully rendered
        await new Promise(resolve => setTimeout(resolve, 300))
        
        console.log('Map reset complete, capturing...')
      } else {
        console.warn('Map instance or resetToOriginalBounds method not found, capturing current view', {
          mapInstance: mapInstance,
          resetMethod: mapInstance?.resetToOriginalBounds,
        })
        // Small delay even if not resetting
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Store original styles
      const originalPosition = mapContainer.style.position
      const originalTop = mapContainer.style.top
      const originalLeft = mapContainer.style.left
      const originalZIndex = mapContainer.style.zIndex
      const originalHeight = mapContainer.style.height
      const originalOverflow = mapContainer.style.overflow
      const originalMaxHeight = (mapContainer.style as any).maxHeight
      const originalWidth = mapContainer.style.width
      const originalOpacity = mapContainer.style.opacity
      const originalTransition = mapContainer.style.transition
      const originalClipPath = mapContainer.style.clipPath
      
      // Get the container's current dimensions
      const rect = mapContainer.getBoundingClientRect()
      
      // Create placeholder FIRST to maintain layout space
      const placeholder = document.createElement('div')
      placeholder.style.width = rect.width + 'px'
      placeholder.style.height = rect.height + 'px'
      placeholder.style.flexShrink = '0'
      placeholder.style.visibility = 'hidden'
      placeholder.setAttribute('data-map-placeholder', 'true')
      
      // Insert placeholder before map container
      if (mapContainer.parentNode) {
        mapContainer.parentNode.insertBefore(placeholder, mapContainer)
      }
      
      // Disable transitions for instant changes
      mapContainer.style.transition = 'none'
      
      // Move off-screen immediately (before expanding) - user won't see anything
      mapContainer.style.position = 'fixed'
      mapContainer.style.top = '0'
      mapContainer.style.left = '-9999px'
      mapContainer.style.width = rect.width + 'px'
      mapContainer.style.height = '800px'
      mapContainer.style.overflow = 'visible'
      ;(mapContainer.style as any).maxHeight = 'none'
      mapContainer.style.zIndex = '-1'
      
      // Wait for map to resize and render (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Force map to resize to new container size
      if (mapInstance?.resize) {
        mapInstance.resize()
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Capturing map with html2canvas...', {
          containerHeight: mapContainer.offsetHeight,
          containerWidth: mapContainer.offsetWidth,
        })
      }

      // Already off-screen, no need to move again

      // Use html2canvas to capture the entire map including markers
      const originalOverflowY = (mapContainer.style as any).overflowY
      mapContainer.style.overflowY = 'visible'
      
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })
      
      // Restore overflow
      mapContainer.style.overflowY = originalOverflowY
      
      // Remove placeholder
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder)
      }
      
      // Restore original styles immediately
      mapContainer.style.position = originalPosition || ''
      mapContainer.style.top = originalTop || ''
      mapContainer.style.left = originalLeft || ''
      mapContainer.style.width = originalWidth || ''
      mapContainer.style.height = originalHeight
      mapContainer.style.overflow = originalOverflow
      mapContainer.style.zIndex = originalZIndex || ''
      mapContainer.style.transition = originalTransition || ''
      mapContainer.style.opacity = originalOpacity || ''
      
      if (originalMaxHeight) {
        ;(mapContainer.style as any).maxHeight = originalMaxHeight
      } else {
        ;(mapContainer.style as any).maxHeight = ''
      }
      
      // Resize map back to original
      if (mapInstance?.resize) {
        mapInstance.resize()
      }
      
      const dataUrl = canvas.toDataURL('image/png')
      
      if (!dataUrl || dataUrl === 'data:,') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Map capture returned empty data')
        }
        return null
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Map captured successfully with markers, data URL length:', dataUrl.length)
      }
      return dataUrl
    } catch (error) {
      // Keep error logging in production for debugging
      console.error('Error capturing map with html2canvas:', error)
      return null
    }
  }

  const handlePrintClick = async () => {
    // SECURITY: Server-side validation before allowing PDF export
    const validation = await validatePDFExport()
    if (!validation.success) {
      console.error('PDF export not allowed:', validation.error)
      alert(validation.error || 'Pro subscription required to export PDF')
      return
    }
    
    setIsCapturing(true)
    
    try {
      // Reset map and capture it first
    const mapUrl = await captureMap()
    if (mapUrl) {
      setMapImageUrl(mapUrl)
    }
    
      // Small delay to ensure state is updated before opening print dialog
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Trigger print dialog - loading state will persist until dialog opens
      handlePrint()
    } catch (error) {
      console.error('Error during print preparation:', error)
      setIsCapturing(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `NHVR-Logbook-Check-${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => {
      // Reset loading state and clean up the image URL after printing
      setIsCapturing(false)
      setTimeout(() => setMapImageUrl(undefined), 1000)
    },
  })

  if (!isPro) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled
          title="Pro feature - Upgrade to unlock"
        >
          <Lock className="h-4 w-4" />
          Print/PDF (Pro)
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-2"
          title="Pro feature - Upgrade to unlock"
        >
          <Lock className="h-4 w-4" />
          Export CSV (Pro)
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Hidden print component */}
      <div className="hidden">
        <PrintResult ref={printRef} result={result} mapImageUrl={mapImageUrl} />
      </div>

      {/* Export buttons */}
      <div className="flex gap-2">
        {/* Print/PDF button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintClick}
          disabled={isCapturing}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          {isCapturing ? "Preparing..." : "Print/PDF"}
        </Button>

        {/* CSV Export button */}
        {isPro ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCSVExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
            title="Pro feature - Upgrade to unlock"
          >
            <Lock className="h-4 w-4" />
            Export CSV (Pro)
          </Button>
        )}
      </div>
    </>
  )
}

