import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Gestion i18n — détection de locale et redirections
const handleI18n = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  // Appliquer i18n en premier (lecture seule, pas de redirection agressive)
  const intlResponse = handleI18n(request)

  // Si next-intl redirige (ex: /fr → /fr/...), honorer la redirection
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }

  // Gestion des cookies Supabase SSR
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isDashboardRoute =
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/pacientes') ||
    pathname.startsWith('/notas') ||
    pathname.startsWith('/configuracion')

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/agenda', request.url))
  }

  // Propager les cookies i18n sur la réponse Supabase
  intlResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    supabaseResponse.cookies.set(name, value, options)
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|book/.*|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
