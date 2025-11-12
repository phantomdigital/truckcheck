import Link from "next/link"
import Image from "next/image"
import { navigationItems } from "@/lib/navigation"
import { Navigation } from "./header-navigation"
import { AuthButton } from "./auth-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" prefetch={true} className="hover:opacity-80 transition-opacity shrink-0">
            <Image
              src="/logo.png"
              alt="TruckCheck"
              width={140}
              height={36}
              className="object-contain h-9"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-6">
            <Navigation />
            <div className="hidden md:block h-6 w-px bg-border"></div>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}

