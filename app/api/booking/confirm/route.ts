import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendAppointmentConfirmation,
  sendNewBookingNotification,
} from '@/lib/resend/emails'
import { checkRateLimit } from '@/lib/rate-limit'
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
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { allowed } = await checkRateLimit(`booking:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      { status: 429 }
    )
  }

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

  const {
    slug,
    service_id,
    starts_at,
    patient_name,
    patient_email,
    patient_whatsapp,
  } = parsed.data

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
    return NextResponse.json(
      { error: 'Este horario ya no está disponible' },
      { status: 409 }
    )
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      therapist_id: profile.id,
      patient_id: null,
      patient_name,
      patient_email,
      patient_whatsapp: patient_whatsapp ?? null,
      service_name: service.name,
      price_usd: service.price_usd,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
      notes: null,
      reminder_24h_sent: false,
      reminder_1h_sent: false,
    })
    .select('id')
    .single()

  if (error ?? !appointment) {
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
