import { DashboardNav } from './dashboard-nav';
import { Suspense } from 'react';

// Fallback component for loading state
function DashboardNavFallback() {
  return (
    <nav className="h-12 border-b border-border/40 bg-background flex items-center px-6 shrink-0">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex flex-col px-3 py-1">
          <span className="text-[10px] uppercase tracking-wider font-medium opacity-50">
            Manufacturer
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            Loading...
          </span>
        </div>
      </div>
    </nav>
  );
}

// This component wraps the client DashboardNav in Suspense
export function DashboardNavServer() {
  return (
    <Suspense fallback={<DashboardNavFallback />}>
      <DashboardNav />
    </Suspense>
  );
}

