'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { saveAvailabilityRules, deleteAvailabilityRule } from '@/app/actions/availability'
import type { Database } from '@/lib/supabase/types'

type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 20; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 20) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const inputCls =
  'w-full px-3 py-2 rounded-md text-sm text-white bg-white/5 border border-[#ffffff12] outline-none focus:ring-1 focus:ring-[#635BFF]'

export function AvailabilityManager({ rules }: { rules: AvailabilityRule[] }) {
  const [showForm, setShowForm] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)

  function toggleDay(i: number) {
    setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))
  }

  function resetForm() {
    setSelectedDays([])
    setStartTime('09:00')
    setEndTime('18:00')
    setDuration(60)
    setShowForm(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedDays.length === 0) {
      toast.error('Selecciona al menos un día')
      return
    }
    setSaving(true)
    const result = await saveAvailabilityRules(
      selectedDays.map((day) => ({
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        session_duration_min: duration,
      }))
    )
    setSaving(false)
    if (result.success) {
      toast.success(`Disponibilidad guardada (${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''})`)
      resetForm()
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
        <form
          onSubmit={onSubmit}
          className="space-y-3 pt-3 p-3 rounded-lg"
          style={{ backgroundColor: '#161618', border: '1px solid #ffffff12' }}
        >
          {/* Selector de días */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Días</p>
            <div className="flex flex-wrap gap-1.5">
              {DAY_SHORT.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedDays.includes(i) ? '#635BFF' : '#ffffff08',
                    color: selectedDays.includes(i) ? '#fff' : '#a1a1aa',
                    border: `1px solid ${selectedDays.includes(i) ? '#635BFF' : '#ffffff12'}`,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Inicio</p>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: '#1a1a1d' }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Fin</p>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputCls}
                style={{ backgroundColor: '#1a1a1d' }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duración */}
          <div>
            <p className="text-xs text-zinc-500 mb-1">Duración de sesión</p>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls}
              style={{ backgroundColor: '#1a1a1d' }}
            >
              {[30, 60, 90, 120].map((d) => (
                <option key={d} value={d}>{d} minutos</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border rounded-md transition-colors"
              style={{ borderColor: '#ffffff12' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedDays.length === 0}
              className="px-3 py-1.5 text-xs text-white rounded-md disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#635BFF' }}
            >
              {saving
                ? 'Guardando...'
                : selectedDays.length > 0
                ? `Guardar ${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''}`
                : 'Selecciona días'}
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
