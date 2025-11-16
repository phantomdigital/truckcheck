import { DashboardNav } from './dashboard-nav';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';

// Skeleton component that matches the nav design
function DashboardNavSkeleton() {
  return (
    <nav className="h-12 border-b border-border/40 bg-background flex items-center shrink-0 w-full">
      <div className="flex items-center gap-3 flex-1 overflow-x-auto px-6">
        {/* Skeleton Steps */}
        {[
          { label: 'Manufacturer', width: 'w-20' },
          { label: 'Model', width: 'w-24' },
          { label: 'Body Type', width: 'w-16' }
        ].map((step, index) => (
          <div key={step.label} className="flex items-center gap-2 shrink-0">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            )}
            
            <div className="flex flex-col px-3 py-1 rounded-md">
              <span className="text-[10px] uppercase tracking-wider font-medium opacity-50">
                {step.label}
              </span>
              <div className={`h-4 bg-muted/50 rounded animate-pulse ${step.width}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Skeleton */}
      <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
        <div className="h-6 w-20 bg-muted/50 rounded animate-pulse" />
      </div>
    </nav>
  );
}

// This component wraps the client DashboardNav in Suspense
export function DashboardNavServer() {
  return (
    <Suspense fallback={<DashboardNavSkeleton />}>
      <DashboardNav />
    </Suspense>
  );
}

