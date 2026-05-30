import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, Settings } from 'lucide-react'
import { NavLink } from './components/NavLink'
import { SidebarSignOut } from './components/SidebarSignOut'

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
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0F0F11' }}>
      <aside
        className="hidden md:flex w-60 flex-col flex-shrink-0 border-r"
        style={{ backgroundColor: '#161618', borderColor: '#ffffff12' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: '#ffffff12' }}>
          <span className="text-white font-semibold text-base tracking-tight">
            AgendaPsy
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/agenda" icon={<Calendar size={16} />} label="Agenda" />
          <NavLink href="/pacientes" icon={<Users size={16} />} label="Pacientes" />
          <NavLink href="/configuracion" icon={<Settings size={16} />} label="Configuración" />
        </nav>
        <div className="px-3 py-4 border-t" style={{ borderColor: '#ffffff12' }}>
          <p className="text-xs text-zinc-500 px-2 mb-2 truncate">
            {profile?.email ?? user.email}
          </p>
          <SidebarSignOut />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
