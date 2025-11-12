import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SubscriptionDetailsSkeleton() {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeaturesListSkeleton() {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <ul className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

