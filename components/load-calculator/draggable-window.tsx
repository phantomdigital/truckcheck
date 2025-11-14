"use client"

import { useState, useEffect, useRef } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DraggableWindowProps {
  id: string
  title: string
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  minWidth?: number
  minHeight?: number
  children: React.ReactNode
  onClose?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  className?: string
}

export function DraggableWindow({
  id,
  title,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  minWidth = 300,
  minHeight = 200,
  children,
  onClose,
  onPositionChange,
  className,
}: DraggableWindowProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [size, setSize] = useState(defaultSize)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const lastTransformRef = useRef<{ x: number; y: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `window-${id}`,
    disabled: isMaximized,
  })

  // Update position when drag ends
  useEffect(() => {
    if (!isDragging && transform) {
      const deltaX = transform.x - (lastTransformRef.current?.x || 0)
      const deltaY = transform.y - (lastTransformRef.current?.y || 0)
      
      if (deltaX !== 0 || deltaY !== 0) {
        setPosition((prev) => ({
          x: Math.max(0, prev.x + deltaX),
          y: Math.max(0, prev.y + deltaY),
        }))
        lastTransformRef.current = { x: transform.x, y: transform.y }
      }
    } else if (isDragging && transform) {
      lastTransformRef.current = { x: transform.x, y: transform.y }
    } else if (!isDragging) {
      lastTransformRef.current = null
    }
  }, [transform, isDragging])

  const style = {
    transform: isDragging ? CSS.Translate.toString(transform) : undefined,
    left: isMaximized ? 0 : position.x,
    top: isMaximized ? 0 : position.y,
    opacity: isDragging ? 0.8 : 1,
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
    if (isMaximized) {
      setSize(defaultSize)
      setPosition(defaultPosition)
    } else {
      setSize({ width: window.innerWidth - 300, height: window.innerHeight - 100 })
      setPosition({ x: 150, y: 50 })
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute z-50 shadow-2xl border border-border/50 rounded-lg bg-background overflow-hidden",
        isMinimized && "h-auto",
        className
      )}
      style={{
        ...style,
        width: isMaximized ? "calc(100vw - 300px)" : size.width,
        height: isMinimized ? "auto" : isMaximized ? "calc(100vh - 100px)" : size.height,
      }}
    >
      {/* Window Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50 cursor-move select-none"
        {...listeners}
        {...attributes}
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMinimize}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMaximize}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Window Content */}
      {!isMinimized && (
        <div className="h-full overflow-auto">
          {children}
        </div>
      )}
    </div>
  )
}

