"use client"

import { useRef, useState } from "react"
import type { ReactElement } from "react"
import { useReactToPrint } from "react-to-print"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Lock, Download, Mail, FileText } from "lucide-react"
import { PrintResult } from "@/components/logbook/print-result"
import { validatePDFExport } from "@/lib/stripe/actions"
import { toast } from "sonner"
import type { CalculationResult } from "@/lib/logbook/types"
import type mapboxgl from "mapbox-gl"

interface ExportModalProps {
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

export function ExportModal({ result, isPro = false }: ExportModalProps): ReactElement {
  const printRef = useRef<HTMLDivElement>(null)
  const [mapImageUrl, setMapImageUrl] = useState<string>()
  const [isCapturing, setIsCapturing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("Work Diary Requirement Check Result")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

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

  const prepareExport = async (manageState = true) => {
    // SECURITY: Server-side validation before allowing PDF export
    const validation = await validatePDFExport()
    if (!validation.success) {
      console.error('PDF export not allowed:', validation.error)
      toast.error(validation.error || 'Pro subscription required to export')
      return null
    }
    
    if (manageState) {
      setIsCapturing(true)
    }
    
    try {
      // Reset map and capture it first
      const mapUrl = await captureMap()
      if (mapUrl) {
        setMapImageUrl(mapUrl)
      }
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return mapUrl
    } catch (error) {
      console.error('Error during export preparation:', error)
      toast.error('Failed to prepare export')
      return null
    } finally {
      if (manageState) {
        setIsCapturing(false)
      }
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Work-Diary-Check-${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => {
      // Clean up the image URL after printing
      setTimeout(() => setMapImageUrl(undefined), 1000)
    },
  })

  const handlePrintClick = async () => {
    const mapUrl = await prepareExport()
    if (mapUrl !== null) {
      // Trigger print dialog
      handlePrint()
      toast.success('Opening print dialog...')
    }
  }

  const handleSaveAsPDF = async () => {
    const mapUrl = await prepareExport()
    if (mapUrl !== null) {
      // Trigger print dialog - user can select "Save as PDF" as printer
      handlePrint()
      toast.success('Opening print dialog...', {
        description: 'Select "Save as PDF" as your printer destination.'
      })
    }
  }

  const handleEmailSend = async () => {
    if (!emailTo.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTo)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSendingEmail(true)

    try {
      // Prepare export first
      const mapUrl = await prepareExport()
      if (mapUrl === null) {
        setIsSendingEmail(false)
        return
      }

      // TODO: Implement email sending with Resend and React Email
      // For now, show a coming soon message
      toast.info('Email feature coming soon!', {
        description: 'We\'re working on email delivery. For now, please use Print/PDF.'
      })

      // Future implementation will look like:
      // const response = await fetch('/api/send-logbook-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: emailTo,
      //     subject: emailSubject,
      //     result: result,
      //     mapImageUrl: mapUrl,
      //   }),
      // })
      //
      // if (!response.ok) throw new Error('Failed to send email')
      //
      // toast.success('Email sent successfully!')
      // setEmailTo('')
      // setIsOpen(false)

    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (!isPro) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled
        title="Pro feature - Upgrade to unlock"
      >
        <Lock className="h-4 w-4" />
        Export (Pro)
      </Button>
    )
  }

  return (
    <>
      {/* Hidden print component */}
      <div className="hidden">
        <PrintResult ref={printRef} result={result} mapImageUrl={mapImageUrl} />
      </div>

      {/* Export Modal Trigger */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isCapturing}
          >
            <FileText className="h-4 w-4" />
            {isCapturing ? "Preparing..." : "Export"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Result</DialogTitle>
            <DialogDescription>
              Save or share your work diary requirement check result
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pdf">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </TabsTrigger>
              <TabsTrigger value="print">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Save your work diary requirement check as a PDF file for your records.
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Select "Save as PDF" in the print dialog
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSaveAsPDF}
                disabled={isCapturing}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isCapturing ? "Preparing..." : "Save as PDF"}
              </Button>
            </TabsContent>

            <TabsContent value="print" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Print your work diary requirement check directly to your printer.
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                  <Printer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Optimized for A4 paper size
                  </span>
                </div>
              </div>
              <Button
                onClick={handlePrintClick}
                disabled={isCapturing}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                {isCapturing ? "Preparing..." : "Print"}
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-to">Email Address</Label>
                  <Input
                    id="email-to"
                    type="email"
                    placeholder="example@company.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    disabled={isSendingEmail}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    disabled={isSendingEmail}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Send your work diary requirement check directly to an email address.
                </div>
              </div>
              <Button
                onClick={handleEmailSend}
                disabled={isSendingEmail || isCapturing}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSendingEmail ? "Sending..." : "Send Email"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

