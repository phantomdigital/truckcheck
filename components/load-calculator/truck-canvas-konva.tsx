"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Stage, Layer, Rect, Line, Text, Group, Circle } from "react-konva"
import type { TruckProfile, Pallet } from "@/lib/load-calculator/types"
import { BODY_TYPE_COLORS } from "@/lib/load-calculator/types"
import { formatWeight, palletsOverlap, getUsableDimensions, palletFitsOnTruck } from "@/lib/load-calculator/physics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Konva from "konva"

interface TruckCanvasProps {
  truck: TruckProfile
  pallets: Pallet[]
  onUpdatePalletPosition: (id: string, x: number, y: number) => void
  selectedPalletId?: string | null
  onSelectPallet?: (id: string | null) => void
}

const PADDING = 60
const GRID_SNAP = 0.001 // 1mm grid snapping for high precision (like TruckScience)

export function TruckCanvas({
  truck,
  pallets,
  onUpdatePalletPosition,
  selectedPalletId,
  onSelectPallet,
}: TruckCanvasProps) {
  const [draggingPalletId, setDraggingPalletId] = useState<string | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 })

  // Track window size for responsive scaling
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Calculate cab length based on manufacturer dimensions
  const cabLength = useMemo(() => {
    if (truck.cab_to_axle) {
      return (truck.front_overhang + truck.wheelbase) - truck.cab_to_axle
    }
    return 2.0 // Fallback: typical cab length
  }, [truck.cab_to_axle, truck.front_overhang, truck.wheelbase])

  // Calculate scale to fit truck (including cab) on canvas - scales to window size
  const scale = useMemo(() => {
    const availableWidth = windowSize.width - 2 * PADDING
    const availableHeight = windowSize.height - 2 * PADDING
    const totalLength = cabLength + truck.body_length
    const scaleX = availableWidth / totalLength
    const scaleY = availableHeight / truck.body_width
    return Math.min(scaleX, scaleY)
  }, [cabLength, truck.body_length, truck.body_width, windowSize.width, windowSize.height])

  // Canvas dimensions match window size
  const canvasWidth = windowSize.width
  const canvasHeight = windowSize.height

  // Convert metres to pixels
  const metresToPixels = useCallback((metres: number) => metres * scale, [scale])
  
  // Convert pixels to metres (with fine grid snapping for precision)
  const pixelsToMetres = useCallback((pixels: number) => {
    const metres = pixels / scale
    // Snap to fine grid (1mm) for high precision like TruckScience
    return Math.round(metres / GRID_SNAP) * GRID_SNAP
  }, [scale])

  // Calculate axle positions
  const axlePositions = useMemo(() => {
    let frontAxlePos: number
    let rearAxlePos: number
    
    if (truck.cab_to_axle) {
      rearAxlePos = truck.cab_to_axle
      frontAxlePos = rearAxlePos - truck.wheelbase
    } else {
      frontAxlePos = -cabLength + truck.front_overhang
      rearAxlePos = frontAxlePos + truck.wheelbase
    }
    
    return { frontAxlePos, rearAxlePos }
  }, [truck.cab_to_axle, truck.wheelbase, truck.front_overhang, cabLength])

  // Get usable dimensions
  const usable = useMemo(() => getUsableDimensions(truck), [truck])

  // Calculate stage offset to center truck on canvas (must be before callbacks that use it)
  const stageOffsetX = useMemo(() => {
    const totalLength = cabLength + truck.body_length
    return (canvasWidth - metresToPixels(totalLength)) / 2 + metresToPixels(cabLength)
  }, [cabLength, truck.body_length, canvasWidth, metresToPixels])
  
  const stageOffsetY = useMemo(() => {
    return (canvasHeight - metresToPixels(truck.body_width)) / 2
  }, [canvasHeight, truck.body_width, metresToPixels])

  // Handle pallet drag start
  const handlePalletDragStart = useCallback((palletId: string) => {
    setDraggingPalletId(palletId)
    onSelectPallet?.(palletId)
  }, [onSelectPallet])

  // Handle pallet drag end with constraints
  const handlePalletDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, pallet: Pallet) => {
    setDraggingPalletId(null)
    
    const node = e.target as Konva.Group
    // Get position relative to stage offset
    // node.x() is in stage coordinates (unscaled, but accounts for stage pan)
    // Subtract our fixed offset to get position relative to body start
    const x = node.x() - stageOffsetX
    const y = node.y() - stageOffsetY
    
    // Convert pixels to metres and snap to fine grid (1mm precision)
    const mx = pixelsToMetres(x)
    const my = pixelsToMetres(y)
    
    // Constrain to usable area
    const constrainedX = Math.max(
      usable.usableX,
      Math.min(mx, usable.usableX + usable.usableLength - pallet.length)
    )
    const constrainedY = Math.max(
      usable.usableY,
      Math.min(my, usable.usableY + usable.usableWidth - pallet.width)
    )
    
    // Fine grid snap for precision
    const snappedX = Math.round(constrainedX / GRID_SNAP) * GRID_SNAP
    const snappedY = Math.round(constrainedY / GRID_SNAP) * GRID_SNAP
    
    // Check if position is valid (use snapped position)
    const testPallet: Pallet = {
      ...pallet,
      x: snappedX,
      y: snappedY,
    }
    
    if (palletFitsOnTruck(testPallet, truck)) {
      // Check for overlaps with other pallets (allows 10mm minimum spacing)
      const hasOverlap = pallets.some((p) => 
        p.id !== pallet.id && palletsOverlap(testPallet, p)
      )
      
      if (!hasOverlap) {
        onUpdatePalletPosition(pallet.id, snappedX, snappedY)
        // Update visual position with snapped coordinates
        node.position({
          x: stageOffsetX + metresToPixels(snappedX),
          y: stageOffsetY + metresToPixels(snappedY),
        })
      } else {
        // Reset position if overlap
        node.position({
          x: stageOffsetX + metresToPixels(pallet.x),
          y: stageOffsetY + metresToPixels(pallet.y),
        })
      }
    } else {
      // Reset position if invalid
      node.position({
        x: stageOffsetX + metresToPixels(pallet.x),
        y: stageOffsetY + metresToPixels(pallet.y),
      })
    }
  }, [usable, pallets, truck, onUpdatePalletPosition, pixelsToMetres, metresToPixels, scale, stageOffsetX, stageOffsetY])

  // Handle pallet drag move (for real-time constraint feedback)
  const handlePalletDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>, pallet: Pallet) => {
    const node = e.target as Konva.Group
    // Get position relative to stage offset
    const x = node.x() - stageOffsetX
    const y = node.y() - stageOffsetY
    
    // Convert pixels to metres and snap to fine grid
    const mx = pixelsToMetres(x)
    const my = pixelsToMetres(y)
    
    // Constrain to usable area in real-time
    const constrainedX = Math.max(
      usable.usableX,
      Math.min(mx, usable.usableX + usable.usableLength - pallet.length)
    )
    const constrainedY = Math.max(
      usable.usableY,
      Math.min(my, usable.usableY + usable.usableWidth - pallet.width)
    )
    
    // Update position if constrained or snapped (for smooth dragging)
    const snappedX = Math.round(constrainedX / GRID_SNAP) * GRID_SNAP
    const snappedY = Math.round(constrainedY / GRID_SNAP) * GRID_SNAP
    
    // Only update if position changed significantly (prevents jitter)
    if (Math.abs(node.x() - (stageOffsetX + metresToPixels(snappedX))) > 0.5 ||
        Math.abs(node.y() - (stageOffsetY + metresToPixels(snappedY))) > 0.5) {
      node.position({
        x: stageOffsetX + metresToPixels(snappedX),
        y: stageOffsetY + metresToPixels(snappedY),
      })
    }
  }, [usable, pixelsToMetres, metresToPixels, scale, stageOffsetX, stageOffsetY, GRID_SNAP])

  // Handle stage click (for selection)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect
    if (e.target === e.target.getStage()) {
      onSelectPallet?.(null)
    }
  }, [onSelectPallet])

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/50">
        <h2 className="text-lg font-semibold">Load Plan - Top View</h2>
        <p className="text-sm text-muted-foreground">
          Drag pallets to position them. Canvas scales to fit window.
        </p>
      </div>
      <div className="h-full w-full flex items-center justify-center">
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleStageClick}
          className="bg-white dark:bg-slate-900"
        >
            <Layer>
              {/* Grid lines */}
              {Array.from({ length: Math.ceil(truck.body_length) + 1 }).map((_, i) => (
                <Line
                  key={`grid-x-${i}`}
                  points={[
                    metresToPixels(i) + stageOffsetX,
                    stageOffsetY,
                    metresToPixels(i) + stageOffsetX,
                    stageOffsetY + metresToPixels(truck.body_width),
                  ]}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: Math.ceil(truck.body_width) + 1 }).map((_, i) => (
                <Line
                  key={`grid-y-${i}`}
                  points={[
                    stageOffsetX,
                    metresToPixels(i) + stageOffsetY,
                    stageOffsetX + metresToPixels(truck.body_length),
                    metresToPixels(i) + stageOffsetY,
                  ]}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
              ))}

              {/* Grid labels */}
              {Array.from({ length: Math.ceil(truck.body_length) + 1 }).map((_, i) => (
                <Text
                  key={`label-x-${i}`}
                  x={metresToPixels(i) + stageOffsetX + 2}
                  y={stageOffsetY - 15}
                  text={`${i}m`}
                  fontSize={10}
                  fill="#9ca3af"
                />
              ))}
              {Array.from({ length: Math.ceil(truck.body_width) + 1 }).map((_, i) => {
                if (i === 0) return null
                return (
                  <Text
                    key={`label-y-${i}`}
                    x={stageOffsetX - 25}
                    y={metresToPixels(i) + stageOffsetY + 3}
                    text={`${i}m`}
                    fontSize={10}
                    fill="#9ca3af"
                  />
                )
              })}

              {/* Cab */}
              <Group x={stageOffsetX - metresToPixels(cabLength)} y={stageOffsetY + metresToPixels((truck.body_width - truck.body_width * 0.9) / 2)}>
                <Rect
                  width={metresToPixels(cabLength)}
                  height={metresToPixels(truck.body_width * 0.9)}
                  fill="#6b7280"
                  stroke="#374151"
                  strokeWidth={2}
                />
                <Rect
                  width={metresToPixels(cabLength * 0.15)}
                  height={metresToPixels(truck.body_width * 0.8)}
                  x={0}
                  y={metresToPixels((truck.body_width * 0.9 - truck.body_width * 0.8) / 2)}
                  fill="#93c5fd"
                />
                <Text
                  x={metresToPixels(cabLength / 2)}
                  y={metresToPixels(truck.body_width * 0.9 / 2)}
                  text="CAB"
                  fontSize={10}
                  fill="#ffffff"
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  offsetX={15}
                  offsetY={5}
                />
              </Group>

              {/* Truck body outline */}
              <Rect
                x={stageOffsetX}
                y={stageOffsetY}
                width={metresToPixels(truck.body_length)}
                height={metresToPixels(truck.body_width)}
                fill={BODY_TYPE_COLORS[truck.body_type] + "20"}
                stroke="#374151"
                strokeWidth={3}
              />

              {/* Unusable area (walls) */}
              {(() => {
                if (usable.usableX === 0 && usable.usableY === 0 && 
                    usable.usableLength === truck.body_length && 
                    usable.usableWidth === truck.body_width) {
                  return null
                }
                
                return (
                  <>
                    {/* Front wall */}
                    {usable.usableX > 0 && (
                      <Rect
                        x={stageOffsetX}
                        y={stageOffsetY}
                        width={metresToPixels(usable.usableX)}
                        height={metresToPixels(truck.body_width)}
                        fill="#ef4444"
                        opacity={0.15}
                      />
                    )}
                    
                    {/* Rear wall */}
                    {usable.usableX + usable.usableLength < truck.body_length && (
                      <Rect
                        x={stageOffsetX + metresToPixels(usable.usableX + usable.usableLength)}
                        y={stageOffsetY}
                        width={metresToPixels(truck.body_length - usable.usableX - usable.usableLength)}
                        height={metresToPixels(truck.body_width)}
                        fill="#ef4444"
                        opacity={0.15}
                      />
                    )}
                    
                    {/* Left wall */}
                    {usable.usableY > 0 && (
                      <Rect
                        x={stageOffsetX}
                        y={stageOffsetY}
                        width={metresToPixels(truck.body_length)}
                        height={metresToPixels(usable.usableY)}
                        fill="#ef4444"
                        opacity={0.15}
                      />
                    )}
                    
                    {/* Right wall */}
                    {usable.usableY + usable.usableWidth < truck.body_width && (
                      <Rect
                        x={stageOffsetX}
                        y={stageOffsetY + metresToPixels(usable.usableY + usable.usableWidth)}
                        width={metresToPixels(truck.body_length)}
                        height={metresToPixels(truck.body_width - usable.usableY - usable.usableWidth)}
                        fill="#ef4444"
                        opacity={0.15}
                      />
                    )}
                    
                    {/* Usable area border */}
                    <Rect
                      x={stageOffsetX + metresToPixels(usable.usableX)}
                      y={stageOffsetY + metresToPixels(usable.usableY)}
                      width={metresToPixels(usable.usableLength)}
                      height={metresToPixels(usable.usableWidth)}
                      stroke="#10b981"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                    
                    <Text
                      x={stageOffsetX + metresToPixels(usable.usableX) + 5}
                      y={stageOffsetY + metresToPixels(usable.usableY) - 15}
                      text="Usable Area"
                      fontSize={10}
                      fill="#10b981"
                    />
                  </>
                )
              })()}

              {/* Axles */}
              <Line
                points={[
                  stageOffsetX + metresToPixels(axlePositions.frontAxlePos),
                  stageOffsetY - 10,
                  stageOffsetX + metresToPixels(axlePositions.frontAxlePos),
                  stageOffsetY + metresToPixels(truck.body_width) + 10,
                ]}
                stroke="#dc2626"
                strokeWidth={4}
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.frontAxlePos)}
                y={stageOffsetY}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.frontAxlePos)}
                y={stageOffsetY + metresToPixels(truck.body_width)}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Text
                x={stageOffsetX + metresToPixels(axlePositions.frontAxlePos) + 5}
                y={stageOffsetY - 25}
                text="Front Axle"
                fontSize={11}
                fill="#dc2626"
                fontStyle="bold"
              />

              <Line
                points={[
                  stageOffsetX + metresToPixels(axlePositions.rearAxlePos),
                  stageOffsetY - 10,
                  stageOffsetX + metresToPixels(axlePositions.rearAxlePos),
                  stageOffsetY + metresToPixels(truck.body_width) + 10,
                ]}
                stroke="#dc2626"
                strokeWidth={4}
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.rearAxlePos) - metresToPixels(0.05)}
                y={stageOffsetY}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.rearAxlePos) + metresToPixels(0.05)}
                y={stageOffsetY}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.rearAxlePos) - metresToPixels(0.05)}
                y={stageOffsetY + metresToPixels(truck.body_width)}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Circle
                x={stageOffsetX + metresToPixels(axlePositions.rearAxlePos) + metresToPixels(0.05)}
                y={stageOffsetY + metresToPixels(truck.body_width)}
                radius={metresToPixels(0.25)}
                fill="#1f2937"
              />
              <Text
                x={stageOffsetX + metresToPixels(axlePositions.rearAxlePos) + 5}
                y={stageOffsetY - 25}
                text="Rear Axle"
                fontSize={11}
                fill="#dc2626"
                fontStyle="bold"
              />

              {/* Wheelbase annotation */}
              <Line
                points={[
                  stageOffsetX + metresToPixels(axlePositions.frontAxlePos),
                  stageOffsetY + metresToPixels(truck.body_width) + 30,
                  stageOffsetX + metresToPixels(axlePositions.rearAxlePos),
                  stageOffsetY + metresToPixels(truck.body_width) + 30,
                ]}
                stroke="#6b7280"
                strokeWidth={1}
                dash={[5, 5]}
              />
              <Text
                x={(stageOffsetX + metresToPixels(axlePositions.frontAxlePos) + stageOffsetX + metresToPixels(axlePositions.rearAxlePos)) / 2}
                y={stageOffsetY + metresToPixels(truck.body_width) + 45}
                text={`Wheelbase: ${truck.wheelbase.toFixed(2)}m`}
                fontSize={12}
                fill="#374151"
                align="center"
                offsetX={60}
              />

              {/* Pallets */}
              {pallets.map((pallet) => {
                const isValidPosition = palletFitsOnTruck(pallet, truck)
                const isSelected = selectedPalletId === pallet.id
                const isDragging = draggingPalletId === pallet.id
                
                return (
                  <Group
                    key={pallet.id}
                    x={stageOffsetX + metresToPixels(pallet.x)}
                    y={stageOffsetY + metresToPixels(pallet.y)}
                    draggable
                    dragBoundFunc={(pos) => {
                      // Allow free dragging - constraints applied in dragMove/dragEnd
                      return pos
                    }}
                    onDragStart={() => handlePalletDragStart(pallet.id)}
                    onDragMove={(e) => handlePalletDragMove(e, pallet)}
                    onDragEnd={(e) => handlePalletDragEnd(e, pallet)}
                    onClick={() => onSelectPallet?.(pallet.id)}
                  >
                    <Rect
                      width={metresToPixels(pallet.length)}
                      height={metresToPixels(pallet.width)}
                      fill={pallet.color || "#60a5fa"}
                      stroke={isValidPosition 
                        ? (isSelected ? "#3b82f6" : "#1f2937")
                        : "#ef4444"}
                      strokeWidth={isSelected ? 3 : 2}
                      shadowBlur={isDragging ? 10 : 0}
                      shadowColor="rgba(0, 0, 0, 0.3)"
                      shadowOffsetX={isDragging ? 2 : 0}
                      shadowOffsetY={isDragging ? 2 : 0}
                    />
                    
                    {!isValidPosition && (
                      <Text
                        x={metresToPixels(pallet.length / 2)}
                        y={15}
                        text="⚠"
                        fontSize={10}
                        fill="#ef4444"
                        fontStyle="bold"
                        align="center"
                        offsetX={5}
                      />
                    )}
                    
                    {isSelected && (
                      <Rect
                        x={-2}
                        y={-2}
                        width={metresToPixels(pallet.length) + 4}
                        height={metresToPixels(pallet.width) + 4}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dash={[5, 5]}
                      />
                    )}
                    
                    <Text
                      x={metresToPixels(pallet.length / 2)}
                      y={metresToPixels(pallet.width / 2)}
                      text={formatWeight(pallet.weight)}
                      fontSize={12}
                      fill="#ffffff"
                      fontStyle="bold"
                      align="center"
                      verticalAlign="middle"
                      offsetX={formatWeight(pallet.weight).length * 3}
                      offsetY={6}
                    />
                    
                    {pallet.name && metresToPixels(pallet.length) > 80 && metresToPixels(pallet.width) > 40 && (
                      <Text
                        x={metresToPixels(pallet.length / 2)}
                        y={metresToPixels(pallet.width / 2) - 15}
                        text={pallet.name}
                        fontSize={10}
                        fill="#ffffff"
                        align="center"
                        offsetX={pallet.name.length * 2.5}
                      />
                    )}
                  </Group>
                )
              })}
            </Layer>
          </Stage>
        </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs text-muted-foreground text-center space-y-1 shadow-lg border border-border/50">
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
                <p>Pallets require 10mm minimum spacing. Grid snaps to 1mm for precision.</p>
              </>
            )
          }
          return <p>Pallets require 10mm minimum spacing. Grid snaps to 1mm for precision.</p>
        })()}
      </div>
    </div>
  )
}

