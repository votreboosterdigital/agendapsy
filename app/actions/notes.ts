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
      subjective: parsed.data.subjective ?? null,
      objective: parsed.data.objective ?? null,
      assessment: parsed.data.assessment ?? null,
      plan: parsed.data.plan ?? null,
    },
    { onConflict: 'appointment_id' }
  )

  if (error) return { success: false, error: 'Error al guardar notas' }

  revalidatePath(`/notas/${appointmentId}`)
  return { success: true }
}
