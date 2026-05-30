'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function SidebarSignOut() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-2.5 px-2 py-2 rounded-md text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
    >
      <LogOut size={16} />
      Cerrar sesión
    </button>
  )
}
