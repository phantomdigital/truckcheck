'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraggablePopoverProps {
  id: string;
  title: string;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function DraggablePopover({
  id,
  title,
  position,
  onPositionChange,
  onClose,
  collapsed = false,
  onCollapsedChange,
  children,
  className,
}: DraggablePopoverProps) {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const lastTransformRef = useRef<{ x: number; y: number } | null>(null);
  const initialPositionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);

  // Keep callback ref updated
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `popover-${id}`,
  });

  // Track dragging state and store initial position when drag starts
  useEffect(() => {
    if (isDragging && transform) {
      if (!isDraggingLocal) {
      // Drag just started - store initial position
      setIsDraggingLocal(true);
      initialPositionRef.current = currentPosition;
      }

      // Keep track of the latest transform during the drag
      lastTransformRef.current = { x: transform.x, y: transform.y };
    } else if (!isDragging && isDraggingLocal) {
      // Drag just ended - calculate final position using the last known transform
      const finalTransform = lastTransformRef.current;

      if (finalTransform) {
        const deltaX = finalTransform.x;
        const deltaY = finalTransform.y;

        // Define boundary constraints
        const SIDE_MENU_WIDTH = 140; // Dashboard menu width
        const TOOLS_BAR_WIDTH = 40; // Tools bar width  
        const POPOVER_WIDTH = 320; // Approximate popover width
        const POPOVER_MIN_HEIGHT = 100; // Minimum visible height
        const PADDING = 10; // Padding from edges
        
        const minX = SIDE_MENU_WIDTH + TOOLS_BAR_WIDTH + PADDING; // Can't go over side menu/tools
        const maxX = window.innerWidth - POPOVER_WIDTH - PADDING; // Must stay in viewport
        const minY = PADDING; // Small padding from top
        const maxY = window.innerHeight - POPOVER_MIN_HEIGHT - PADDING; // Must stay visible

        const newX = Math.max(minX, Math.min(initialPositionRef.current.x + deltaX, maxX));
        const newY = Math.max(minY, Math.min(initialPositionRef.current.y + deltaY, maxY));
        
        const newPosition = { x: newX, y: newY };
        setCurrentPosition(newPosition);
        onPositionChangeRef.current(newPosition);
      }

      setIsDraggingLocal(false);
      lastTransformRef.current = null;
    }
  }, [isDragging, isDraggingLocal, transform, currentPosition]);

  // Sync external position changes (but only if not dragging)
  useEffect(() => {
    if (!isDragging && !isDraggingLocal) {
      // Only update if position actually changed (to avoid resetting during drag)
      if (position.x !== currentPosition.x || position.y !== currentPosition.y) {
        setCurrentPosition(position);
        initialPositionRef.current = position;
      }
    }
  }, [position.x, position.y, isDragging, isDraggingLocal, currentPosition]);

  const style = {
    transform: isDragging ? CSS.Translate.toString(transform) : undefined,
    left: currentPosition.x,
    top: currentPosition.y,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'absolute z-50 rounded-lg border border-gray-700 shadow-xl',
        'bg-gray-800/95 backdrop-blur-sm',
        'w-[320px]', // Fixed width instead of min/max
        className
      )}
    >
      {/* Title bar with drag handle */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700/50 rounded-t-lg border-b border-gray-600">
        <div
          {...listeners}
          {...attributes}
          className="flex-1 cursor-move select-none"
        >
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onCollapsedChange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-600 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCollapsedChange(!collapsed);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <motion.div
                animate={{ rotate: collapsed ? 0 : 180 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-600 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content with smooth animation */}
      <AnimatePresence initial={false}>
      {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.2, 
              ease: "easeInOut",
              opacity: { duration: 0.15 }
            }}
            style={{ overflow: "hidden" }}
          >
        <div className="p-4 text-gray-200">{children}</div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

