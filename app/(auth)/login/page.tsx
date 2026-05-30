'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Lock, Sparkles } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

const magicLinkSchema = z.object({
  magicEmail: z.string().email('Ingresa un correo electrónico válido'),
})

type MagicLinkFormData = z.infer<typeof magicLinkSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingMagic, setLoadingMagic] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerMagic,
    handleSubmit: handleSubmitMagic,
    formState: { errors: errorsMagic },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setLoadingPassword(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(
        error.message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos'
          : 'Error al iniciar sesión. Inténtalo de nuevo.'
      )
      setLoadingPassword(false)
      return
    }

    router.push('/agenda')
    router.refresh()
  }

  async function onMagicLink(data: MagicLinkFormData) {
    setLoadingMagic(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: data.magicEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/agenda`,
      },
    })

    if (error) {
      toast.error('Error al enviar el enlace. Inténtalo de nuevo.')
      setLoadingMagic(false)
      return
    }

    setMagicSent(true)
    setLoadingMagic(false)
    toast.success('¡Enlace enviado! Revisa tu correo electrónico.')
  }

  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-[6px] p-8"
        style={{
          backgroundColor: '#111113',
          border: '1px solid #ffffff12',
        }}
      >
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>
            Ingresa a tu cuenta de AgendaPsy
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: '#a1a1aa' }}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...register('email')}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a1d',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #ffffff12',
                }}
              />
            </div>
            {errors.email && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: '#a1a1aa' }}
              />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a1d',
                  border: errors.password ? '1px solid #ef4444' : '1px solid #ffffff12',
                }}
              />
            </div>
            {errors.password && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loadingPassword}
            className="w-full h-9 text-sm font-medium rounded-[6px] text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#635BFF', border: 'none' }}
          >
            {loadingPassword ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: '#ffffff12' }} />
          <span className="text-xs" style={{ color: '#52525b' }}>
            o
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#ffffff12' }} />
        </div>

        {magicSent ? (
          <div
            className="rounded-[6px] p-4 text-center"
            style={{ backgroundColor: '#1a1a1d', border: '1px solid #635BFF30' }}
          >
            <p className="text-sm text-white font-medium mb-1">Revisa tu correo</p>
            <p className="text-xs" style={{ color: '#a1a1aa' }}>
              Te enviamos un enlace de acceso. Puede tardar unos segundos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitMagic(onMagicLink)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white" htmlFor="magicEmail">
                Recibir enlace por email
              </label>
              <input
                id="magicEmail"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...registerMagic('magicEmail')}
                className="w-full h-9 px-3 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a1d',
                  border: errorsMagic.magicEmail
                    ? '1px solid #ef4444'
                    : '1px solid #ffffff12',
                }}
              />
              {errorsMagic.magicEmail && (
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  {errorsMagic.magicEmail.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loadingMagic}
              className="w-full h-9 text-sm font-medium rounded-[6px] transition-colors disabled:opacity-60"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #ffffff12',
                color: '#a1a1aa',
              }}
            >
              {loadingMagic ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-4 mr-1.5" />
                  Enviar enlace mágico
                </>
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: '#a1a1aa' }}>
          ¿No tienes cuenta?{' '}
          <Link
            href="/signup"
            className="font-medium transition-colors hover:text-white"
            style={{ color: '#635BFF' }}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
