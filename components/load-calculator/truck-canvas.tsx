"use client"

import { useRef, useEffect, useState } from "react"
import { useDndMonitor, DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import type { TruckProfile, Pallet } from "@/lib/load-calculator/types"
import { BODY_TYPE_COLORS } from "@/lib/load-calculator/types"
import { formatWeight, palletsOverlap, getUsableDimensions, palletFitsOnTruck } from "@/lib/load-calculator/physics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TruckCanvasProps {
  truck: TruckProfile
  pallets: Pallet[]
  onUpdatePalletPosition: (id: string, x: number, y: number) => void
  selectedPalletId?: string | null
  onSelectPallet?: (id: string | null) => void
}

export function TruckCanvas({
  truck,
  pallets,
  onUpdatePalletPosition,
  selectedPalletId,
  onSelectPallet,
}: TruckCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [draggingPalletId, setDraggingPalletId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Canvas dimensions (pixels)
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const PADDING = 60

  // Calculate cab length based on manufacturer dimensions
  const calculateCabLength = () => {
    if (truck.cab_to_axle) {
      // Cab length = (FOH + WB) - CA
      return (truck.front_overhang + truck.wheelbase) - truck.cab_to_axle
    }
    return 2.0 // Fallback: typical cab length
  }

  // Calculate scale to fit truck (including cab) on canvas
  const calculateScale = () => {
    const availableWidth = CANVAS_WIDTH - 2 * PADDING
    const availableHeight = CANVAS_HEIGHT - 2 * PADDING
    const cabLength = calculateCabLength()
    const totalLength = cabLength + truck.body_length // cab + body
    const scaleX = availableWidth / totalLength
    const scaleY = availableHeight / truck.body_width
    return Math.min(scaleX, scaleY)
  }

  useEffect(() => {
    setScale(calculateScale())
  }, [truck.body_length, truck.body_width, truck.wheelbase, truck.front_overhang, truck.cab_to_axle])

  // Convert metres to canvas pixels
  const metresToPixels = (metres: number) => metres * scale

  // Convert canvas pixels to metres
  const pixelsToMetres = (pixels: number) => pixels / scale

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Save context
    ctx.save()

    // Calculate cab and axle positions using manufacturer dimensions
    // Body coordinate system: 0m = front of body (loading area)
    // CA (Cab to Axle) = distance from back of cab (= front of body) to rear axle
    // FOH (Front Overhang) = distance from front of truck to front axle
    // WB (Wheelbase) = distance from front axle to rear axle
    // Cab length = (FOH + WB) - CA
    
    let cabLength: number
    let frontAxlePosition: number
    let rearAxlePosition: number
    
    if (truck.cab_to_axle) {
      // Use accurate manufacturer dimensions
      rearAxlePosition = truck.cab_to_axle // CA distance from body front
      frontAxlePosition = rearAxlePosition - truck.wheelbase // WB before rear axle
      cabLength = (truck.front_overhang + truck.wheelbase) - truck.cab_to_axle // (FOH + WB) - CA
    } else {
      // Fallback: estimate based on typical cab length
      cabLength = 2.0 // metres (typical cab length)
      frontAxlePosition = -cabLength + truck.front_overhang // Under the cab
      rearAxlePosition = frontAxlePosition + truck.wheelbase
    }
    
    // Translate to account for cab extending into negative coordinates
    // This centers the entire truck (cab + body) on the canvas
    ctx.translate(PADDING + metresToPixels(cabLength), PADDING)
    
    const cabWidth = truck.body_width * 0.9 // Cab is slightly narrower
    const cabOffset = (truck.body_width - cabWidth) / 2 // Center the cab

    // Draw cab first (in front of body)
    ctx.fillStyle = "#6b7280" // Gray for cab
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 2
    
    // Cab body
    ctx.fillRect(
      metresToPixels(-cabLength), // Cab starts before body
      metresToPixels(cabOffset),
      metresToPixels(cabLength),
      metresToPixels(cabWidth)
    )
    ctx.strokeRect(
      metresToPixels(-cabLength),
      metresToPixels(cabOffset),
      metresToPixels(cabLength),
      metresToPixels(cabWidth)
    )

    // Draw windscreen indication (at front of cab)
    ctx.fillStyle = "#93c5fd" // Light blue for windscreen
    const windscreenWidth = cabWidth * 0.8
    const windscreenOffset = cabOffset + (cabWidth - windscreenWidth) / 2
    ctx.fillRect(
      metresToPixels(-cabLength),
      metresToPixels(windscreenOffset),
      metresToPixels(cabLength * 0.15),
      metresToPixels(windscreenWidth)
    )

    // Cab label
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 10px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("CAB", metresToPixels(-cabLength / 2), metresToPixels(truck.body_width / 2))
    ctx.textAlign = "left"

    // Draw grid (every metre) - only over body area
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    for (let i = 0; i <= Math.ceil(truck.body_length); i++) {
      const x = metresToPixels(i)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, metresToPixels(truck.body_width))
      ctx.stroke()

      // Grid labels
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px sans-serif"
      ctx.fillText(`${i}m`, x + 2, -5)
    }

    for (let i = 0; i <= Math.ceil(truck.body_width); i++) {
      const y = metresToPixels(i)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(metresToPixels(truck.body_length), y)
      ctx.stroke()

      if (i > 0) {
        ctx.fillStyle = "#9ca3af"
        ctx.font = "10px sans-serif"
        ctx.fillText(`${i}m`, -25, y + 3)
      }
    }

    // Calculate usable dimensions (accounting for wall thickness)
    const usable = getUsableDimensions(truck)
    
    // Draw truck body outline (total area)
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 3
    ctx.fillStyle = BODY_TYPE_COLORS[truck.body_type] + "20" // 20% opacity
    ctx.fillRect(
      0,
      0,
      metresToPixels(truck.body_length),
      metresToPixels(truck.body_width)
    )
    ctx.strokeRect(
      0,
      0,
      metresToPixels(truck.body_length),
      metresToPixels(truck.body_width)
    )
    
    // Draw unusable area (walls) if there are walls
    if (usable.usableX > 0 || usable.usableY > 0 || 
        usable.usableLength < truck.body_length || 
        usable.usableWidth < truck.body_width) {
      ctx.fillStyle = "#ef4444" + "15" // Light red, 15% opacity for walls
      
      // Front wall
      if (usable.usableX > 0) {
        ctx.fillRect(0, 0, metresToPixels(usable.usableX), metresToPixels(truck.body_width))
      }
      
      // Rear wall
      const rearWallStart = usable.usableX + usable.usableLength
      if (rearWallStart < truck.body_length) {
        ctx.fillRect(
          metresToPixels(rearWallStart),
          0,
          metresToPixels(truck.body_length - rearWallStart),
          metresToPixels(truck.body_width)
        )
      }
      
      // Left wall
      if (usable.usableY > 0) {
        ctx.fillRect(0, 0, metresToPixels(truck.body_length), metresToPixels(usable.usableY))
      }
      
      // Right wall
      const rightWallStart = usable.usableY + usable.usableWidth
      if (rightWallStart < truck.body_width) {
        ctx.fillRect(
          0,
          metresToPixels(rightWallStart),
          metresToPixels(truck.body_length),
          metresToPixels(truck.body_width - rightWallStart)
        )
      }
      
      // Draw usable area border (dashed line)
      ctx.strokeStyle = "#10b981" // Green for usable area
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        metresToPixels(usable.usableX),
        metresToPixels(usable.usableY),
        metresToPixels(usable.usableLength),
        metresToPixels(usable.usableWidth)
      )
      ctx.setLineDash([])
      
      // Label usable area
      ctx.fillStyle = "#10b981"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(
        "Usable Area",
        metresToPixels(usable.usableX) + 5,
        metresToPixels(usable.usableY) - 5
      )
    }

    // Draw front axle (red line with wheels) - positioned under the cab
    ctx.strokeStyle = "#dc2626"
    ctx.lineWidth = 4
    ctx.beginPath()
    const frontAxleX = metresToPixels(frontAxlePosition)
    ctx.moveTo(frontAxleX, -10)
    ctx.lineTo(frontAxleX, metresToPixels(truck.body_width) + 10)
    ctx.stroke()

    // Draw wheels on front axle
    const wheelRadius = metresToPixels(0.25) // 0.25m wheel radius
    ctx.fillStyle = "#1f2937"
    // Left wheel
    ctx.beginPath()
    ctx.arc(frontAxleX, metresToPixels(0), wheelRadius, 0, Math.PI * 2)
    ctx.fill()
    // Right wheel
    ctx.beginPath()
    ctx.arc(frontAxleX, metresToPixels(truck.body_width), wheelRadius, 0, Math.PI * 2)
    ctx.fill()

    // Front axle label
    ctx.fillStyle = "#dc2626"
    ctx.font = "bold 11px sans-serif"
    ctx.fillText("Front Axle", frontAxleX + 5, -15)

    // Draw rear axle (red line with wheels)
    const rearAxleX = metresToPixels(rearAxlePosition)
    ctx.beginPath()
    ctx.moveTo(rearAxleX, -10)
    ctx.lineTo(rearAxleX, metresToPixels(truck.body_width) + 10)
    ctx.stroke()

    // Draw wheels on rear axle (dual wheels for most trucks)
    ctx.fillStyle = "#1f2937"
    // Left wheels (dual)
    ctx.beginPath()
    ctx.arc(rearAxleX - metresToPixels(0.05), metresToPixels(0), wheelRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(rearAxleX + metresToPixels(0.05), metresToPixels(0), wheelRadius, 0, Math.PI * 2)
    ctx.fill()
    // Right wheels (dual)
    ctx.beginPath()
    ctx.arc(rearAxleX - metresToPixels(0.05), metresToPixels(truck.body_width), wheelRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(rearAxleX + metresToPixels(0.05), metresToPixels(truck.body_width), wheelRadius, 0, Math.PI * 2)
    ctx.fill()

    // Rear axle label
    ctx.fillStyle = "#dc2626"
    ctx.font = "bold 11px sans-serif"
    ctx.fillText("Rear Axle", rearAxleX + 5, -15)

    // Draw wheelbase annotation (line between axles)
    ctx.strokeStyle = "#6b7280"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    const annotationY = metresToPixels(truck.body_width) + 30
    ctx.beginPath()
    ctx.moveTo(frontAxleX, annotationY)
    ctx.lineTo(rearAxleX, annotationY)
    ctx.stroke()
    ctx.setLineDash([])

    // Wheelbase label
    ctx.fillStyle = "#374151"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(
      `Wheelbase: ${truck.wheelbase.toFixed(2)}m`,
      (frontAxleX + rearAxleX) / 2,
      annotationY + 15
    )
    ctx.textAlign = "left"

    // Draw pallets
    pallets.forEach((pallet) => {
      const px = metresToPixels(pallet.x)
      const py = metresToPixels(pallet.y)
      const pw = metresToPixels(pallet.length)
      const ph = metresToPixels(pallet.width)

      const isSelected = selectedPalletId === pallet.id
      const isDragging = draggingPalletId === pallet.id

      // Shadow when dragging
      if (isDragging) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }

      // Pallet fill
      ctx.fillStyle = pallet.color || "#60a5fa"
      ctx.fillRect(px, py, pw, ph)

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Check if pallet is in valid position
      const isValidPosition = palletFitsOnTruck(pallet, truck)
      
      // Pallet border (red if invalid position)
      ctx.strokeStyle = isValidPosition 
        ? (isSelected ? "#3b82f6" : "#1f2937")
        : "#ef4444" // Red if outside usable area
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeRect(px, py, pw, ph)
      
      // Warning indicator if pallet is outside usable area
      if (!isValidPosition) {
        ctx.fillStyle = "#ef4444"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("⚠", px + pw / 2, py + 15)
        ctx.textAlign = "left"
      }

      // Selected highlight
      if (isSelected) {
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4)
        ctx.setLineDash([])

        // Pulse animation would be handled via state updates
      }

      // Pallet weight label
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(formatWeight(pallet.weight), px + pw / 2, py + ph / 2)

      // Pallet name (if small enough to fit)
      if (pallet.name && pw > 80 && ph > 40) {
        ctx.font = "10px sans-serif"
        ctx.fillText(pallet.name, px + pw / 2, py + ph / 2 - 15)
      }

      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
    })

    // Restore context
    ctx.restore()
  }, [truck, pallets, scale, selectedPalletId, draggingPalletId])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const cabLength = calculateCabLength()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - PADDING - metresToPixels(cabLength)
    const y = e.clientY - rect.top - PADDING

    // Convert to metres
    const mx = pixelsToMetres(x)
    const my = pixelsToMetres(y)

    // Check if clicked on a pallet (reverse order to get topmost)
    for (let i = pallets.length - 1; i >= 0; i--) {
      const pallet = pallets[i]
      if (
        mx >= pallet.x &&
        mx <= pallet.x + pallet.length &&
        my >= pallet.y &&
        my <= pallet.y + pallet.width
      ) {
        onSelectPallet?.(pallet.id)
        return
      }
    }

    // Clicked on empty space
    onSelectPallet?.(null)
  }

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const cabLength = calculateCabLength()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - PADDING - metresToPixels(cabLength)
    const y = e.clientY - rect.top - PADDING

    // Convert to metres
    const mx = pixelsToMetres(x)
    const my = pixelsToMetres(y)

    // Check if clicked on a pallet (reverse order to get topmost)
    for (let i = pallets.length - 1; i >= 0; i--) {
      const pallet = pallets[i]
      if (
        mx >= pallet.x &&
        mx <= pallet.x + pallet.length &&
        my >= pallet.y &&
        my <= pallet.y + pallet.width
      ) {
        setDraggingPalletId(pallet.id)
        setDragOffset({
          x: mx - pallet.x,
          y: my - pallet.y,
        })
        onSelectPallet?.(pallet.id)
        return
      }
    }
  }

  // Handle mouse move while dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPalletId) return

    const canvas = canvasRef.current
    if (!canvas) return

    const cabLength = calculateCabLength()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - PADDING - metresToPixels(cabLength)
    const y = e.clientY - rect.top - PADDING

    // Convert to metres
    const mx = pixelsToMetres(x) - dragOffset.x
    const my = pixelsToMetres(y) - dragOffset.y

    // Constrain to usable area (accounting for wall thickness)
    const pallet = pallets.find((p) => p.id === draggingPalletId)
    if (pallet) {
      const usable = getUsableDimensions(truck)
      
      // Constrain to usable area
      const newX = Math.max(
        usable.usableX, 
        Math.min(mx, usable.usableX + usable.usableLength - pallet.length)
      )
      const newY = Math.max(
        usable.usableY, 
        Math.min(my, usable.usableY + usable.usableWidth - pallet.width)
      )
      
      // Check if position is valid (fits in usable area)
      const testPallet: Pallet = {
        ...pallet,
        x: newX,
        y: newY,
      }
      
      if (palletFitsOnTruck(testPallet, truck)) {
        // Check for overlaps with other pallets (includes spacing)
        const hasOverlap = pallets.some((p) => 
          p.id !== draggingPalletId && palletsOverlap(testPallet, p)
        )
        
        // Only update position if no overlap
        if (!hasOverlap) {
          onUpdatePalletPosition(draggingPalletId, newX, newY)
        }
      }
    }
  }

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setDraggingPalletId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Plan - Top View</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag pallets to position them on the truck body
        </p>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={cn(
              "border rounded-md bg-white dark:bg-slate-900",
              draggingPalletId && "cursor-grabbing"
            )}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
          <p>Red lines show axle positions. Grid is 1m × 1m. Gray area is cab (not for loading).</p>
          <p>Front axle is under the cab. Body measurements start from front of body (0m).</p>
          {(() => {
            const usable = getUsableDimensions(truck)
            const hasWalls = usable.usableX > 0 || usable.usableY > 0 || 
                           usable.usableLength < truck.body_length || 
                           usable.usableWidth < truck.body_width
            if (hasWalls) {
              return (
                <>
                  <p className="text-green-600 dark:text-green-400">
                    Green dashed line shows usable loading area (accounting for wall thickness).
                  </p>
                  <p className="text-red-600 dark:text-red-400">
                    Red shaded areas are walls - pallets cannot be placed there.
                  </p>
                  <p>Pallets require 50mm minimum spacing between them.</p>
                </>
              )
            }
            return <p>Pallets require 50mm minimum spacing between them.</p>
          })()}
        </div>
      </CardContent>
    </Card>
  )
}

