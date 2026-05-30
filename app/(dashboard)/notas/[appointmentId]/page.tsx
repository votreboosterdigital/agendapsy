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
          {format(parseISO(appointment.starts_at), "d 'de' MMMM 'a las' HH:mm", {
            locale: es,
          })}
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
