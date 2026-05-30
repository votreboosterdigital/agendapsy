import Stripe from 'stripe'

function createStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder_build_key', {
    apiVersion: '2026-05-27.dahlia',
    typescript: true,
  })
}

export const stripe = createStripeClient()
