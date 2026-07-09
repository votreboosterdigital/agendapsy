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
    .select('id, therapist_id, full_name, email, whatsapp, status, notes, created_at')
    .eq('therapist_id', user.id)
    .order('full_name')

  if (status && ['active', 'inactive', 'waitlist'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: patients } = await query

  const { data: apptRows } = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('therapist_id', user.id)
    .not('patient_id', 'is', null)

  const appointmentCounts: Record<string, number> = {}
  apptRows?.forEach((a) => {
    if (a.patient_id) {
      appointmentCounts[a.patient_id] = (appointmentCounts[a.patient_id] ?? 0) + 1
    }
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
        <NewPatientDialog />
      </div>
      <div className="flex gap-2 mb-5">
        {([undefined, 'active', 'inactive', 'waitlist'] as const).map((s) => (
          <a
            key={s ?? 'all'}
            href={s ? `/pacientes?status=${s}` : '/pacientes'}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              status === s
                ? 'bg-[#635BFF] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'Todos'}
          </a>
        ))}
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr>
              {['Nombre', 'Email', 'WhatsApp', 'Estado', '# Citas', 'Acciones'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs text-muted-foreground font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background">
            {((patients ?? []) as Patient[]).map((patient) => (
              <tr key={patient.id} className="border-t border-border/50">
                <td className="px-4 py-3 text-foreground font-medium">{patient.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{patient.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{patient.whatsapp ?? '—'}</td>
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
                <td className="px-4 py-3 text-muted-foreground">
                  {appointmentCounts[patient.id] ?? 0}
                </td>
                <td className="px-4 py-3">
                  <PatientActions patientId={patient.id} status={patient.status} />
                </td>
              </tr>
            ))}
            {(patients ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
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
