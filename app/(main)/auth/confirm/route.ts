import { createClient } from "@/lib/supabase/server"
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"
import { safeCaptureException } from "@/lib/sentry/utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      console.log("[Auth Confirm] Email verified successfully")
      
      // Check if there's a checkout intent from sign-up (fallback for edge cases)
      const checkoutIntent = searchParams.get("checkout")
      const priceId = searchParams.get("priceId")
      
      if (checkoutIntent === "true" || next.includes("checkout=true")) {
        console.log("[Auth Confirm] Redirecting to checkout")
        const params = new URLSearchParams()
        if (priceId) {
          params.set("priceId", priceId)
        }
        redirect(`/checkout/verify?${params.toString()}`)
      }
      
      console.log("[Auth Confirm] Redirecting to:", next)
      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      console.error("[Auth Confirm] Verification error:", error)
      const err = new Error(`Email verification failed: ${error?.message || "Unknown error"}`)
      safeCaptureException(err, {
        context: "auth_confirm_verification",
        type,
        hasTokenHash: !!token_hash,
      })
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || "Verification failed")}`)
    }
  }

  console.error("[Auth Confirm] Missing token_hash or type")
  const err = new Error("Missing token_hash or type in auth confirmation")
  safeCaptureException(err, {
    context: "auth_confirm_missing_params",
    hasTokenHash: !!token_hash,
    hasType: !!type,
  })
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=Invalid confirmation link. Please request a new confirmation email.`)
}

