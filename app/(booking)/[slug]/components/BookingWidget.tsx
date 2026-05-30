'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { addDays, format, startOfDay, setHours, setMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']
type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

interface BookingWidgetProps {
  therapistId: string
  therapistSlug: string
  services: Service[]
  availabilityRules: AvailabilityRule[]
}

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
})

type ContactData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2.5 rounded-lg text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF] placeholder:text-zinc-600'

function generateSlots(rule: AvailabilityRule, date: Date): string[] {
  const slots: string[] = []
  const [sh, sm] = rule.start_time.split(':').map(Number)
  const [eh, em] = rule.end_time.split(':').map(Number)
  let current = setMinutes(setHours(date, sh ?? 0), sm ?? 0)
  const end = setMinutes(setHours(date, eh ?? 0), em ?? 0)
  while (current < end) {
    slots.push(format(current, 'HH:mm'))
    current = new Date(current.getTime() + rule.session_duration_min * 60 * 1000)
  }
  return slots
}

export function BookingWidget({
  therapistSlug,
  services,
  availabilityRules,
}: BookingWidgetProps) {
  const [step, setStep] = useState<'service' | 'date' | 'contact' | 'done'>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactData>({ resolver: zodResolver(schema) })

  const next7Days = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfDay(new Date()), i + 1)
  )

  function getSlotsForDate(date: Date): string[] {
    const dayOfWeek = (date.getDay() + 6) % 7
    const rule = availabilityRules.find((r) => r.day_of_week === dayOfWeek)
    if (!rule) return []
    return generateSlots(rule, date)
  }

  async function onContactSubmit(contactData: ContactData) {
    if (!selectedService || !selectedDate || !selectedSlot) return

    const [hours, minutes] = selectedSlot.split(':').map(Number)
    const startsAt = setMinutes(setHours(selectedDate, hours ?? 0), minutes ?? 0)

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: therapistSlug,
          service_id: selectedService.id,
          starts_at: startsAt.toISOString(),
          patient_name: contactData.full_name,
          patient_email: contactData.email,
          patient_whatsapp: contactData.whatsapp,
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (data.success) {
        setStep('done')
      } else {
        toast.error(data.error ?? 'Error al reservar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
      >
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-semibold text-white mb-2">¡Cita reservada!</h2>
        <p className="text-zinc-400 text-sm">
          Recibirás un correo de confirmación con los detalles.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
    >
      {step === 'service' && (
        <div className="p-5">
          <h2 className="text-base font-medium text-white mb-4">Selecciona un servicio</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedService(s)
                  setStep('date')
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors hover:border-[#635BFF]"
                style={{ backgroundColor: '#0F0F11', border: '1px solid #ffffff12' }}
              >
                <div>
                  <p className="text-white text-sm font-medium">{s.name}</p>
                  <p className="text-zinc-500 text-xs">{s.duration_min} minutos</p>
                </div>
                <span className="text-sm font-medium" style={{ color: '#635BFF' }}>
                  ${s.price_usd} USD
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'date' && selectedService && (
        <div className="p-5">
          <button
            onClick={() => setStep('service')}
            className="text-xs text-zinc-500 hover:text-white mb-4 block"
          >
            ← Cambiar servicio
          </button>
          <h2 className="text-base font-medium text-white mb-4">Elige una fecha</h2>
          <div className="grid grid-cols-7 gap-1 mb-5">
            {next7Days.map((day) => {
              const slots = getSlotsForDate(day)
              const available = slots.length > 0
              const isSelected = selectedDate?.toDateString() === day.toDateString()
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => available && setSelectedDate(day)}
                  disabled={!available}
                  className="flex flex-col items-center py-2 rounded-lg text-xs transition-colors disabled:opacity-30"
                  style={{
                    backgroundColor: isSelected ? '#635BFF' : '#0F0F11',
                    border: `1px solid ${isSelected ? '#635BFF' : '#ffffff12'}`,
                    color: isSelected ? 'white' : available ? '#a1a1aa' : '#444',
                  }}
                >
                  <span className="uppercase">{format(day, 'EEE', { locale: es })}</span>
                  <span className="font-medium text-sm mt-0.5">{format(day, 'd')}</span>
                </button>
              )
            })}
          </div>
          {selectedDate && (
            <>
              <h3 className="text-sm font-medium text-zinc-300 mb-2">
                Horarios disponibles
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {getSlotsForDate(selectedDate).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(slot)
                      setStep('contact')
                    }}
                    className="py-2 rounded-lg text-xs font-medium transition-colors hover:border-[#635BFF]"
                    style={{
                      backgroundColor: '#0F0F11',
                      border: `1px solid ${selectedSlot === slot ? '#635BFF' : '#ffffff12'}`,
                      color: selectedSlot === slot ? '#635BFF' : '#a1a1aa',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 'contact' && selectedService && selectedDate && selectedSlot && (
        <div className="p-5">
          <button
            onClick={() => setStep('date')}
            className="text-xs text-zinc-500 hover:text-white mb-4 block"
          >
            ← Cambiar horario
          </button>
          <div
            className="rounded-lg px-4 py-3 mb-5 text-sm"
            style={{ backgroundColor: '#0F0F11', border: '1px solid #ffffff12' }}
          >
            <p className="text-white font-medium">{selectedService.name}</p>
            <p className="text-zinc-400 text-xs mt-0.5">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} · {selectedSlot}
            </p>
          </div>
          <h2 className="text-base font-medium text-white mb-4">Tus datos</h2>
          <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-3">
            <div>
              <input
                {...register('full_name')}
                placeholder="Nombre completo"
                className={inputCls}
              />
              {errors.full_name && (
                <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
              )}
            </div>
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Correo electrónico"
                className={inputCls}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>
            <input
              {...register('whatsapp')}
              placeholder="WhatsApp (opcional)"
              className={inputCls}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#635BFF' }}
            >
              {isSubmitting ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
