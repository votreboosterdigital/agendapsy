# AgendaPsy Dashboard & API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete dashboard, API routes, and public booking page for AgendaPsy — a scheduling SaaS for Mexican psychologists.

**Architecture:** Next.js 16 App Router with route groups: `(dashboard)` for protected therapist views, `(booking)` for the public patient-facing booking page, and `api/` for Stripe webhooks, cron reminders, and booking confirmation. All server data fetching uses `createClient()` from `@/lib/supabase/server`; mutations use Server Actions with `revalidatePath`.

**Tech Stack:** Next.js 16, TypeScript strict, Supabase SSR, Stripe, Resend, react-hook-form, zod, shadcn/ui, lucide-react, date-fns, sonner (toasts), Tailwind CSS v4

---

## File Map

| File | Responsibility |
|---|---|
| `app/(dashboard)/layout.tsx` | Sidebar layout, nav, sign-out |
| `app/(dashboard)/agenda/page.tsx` | Week calendar view, loads appointments |
| `app/(dashboard)/agenda/components/WeekCalendar.tsx` | Client calendar grid component |
| `app/(dashboard)/agenda/components/NewAppointmentDialog.tsx` | Dialog + form to create appointment |
| `app/(dashboard)/pacientes/page.tsx` | Patients table with filter |
| `app/(dashboard)/pacientes/components/NewPatientDialog.tsx` | Dialog + form to add patient |
| `app/(dashboard)/notas/[appointmentId]/page.tsx` | SOAP notes editor |
| `app/(dashboard)/configuracion/page.tsx` | Profile, services, availability, billing |
| `app/(dashboard)/configuracion/components/ServicesManager.tsx` | Client CRUD for services |
| `app/(dashboard)/configuracion/components/AvailabilityManager.tsx` | Client CRUD for availability rules |
| `app/(booking)/[slug]/page.tsx` | Public booking page |
| `app/(booking)/[slug]/components/BookingWidget.tsx` | Client date/slot selector + form |
| `app/actions/appointments.ts` | Server actions: create, updateStatus, delete |
| `app/actions/patients.ts` | Server actions: create, update, archive |
| `app/actions/notes.ts` | Server action: saveSessionNotes (upsert) |
| `app/actions/services.ts` | Server actions: createService, deleteService |
| `app/actions/availability.ts` | Server actions: saveAvailabilityRule, deleteRule |
| `app/api/booking/confirm/route.ts` | POST — public booking confirmation |
| `app/api/reminders/send/route.ts` | GET — cron: send 24h + 1h reminders |
| `app/api/stripe/webhook/route.ts` | POST — handle Stripe subscription events |
| `app/api/stripe/checkout/route.ts` | POST — create Stripe checkout session |
| `vercel.json` | Cron job config |

---

## Task 1: Dashboard Layout

**Files:**
- Create: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create the dashboard layout with sidebar**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, Settings, LogOut } from 'lucide-react'
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

function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-zinc-400 hover:text-white transition-colors"
      style={{ '--hover-bg': '#635BFF20' } as React.CSSProperties}
    >
      {icon}
      {label}
    </Link>
  )
}
```

- [ ] **Step 2: Create SidebarSignOut client component**

Create `app/(dashboard)/components/SidebarSignOut.tsx`:

```tsx
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
```

- [ ] **Step 3: Fix NavLink to use active styling**

The NavLink needs `usePathname` for active state — extract to a client component. Replace the NavLink function in `app/(dashboard)/layout.tsx` with an import, and create `app/(dashboard)/components/NavLink.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

