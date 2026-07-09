'use client'

import { format, addDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { AppointmentCard } from './AppointmentCard'

type Appointment = Database['public']['Tables']['appointments']['Row']

interface WeekCalendarProps {
  appointments: Appointment[]
  weekStart: Date
  prevWeek: string
  nextWeek: string
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7)

export function WeekCalendar({ appointments, weekStart, prevWeek, nextWeek }: WeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  const rangeLabel = `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <a
          href={`/agenda?week=${prevWeek}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white border transition-colors"
          style={{ borderColor: '#ffffff12' }}
        >
          <ChevronLeft size={15} />
          Semana anterior
        </a>
        <span className="text-sm font-medium text-white capitalize">{rangeLabel}</span>
        <a
          href={`/agenda?week=${nextWeek}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white border transition-colors"
          style={{ borderColor: '#ffffff12' }}
        >
          Semana siguiente
          <ChevronRight size={15} />
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#ffffff12' }}>
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 border-b" style={{ borderColor: '#ffffff12', backgroundColor: '#161618' }}>
            <div className="p-3 text-xs text-zinc-500" />
            {days.map((day) => (
              <div key={day.toISOString()} className="p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase">
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className="text-sm text-white font-medium">{format(day, 'd')}</p>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: '#0F0F11' }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b"
                style={{ borderColor: '#ffffff08', minHeight: '64px' }}
              >
                <div className="p-2 text-xs text-zinc-600 text-right pr-3 pt-2">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {days.map((day) => {
                  const dayAppts = appointments.filter((a) => {
                    const d = parseISO(a.starts_at)
                    return (
                      d.getDate() === day.getDate() &&
                      d.getMonth() === day.getMonth() &&
                      d.getFullYear() === day.getFullYear() &&
                      d.getHours() === hour
                    )
                  })
                  return (
                    <div
                      key={day.toISOString()}
                      className="border-l p-1 relative"
                      style={{ borderColor: '#ffffff08' }}
                    >
                      {dayAppts.map((appt) => (
                        <AppointmentCard key={appt.id} appointment={appt} />
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
