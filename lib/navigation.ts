/**
 * Navigation configuration for the site
 * Add new tools here as they're created
 */

export interface NavItem {
  title: string
  href: string
  description?: string
  comingSoon?: boolean
}

export const navigationItems: NavItem[] = [
  {
    title: "NHVR Logbook Checker",
    href: "/nhvr-logbook-checker",
    description: "Check if you need a work diary for your journey",
  },
  // Add more tools here as they're created
  // {
  //   title: "Route Planner",
  //   href: "/route-planner",
  //   description: "Plan your truck routes",
  //   comingSoon: true,
  // },
]

// Helper to get the current active route
export function getActiveNavItem(pathname: string): NavItem | undefined {
  return navigationItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
}

