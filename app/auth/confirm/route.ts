import { createClient } from "@/lib/supabase/server"
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

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
      // Check if there's a checkout intent from sign-up
      // If user came from email confirmation and has checkout intent, redirect to pricing
      const checkoutIntent = searchParams.get("checkout")
      const priceId = searchParams.get("priceId")
      
      if (checkoutIntent === "true" || next.includes("checkout=true")) {
        // Redirect to checkout verification route which handles auth verification and checkout
        const params = new URLSearchParams()
        if (priceId) {
          params.set("priceId", priceId)
        }
        redirect(`/checkout/verify?${params.toString()}`)
      } else {
        // redirect user to specified redirect URL or root of app
        redirect(next)
      }
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`)
}

