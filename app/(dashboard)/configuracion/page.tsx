import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServicesManager } from './components/ServicesManager'
import { AvailabilityManager } from './components/AvailabilityManager'
import { BillingSection } from './components/BillingSection'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']
type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-sm font-medium text-zinc-300 mb-3 pb-2 border-b"
        style={{ borderColor: '#ffffff12' }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: services }, { data: rules }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, bio, specialty, subscription_status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('services')
      .select('id, name, duration_min, price_usd, is_active, therapist_id')
      .eq('therapist_id', user.id)
      .order('name'),
    supabase
      .from('availability_rules')
      .select('id, day_of_week, start_time, end_time, session_duration_min, therapist_id')
      .eq('therapist_id', user.id)
      .order('day_of_week'),
  ])

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-white">Configuración</h1>
      <Section title="Perfil">
        <div className="space-y-1 text-sm">
          <p className="text-white font-medium">{profile?.full_name}</p>
          <p className="text-zinc-400">{profile?.email}</p>
          {profile?.specialty && <p className="text-zinc-400">{profile.specialty}</p>}
          {profile?.bio && (
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </Section>
      <Section title="Servicios">
        <ServicesManager services={(services ?? []) as Service[]} />
      </Section>
      <Section title="Disponibilidad">
        <AvailabilityManager rules={(rules ?? []) as AvailabilityRule[]} />
      </Section>
      <Section title="Facturación">
        <BillingSection
          subscriptionStatus={profile?.subscription_status ?? 'trialing'}
        />
      </Section>
    </div>
  )
}
