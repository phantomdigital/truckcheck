import Link from "next/link"
import Image from "next/image"
import { Navigation } from "./header-navigation"
import { AuthButton } from "./auth-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">
          <Link href="/" prefetch={true} className="hover:opacity-80 transition-opacity duration-200 shrink-0">
            <Image
              src="/TRUCKCHECK_LOGO.png"
              alt="TruckCheck"
              width={160}
              height={40}
              className="object-contain h-10"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-8">
            <Navigation />
            <div className="hidden md:block h-8 w-[2px] bg-border/60"></div>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}

