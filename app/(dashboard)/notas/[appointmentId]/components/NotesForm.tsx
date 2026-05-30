'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { saveSessionNotes } from '@/app/actions/notes'

interface NotesData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface NotesFormProps {
  appointmentId: string
  initialNotes: NotesData
}

const SOAP_FIELDS: { key: keyof NotesData; label: string; placeholder: string }[] = [
  { key: 'subjective', label: 'Subjetivo', placeholder: 'Lo que reporta el paciente...' },
  { key: 'objective', label: 'Objetivo', placeholder: 'Observaciones clínicas...' },
  { key: 'assessment', label: 'Análisis', placeholder: 'Evaluación clínica...' },
  { key: 'plan', label: 'Plan', placeholder: 'Intervenciones y próximos pasos...' },
]

export function NotesForm({ appointmentId, initialNotes }: NotesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<NotesData>({ defaultValues: initialNotes })

  async function onSubmit(data: NotesData) {
    const result = await saveSessionNotes(appointmentId, data)
    if (result.success) toast.success('Notas guardadas')
    else toast.error(result.error ?? 'Error al guardar')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {SOAP_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
          <textarea
            {...register(key)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-white border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF] resize-y"
            style={{ backgroundColor: '#161618' }}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#635BFF' }}
      >
        {isSubmitting ? 'Guardando...' : 'Guardar notas'}
      </button>
    </form>
  )
}
