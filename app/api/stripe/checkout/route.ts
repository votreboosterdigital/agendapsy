import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { allowed } = await checkRateLimit(`stripe-checkout:${ip}`)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      { status: 429 }
    )
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const fallbackEmail = user.email ?? ''
    const baseSlug = fallbackEmail.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
    await supabase.from('profiles').upsert({
      id: user.id,
      email: fallbackEmail,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? fallbackEmail,
      slug: `${baseSlug}-${user.id.slice(0, 6)}`,
      subscription_status: 'trialing',
    })
    profile = { email: fallbackEmail, full_name: fallbackEmail, stripe_customer_id: null }
  }

  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error Stripe'
    console.error('[stripe/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
