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

  if (error) {
    console.error('[createPatient]', error)
    return { success: false, error: `Error al crear paciente: ${error.message}` }
  }

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
