import Link from "next/link"
import { Button } from "./ui/button"
import { createClient } from "@/lib/supabase/server"
import { AccountPopover } from "./account-popover"

export async function AuthButton() {
  const supabase = await createClient()

  // Get user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    )
  }

  // Get subscription status and user details
  const { data: userData } = await supabase
    .from("users")
    .select("first_name, last_name, subscription_status, subscription_current_period_end")
    .eq("id", user.id)
    .single()

  const isPro = userData?.subscription_status === "pro"
  const subscriptionEndDate = userData?.subscription_current_period_end

  return (
    <AccountPopover
      user={{
        email: user.email,
        firstName: userData?.first_name,
        lastName: userData?.last_name,
      }}
      isPro={isPro}
      subscriptionEndDate={subscriptionEndDate}
    />
  )
}

