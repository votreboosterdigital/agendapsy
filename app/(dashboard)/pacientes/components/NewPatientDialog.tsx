'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createPatient } from '@/app/actions/patients'

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

export function NewPatientDialog() {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const result = await createPatient(data)
    if (result.success) {
      toast.success('Paciente añadido')
      reset()
      setOpen(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-80 transition-opacity"
        style={{ backgroundColor: '#635BFF' }}
      >
        <Plus size={15} />
        Nuevo paciente
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-5">Nuevo paciente</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre completo" error={errors.full_name?.message}>
            <input
              {...register('full_name')}
              placeholder="María González"
              className={inputCls}
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="maria@ejemplo.com"
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp (opcional)">
            <input
              {...register('whatsapp')}
              placeholder="+52 55 1234 5678"
              className={inputCls}
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-white border transition-colors"
              style={{ borderColor: '#ffffff12' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#635BFF' }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
