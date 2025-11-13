import Link from "next/link"
import { Button } from "@/components/ui/button"
import { navigationItems } from "@/lib/navigation"

export const metadata = {
  title: "404 - Page Not Found | TruckCheck",
  description: "The page you're looking for doesn't exist.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Heading */}
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold text-primary/20 dark:text-primary/10">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It may have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Popular pages:
          </p>
          <nav className="flex flex-wrap gap-4 justify-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-primary hover:underline transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

