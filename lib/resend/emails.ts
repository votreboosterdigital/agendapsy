import { Resend } from 'resend'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder_build_key')

const FROM = 'AgendaPsy <noreply@agendapsy.com>'

interface AppointmentReminderParams {
  patientName: string
  patientEmail: string
  therapistName: string
  serviceName: string
  startsAt: Date
  therapistSlug: string
}

export async function sendAppointmentConfirmation(params: AppointmentReminderParams) {
  const dateStr = format(params.startsAt, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })

  return resend.emails.send({
    from: FROM,
    to: params.patientEmail,
    subject: `Confirmación de tu cita con ${params.therapistName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #635BFF;">Tu cita está confirmada ✓</h2>
        <p>Hola <strong>${params.patientName}</strong>,</p>
        <p>Tu cita de <strong>${params.serviceName}</strong> con <strong>${params.therapistName}</strong> ha sido confirmada.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Fecha:</strong> ${dateStr}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Si necesitas cancelar, por favor avisa con al menos 24 horas de anticipación.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">AgendaPsy · Tu agenda inteligente para psicólogos</p>
      </div>
    `,
  })
}

export async function sendReminder24h(params: AppointmentReminderParams) {
  const dateStr = format(params.startsAt, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })

  return resend.emails.send({
    from: FROM,
    to: params.patientEmail,
    subject: `Recordatorio: tu cita es mañana 📅`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #635BFF;">Recordatorio de cita</h2>
        <p>Hola <strong>${params.patientName}</strong>,</p>
        <p>Te recordamos que mañana tienes una cita de <strong>${params.serviceName}</strong> con <strong>${params.therapistName}</strong>.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Fecha:</strong> ${dateStr}</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">AgendaPsy · Tu agenda inteligente para psicólogos</p>
      </div>
    `,
  })
}

export async function sendReminder1h(params: AppointmentReminderParams) {
  const dateStr = format(params.startsAt, "HH:mm", { locale: es })

  return resend.emails.send({
    from: FROM,
    to: params.patientEmail,
    subject: `Tu cita comienza en 1 hora ⏰`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #635BFF;">Tu cita es en 1 hora</h2>
        <p>Hola <strong>${params.patientName}</strong>,</p>
        <p>Tu cita de <strong>${params.serviceName}</strong> con <strong>${params.therapistName}</strong> comienza a las <strong>${dateStr}</strong>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">AgendaPsy · Tu agenda inteligente para psicólogos</p>
      </div>
    `,
  })
}

export async function sendNewBookingNotification(params: {
  therapistEmail: string
  therapistName: string
  patientName: string
  patientEmail: string
  serviceName: string
  startsAt: Date
}) {
  const dateStr = format(params.startsAt, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })

  return resend.emails.send({
    from: FROM,
    to: params.therapistEmail,
    subject: `Nueva reserva: ${params.patientName} — ${dateStr}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #635BFF;">Nueva reserva recibida</h2>
        <p>Hola <strong>${params.therapistName}</strong>,</p>
        <p><strong>${params.patientName}</strong> ha reservado una cita contigo.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>👤 Paciente:</strong> ${params.patientName} (${params.patientEmail})</p>
          <p style="margin: 4px 0;"><strong>🗂 Servicio:</strong> ${params.serviceName}</p>
          <p style="margin: 4px 0;"><strong>📅 Fecha:</strong> ${dateStr}</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">AgendaPsy · Tu agenda inteligente para psicólogos</p>
      </div>
    `,
  })
}
