import { getSubscriptionStatus, getCalculationHistory } from "@/lib/stripe/actions"
import { getDepot } from "@/lib/depot/actions"
import { DepotSettings } from "@/components/depot-settings"
import { CalculationHistoryClient } from "@/components/calculation-history-client"

export async function ProContent() {
  // Use cached subscription status
  const { isPro } = await getSubscriptionStatus()

  if (!isPro) {
    return null
  }

  // Fetch both in parallel for better performance
  const [historyResult, depotResult] = await Promise.all([
    getCalculationHistory(),
    getDepot(),
  ])

  return (
    <>
      {/* Depot Settings - Only for Pro */}
      <DepotSettings initialDepot={depotResult.data} />

      {/* Calculation History - Only for Pro */}
      <CalculationHistoryClient initialHistory={historyResult.data} />
    </>
  )
}

