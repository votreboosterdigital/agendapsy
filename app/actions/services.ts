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
