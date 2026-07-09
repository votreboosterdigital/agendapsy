'use client'

import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings } from 'lucide-react'

const LINKS = [
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/configuracion', icon: Settings, label: 'Config' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
      <div className="flex items-center">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <a
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-3 transition-colors"
            >
              <Icon
                size={20}
                className={active ? 'text-[#635BFF]' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-[#635BFF]' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
