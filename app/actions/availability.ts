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

  if (error) {
    console.error('[saveAvailabilityRule]', error)
    return { success: false, error: `Error: ${error.message}` }
  }

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
