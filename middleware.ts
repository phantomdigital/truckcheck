import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api/stripe/webhook (Stripe webhooks - must not be modified)
     * - api/proxy-map-image (Map image proxy - must be publicly accessible for email clients)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/proxy-map-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

