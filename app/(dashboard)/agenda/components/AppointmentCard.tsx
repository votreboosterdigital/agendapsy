'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { updateAppointmentStatus, updateAppointmentTime } from '@/app/actions/appointments'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']

const STATUS_INFO = {
  confirmed: { bg: '#16a34a20', text: '#4ade80', label: 'Confirmada' },
  completed: { bg: '#2563eb20', text: '#60a5fa', label: 'Completada' },
  no_show:   { bg: '#dc262620', text: '#f87171', label: 'No se presentó' },
  cancelled: { bg: '#52525220', text: '#a1a1aa', label: 'Cancelada' },
}

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 20; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 20) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reschedule, setReschedule] = useState(false)
  const [newDate, setNewDate] = useState(format(parseISO(appointment.starts_at), 'yyyy-MM-dd'))
  const [newTime, setNewTime] = useState(format(parseISO(appointment.starts_at), 'HH:mm'))

  const colors = STATUS_INFO[appointment.status as keyof typeof STATUS_INFO] ?? STATUS_INFO.confirmed

  async function handleStatus(status: 'confirmed' | 'cancelled' | 'no_show' | 'completed') {
    setLoading(true)
    const result = await updateAppointmentStatus(appointment.id, status)
    setLoading(false)
    if (!result.success) toast.error(result.error)
    else {
      toast.success(STATUS_INFO[status].label)
      setOpen(false)
    }
  }

  async function handleReschedule() {
    setLoading(true)
    const origStart = parseISO(appointment.starts_at)
    const origEnd = parseISO(appointment.ends_at)
    const durationMs = origEnd.getTime() - origStart.getTime()
    const newStart = new Date(`${newDate}T${newTime}:00`)
    const newEnd = new Date(newStart.getTime() + durationMs)
    const result = await updateAppointmentTime(appointment.id, newStart.toISOString(), newEnd.toISOString())
    setLoading(false)
    if (!result.success) toast.error(result.error)
    else {
      toast.success('Cita reprogramada')
      setReschedule(false)
      setOpen(false)
    }
  }

  const isEditable = appointment.status === 'confirmed'

  return (
    <>
      <div
        className="rounded p-1.5 text-xs cursor-pointer mb-1 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.text}30` }}
        onClick={() => setOpen(true)}
      >
        <p className="font-medium truncate">{appointment.patient_name}</p>
        <p className="opacity-70 truncate">{appointment.service_name}</p>
        <p className="opacity-60">{format(parseISO(appointment.starts_at), 'HH:mm')}</p>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 shadow-2xl bg-card border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">{appointment.patient_name}</p>
                <p className="text-xs text-muted-foreground">{appointment.patient_email}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">
                  {format(parseISO(appointment.starts_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{appointment.service_name}</p>
              {appointment.price_usd && (
                <p className="text-sm text-muted-foreground">${appointment.price_usd} MXN</p>
              )}
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {colors.label}
              </span>
            </div>

            {/* Reschedule section */}
            {isEditable && (
              reschedule ? (
                <div className="space-y-3 mb-4 p-3 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-medium text-foreground">Cambiar horario</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="px-2 py-1.5 rounded-md text-xs text-foreground bg-card border border-border outline-none focus:ring-1 focus:ring-[#635BFF]"
                    />
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="px-2 py-1.5 rounded-md text-xs text-foreground bg-card border border-border outline-none focus:ring-1 focus:ring-[#635BFF]"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReschedule(false)}
                      className="flex-1 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReschedule}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 text-xs text-white rounded-md disabled:opacity-50"
                      style={{ backgroundColor: '#635BFF' }}
                    >
                      {loading ? '...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReschedule(true)}
                  className="w-full mb-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors flex items-center gap-2"
                >
                  <Clock size={14} />
                  Cambiar horario
                </button>
              )
            )}

            {/* Status actions */}
            {isEditable && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatus('completed')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  <CheckCircle size={13} />
                  Completada
                </button>
                <button
                  onClick={() => handleStatus('no_show')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md disabled:opacity-50"
                  style={{ backgroundColor: '#dc262620', color: '#f87171', border: '1px solid #f8717130' }}
                >
                  <AlertCircle size={13} />
                  No show
                </button>
                <button
                  onClick={() => handleStatus('cancelled')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md disabled:opacity-50"
                  style={{ backgroundColor: '#52525220', color: '#a1a1aa', border: '1px solid #a1a1aa30' }}
                >
                  <XCircle size={13} />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
