import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReminder24h, sendReminder1h } from '@/lib/resend/emails'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (auth !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()

  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const in65min = new Date(now.getTime() + 65 * 60 * 1000)
  const in55min = new Date(now.getTime() + 55 * 60 * 1000)

  const [{ data: remind24 }, { data: remind1h }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, patient_name, patient_email, service_name, starts_at, therapist_id')
      .eq('status', 'confirmed')
      .eq('reminder_24h_sent', false)
      .gte('starts_at', in23h.toISOString())
      .lte('starts_at', in25h.toISOString()),
    supabase
      .from('appointments')
      .select('id, patient_name, patient_email, service_name, starts_at, therapist_id')
      .eq('status', 'confirmed')
      .eq('reminder_1h_sent', false)
      .gte('starts_at', in55min.toISOString())
      .lte('starts_at', in65min.toISOString()),
  ])

  const therapistIds = [
    ...new Set([
      ...(remind24 ?? []).map((a) => a.therapist_id),
      ...(remind1h ?? []).map((a) => a.therapist_id),
    ]),
  ]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, slug')
    .in(
      'id',
      therapistIds.length > 0
        ? therapistIds
        : ['00000000-0000-0000-0000-000000000000']
    )

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  let sent24h = 0
  let sent1h = 0

  await Promise.all([
    ...(remind24 ?? []).map(async (appt) => {
      const therapist = profileMap.get(appt.therapist_id)
      if (!therapist) return
      try {
        await sendReminder24h({
          patientName: appt.patient_name,
          patientEmail: appt.patient_email,
          therapistName: therapist.full_name,
          serviceName: appt.service_name,
          startsAt: new Date(appt.starts_at),
          therapistSlug: therapist.slug,
        })
        await supabase
          .from('appointments')
          .update({ reminder_24h_sent: true })
          .eq('id', appt.id)
        sent24h++
      } catch {}
    }),
    ...(remind1h ?? []).map(async (appt) => {
      const therapist = profileMap.get(appt.therapist_id)
      if (!therapist) return
      try {
        await sendReminder1h({
          patientName: appt.patient_name,
          patientEmail: appt.patient_email,
          therapistName: therapist.full_name,
          serviceName: appt.service_name,
          startsAt: new Date(appt.starts_at),
          therapistSlug: therapist.slug,
        })
        await supabase
          .from('appointments')
          .update({ reminder_1h_sent: true })
          .eq('id', appt.id)
        sent1h++
      } catch {}
    }),
  ])

  return NextResponse.json({ sent24h, sent1h })
}
