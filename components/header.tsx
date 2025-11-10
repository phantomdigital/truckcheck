import Link from "next/link"
import Image from "next/image"
import { navigationItems } from "@/lib/navigation"
import { Navigation } from "./header-navigation"
import { AuthButton } from "./auth-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="TruckCheck"
              width={120}
              height={32}
              className="object-contain h-8"
            />
          </Link>
          
          <div className="flex items-center gap-4">
            <Navigation />
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}

