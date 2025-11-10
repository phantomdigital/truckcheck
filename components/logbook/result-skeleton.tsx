"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ResultSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Primary Information Skeleton */}
        <div className="space-y-4">
          {/* Distance Card Skeleton */}
          <div className="text-center space-y-2 p-4 sm:p-6 border border-border/50 rounded-lg bg-muted/30">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-12 w-32 mx-auto" />
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>

          {/* Logbook Required Card Skeleton */}
          <div className="relative overflow-hidden rounded-lg border-2 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Route Information Skeleton */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        </div>

        {/* Map Skeleton */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="w-full h-[300px] sm:h-[400px] lg:h-[450px] rounded-lg" />
        </div>

        {/* Distance Summary Skeleton */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-10 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-10 w-24 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

