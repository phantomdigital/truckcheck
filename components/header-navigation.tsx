"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationItems } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sparkles } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-8">
        {navigationItems.map((item) => {
          // Dropdown menu items
          if (item.items && item.items.length > 0) {
            const hasActiveChild = item.items.some(
              (subItem) => subItem.href && (pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
            )
            
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger 
                  className={cn(
                    "h-auto bg-transparent px-0 py-2 text-[15px] font-semibold hover:bg-transparent data-[state=open]:bg-transparent",
                    "relative transition-colors duration-200",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300",
                    "hover:after:scale-x-100 data-[state=open]:after:scale-x-100",
                    hasActiveChild 
                      ? "text-foreground after:scale-x-100" 
                      : "text-foreground/70 hover:text-foreground data-[state=open]:text-foreground"
                  )}
                >
                  {item.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[340px] p-3 space-y-1">
                    {item.items.map((subItem) => {
                      const Icon = subItem.icon
                      const isComingSoon = subItem.comingSoon || !subItem.href
                      const isActive = subItem.href && (pathname === subItem.href || pathname.startsWith(`${subItem.href}/`))
                      
                      if (isComingSoon) {
                        return (
                          <li key={subItem.title}>
                            <div className="flex items-start gap-3.5 px-4 py-3 rounded-sm border border-border/40 bg-muted/20 opacity-50 cursor-not-allowed">
                              {Icon && (
                                <div className="mt-0.5 shrink-0 text-muted-foreground">
                                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-sm">
                                    {subItem.title}
                                  </div>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium uppercase tracking-wider">
                                    Soon
                                  </span>
                                </div>
                                {subItem.description && (
                                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {subItem.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      }
                      
                      return (
                        <li key={subItem.href || subItem.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={subItem.href || "#"}
                              className={cn(
                                "group flex items-start gap-3.5 px-4 py-3 rounded-sm border transition-all duration-200",
                                "hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
                                isActive
                                  ? "border-primary/40 bg-primary/5 shadow-sm"
                                  : "border-border/40 bg-card"
                              )}
                            >
                              <div className="flex items-start gap-3.5 w-full">
                                {Icon && (
                                  <div className={cn(
                                    "mt-0.5 shrink-0 transition-colors duration-200",
                                    isActive 
                                      ? "text-primary" 
                                      : "text-muted-foreground group-hover:text-primary"
                                  )}>
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold leading-tight">
                                    {subItem.title}
                                  </div>
                                  {subItem.description && (
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                      {subItem.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )
                    })}
                    
                    {/* More tools coming soon */}
                    {item.items.filter(subItem => !subItem.comingSoon && subItem.href).length < 3 && (
                      <li>
                        <div className="pt-3 mt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-primary/60" strokeWidth={2} />
                            <span>More tools coming soon</span>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          }
          
          // Regular navigation links
          const isActive = item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
          
          return (
            <NavigationMenuItem key={item.href || item.title}>
              <Link href={item.href || "#"} legacyBehavior passHref>
                <NavigationMenuLink 
                  className={cn(
                    "group inline-flex h-auto items-center justify-center bg-transparent px-0 py-2 text-[15px] font-semibold transition-colors duration-200",
                    "relative",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300",
                    "hover:after:scale-x-100",
                    isActive 
                      ? "text-foreground after:scale-x-100" 
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {item.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

