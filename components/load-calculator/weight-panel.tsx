"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WeightDistribution } from "@/lib/load-calculator/types"
import { formatWeight } from "@/lib/load-calculator/physics"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeightPanelProps {
  distribution: WeightDistribution
  frontTareWeight?: number
  rearTareWeight?: number
  frontAxleLimit?: number
  rearAxleLimit?: number
}

export function WeightPanel({ 
  distribution,
  frontTareWeight,
  rearTareWeight,
  frontAxleLimit,
  rearAxleLimit 
}: WeightPanelProps) {
  const tareWeight = (frontTareWeight || 0) + (rearTareWeight || 0)
  const loadWeight = distribution.total_weight - tareWeight
  const getStatusColor = (percentage: number, isOver: boolean) => {
    if (isOver) return "text-red-600 dark:text-red-400"
    if (percentage > 95) return "text-orange-600 dark:text-orange-400"
    if (percentage > 85) return "text-yellow-600 dark:text-yellow-400"
    return "text-green-600 dark:text-green-400"
  }

  const getStatusIcon = (percentage: number, isOver: boolean) => {
    if (isOver || percentage > 95) {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <CheckCircle2 className="h-4 w-4" />
  }

  const getProgressBarColor = (percentage: number, isOver: boolean) => {
    if (isOver) return "bg-red-500"
    if (percentage > 95) return "bg-orange-500"
    if (percentage > 85) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Distribution</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Using your entered tare weights
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight Breakdown */}
        {(frontTareWeight || rearTareWeight) && (
          <div className="p-3 bg-muted/30 rounded-md space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empty truck (tare):</span>
              <span className="font-medium">{formatWeight(tareWeight)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Load added:</span>
              <span className="font-medium">{formatWeight(loadWeight)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">{formatWeight(distribution.total_weight)}</span>
            </div>
          </div>
        )}

        {/* Overall Status */}
        {distribution.is_overweight && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              Vehicle is overweight
            </p>
          </div>
        )}

        {(distribution.is_front_overweight || distribution.is_rear_overweight) &&
          !distribution.is_overweight && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Axle weight limit exceeded
              </p>
            </div>
          )}

        {/* Total Weight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(distribution.gvm_percentage, distribution.is_overweight)}
              <span className="text-sm font-medium">Total Weight (GVM)</span>
            </div>
            <Badge variant={distribution.is_overweight ? "destructive" : "default"}>
              {distribution.gvm_percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  getProgressBarColor(
                    distribution.gvm_percentage,
                    distribution.is_overweight
                  )
                )}
                style={{
                  width: `${Math.min(distribution.gvm_percentage, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatWeight(distribution.total_weight)}</span>
              <span
                className={cn(
                  "font-medium",
                  distribution.total_capacity_remaining < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
                )}
              >
                {distribution.total_capacity_remaining >= 0 ? (
                  <>
                    {formatWeight(distribution.total_capacity_remaining)} remaining
                  </>
                ) : (
                  <>
                    {formatWeight(Math.abs(distribution.total_capacity_remaining))} over
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Front Axle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(
                distribution.front_axle_percentage,
                distribution.is_front_overweight
              )}
              <span className="text-sm font-medium">Front Axle</span>
            </div>
            <Badge variant={distribution.is_front_overweight ? "destructive" : "default"}>
              {distribution.front_axle_percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  getProgressBarColor(
                    distribution.front_axle_percentage,
                    distribution.is_front_overweight
                  )
                )}
                style={{
                  width: `${Math.min(distribution.front_axle_percentage, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatWeight(distribution.front_axle_weight)}</span>
              <span
                className={cn(
                  "font-medium",
                  distribution.front_axle_capacity_remaining < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
                )}
              >
                {distribution.front_axle_capacity_remaining >= 0 ? (
                  <>
                    {formatWeight(distribution.front_axle_capacity_remaining)} remaining
                  </>
                ) : (
                  <>
                    {formatWeight(Math.abs(distribution.front_axle_capacity_remaining))} over
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Rear Axle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(
                distribution.rear_axle_percentage,
                distribution.is_rear_overweight
              )}
              <span className="text-sm font-medium">Rear Axle</span>
            </div>
            <Badge variant={distribution.is_rear_overweight ? "destructive" : "default"}>
              {distribution.rear_axle_percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  getProgressBarColor(
                    distribution.rear_axle_percentage,
                    distribution.is_rear_overweight
                  )
                )}
                style={{
                  width: `${Math.min(distribution.rear_axle_percentage, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatWeight(distribution.rear_axle_weight)}</span>
              <span
                className={cn(
                  "font-medium",
                  distribution.rear_axle_capacity_remaining < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
                )}
              >
                {distribution.rear_axle_capacity_remaining >= 0 ? (
                  <>
                    {formatWeight(distribution.rear_axle_capacity_remaining)} remaining
                  </>
                ) : (
                  <>
                    {formatWeight(Math.abs(distribution.rear_axle_capacity_remaining))} over
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Load Centre of Gravity */}
        {distribution.load_cog_x > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Load centre of gravity:{" "}
              <span className="font-medium text-foreground">
                {distribution.load_cog_x.toFixed(2)}m
              </span>{" "}
              from front of body
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

