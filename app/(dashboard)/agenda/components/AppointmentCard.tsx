'use client'

import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { updateAppointmentStatus } from '@/app/actions/appointments'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#16a34a20', text: '#4ade80' },
  completed: { bg: '#2563eb20', text: '#60a5fa' },
  no_show: { bg: '#dc262620', text: '#f87171' },
  cancelled: { bg: '#52525220', text: '#a1a1aa' },
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const colors = STATUS_COLORS[appointment.status] ?? STATUS_COLORS.confirmed

  async function markNoShow() {
    const result = await updateAppointmentStatus(appointment.id, 'no_show')
    if (!result.success) toast.error(result.error)
    else toast.success('Marcado como no-show')
  }

  return (
    <div
      className="rounded p-1.5 text-xs cursor-pointer mb-1 group relative"
      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.text}30` }}
      title={`${appointment.patient_name} — ${appointment.service_name}`}
      onClick={markNoShow}
    >
      <p className="font-medium truncate">{appointment.patient_name}</p>
      <p className="opacity-70 truncate">{appointment.service_name}</p>
      <p className="opacity-60">{format(parseISO(appointment.starts_at), 'HH:mm')}</p>
    </div>
  )
}
