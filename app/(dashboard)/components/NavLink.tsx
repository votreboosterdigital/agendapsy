'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

export function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors"
      style={{
        backgroundColor: isActive ? '#635BFF20' : 'transparent',
        color: isActive ? '#635BFF' : '#a1a1aa',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
