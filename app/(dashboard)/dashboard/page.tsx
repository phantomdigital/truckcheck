import { redirect } from "next/navigation"
import { LoadCalculator } from './components/load-calculator';
import { ISUZU_FVR_170_300, FUSO_SHOGUN_FS76 } from '@/lib/load-calculator/truck-config';
import type { TruckConfig } from '@/lib/load-calculator/truck-config';

/**
 * Get truck configuration from URL parameters
 */
function getTruckConfigFromParams(params: { manufacturer?: string; model?: string }): TruckConfig {
  const { manufacturer, model } = params;
  
  // Map model IDs back to truck configs
  if (manufacturer === "isuzu" && model === "isuzu-fvd-165-260-mwb") {
    return ISUZU_FVR_170_300;
  }
  
  if (manufacturer === "fuso" && model === "fuso-shogun-fs76-8x4") {
    return FUSO_SHOGUN_FS76;
  }
  
  // Default fallback to Isuzu if no valid selection
  return ISUZU_FVR_170_300;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer?: string; model?: string; bodyType?: string }>
}) {
  const params = await searchParams;
  
  // If no truck is selected, redirect to setup
  if (!params.manufacturer || !params.model) {
    redirect("/dashboard/setup");
  }
  
  const selectedTruckConfig = getTruckConfigFromParams(params);
  
  return <LoadCalculator truckConfig={selectedTruckConfig} />;
}

