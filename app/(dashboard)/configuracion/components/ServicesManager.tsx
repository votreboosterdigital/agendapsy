'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createService, deleteService } from '@/app/actions/services'
import type { Database } from '@/lib/supabase/types'
import type { Resolver } from 'react-hook-form'

type Service = Database['public']['Tables']['services']['Row']

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  duration_min: z.coerce.number().int().min(15, 'Mínimo 15 min'),
  price_usd: z.coerce.number().min(0, 'Precio inválido'),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-md text-sm text-foreground bg-muted border border-border outline-none focus:ring-1 focus:ring-[#635BFF]'

export function ServicesManager({ services }: { services: Service[] }) {
  const [showForm, setShowForm] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> })

  async function onSubmit(data: FormData) {
    const result = await createService(data)
    if (result.success) {
      toast.success('Servicio añadido')
      reset()
      setShowForm(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    const result = await deleteService(id)
    if (!result.success) toast.error(result.error)
    else toast.success('Servicio eliminado')
  }

  return (
    <div className="space-y-2">
      {services
        .filter((s) => s.is_active)
        .map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border/50"
          >
            <div>
              <p className="text-sm text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.duration_min} min · ${s.price_usd} MXN
              </p>
            </div>
            <button
              onClick={() => handleDelete(s.id, s.name)}
              className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="space-y-2">
            <div>
              <input
                {...register('name')}
                placeholder="Nombre del servicio"
                className={inputCls}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  {...register('duration_min')}
                  type="number"
                  placeholder="Duración (min)"
                  className={inputCls}
                />
                {errors.duration_min && (
                  <p className="text-xs text-red-400 mt-1">{errors.duration_min.message}</p>
                )}
              </div>
              <div>
                <input
                  {...register('price_usd')}
                  type="number"
                  step="0.01"
                  placeholder="Precio MXN"
                  className={inputCls}
                />
                {errors.price_usd && (
                  <p className="text-xs text-red-400 mt-1">{errors.price_usd.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-white rounded-md disabled:opacity-50"
              style={{ backgroundColor: '#635BFF' }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground border border-border transition-colors"
        >
          <Plus size={13} />
          Añadir servicio
        </button>
      )}
    </div>
  )
}