export function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors"
      style={{
        backgroundColor: isActive ? '#635BFF20' : 'transparent',
        color: isActive ? '#635BFF' : '#a1a1aa',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
```

Then update `app/(dashboard)/layout.tsx` to use `import { NavLink } from './components/NavLink'` and remove the inline NavLink function.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/layout.tsx app/(dashboard)/components/
git commit -m "feat: dashboard layout avec sidebar et navigation"
```

---

## Task 2: Server Actions — Appointments

**Files:**
- Create: `app/actions/appointments.ts`

- [ ] **Step 1: Create appointments server actions**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendAppointmentConfirmation } from '@/lib/resend/emails'
import { z } from 'zod'

const CreateAppointmentSchema = z.object({
  patient_name: z.string().min(2),
  patient_email: z.string().email(),
  patient_whatsapp: z.string().optional(),
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
})

export async function createAppointment(
  formData: z.infer<typeof CreateAppointmentSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = CreateAppointmentSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: service } = await supabase
    .from('services')
    .select('id, name, duration_min, price_usd')
    .eq('id', parsed.data.service_id)
    .eq('therapist_id', user.id)
    .single()

  if (!service) return { success: false, error: 'Servicio no encontrado' }

  const startsAt = new Date(parsed.data.starts_at)
  const endsAt = new Date(startsAt.getTime() + service.duration_min * 60 * 1000)

  const { error } = await supabase.from('appointments').insert({
    therapist_id: user.id,
    patient_name: parsed.data.patient_name,
    patient_email: parsed.data.patient_email,
    patient_whatsapp: parsed.data.patient_whatsapp ?? null,
    service_name: service.name,
    price_usd: service.price_usd,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: 'confirmed',
  })

  if (error) return { success: false, error: 'Error al crear la cita' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, slug')
    .eq('id', user.id)
    .single()

  if (profile) {
    await sendAppointmentConfirmation({
      patientName: parsed.data.patient_name,
      patientEmail: parsed.data.patient_email,
      therapistName: profile.full_name,
      serviceName: service.name,
      startsAt,
      therapistSlug: profile.slug,
    }).catch(() => {})
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function updateAppointmentStatus(
  id: string,
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al actualizar' }

  revalidatePath('/agenda')
  return { success: true }
}

export async function deleteAppointment(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(id, 'cancelled')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/appointments.ts
git commit -m "feat: server actions appointments (create, status, cancel)"
```

---

## Task 3: Server Actions — Patients, Notes, Services, Availability

**Files:**
- Create: `app/actions/patients.ts`
- Create: `app/actions/notes.ts`
- Create: `app/actions/services.ts`
- Create: `app/actions/availability.ts`

- [ ] **Step 1: Create patients actions**

`app/actions/patients.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PatientSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().optional(),
})

export async function createPatient(
  formData: z.infer<typeof PatientSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = PatientSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('patients').insert({
    therapist_id: user.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    whatsapp: parsed.data.whatsapp ?? null,
    status: 'active',
  })

  if (error) return { success: false, error: 'Error al crear paciente' }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function updatePatient(
  id: string,
  formData: Partial<z.infer<typeof PatientSchema>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('patients')
    .update(formData)
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al actualizar' }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function archivePatient(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('patients')
    .update({ status: 'inactive' })
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al archivar' }

  revalidatePath('/pacientes')
  return { success: true }
}
```

- [ ] **Step 2: Create notes actions**

`app/actions/notes.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const NotesSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})

export async function saveSessionNotes(
  appointmentId: string,
  formData: z.infer<typeof NotesSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = NotesSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('session_notes').upsert(
    {
      appointment_id: appointmentId,
      therapist_id: user.id,
      ...parsed.data,
    },
    { onConflict: 'appointment_id' }
  )

  if (error) return { success: false, error: 'Error al guardar notas' }

  revalidatePath(`/notas/${appointmentId}`)
  return { success: true }
}
```

- [ ] **Step 3: Create services actions**

`app/actions/services.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ServiceSchema = z.object({
  name: z.string().min(2),
  duration_min: z.number().int().min(15).max(480),
  price_usd: z.number().min(0),
})

export async function createService(
  formData: z.infer<typeof ServiceSchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = ServiceSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('services').insert({
    therapist_id: user.id,
    ...parsed.data,
    is_active: true,
  })

  if (error) return { success: false, error: 'Error al crear servicio' }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al eliminar servicio' }

  revalidatePath('/configuracion')
  return { success: true }
}
```

- [ ] **Step 4: Create availability actions**

`app/actions/availability.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  session_duration_min: z.number().int().min(15).max(480),
})

