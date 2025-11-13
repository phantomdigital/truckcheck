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
    title: "100km Distance Checker",
    href: "/100km-distance-checker-as-the-crow-flies",
    description: "Check distance as the crow flies to see if you need a work diary",
  },
  {
    title: "Pricing",
    href: "/pricing",
    description: "View our subscription plans and features",
  },
  {
    title: "Blogs",
    href: "/blog",
    description: "Learn more about TruckCheck",
  },
  {
    title: "Resources",
    href: "/resources",
    description: "Learn more about TruckCheck",
  },
]

// Helper to get the current active route
export function getActiveNavItem(pathname: string): NavItem | undefined {
  return navigationItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
}

