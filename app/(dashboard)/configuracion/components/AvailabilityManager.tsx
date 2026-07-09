'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { saveAvailabilityRule, deleteAvailabilityRule } from '@/app/actions/availability'
import type { Database } from '@/lib/supabase/types'
import type { Resolver } from 'react-hook-form'

type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const schema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  session_duration_min: z.coerce.number().int().min(15, 'Mínimo 15 min'),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'

export function AvailabilityManager({ rules }: { rules: AvailabilityRule[] }) {
  const [showForm, setShowForm] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { session_duration_min: 50 },
  })

  async function onSubmit(data: FormData) {
    const result = await saveAvailabilityRule(data)
    if (result.success) {
      toast.success('Disponibilidad guardada')
      reset()
      setShowForm(false)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAvailabilityRule(id)
    if (!result.success) toast.error(result.error)
    else toast.success('Regla eliminada')
  }

  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
          style={{ backgroundColor: '#161618', border: '1px solid #ffffff08' }}
        >
          <div>
            <p className="text-sm text-white">{DAYS[r.day_of_week]}</p>
            <p className="text-xs text-zinc-500">
              {r.start_time} – {r.end_time} · {r.session_duration_min} min
            </p>
          </div>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <select
                {...register('day_of_week')}
                className={inputCls}
                style={{ backgroundColor: '#1a1a1d' }}
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <input {...register('start_time')} type="time" className={inputCls} style={{ colorScheme: 'dark' }} />
            <input {...register('end_time')} type="time" className={inputCls} style={{ colorScheme: 'dark' }} />
            <div className="col-span-2">
              <select
                {...register('session_duration_min')}
                className={inputCls}
                style={{ backgroundColor: '#1a1a1d' }}
              >
                {[30, 60, 90, 120].map((d) => (
                  <option key={d} value={d}>{d} minutos</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border rounded-md transition-colors"
              style={{ borderColor: '#ffffff12' }}
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white border transition-colors"
          style={{ borderColor: '#ffffff12' }}
        >
          <Plus size={13} />
          Añadir horario
        </button>
      )}
    </div>
  )
}
