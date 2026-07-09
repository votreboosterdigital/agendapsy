'use client'

import { toast } from 'sonner'
import { archivePatient, unarchivePatient } from '@/app/actions/patients'
import { Archive, ArchiveRestore } from 'lucide-react'

export function PatientActions({ patientId, status }: { patientId: string; status: string }) {
  async function handleArchive() {
    if (!confirm('¿Archivar este paciente?')) return
    const result = await archivePatient(patientId)
    if (!result.success) toast.error(result.error)
    else toast.success('Paciente archivado')
  }

  async function handleUnarchive() {
    const result = await unarchivePatient(patientId)
    if (!result.success) toast.error(result.error)
    else toast.success('Paciente reactivado')
  }

  if (status === 'inactive') {
    return (
      <button
        onClick={handleUnarchive}
        className="p-1.5 rounded text-zinc-500 hover:text-green-400 hover:bg-white/5 transition-colors"
        title="Desarchivar"
      >
        <ArchiveRestore size={14} />
      </button>
    )
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
