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
import { Loader2, User, Mail, Lock } from 'lucide-react'

const signupSchema = z.object({
  full_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupFormData) {
    setLoading(true)
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este correo ya está registrado. Inicia sesión.')
      } else {
        toast.error('Error al crear la cuenta. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    if (authData.user && !authData.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-sm">
        <div
          className="rounded-[6px] p-8 text-center"
          style={{
            backgroundColor: '#111113',
            border: '1px solid #ffffff12',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#635BFF20' }}
          >
            <Mail className="size-6" style={{ color: '#635BFF' }} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Confirma tu correo
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
            Te enviamos un enlace de confirmación a tu correo. Haz clic en el enlace
            para activar tu cuenta y comenzar el onboarding.
          </p>
          <p className="mt-4 text-xs" style={{ color: '#52525b' }}>
            ¿No lo encuentras? Revisa tu carpeta de spam.
          </p>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-semibold text-white mb-1">Crea tu cuenta</h1>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>
            Empieza a gestionar tu agenda en minutos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white" htmlFor="full_name">
              Nombre completo
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: '#a1a1aa' }}
              />
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="Dr. Ana García López"
                {...register('full_name')}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-[6px] text-white placeholder:text-[#52525b] outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a1d',
                  border: errors.full_name ? '1px solid #ef4444' : '1px solid #ffffff12',
                }}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {errors.full_name.message}
              </p>
            )}
          </div>

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
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
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
            disabled={loading}
            className="w-full h-9 text-sm font-medium rounded-[6px] text-white transition-opacity disabled:opacity-60 mt-2"
            style={{ backgroundColor: '#635BFF', border: 'none' }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Crear cuenta gratis'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: '#a1a1aa' }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium transition-colors hover:text-white"
            style={{ color: '#635BFF' }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
