import Link from "next/link"

interface PageHeaderProps {
  title: string
  description: string
  breadcrumbs?: Array<{
    label: string
    href: string
  }>
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="w-full border-b border-border/50 bg-muted/30">
      <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-32">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          )}

          {/* Title and Description */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

