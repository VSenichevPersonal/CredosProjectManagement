import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/landing"
        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors group"
      >
        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Главная</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-500" />
          {item.href ? (
            <Link href={item.href} className="text-gray-300 hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

