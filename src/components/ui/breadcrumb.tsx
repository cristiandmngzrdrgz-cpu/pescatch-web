import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-sm mb-6" style={{ color: '#4A6080' }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span style={{ color: '#1E3A5F' }}>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#00D4FF] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span style={{ color: '#E8F0FE' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
