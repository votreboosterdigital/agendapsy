'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createAppointment } from '@/app/actions/appointments'
import type { Database } from '@/lib/supabase/types'

type Service = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'name' | 'duration_min' | 'price_usd'
>

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 20; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 20) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const schema = z.object({
  patient_name: z.string().min(2, 'Mínimo 2 caracteres'),
  patient_email: z.string().email('Email inválido'),
  patient_whatsapp: z.string().optional(),
  service_id: z.string().uuid('Selecciona un servicio'),
  date: z.string().min(1, 'Selecciona una fecha'),
  time: z.string().min(1, 'Selecciona una hora'),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

export function NewAppointmentDialog({
  services,
  defaultDate,
}: {
  services: Service[]
  defaultDate: string
}) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: defaultDate, time: '09:00' },
  })

  async function onSubmit(data: FormData) {
    const starts_at = new Date(`${data.date}T${data.time}:00`).toISOString()
    const result = await createAppointment({
      patient_name: data.patient_name,
      patient_email: data.patient_email,
      patient_whatsapp: data.patient_whatsapp,
      service_id: data.service_id,
      starts_at,
    })
    if (result.success) {
      toast.success('Cita creada')
      reset({ date: defaultDate, time: '09:00' })
      setOpen(false)
    } else {
      toast.error(result.error ?? 'Error al crear cita')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#635BFF' }}
      >
        <Plus size={15} />
        Nueva cita
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-5">Nueva cita</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre del paciente" error={errors.patient_name?.message}>
            <input
              {...register('patient_name')}
              placeholder="María González"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Email" error={errors.patient_email?.message}>
            <input
              {...register('patient_email')}
              type="email"
              placeholder="maria@ejemplo.com"
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp (opcional)">
            <input
              {...register('patient_whatsapp')}
              placeholder="+52 55 1234 5678"
              className={inputCls}
            />
          </Field>
          <Field label="Servicio" error={errors.service_id?.message}>
            <select
              {...register('service_id')}
              className={inputCls}
              style={{ backgroundColor: '#1a1a1d' }}
            >
              <option value="">Selecciona un servicio</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_min}min — ${s.price_usd} MXN
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" error={errors.date?.message}>
              <input
                {...register('date')}
                type="date"
                className={inputCls}
                style={{ colorScheme: 'dark' }}
              />
            </Field>
            <Field label="Hora" error={errors.time?.message}>
              <select
                {...register('time')}
                className={inputCls}
                style={{ backgroundColor: '#1a1a1d' }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-white border transition-colors"
              style={{ borderColor: '#ffffff12' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#635BFF' }}
            >
              {isSubmitting ? 'Creando...' : 'Crear cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
