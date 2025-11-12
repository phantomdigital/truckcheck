import { createClient } from "@/lib/supabase/server"
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"
  
  // Log for debugging
  console.log("[Auth Confirm] Params:", {
    token_hash: token_hash ? "present" : "missing",
    type,
    next,
    checkout: searchParams.get("checkout"),
    priceId: searchParams.get("priceId"),
    allParams: Object.fromEntries(searchParams.entries())
  })

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      console.log("[Auth Confirm] Email verified successfully")
      
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if there's a checkout intent from sign-up
      const checkoutIntent = searchParams.get("checkout")
      let priceId = searchParams.get("priceId")
      
      // If checkout intent is in URL params, use it
      if (checkoutIntent === "true" || next.includes("checkout=true")) {
        console.log("[Auth Confirm] Checkout intent from URL params")
        const params = new URLSearchParams()
        if (priceId) {
          params.set("priceId", priceId)
        }
        redirect(`/checkout/verify?${params.toString()}`)
      }
      
      // Otherwise, check user metadata for checkout intent
      // This handles cases where URL params are lost in email flow
      if (user?.user_metadata?.checkout_intent === true) {
        console.log("[Auth Confirm] Checkout intent from user metadata")
        const params = new URLSearchParams()
        if (user.user_metadata?.price_id) {
          params.set("priceId", user.user_metadata.price_id)
        }
        redirect(`/checkout/verify?${params.toString()}`)
      }
      
      console.log("[Auth Confirm] No checkout intent, redirecting to:", next)
      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      console.error("[Auth Confirm] Verification error:", error)
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || "Verification failed")}`)
    }
  }

  console.error("[Auth Confirm] Missing token_hash or type")
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=Invalid confirmation link. Please request a new confirmation email.`)
}

