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
