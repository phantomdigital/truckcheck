import { redirect } from "next/navigation"
import { LoadCalculator } from './components/load-calculator';
import { DashboardNavServer } from '@/components/dashboard-nav-server';
import { ISUZU_FVR_170_300, FUSO_SHOGUN_FS76 } from '@/lib/load-calculator/truck-config';
import type { TruckConfig } from '@/lib/load-calculator/truck-config';
import { Suspense } from 'react';

// Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar Skeleton */}
      <div className="w-20 bg-gray-900 border-r border-gray-800 shrink-0">
        <div className="flex flex-col items-center py-4 gap-2 h-full">
          {/* Logo Skeleton */}
          <div className="w-8 h-8 bg-muted/30 rounded animate-pulse mb-4" />
          
          {/* Tool Icons Skeleton */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-10 h-10 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Area Skeleton */}
        <div className="flex-1 bg-gray-950 relative">
          <div className="absolute inset-4">
            {/* Truck Outline Skeleton */}
            <div className="w-full h-32 bg-muted/10 rounded-lg animate-pulse mb-4" />
            
            {/* Pallet Grid Skeleton */}
            <div className="grid grid-cols-6 gap-2 max-w-4xl">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 shrink-0 p-4">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get truck configuration from URL parameters
 */
function getTruckConfigFromParams(params: { manufacturer?: string; model?: string }): TruckConfig {
  const { manufacturer, model } = params;
  
  // Map model IDs back to truck configs
  if (manufacturer === "isuzu" && model === "isuzu-fvd-165-260-mwb") {
    return ISUZU_FVR_170_300;
  }
  
  if (manufacturer === "fuso" && model === "fuso-shogun-fs76-8x4") {
    return FUSO_SHOGUN_FS76;
  }
  
  // Default fallback to Isuzu if no valid selection
  return ISUZU_FVR_170_300;
}


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer?: string; model?: string; bodyType?: string }>
}) {
  const params = await searchParams;
  
  // If no truck is selected, redirect to setup
  if (!params.manufacturer || !params.model) {
    redirect("/dashboard/setup");
  }
  
  const selectedTruckConfig = getTruckConfigFromParams(params);
  
  return (
    <div className="flex flex-col h-full">
      <DashboardNavServer />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<DashboardSkeleton />}>
          <LoadCalculator truckConfig={selectedTruckConfig} />
        </Suspense>
      </div>
    </div>
  );
}

