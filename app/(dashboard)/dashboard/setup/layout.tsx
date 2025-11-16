import { DashboardNavServer } from '@/components/dashboard-nav-server';
import { Suspense } from 'react';

// Loading skeleton for setup pages
function SetupPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-8 w-64 bg-muted/20 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-4 w-96 bg-muted/20 rounded mx-auto animate-pulse" />
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card/50 border border-border/50 rounded-lg p-6 animate-pulse">
              <div className="h-6 w-3/4 bg-muted/30 rounded mb-3" />
              <div className="h-4 w-full bg-muted/20 rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <DashboardNavServer />
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<SetupPageSkeleton />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}

