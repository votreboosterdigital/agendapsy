import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, Settings } from 'lucide-react'
import { NavLink } from './components/NavLink'
import { SidebarSignOut } from './components/SidebarSignOut'
import { ThemeToggle } from './components/ThemeToggle'
import { MobileNav } from './components/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 border-r bg-card border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <span className="text-foreground font-semibold text-base tracking-tight">
            AgendaPsy
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/agenda" icon={<Calendar size={16} />} label="Agenda" />
          <NavLink href="/pacientes" icon={<Users size={16} />} label="Pacientes" />
          <NavLink href="/configuracion" icon={<Settings size={16} />} label="Configuración" />
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <p className="text-xs text-muted-foreground px-2 mb-2 truncate">
            {profile?.email ?? user.email}
          </p>
          <ThemeToggle />
          <SidebarSignOut />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
