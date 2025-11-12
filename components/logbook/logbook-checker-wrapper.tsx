import { getSubscriptionStatus } from "@/lib/stripe/actions"
import LogbookChecker from "../../app/logbook-checker"
import { DepotProvider } from "@/lib/depot/depot-context"

export async function LogbookCheckerWrapper() {
  // Fetch subscription status (cached)
  const { isPro } = await getSubscriptionStatus()

  return (
    <DepotProvider isPro={isPro}>
      <LogbookChecker isPro={isPro} />
    </DepotProvider>
  )
}

