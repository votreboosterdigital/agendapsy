import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek } from 'date-fns'
import { WeekCalendar } from './components/WeekCalendar'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Service = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'name' | 'duration_min' | 'price_usd'
>

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const [{ data: appointments }, { data: services }] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, patient_name, patient_email, service_name, price_usd, starts_at, ends_at, status, notes, patient_whatsapp, patient_id, therapist_id, reminder_24h_sent, reminder_1h_sent, created_at'
      )
      .eq('therapist_id', user.id)
      .gte('starts_at', weekStart.toISOString())
      .lte('starts_at', weekEnd.toISOString())
      .order('starts_at'),
    supabase
      .from('services')
      .select('id, name, duration_min, price_usd')
      .eq('therapist_id', user.id)
      .eq('is_active', true),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Agenda</h1>
        <NewAppointmentDialog services={(services ?? []) as Service[]} />
      </div>
      <WeekCalendar
        appointments={(appointments ?? []) as Appointment[]}
        weekStart={weekStart}
      />
    </div>
  )
}
