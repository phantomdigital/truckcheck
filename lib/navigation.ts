/**
 * Navigation configuration for the site
 * Add new tools here as they're created
 */

import type { LucideIcon } from "lucide-react"
import { Navigation as NavigationIcon } from "lucide-react"

export interface NavItem {
  title: string
  href?: string
  description?: string
  comingSoon?: boolean
  icon?: LucideIcon
  items?: NavItem[] // For dropdown menus
}

export const navigationItems: NavItem[] = [
  {
    title: "Tools",
    items: [
      {
        title: "100km Distance Checker",
        href: "/100km-distance-checker-as-the-crow-flies",
        description: "Check distance as the crow flies to see if you need a work diary",
        icon: NavigationIcon,
      },
      // Add more tools here as they're created
      // Example:
      // {
      //   title: "Route Planner",
      //   href: "/route-planner",
      //   description: "Plan your routes efficiently",
      //   comingSoon: true,
      // },
    ],
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
  for (const item of navigationItems) {
    if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
      return item
    }
    if (item.items) {
      const found = item.items.find((subItem) => 
        subItem.href && (pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
      )
      if (found) return found
    }
  }
  return undefined
}

