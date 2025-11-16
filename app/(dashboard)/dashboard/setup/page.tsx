import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, ArrowRight } from "lucide-react"

/**
 * Setup Landing Page - Overview of the setup process
 * Server Component
 */
export default function SetupPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <div className="w-full max-w-400 mx-auto px-4 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Let's Set Up Your Load Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We'll guide you through selecting your truck and body type to ensure accurate weight calculations.
            </p>
          </div>

          {/* Steps Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Step 1</div>
                    <CardTitle className="text-xl">Brand</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Select your truck manufacturer
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Step 2</div>
                    <CardTitle className="text-xl">Model</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Choose model and wheelbase
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Step 3</div>
                    <CardTitle className="text-xl">Body Type</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Select body configuration
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard/setup/manufacturer">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>This will only take a minute. You can change these settings later.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

