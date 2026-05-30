import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingWidget } from './components/BookingWidget'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']
type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, specialty, slug')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const [{ data: services }, { data: rules }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration_min, price_usd, is_active, therapist_id')
      .eq('therapist_id', profile.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('availability_rules')
      .select('id, day_of_week, start_time, end_time, session_duration_min, therapist_id')
      .eq('therapist_id', profile.id)
      .order('day_of_week'),
  ])

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#0F0F11' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-2xl font-bold text-white"
            style={{ backgroundColor: '#635BFF' }}
          >
            {profile.full_name[0]}
          </div>
          <h1 className="text-2xl font-semibold text-white">{profile.full_name}</h1>
          {profile.specialty && (
            <p className="text-zinc-400 text-sm mt-1">{profile.specialty}</p>
          )}
          {profile.bio && (
            <p className="text-zinc-500 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
        <BookingWidget
          therapistId={profile.id}
          therapistSlug={profile.slug}
          services={(services ?? []) as Service[]}
          availabilityRules={(rules ?? []) as AvailabilityRule[]}
        />
      </div>
    </div>
  )
}
