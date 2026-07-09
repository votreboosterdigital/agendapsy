'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: '#4ade80' },
  trialing: { label: 'Período de prueba', color: '#fbbf24' },
  past_due: { label: 'Pago pendiente', color: '#f87171' },
  canceled: { label: 'Cancelado', color: '#a1a1aa' },
  inactive: { label: 'Inactivo', color: '#a1a1aa' },
}

export function BillingSection({
  subscriptionStatus,
}: {
  subscriptionStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.inactive

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error al abrir checkout')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">Estado:</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${statusInfo.color}20`,
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </span>
      </div>
      {subscriptionStatus === 'active' ? (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white border disabled:opacity-50 transition-colors hover:bg-white/5"
          style={{ borderColor: '#ffffff12' }}
        >
          <ExternalLink size={14} />
          {loading ? 'Cargando...' : 'Gestionar facturación'}
        </button>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#635BFF' }}
        >
          {loading ? 'Cargando...' : 'Suscribirme — $29 CAD/mes'}
        </button>
      )}
    </div>
  )
}
