import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to the main tool for now
  // In the future, this can be a landing page with multiple tools
  redirect("/100km-distance-checker-as-the-crow-flies")
}

