import Link from "next/link"
import Image from "next/image"
import { ResponsiveAd } from "@/components/ezoic"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { navigationItems } from "@/lib/navigation"

export async function Footer() {
  const currentYear = new Date().getFullYear()
  const { isPro } = await getSubscriptionStatus()

  // Get all tools from navigation items
  const toolsSection = navigationItems.find(item => item.title === "Tools")
  const tools = toolsSection?.items?.filter(tool => tool.href && !tool.comingSoon) || []

  return (
    <footer className="w-full border-t border-border/50 mt-auto bg-muted/20">
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
          {/* Ad placement in footer - only show for free users */}
          {!isPro && (
            <div className="mb-8">
              <ResponsiveAd placementId={101} />
            </div>
          )}
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Section with Logo */}
            <div className="space-y-4">
              <Image
                src="/TRUCKCHECK_LOGO.png"
                alt="TruckCheck"
                width={140}
                height={40}
                className="object-contain h-10"
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Free tools for Australian truck drivers and fleet managers. NHVR compliance made simple.
              </p>
            </div>

            {/* Tools Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Tools</h3>
              <ul className="space-y-2 text-sm">
                {tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href!}
                      prefetch={true}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tool.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    prefetch={true}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    prefetch={true}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="py-6 border-t border-border/50">
            <div className="flex items-start gap-2 mb-6">
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5"></span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> This tool is for reference only and should not be considered legal advice. 
                Always consult the official NHVR regulations and guidelines. While we strive for accuracy, 
                we cannot guarantee the results are error-free. Use at your own discretion.
              </p>
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                © {currentYear} TruckCheck. Made for Aussie Truckies.
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link
                  href="https://nhvr.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Visit NHVR.gov.au
                </Link>
                <span>•</span>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
      </div>
    </footer>
  )
}

