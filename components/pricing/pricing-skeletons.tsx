import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PricingContentSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>

      {/* Pricing Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {[1, 2].map((i) => (
          <Card key={i} className="relative pt-4">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-24 mx-auto" />
                <CardTitle>
                  <Skeleton className="h-7 w-32 mx-auto" />
                </CardTitle>
                {/* Use div instead of CardDescription to avoid nesting div inside p */}
                <div className="text-sm text-muted-foreground">
                  <Skeleton className="h-4 w-48 mx-auto" />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                    <Skeleton className="h-4 flex-1" />
                  </li>
                ))}
              </ul>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-80 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </>
  )
}

