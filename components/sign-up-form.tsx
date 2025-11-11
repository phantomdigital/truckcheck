"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"
  const shouldCheckout = searchParams.get("checkout") === "true"
  const priceId = searchParams.get("priceId") || undefined
  const planName = searchParams.get("plan") || searchParams.get("product") || null

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Build email redirect URL with checkout params if needed
      let emailRedirectTo = `${window.location.origin}/auth/confirm`
      if (shouldCheckout) {
        const params = new URLSearchParams()
        params.set("checkout", "true")
        params.set("next", redirectTo)
        if (priceId) {
          params.set("priceId", priceId)
        }
        emailRedirectTo = `${emailRedirectTo}?${params.toString()}`
      } else if (redirectTo !== "/") {
        emailRedirectTo = `${emailRedirectTo}?next=${encodeURIComponent(redirectTo)}`
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })
      if (error) throw error
      
      // Check if user is immediately authenticated (email confirmation may or may not be required)
      // If session exists, user can proceed to checkout
      if (data.session && shouldCheckout) {
        // User is authenticated, redirect to checkout verification route
        // This route will verify auth server-side and create the checkout session
        // Keep loading state active during navigation
        const params = new URLSearchParams()
        if (priceId) {
          params.set("priceId", priceId)
        }
        router.push(`/checkout/verify?${params.toString()}`)
        // Don't set loading to false - let the navigation complete
        return
      } else if (shouldCheckout) {
        // User needs to confirm email first
        // Store checkout intent in sessionStorage for after email confirmation
        if (priceId) {
          sessionStorage.setItem("checkout_priceId", priceId)
        }
        sessionStorage.setItem("checkout_redirect", redirectTo)
        router.push("/auth/sign-up-success?checkout=true")
        return
      } else {
        router.push("/auth/sign-up-success")
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
                ? `Sign up to unlock ${planName}`
                : "Sign up to unlock Pro"
              : "Sign up"}
          </CardTitle>
          <CardDescription className="text-base">
            {shouldCheckout 
              ? planName
                ? `Create an account to start your ${planName} subscription. The free tool works without sign-up, but Pro features require an account.`
                : "Create an account to unlock Pro features. The free tool works without sign-up, but Pro features require an account."
              : "Create a new account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
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
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" variant="cta" className="w-full !rounded-md" disabled={isLoading}>
                {isLoading 
                  ? (shouldCheckout ? "Creating account..." : "Creating an account...")
                  : (shouldCheckout ? "Continue to checkout" : "Sign up")}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {shouldCheckout ? (
                <>
                  Already have an account?{" "}
                  <Link 
                    href={`/auth/login?redirect=/pricing&checkout=true${planName ? `&plan=${encodeURIComponent(planName)}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                    className="underline underline-offset-4"
                  >
                    Login to upgrade
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Login
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