export async function saveAvailabilityRule(
  formData: z.infer<typeof AvailabilitySchema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = AvailabilitySchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('availability_rules').insert({
    therapist_id: user.id,
    ...parsed.data,
  })

  if (error) return { success: false, error: 'Error al guardar disponibilidad' }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteAvailabilityRule(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('availability_rules')
    .delete()
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al eliminar regla' }

  revalidatePath('/configuracion')
  return { success: true }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/actions/
git commit -m "feat: server actions patients, notas, servicios, disponibilidad"
```

---

## Task 4: Agenda Page

**Files:**
- Create: `app/(dashboard)/agenda/page.tsx`
- Create: `app/(dashboard)/agenda/components/WeekCalendar.tsx`
- Create: `app/(dashboard)/agenda/components/AppointmentCard.tsx`
- Create: `app/(dashboard)/agenda/components/NewAppointmentDialog.tsx`

- [ ] **Step 1: Create the agenda server page**

`app/(dashboard)/agenda/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, addDays } from 'date-fns'
import { WeekCalendar } from './components/WeekCalendar'
import { NewAppointmentDialog } from './components/NewAppointmentDialog'
import type { Database } from '@/lib/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Service = Database['public']['Tables']['services']['Row']

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
      .select('id, patient_name, patient_email, service_name, price_usd, starts_at, ends_at, status')
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
        <NewAppointmentDialog services={services ?? []} />
      </div>
      <WeekCalendar
        appointments={(appointments ?? []) as Appointment[]}
        weekStart={weekStart}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create WeekCalendar client component**

`app/(dashboard)/agenda/components/WeekCalendar.tsx`:

```tsx
'use client'

import { format, addDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/lib/supabase/types'
import { AppointmentCard } from './AppointmentCard'

type Appointment = Database['public']['Tables']['appointments']['Row']

interface WeekCalendarProps {
  appointments: Appointment[]
  weekStart: Date
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7)

export function WeekCalendar({ appointments, weekStart }: WeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
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
  )
}
```

- [ ] **Step 3: Create AppointmentCard**

`app/(dashboard)/agenda/components/AppointmentCard.tsx`:

```tsx
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
  }

  return (
    <div
      className="rounded p-1.5 text-xs cursor-pointer mb-1"
      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.text}30` }}
      title={`${appointment.patient_name} — ${appointment.service_name}`}
    >
      <p className="font-medium truncate">{appointment.patient_name}</p>
      <p className="opacity-70 truncate">{appointment.service_name}</p>
      <p className="opacity-60">{format(parseISO(appointment.starts_at), 'HH:mm')}</p>
    </div>
  )
}
```

- [ ] **Step 4: Create NewAppointmentDialog**

`app/(dashboard)/agenda/components/NewAppointmentDialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createAppointment } from '@/app/actions/appointments'
import type { Database } from '@/lib/supabase/types'

type Service = Pick<Database['public']['Tables']['services']['Row'], 'id' | 'name' | 'duration_min' | 'price_usd'>

const schema = z.object({
  patient_name: z.string().min(2, 'Mínimo 2 caracteres'),
  patient_email: z.string().email('Email inválido'),
  patient_whatsapp: z.string().optional(),
  service_id: z.string().uuid('Selecciona un servicio'),
  starts_at: z.string().min(1, 'Selecciona fecha y hora'),
})

type FormData = z.infer<typeof schema>

