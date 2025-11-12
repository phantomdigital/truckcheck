import Link from "next/link"
import { Button } from "./ui/button"
import { createClient, getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { AccountPopover } from "./account-popover"

export async function AuthButton() {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant={"ghost"}>
          <Link href="/auth/login" prefetch={true}>Login</Link>
        </Button>
        <Button asChild size="rounded" variant={"cta"}>
          <Link href="/auth/sign-up" prefetch={true}>Get Started</Link>
        </Button>
      </div>
    )
  }

  // Get subscription status (cached) and user details in parallel
  const [subscriptionStatus, userDataResult] = await Promise.all([
    getSubscriptionStatus(),
    (async () => {
      const supabase = await createClient()
      return await supabase
    .from("users")
        .select("first_name, last_name")
    .eq("id", user.id)
    .single()
    })(),
  ])

  const userData = userDataResult.data

  return (
    <AccountPopover
      user={{
        email: user.email,
        firstName: userData?.first_name,
        lastName: userData?.last_name,
      }}
      isPro={subscriptionStatus.isPro}
      subscriptionEndDate={subscriptionStatus.subscriptionEndDate}
    />
  )
}

