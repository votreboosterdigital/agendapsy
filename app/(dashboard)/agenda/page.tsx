import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, addDays, format, parseISO, isValid } from 'date-fns'
import { WeekCalendar } from './components/WeekCalendar'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Service = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'name' | 'duration_min' | 'price_usd'
>

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let weekStart: Date
  if (week) {
    const parsed = parseISO(week)
    weekStart = isValid(parsed)
      ? startOfWeek(parsed, { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  } else {
    weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  }
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const prevWeek = format(addDays(weekStart, -7), 'yyyy-MM-dd')
  const nextWeek = format(addDays(weekStart, 7), 'yyyy-MM-dd')

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
        <NewAppointmentDialog services={(services ?? []) as Service[]} defaultDate={format(new Date(), 'yyyy-MM-dd')} />
      </div>
      <WeekCalendar
        appointments={(appointments ?? []) as Appointment[]}
        weekStart={weekStart}
        prevWeek={prevWeek}
        nextWeek={nextWeek}
      />
    </div>
  )
}