export function NewAppointmentDialog({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const result = await createAppointment({
      ...data,
      starts_at: new Date(data.starts_at).toISOString(),
    })
    if (result.success) {
      toast.success('Cita creada')
      reset()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-5">Nueva cita</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre del paciente" error={errors.patient_name?.message}>
            <input {...register('patient_name')} placeholder="María González" className={inputCls} />
          </Field>
          <Field label="Email" error={errors.patient_email?.message}>
            <input {...register('patient_email')} type="email" placeholder="maria@ejemplo.com" className={inputCls} />
          </Field>
          <Field label="WhatsApp (opcional)" error={errors.patient_whatsapp?.message}>
            <input {...register('patient_whatsapp')} placeholder="+52 55 1234 5678" className={inputCls} />
          </Field>
          <Field label="Servicio" error={errors.service_id?.message}>
            <select {...register('service_id')} className={inputCls}>
              <option value="">Selecciona un servicio</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_min}min — ${s.price_usd}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha y hora" error={errors.starts_at?.message}>
            <input {...register('starts_at')} type="datetime-local" className={inputCls} />
          </Field>
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

const inputCls = 'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border outline-none focus:ring-1 focus:ring-[#635BFF]'
  + ' border-[#ffffff12]'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/agenda/"
git commit -m "feat: page agenda avec calendrier semaine et dialog nouvelle cita"
```

---

## Task 5: Patients Page

**Files:**
- Create: `app/(dashboard)/pacientes/page.tsx`
- Create: `app/(dashboard)/pacientes/components/NewPatientDialog.tsx`
- Create: `app/(dashboard)/pacientes/components/PatientActions.tsx`

- [ ] **Step 1: Create patients server page**

`app/(dashboard)/pacientes/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewPatientDialog } from './components/NewPatientDialog'
import { PatientActions } from './components/PatientActions'
import type { Database } from '@/lib/supabase/types'

type Patient = Database['public']['Tables']['patients']['Row']

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  waitlist: 'Lista de espera',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  inactive: '#a1a1aa',
  waitlist: '#fbbf24',
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('patients')
    .select('id, full_name, email, whatsapp, status, created_at')
    .eq('therapist_id', user.id)
    .order('full_name')

  if (status && ['active', 'inactive', 'waitlist'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: patients } = await query

  const appointmentCounts = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('therapist_id', user.id)
    .not('patient_id', 'is', null)
    .then(({ data }) => {
      const counts: Record<string, number> = {}
      data?.forEach((a) => { if (a.patient_id) counts[a.patient_id] = (counts[a.patient_id] ?? 0) + 1 })
      return counts
    })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Pacientes</h1>
        <NewPatientDialog />
      </div>
      <div className="flex gap-2 mb-5">
        {[undefined, 'active', 'inactive', 'waitlist'].map((s) => (
          <a
            key={s ?? 'all'}
            href={s ? `/pacientes?status=${s}` : '/pacientes'}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: status === s ? '#635BFF' : '#ffffff08',
              color: status === s ? 'white' : '#a1a1aa',
            }}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </a>
        ))}
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#ffffff12' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#161618' }}>
            <tr>
              {['Nombre', 'Email', 'WhatsApp', 'Estado', '# Citas', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#0F0F11' }}>
            {(patients ?? []).map((patient: Patient) => (
              <tr key={patient.id} className="border-t" style={{ borderColor: '#ffffff08' }}>
                <td className="px-4 py-3 text-white font-medium">{patient.full_name}</td>
                <td className="px-4 py-3 text-zinc-400">{patient.email}</td>
                <td className="px-4 py-3 text-zinc-400">{patient.whatsapp ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[patient.status] ?? '#a1a1aa'}20`,
                      color: STATUS_COLORS[patient.status] ?? '#a1a1aa',
                    }}
                  >
                    {STATUS_LABELS[patient.status] ?? patient.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{appointmentCounts[patient.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <PatientActions patientId={patient.id} />
                </td>
              </tr>
            ))}
            {(patients ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No hay pacientes aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create NewPatientDialog**

`app/(dashboard)/pacientes/components/NewPatientDialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createPatient } from '@/app/actions/patients'

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function NewPatientDialog() {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const result = await createPatient(data)
    if (result.success) {
      toast.success('Paciente añadido')
      reset()
      setOpen(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#635BFF' }}
      >
        <Plus size={15} />
        Nuevo paciente
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-5">Nuevo paciente</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre completo" error={errors.full_name?.message}>
            <input {...register('full_name')} placeholder="María González" className={inputCls} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="maria@ejemplo.com" className={inputCls} />
          </Field>
          <Field label="WhatsApp (opcional)">
            <input {...register('whatsapp')} placeholder="+52 55 1234 5678" className={inputCls} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-white border transition-colors" style={{ borderColor: '#ffffff12' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#635BFF' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Create PatientActions client component**

`app/(dashboard)/pacientes/components/PatientActions.tsx`:

```tsx
'use client'

import { toast } from 'sonner'
import { archivePatient } from '@/app/actions/patients'
import { Archive } from 'lucide-react'

export function PatientActions({ patientId }: { patientId: string }) {
  async function handleArchive() {
    if (!confirm('¿Archivar este paciente?')) return
    const result = await archivePatient(patientId)
    if (!result.success) toast.error(result.error)
    else toast.success('Paciente archivado')
  }

  return (
    <button
      onClick={handleArchive}
      className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
      title="Archivar"
    >
      <Archive size={14} />
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/pacientes/"
git commit -m "feat: page pacientes avec tabla y dialog nuevo paciente"
```

---

## Task 6: Session Notes Page

**Files:**
- Create: `app/(dashboard)/notas/[appointmentId]/page.tsx`
- Create: `app/(dashboard)/notas/[appointmentId]/components/NotesForm.tsx`

- [ ] **Step 1: Create notes server page**

`app/(dashboard)/notas/[appointmentId]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { NotesForm } from './components/NotesForm'

export default async function NotasPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: appointment }, { data: notes }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, patient_name, service_name, starts_at, status')
      .eq('id', appointmentId)
      .eq('therapist_id', user.id)
      .single(),
    supabase
      .from('session_notes')
      .select('subjective, objective, assessment, plan')
      .eq('appointment_id', appointmentId)
      .single(),
  ])

  if (!appointment) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{appointment.patient_name}</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {appointment.service_name} ·{' '}
          {format(parseISO(appointment.starts_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
        </p>
      </div>
      <NotesForm
        appointmentId={appointmentId}
        initialNotes={{
          subjective: notes?.subjective ?? '',
          objective: notes?.objective ?? '',
          assessment: notes?.assessment ?? '',
          plan: notes?.plan ?? '',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create NotesForm client component**

`app/(dashboard)/notas/[appointmentId]/components/NotesForm.tsx`:

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { saveSessionNotes } from '@/app/actions/notes'

interface NotesFormProps {
  appointmentId: string
  initialNotes: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
}

const SOAP_FIELDS = [
  { key: 'subjective' as const, label: 'Subjetivo', placeholder: 'Lo que reporta el paciente...' },
  { key: 'objective' as const, label: 'Objetivo', placeholder: 'Observaciones clínicas...' },
  { key: 'assessment' as const, label: 'Análisis', placeholder: 'Evaluación clínica...' },
  { key: 'plan' as const, label: 'Plan', placeholder: 'Intervenciones y próximos pasos...' },
]

export function NotesForm({ appointmentId, initialNotes }: NotesFormProps) {
  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: initialNotes,
  })

  async function onSubmit(data: typeof initialNotes) {
    const result = await saveSessionNotes(appointmentId, data)
    if (result.success) toast.success('Notas guardadas')
    else toast.error(result.error ?? 'Error al guardar')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {SOAP_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
          <textarea
            {...register(key)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF] resize-y"
            style={{ backgroundColor: '#161618' }}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#635BFF' }}
      >
        {isSubmitting ? 'Guardando...' : 'Guardar notas'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/notas/"
git commit -m "feat: page notas SOAP par cita"
```

---

## Task 7: Configuration Page

**Files:**
- Create: `app/(dashboard)/configuracion/page.tsx`
- Create: `app/(dashboard)/configuracion/components/ServicesManager.tsx`
- Create: `app/(dashboard)/configuracion/components/AvailabilityManager.tsx`
- Create: `app/(dashboard)/configuracion/components/BillingSection.tsx`

- [ ] **Step 1: Create configuration server page**

`app/(dashboard)/configuracion/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServicesManager } from './components/ServicesManager'
import { AvailabilityManager } from './components/AvailabilityManager'
import { BillingSection } from './components/BillingSection'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']
type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: services }, { data: rules }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, bio, specialty, subscription_status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('services')
      .select('id, name, duration_min, price_usd, is_active')
      .eq('therapist_id', user.id)
      .order('name'),
    supabase
      .from('availability_rules')
      .select('id, day_of_week, start_time, end_time, session_duration_min')
      .eq('therapist_id', user.id)
      .order('day_of_week'),
  ])

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-white">Configuración</h1>
      <Section title="Perfil">
        <div className="space-y-1 text-sm">
          <p className="text-white">{profile?.full_name}</p>
          <p className="text-zinc-400">{profile?.email}</p>
          {profile?.specialty && <p className="text-zinc-400">{profile.specialty}</p>}
          {profile?.bio && <p className="text-zinc-500 text-xs mt-2">{profile.bio}</p>}
        </div>
      </Section>
      <Section title="Servicios">
        <ServicesManager services={(services ?? []) as Service[]} />
      </Section>
      <Section title="Disponibilidad">
        <AvailabilityManager rules={(rules ?? []) as AvailabilityRule[]} />
      </Section>
      <Section title="Facturación">
        <BillingSection subscriptionStatus={profile?.subscription_status ?? 'trialing'} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-300 mb-3 pb-2 border-b" style={{ borderColor: '#ffffff12' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create ServicesManager**

`app/(dashboard)/configuracion/components/ServicesManager.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createService, deleteService } from '@/app/actions/services'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

const schema = z.object({
  name: z.string().min(2),
  duration_min: z.coerce.number().int().min(15),
  price_usd: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

export function ServicesManager({ services }: { services: Service[] }) {
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const result = await createService(data)
    if (result.success) {
      toast.success('Servicio añadido')
      reset()
      setShowForm(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    const result = await deleteService(id)
    if (!result.success) toast.error(result.error)
    else toast.success('Servicio eliminado')
  }

  return (
    <div className="space-y-2">
      {services.filter((s) => s.is_active).map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ backgroundColor: '#161618', border: '1px solid #ffffff08' }}
        >
          <div>
            <p className="text-sm text-white">{s.name}</p>
            <p className="text-xs text-zinc-500">{s.duration_min} min · ${s.price_usd} USD</p>
          </div>
          <button
            onClick={() => handleDelete(s.id, s.name)}
            className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <input {...register('name')} placeholder="Nombre del servicio" className={inputCls} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <input {...register('duration_min')} type="number" placeholder="Duración (min)" className={inputCls} />
            </div>
            <div>
              <input {...register('price_usd')} type="number" step="0.01" placeholder="Precio USD" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border rounded-md transition-colors" style={{ borderColor: '#ffffff12' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs text-white rounded-md disabled:opacity-50" style={{ backgroundColor: '#635BFF' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white border transition-colors"
          style={{ borderColor: '#ffffff12' }}
        >
          <Plus size={13} />
          Añadir servicio
        </button>
      )}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'
```

- [ ] **Step 3: Create AvailabilityManager**

`app/(dashboard)/configuracion/components/AvailabilityManager.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { saveAvailabilityRule, deleteAvailabilityRule } from '@/app/actions/availability'
import type { Database } from '@/lib/supabase/types'

type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const schema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  session_duration_min: z.coerce.number().int().min(15),
})

type FormData = z.infer<typeof schema>

export function AvailabilityManager({ rules }: { rules: AvailabilityRule[] }) {
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { session_duration_min: 50 },
  })

  async function onSubmit(data: FormData) {
    const result = await saveAvailabilityRule(data)
    if (result.success) {
      toast.success('Disponibilidad guardada')
      reset()
      setShowForm(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAvailabilityRule(id)
    if (!result.success) toast.error(result.error)
    else toast.success('Regla eliminada')
  }

  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ backgroundColor: '#161618', border: '1px solid #ffffff08' }}
        >
          <div>
            <p className="text-sm text-white">{DAYS[r.day_of_week]}</p>
            <p className="text-xs text-zinc-500">{r.start_time} – {r.end_time} · {r.session_duration_min} min</p>
          </div>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <select {...register('day_of_week')} className={inputCls}>
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <input {...register('start_time')} type="time" className={inputCls} />
            <input {...register('end_time')} type="time" className={inputCls} />
            <input {...register('session_duration_min')} type="number" placeholder="Duración (min)" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border rounded-md transition-colors" style={{ borderColor: '#ffffff12' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs text-white rounded-md disabled:opacity-50" style={{ backgroundColor: '#635BFF' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white border transition-colors"
          style={{ borderColor: '#ffffff12' }}
        >
          <Plus size={13} />
          Añadir horario
        </button>
      )}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'
```

- [ ] **Step 4: Create BillingSection**

`app/(dashboard)/configuracion/components/BillingSection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: '#4ade80' },
  trialing: { label: 'Período de prueba', color: '#fbbf24' },
  past_due: { label: 'Pago pendiente', color: '#f87171' },
  canceled: { label: 'Cancelado', color: '#a1a1aa' },
  inactive: { label: 'Inactivo', color: '#a1a1aa' },
}

export function BillingSection({ subscriptionStatus }: { subscriptionStatus: string }) {
  const [loading, setLoading] = useState(false)
  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.inactive

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error al abrir checkout')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">Estado:</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>
      {subscriptionStatus === 'active' ? (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white border disabled:opacity-50 transition-colors hover:bg-white/5"
          style={{ borderColor: '#ffffff12' }}
        >
          <ExternalLink size={14} />
          {loading ? 'Cargando...' : 'Gestionar facturación'}
        </button>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#635BFF' }}
        >
          {loading ? 'Cargando...' : 'Suscribirme — $29/mes'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/configuracion/"
git commit -m "feat: page configuracion con servicios, disponibilidad y facturacion"
```

---

## Task 8: Public Booking Page

**Files:**
- Create: `app/(booking)/[slug]/page.tsx`
- Create: `app/(booking)/[slug]/components/BookingWidget.tsx`

- [ ] **Step 1: Create public booking server page**

`app/(booking)/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingWidget } from './components/BookingWidget'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']
type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, specialty, slug')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const [{ data: services }, { data: rules }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_min, price_usd')
      .eq('therapist_id', profile.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('availability_rules')
      .select('id, day_of_week, start_time, end_time, session_duration_min')
      .eq('therapist_id', profile.id)
      .order('day_of_week'),
  ])

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#0F0F11' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-2xl font-bold text-white"
            style={{ backgroundColor: '#635BFF' }}
          >
            {profile.full_name[0]}
          </div>
          <h1 className="text-2xl font-semibold text-white">{profile.full_name}</h1>
          {profile.specialty && (
            <p className="text-zinc-400 text-sm mt-1">{profile.specialty}</p>
          )}
          {profile.bio && (
            <p className="text-zinc-500 text-sm mt-3 max-w-sm mx-auto">{profile.bio}</p>
          )}
        </div>
        <BookingWidget
          therapistId={profile.id}
          therapistSlug={profile.slug}
          services={(services ?? []) as Service[]}
          availabilityRules={(rules ?? []) as AvailabilityRule[]}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create BookingWidget client component**

`app/(booking)/[slug]/components/BookingWidget.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { addDays, format, startOfDay, parseISO, setHours, setMinutes } from 'date-fns'
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

function generateSlots(rule: AvailabilityRule, date: Date): string[] {
  const slots: string[] = []
  const [sh, sm] = rule.start_time.split(':').map(Number)
  const [eh, em] = rule.end_time.split(':').map(Number)
  let current = setMinutes(setHours(date, sh), sm ?? 0)
  const end = setMinutes(setHours(date, eh), em ?? 0)
  while (current < end) {
    slots.push(format(current, 'HH:mm'))
    current = new Date(current.getTime() + rule.session_duration_min * 60 * 1000)
  }
  return slots
}

export function BookingWidget({ therapistId, therapistSlug, services, availabilityRules }: BookingWidgetProps) {
  const [step, setStep] = useState<'service' | 'date' | 'contact' | 'done'>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ContactData>({
    resolver: zodResolver(schema),
  })

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i + 1))

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
      const data = await res.json() as { success?: boolean; error?: string }
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
                onClick={() => { setSelectedService(s); setStep('date') }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors hover:border-[#635BFF]"
                style={{ backgroundColor: '#0F0F11', border: '1px solid #ffffff12' }}
              >
                <div>
                  <p className="text-white text-sm font-medium">{s.name}</p>
                  <p className="text-zinc-500 text-xs">{s.duration_min} minutos</p>
                </div>
                <span className="text-[#635BFF] text-sm font-medium">${s.price_usd} USD</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'date' && selectedService && (
        <div className="p-5">
          <button onClick={() => setStep('service')} className="text-xs text-zinc-500 hover:text-white mb-4 block">
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
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Horarios disponibles</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {getSlotsForDate(selectedDate).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setStep('contact') }}
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
          <button onClick={() => setStep('date')} className="text-xs text-zinc-500 hover:text-white mb-4 block">
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
              <input {...register('full_name')} placeholder="Nombre completo" className={inputCls} />
              {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <input {...register('email')} type="email" placeholder="Correo electrónico" className={inputCls} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            <input {...register('whatsapp')} placeholder="WhatsApp (opcional)" className={inputCls} />
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

const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF] placeholder:text-zinc-600'
```

- [ ] **Step 3: Commit**

```bash
git add "app/(booking)/"
git commit -m "feat: page réservation publique avec sélection service/date/horaire"
```

---

## Task 9: Booking Confirm API Route

**Files:**
- Create: `app/api/booking/confirm/route.ts`

- [ ] **Step 1: Create booking confirmation API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAppointmentConfirmation, sendNewBookingNotification } from '@/lib/resend/emails'
import { z } from 'zod'

const BodySchema = z.object({
  slug: z.string(),
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  patient_name: z.string().min(2),
  patient_email: z.string().email(),
  patient_whatsapp: z.string().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { slug, service_id, starts_at, patient_name, patient_email, patient_whatsapp } = parsed.data

  const supabase = await createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, slug')
    .eq('slug', slug)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Terapeuta no encontrado' }, { status: 404 })
  }

  const { data: service } = await supabase
    .from('services')
    .select('id, name, duration_min, price_usd')
    .eq('id', service_id)
    .eq('therapist_id', profile.id)
    .eq('is_active', true)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 404 })
  }

  const startsAt = new Date(starts_at)
  const endsAt = new Date(startsAt.getTime() + service.duration_min * 60 * 1000)

  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('therapist_id', profile.id)
    .eq('starts_at', startsAt.toISOString())
    .neq('status', 'cancelled')
    .single()

  if (conflict) {
    return NextResponse.json({ error: 'Este horario ya no está disponible' }, { status: 409 })
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      therapist_id: profile.id,
      patient_name,
      patient_email,
      patient_whatsapp: patient_whatsapp ?? null,
      service_name: service.name,
      price_usd: service.price_usd,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (error || !appointment) {
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
  }

  await Promise.all([
    sendAppointmentConfirmation({
      patientName: patient_name,
      patientEmail: patient_email,
      therapistName: profile.full_name,
      serviceName: service.name,
      startsAt,
      therapistSlug: profile.slug,
    }).catch(() => {}),
    sendNewBookingNotification({
      therapistEmail: profile.email,
      therapistName: profile.full_name,
      patientName: patient_name,
      patientEmail: patient_email,
      serviceName: service.name,
      startsAt,
    }).catch(() => {}),
  ])

  return NextResponse.json({ success: true, appointmentId: appointment.id })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/booking/
git commit -m "feat: API route POST /api/booking/confirm"
```

---

## Task 10: Reminders Cron API Route

**Files:**
- Create: `app/api/reminders/send/route.ts`

- [ ] **Step 1: Create reminders cron route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReminder24h, sendReminder1h } from '@/lib/resend/emails'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (auth !== expected) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()

  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000)

  const in65min = new Date(now.getTime() + 65 * 60 * 1000)
  const in55min = new Date(now.getTime() + 55 * 60 * 1000)

  const [{ data: remind24 }, { data: remind1h }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, patient_name, patient_email, service_name, starts_at, therapist_id')
      .eq('status', 'confirmed')
      .eq('reminder_24h_sent', false)
      .gte('starts_at', in23h.toISOString())
      .lte('starts_at', in25h.toISOString()),
    supabase
      .from('appointments')
      .select('id, patient_name, patient_email, service_name, starts_at, therapist_id')
      .eq('status', 'confirmed')
      .eq('reminder_1h_sent', false)
      .gte('starts_at', in55min.toISOString())
      .lte('starts_at', in65min.toISOString()),
  ])

  const therapistIds = [
    ...new Set([
      ...(remind24 ?? []).map((a) => a.therapist_id),
      ...(remind1h ?? []).map((a) => a.therapist_id),
    ]),
  ]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, slug')
    .in('id', therapistIds.length > 0 ? therapistIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  let sent24h = 0
  let sent1h = 0

  await Promise.all([
    ...(remind24 ?? []).map(async (appt) => {
      const therapist = profileMap.get(appt.therapist_id)
      if (!therapist) return
      try {
        await sendReminder24h({
          patientName: appt.patient_name,
          patientEmail: appt.patient_email,
          therapistName: therapist.full_name,
          serviceName: appt.service_name,
          startsAt: new Date(appt.starts_at),
          therapistSlug: therapist.slug,
        })
        await supabase.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id)
        sent24h++
      } catch {}
    }),
    ...(remind1h ?? []).map(async (appt) => {
      const therapist = profileMap.get(appt.therapist_id)
      if (!therapist) return
      try {
        await sendReminder1h({
          patientName: appt.patient_name,
          patientEmail: appt.patient_email,
          therapistName: therapist.full_name,
          serviceName: appt.service_name,
          startsAt: new Date(appt.starts_at),
          therapistSlug: therapist.slug,
        })
        await supabase.from('appointments').update({ reminder_1h_sent: true }).eq('id', appt.id)
        sent1h++
      } catch {}
    }),
  ])

  return NextResponse.json({ sent24h, sent1h })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/reminders/
git commit -m "feat: API route cron reminders 24h et 1h"
```

---

## Task 11: Stripe API Routes

**Files:**
- Create: `app/api/stripe/webhook/route.ts`
- Create: `app/api/stripe/checkout/route.ts`
- Create: `app/api/stripe/portal/route.ts`

- [ ] **Step 1: Create Stripe webhook route**

`app/api/stripe/webhook/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('stripe_customer_id', subscription.customer as string)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: null,
        subscription_status: 'canceled',
      })
      .eq('stripe_customer_id', subscription.customer as string)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await supabase
      .from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer as string)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Create Stripe checkout route**

`app/api/stripe/checkout/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion`,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 3: Create Stripe portal route**

`app/api/stripe/portal/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion`,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/
git commit -m "feat: routes Stripe webhook, checkout et portail facturation"
```

---

## Task 12: Vercel Cron Config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/reminders/send",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: config cron Vercel reminders toutes les heures"
```

---

## Task 13: Fix Booking Layout

**Files:**
- Create: `app/(booking)/layout.tsx`

- [ ] **Step 1: Create minimal booking layout (no auth)**

```tsx
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(booking)/layout.tsx"
git commit -m "chore: layout vide pour route group booking"
```

---

## Spec Coverage Verification

| Requirement | Task |
|---|---|
| Dashboard layout + sidebar | Task 1 |
| Sign-out | Task 1 (SidebarSignOut) |
| Active nav link styling | Task 1 (NavLink) |
| Agenda week calendar | Task 4 |
| Appointment cards with status | Task 4 (AppointmentCard) |
| New appointment dialog + form | Task 4 (NewAppointmentDialog) |
| createAppointment server action + email | Task 2 |
| updateAppointmentStatus + deleteAppointment | Task 2 |
| Patients table with filter + count | Task 5 |
| New patient dialog | Task 5 |
| Archive patient | Task 5 (PatientActions) |
| SOAP notes page | Task 6 |
| saveSessionNotes upsert | Task 3 |
| Config page: profile/services/availability/billing | Task 7 |
| ServicesManager CRUD | Task 7 |
| AvailabilityManager CRUD | Task 7 |
| Stripe checkout + portal | Task 11 + Task 7 |
| Public booking page | Task 8 |
| BookingWidget: service → date → slot → contact | Task 8 |
| POST /api/booking/confirm + race condition check | Task 9 |
| Cron reminders 24h + 1h | Task 10 |
| Stripe webhook (4 events) | Task 11 |
| vercel.json cron | Task 12 |
| Booking layout | Task 13 |
