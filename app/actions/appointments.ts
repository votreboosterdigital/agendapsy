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
    patient_id: null,
    patient_name: parsed.data.patient_name,
    patient_email: parsed.data.patient_email,
    patient_whatsapp: parsed.data.patient_whatsapp ?? null,
    service_name: service.name,
    price_usd: service.price_usd,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: 'confirmed',
    notes: null,
    reminder_24h_sent: false,
    reminder_1h_sent: false,
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

export async function updateAppointmentTime(
  id: string,
  starts_at: string,
  ends_at: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('appointments')
    .update({ starts_at, ends_at })
    .eq('id', id)
    .eq('therapist_id', user.id)

  if (error) return { success: false, error: 'Error al actualizar horario' }

  revalidatePath('/agenda')
  return { success: true }
}
