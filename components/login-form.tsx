"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { captureEvent, identifyUser } from "@/lib/posthog/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"
  const shouldCheckout = searchParams.get("checkout") === "true"
  const priceId = searchParams.get("priceId") || undefined
  const planName = searchParams.get("plan") || searchParams.get("product") || null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Track login event and identify user
      if (data.user) {
        captureEvent("user_logged_in", {
          checkout_intent: shouldCheckout,
          price_id: priceId,
          plan_name: planName,
        })
        identifyUser(data.user.id, {
          email: data.user.email,
        })
      }
      
      // If checkout intent, redirect to checkout verification route
      // Keep loading state active during navigation
      if (shouldCheckout) {
        const params = new URLSearchParams()
        if (priceId) {
          params.set("priceId", priceId)
        }
        router.push(`/checkout/verify?${params.toString()}`)
        // Don't set loading to false - let the navigation complete
        return
      } else {
        // Redirect to intended page or home after successful login
        router.push(redirectTo)
        router.refresh()
        return
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl gradient-text">
            {shouldCheckout 
              ? planName
                ? `Login to unlock ${planName}`
                : "Login to unlock Pro"
              : "Login"}
          </CardTitle>
          <CardDescription className="text-base">
            {shouldCheckout
              ? "Enter your email below to login and continue to checkout. The free tool works without sign-up, but Pro features require an account."
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" variant="cta" className="w-full !rounded-md" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{shouldCheckout ? "Preparing checkout..." : "Logging in..."}</span>
                  </div>
                ) : (
                  shouldCheckout ? "Continue to checkout" : "Login"
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {shouldCheckout ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/auth/sign-up?redirect=/pricing&checkout=true${planName ? `&plan=${encodeURIComponent(planName)}` : ''}${searchParams.get("priceId") ? `&priceId=${searchParams.get("priceId")}` : ''}`}
                    className="underline underline-offset-4"
                  >
                    Sign up to upgrade
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

