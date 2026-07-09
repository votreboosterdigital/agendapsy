'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProfileData {
  full_name: string
  specialty: string
  bio: string
  phone: string
}

interface ServiceData {
  name: string
  duration_min: number
  price_usd: number
}

interface AvailabilityRule {
  day_of_week: number
  start_time: string
  end_time: string
  session_duration_min: number
}

interface ActionResult<T = null> {
  success: boolean
  error?: string
  data?: T
}

export async function updateProfile(data: ProfileData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: data.full_name,
      specialty: data.specialty,
      bio: data.bio,
      phone: data.phone,
      subscription_status: 'trialing',
    } as never)

  if (error) {
    console.error('[updateProfile]', error)
    return { success: false, error: 'Error al actualizar el perfil' }
  }

  revalidatePath('/onboarding')
  return { success: true }
}

export async function createService(data: ServiceData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  const { data: inserted, error } = await supabase
    .from('services')
    .insert({
      therapist_id: user.id,
      name: data.name,
      duration_min: data.duration_min,
      price_usd: data.price_usd,
      is_active: true,
    } as never)
    .select('id')
    .single()

  if (error) {
    console.error('[createService]', error)
    return { success: false, error: 'Error al crear el servicio' }
  }

  const row = inserted as unknown as { id: string }
  return { success: true, data: { id: row.id } }
}

export async function saveAvailability(
  rules: AvailabilityRule[]
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  const { error: deleteError } = await supabase
    .from('availability_rules')
    .delete()
    .eq('therapist_id', user.id)

  if (deleteError) {
    console.error('[saveAvailability - delete]', deleteError)
    return { success: false, error: 'Error al guardar la disponibilidad' }
  }

  if (rules.length === 0) {
    return { success: true }
  }

  const { error: insertError } = await supabase.from('availability_rules').insert(
    rules.map((rule) => ({
      therapist_id: user.id,
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      session_duration_min: rule.session_duration_min,
    })) as never[]
  )

  if (insertError) {
    console.error('[saveAvailability - insert]', insertError)
    return { success: false, error: 'Error al guardar la disponibilidad' }
  }

  revalidatePath('/onboarding')
  return { success: true }
}
