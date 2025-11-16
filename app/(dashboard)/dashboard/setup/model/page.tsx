import { redirect } from "next/navigation"

/**
 * Redirect /dashboard/setup/model to /dashboard/setup/truck
 * (The actual model selection page is at /dashboard/setup/truck)
 */
export default async function ModelRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ manufacturer?: string }>
}) {
  const params = await searchParams
  const manufacturer = params.manufacturer
  const queryParams = manufacturer ? `?manufacturer=${manufacturer}` : ""
  redirect(`/dashboard/setup/truck${queryParams}`)
}

