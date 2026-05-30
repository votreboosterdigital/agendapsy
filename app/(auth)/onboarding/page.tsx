'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateProfile, createService, saveAvailability } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  Briefcase,
  Calendar,
  PartyPopper,
} from 'lucide-react'

const STEPS = [
  { label: 'Perfil', icon: User },
  { label: 'Servicios', icon: Briefcase },
  { label: 'Disponibilidad', icon: Calendar },
  { label: 'Completado', icon: PartyPopper },
]

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  specialty: z.string().min(2, 'Indica tu especialidad'),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  phone: z.string().max(20, 'Número demasiado largo').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

const serviceSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  duration_min: z
    .number({ error: 'Ingresa la duración' })
    .min(15, 'Mínimo 15 minutos')
    .max(480, 'Máximo 8 horas'),
  price_usd: z
    .number({ error: 'Ingresa el precio' })
    .min(0, 'El precio no puede ser negativo'),
})

type ServiceFormData = z.infer<typeof serviceSchema>

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

interface DaySchedule {
  enabled: boolean
  start_time: string
  end_time: string
}

const defaultSchedule: Record<number, DaySchedule> = {
  1: { enabled: true, start_time: '09:00', end_time: '18:00' },
  2: { enabled: true, start_time: '09:00', end_time: '18:00' },
  3: { enabled: true, start_time: '09:00', end_time: '18:00' },
  4: { enabled: true, start_time: '09:00', end_time: '18:00' },
  5: { enabled: true, start_time: '09:00', end_time: '18:00' },
  6: { enabled: false, start_time: '09:00', end_time: '14:00' },
  0: { enabled: false, start_time: '09:00', end_time: '14:00' },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [services, setServices] = useState<ServiceFormData[]>([])
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(defaultSchedule)
  const [sessionDuration, setSessionDuration] = useState(50)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { duration_min: 50, price_usd: 0 },
  })

  const progress = ((step + 1) / STEPS.length) * 100

  async function onProfileSubmit(data: ProfileFormData) {
    setLoadingProfile(true)
    const result = await updateProfile({
      full_name: data.full_name,
      specialty: data.specialty,
      bio: data.bio ?? '',
      phone: data.phone ?? '',
    })

    if (!result.success) {
      toast.error(result.error ?? 'Error al guardar el perfil')
      setLoadingProfile(false)
      return
    }

    setLoadingProfile(false)
    setStep(1)
  }

  function addService(data: ServiceFormData) {
    if (services.length >= 3) {
      toast.error('Máximo 3 servicios en el onboarding')
      return
    }
    setServices((prev) => [...prev, data])
    serviceForm.reset({ duration_min: 50, price_usd: 0 })
  }

  function removeService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  async function onServicesNext() {
    if (services.length === 0) {
      toast.error('Agrega al menos un servicio')
      return
    }
    setLoadingServices(true)

    for (const service of services) {
      const result = await createService(service)
      if (!result.success) {
        toast.error(result.error ?? 'Error al guardar servicios')
        setLoadingServices(false)
        return
      }
    }

    setLoadingServices(false)
    setStep(2)
  }

  function toggleDay(day: number) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  function updateDayTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  async function onAvailabilityNext() {
    const enabledDays = DAYS.filter((d) => schedule[d.value]?.enabled)
    if (enabledDays.length === 0) {
      toast.error('Selecciona al menos un día disponible')
      return
    }

    setLoadingAvailability(true)

    const rules = enabledDays.map((d) => ({
      day_of_week: d.value,
      start_time: schedule[d.value].start_time,
      end_time: schedule[d.value].end_time,
      session_duration_min: sessionDuration,
    }))

    const result = await saveAvailability(rules)
    if (!result.success) {
      toast.error(result.error ?? 'Error al guardar disponibilidad')
      setLoadingAvailability(false)
      return
    }

    setLoadingAvailability(false)
    setStep(3)
  }

  const inputClass =
    'w-full h-9 px-3 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors'
  const inputStyle = {
    backgroundColor: '#1a1a1d',
    border: '1px solid #ffffff12',
  }
  const labelClass = 'block text-sm font-medium text-white mb-1.5'

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isDone = i < step
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isDone
                      ? '#635BFF'
                      : isActive
                        ? '#635BFF20'
                        : '#1a1a1d',
                    border: isActive ? '1px solid #635BFF' : '1px solid #ffffff12',
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5 text-white" />
                  ) : (
                    <Icon
                      className="size-3.5"
                      style={{ color: isActive ? '#635BFF' : '#52525b' }}
                    />
                  )}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? '#ffffff' : '#52525b' }}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-8 h-px mx-1"
                    style={{
                      backgroundColor: i < step ? '#635BFF' : '#ffffff12',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: '#1a1a1d' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#635BFF' }}
          />
        </div>
      </div>

      <div
        className="rounded-[6px] p-8"
        style={{ backgroundColor: '#111113', border: '1px solid #ffffff12' }}
      >
        {step === 0 && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Tu perfil profesional</h2>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                Esta información aparecerá en tu página de reservas
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="full_name">
                Nombre completo
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Dr. Ana García López"
                {...profileForm.register('full_name')}
                className={inputClass}
                style={{
                  ...inputStyle,
                  border: profileForm.formState.errors.full_name
                    ? '1px solid #ef4444'
                    : '1px solid #ffffff12',
                }}
              />
              {profileForm.formState.errors.full_name && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  {profileForm.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="specialty">
                Especialidad
              </label>
              <input
                id="specialty"
                type="text"
                placeholder="Psicología cognitivo-conductual"
                {...profileForm.register('specialty')}
                className={inputClass}
                style={{
                  ...inputStyle,
                  border: profileForm.formState.errors.specialty
                    ? '1px solid #ef4444'
                    : '1px solid #ffffff12',
                }}
              />
              {profileForm.formState.errors.specialty && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  {profileForm.formState.errors.specialty.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="bio">
                Presentación breve{' '}
                <span style={{ color: '#52525b' }}>(opcional)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Cuéntale a tus pacientes sobre tu enfoque terapéutico..."
                {...profileForm.register('bio')}
                className="w-full px-3 py-2.5 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors resize-none"
                style={inputStyle}
              />
              {profileForm.formState.errors.bio && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  {profileForm.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="phone">
                Teléfono / WhatsApp{' '}
                <span style={{ color: '#52525b' }}>(opcional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+52 55 1234 5678"
                {...profileForm.register('phone')}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <Button
              type="submit"
              disabled={loadingProfile}
              className="w-full h-9 text-sm font-medium rounded-[6px] text-white disabled:opacity-60"
              style={{ backgroundColor: '#635BFF', border: 'none' }}
            >
              {loadingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Continuar'
              )}
            </Button>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Tus servicios</h2>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                Agrega de 1 a 3 servicios que ofreces (puedes agregar más después)
              </p>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[6px]"
                    style={{ backgroundColor: '#1a1a1d', border: '1px solid #ffffff12' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>
                        {service.duration_min} min · ${service.price_usd} USD
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="p-1.5 rounded-[6px] transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="size-4" style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {services.length < 3 && (
              <form
                onSubmit={serviceForm.handleSubmit(addService)}
                className="space-y-4 pt-2"
                style={{
                  borderTop: services.length > 0 ? '1px solid #ffffff12' : undefined,
                  paddingTop: services.length > 0 ? '1.25rem' : undefined,
                }}
              >
                {services.length > 0 && (
                  <p className="text-xs font-medium" style={{ color: '#a1a1aa' }}>
                    Agregar otro servicio
                  </p>
                )}
                <div>
                  <label className={labelClass} htmlFor="svc_name">
                    Nombre del servicio
                  </label>
                  <input
                    id="svc_name"
                    type="text"
                    placeholder="Consulta individual"
                    {...serviceForm.register('name')}
                    className={inputClass}
                    style={{
                      ...inputStyle,
                      border: serviceForm.formState.errors.name
                        ? '1px solid #ef4444'
                        : '1px solid #ffffff12',
                    }}
                  />
                  {serviceForm.formState.errors.name && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      {serviceForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="duration">
                      Duración (min)
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min={15}
                      max={480}
                      {...serviceForm.register('duration_min', { valueAsNumber: true })}
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        border: serviceForm.formState.errors.duration_min
                          ? '1px solid #ef4444'
                          : '1px solid #ffffff12',
                      }}
                    />
                    {serviceForm.formState.errors.duration_min && (
                      <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                        {serviceForm.formState.errors.duration_min.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="price">
                      Precio (USD)
                    </label>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      step={0.01}
                      {...serviceForm.register('price_usd', { valueAsNumber: true })}
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        border: serviceForm.formState.errors.price_usd
                          ? '1px solid #ef4444'
                          : '1px solid #ffffff12',
                      }}
                    />
                    {serviceForm.formState.errors.price_usd && (
                      <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                        {serviceForm.formState.errors.price_usd.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm font-medium rounded-[6px] transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #635BFF',
                    color: '#635BFF',
                  }}
                >
                  <Plus className="size-4 mr-1.5" />
                  Agregar servicio
                </Button>
              </form>
            )}

            <Button
              type="button"
              disabled={loadingServices || services.length === 0}
              onClick={onServicesNext}
              className="w-full h-9 text-sm font-medium rounded-[6px] text-white disabled:opacity-60"
              style={{ backgroundColor: '#635BFF', border: 'none' }}
            >
              {loadingServices ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Tu disponibilidad</h2>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                Define los días y horarios en que atiendes pacientes
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="session_duration">
                Duración de sesión por defecto (min)
              </label>
              <select
                id="session_duration"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              >
                {[30, 45, 50, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} minutos
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {DAYS.map((day) => {
                const daySchedule = schedule[day.value]
                return (
                  <div
                    key={day.value}
                    className="rounded-[6px] px-3 py-3"
                    style={{
                      backgroundColor: '#1a1a1d',
                      border: `1px solid ${daySchedule.enabled ? '#635BFF40' : '#ffffff12'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <button
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: daySchedule.enabled ? '#635BFF' : 'transparent',
                            border: daySchedule.enabled
                              ? '1px solid #635BFF'
                              : '1px solid #ffffff40',
                          }}
                        >
                          {daySchedule.enabled && (
                            <svg
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: daySchedule.enabled ? '#ffffff' : '#a1a1aa' }}
                        >
                          {day.label}
                        </span>
                      </button>
                    </div>
                    {daySchedule.enabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={daySchedule.start_time}
                          onChange={(e) =>
                            updateDayTime(day.value, 'start_time', e.target.value)
                          }
                          className="h-8 px-2 text-sm rounded-[6px] text-white outline-none"
                          style={{
                            backgroundColor: '#111113',
                            border: '1px solid #ffffff12',
                          }}
                        />
                        <span className="text-xs" style={{ color: '#52525b' }}>
                          a
                        </span>
                        <input
                          type="time"
                          value={daySchedule.end_time}
                          onChange={(e) =>
                            updateDayTime(day.value, 'end_time', e.target.value)
                          }
                          className="h-8 px-2 text-sm rounded-[6px] text-white outline-none"
                          style={{
                            backgroundColor: '#111113',
                            border: '1px solid #ffffff12',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              disabled={loadingAvailability}
              onClick={onAvailabilityNext}
              className="w-full h-9 text-sm font-medium rounded-[6px] text-white disabled:opacity-60"
              style={{ backgroundColor: '#635BFF', border: 'none' }}
            >
              {loadingAvailability ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: '#635BFF20' }}
            >
              <PartyPopper className="size-8" style={{ color: '#635BFF' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                ¡Todo listo!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                Tu perfil está configurado. Ya puedes empezar a recibir citas y
                gestionar a tus pacientes desde tu agenda.
              </p>
            </div>

            <div
              className="rounded-[6px] p-4 text-left space-y-2"
              style={{ backgroundColor: '#1a1a1d', border: '1px solid #ffffff12' }}
            >
              {[
                'Perfil profesional guardado',
                `${services.length} servicio${services.length !== 1 ? 's' : ''} configurado${services.length !== 1 ? 's' : ''}`,
                'Disponibilidad semanal guardada',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" style={{ color: '#635BFF' }} />
                  <span className="text-sm" style={{ color: '#a1a1aa' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={() => router.push('/agenda')}
              className="w-full h-9 text-sm font-medium rounded-[6px] text-white"
              style={{ backgroundColor: '#635BFF', border: 'none' }}
            >
              Ir a mi agenda
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
