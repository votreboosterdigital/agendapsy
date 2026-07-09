"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  Calendar,
  Link as LinkIcon,
  Bell,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react"

import { SparklesCore } from "@/components/ui/sparkles"
import { MovingBorderButton } from "@/components/ui/moving-border"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const testimonials = [
  {
    quote: "Reduje mis inasistencias a la mitad en el primer mes.",
    name: "Dra. Valentina Ríos",
    title: "Psicóloga clínica · CDMX",
  },
  {
    quote: "Mis pacientes adoran poder reservar solos a cualquier hora.",
    name: "Dr. Andrés Fuentes",
    title: "Terapeuta · Guadalajara",
  },
  {
    quote: "Por fin puedo enfocarme en la terapia, no en el papeleo.",
    name: "Psic. Camila Torres",
    title: "Psicóloga · Monterrey",
  },
  {
    quote: "Los recordatorios automáticos cambiaron mi práctica por completo.",
    name: "Dr. Rodrigo Méndez",
    title: "Psicólogo · Puebla",
  },
  {
    quote: "Llevo notas SOAP digitales por primera vez en 8 años.",
    name: "Psic. Sofía Herrera",
    title: "Psicoterapeuta · CDMX",
  },
  {
    quote: "El setup fue de 10 minutos. Increíble.",
    name: "Dr. Miguel Ángel Vera",
    title: "Psicólogo · Querétaro",
  },
]

const features = [
  {
    title: "Agenda Inteligente",
    description:
      "Vista semanal clara, citas a un vistazo. Gestiona tu disponibilidad en segundos.",
    icon: Calendar,
    highlight: true,
  },
  {
    title: "Reservas en línea",
    description:
      "Tus pacientes reservan solos desde tu página personalizada, sin llamadas.",
    icon: LinkIcon,
    highlight: false,
  },
  {
    title: "Recordatorios automáticos",
    description:
      "Email 24h y 1h antes de cada cita. Menos no-shows, más ingresos.",
    icon: Bell,
    highlight: false,
  },
  {
    title: "Expediente digital",
    description:
      "Notas SOAP por sesión, historial organizado, todo en un solo lugar.",
    icon: FileText,
    highlight: false,
  },
  {
    title: "Gestión de pacientes",
    description:
      "Historial completo de cada paciente: sesiones, notas, próximas citas.",
    icon: Users,
    highlight: false,
  },
]

const faqItems = [
  {
    question: "¿Necesito tarjeta de crédito para empezar?",
    answer:
      "No, los 14 días de prueba son completamente gratis. Sin tarjeta de crédito, sin compromisos.",
  },
  {
    question: "¿Mis pacientes necesitan crear una cuenta?",
    answer:
      "No. Reservan directamente desde tu página pública con solo su nombre y correo.",
  },
  {
    question: "¿Cómo se envían los recordatorios?",
    answer:
      "Por email automáticamente 24h y 1h antes de cada cita. Sin intervención de tu parte.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer:
      "Sí, sin penalizaciones ni contratos. Cancela desde tu cuenta con un clic.",
  },
  {
    question: "¿Es seguro guardar notas de sesión?",
    answer:
      "Sí. Tus notas están protegidas con cifrado en tránsito y en reposo. Solo tú puedes acceder.",
  },
  {
    question: "¿Funciona para psicólogos en México?",
    answer:
      "Sí, aceptamos pagos en USD vía Stripe, compatible con cuentas bancarias mexicanas.",
  },
]

function FaqItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  const [open, setOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="border-b border-[#ffffff12]">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-white pr-4">{question}</span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-[#635BFF]" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-[#71717a]" />
        )}
      </button>
      {open && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <p className="pb-5 text-sm leading-relaxed text-[#71717a]">
            {answer}
          </p>
        </motion.div>
      )}
    </div>
  )
}

const animProps = (i: number = 0) => ({
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, margin: "-50px" },
  custom: i,
  variants: fadeUp,
})

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion()

  const motionProps = (i: number = 0) =>
    prefersReducedMotion ? animProps(i) : animProps(i)

  return (
    <>
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-32">
        <SparklesCore className="z-0" particleCount={90} />

        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#635BFF]/8 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div {...motionProps(0)}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#635BFF]/30 bg-[#635BFF]/10 px-4 py-1.5 text-xs font-medium text-[#818CF8]">
              ✦ Software #1 para psicólogos en México
            </span>
          </motion.div>

          <motion.h1
            className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            {...motionProps(1)}
          >
            Tu agenda inteligente{" "}
            <span className="bg-gradient-to-r from-[#635BFF] via-[#818CF8] to-white bg-clip-text text-transparent">
              para psicólogos
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[#a1a1aa] sm:text-lg"
            {...motionProps(2)}
          >
            Reduce inasistencias, automatiza recordatorios y gestiona tus
            pacientes desde un solo lugar.
          </motion.p>

          <motion.p
            className="mb-10 text-xs text-[#71717a]"
            {...motionProps(3)}
          >
            Únete a más de{" "}
            <span className="font-semibold text-[#a1a1aa]">500 terapeutas</span>{" "}
            que ya usan AgendaPsy
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            {...motionProps(4)}
          >
            <MovingBorderButton
              as="a"
              href="/signup"
              containerClassName="h-12"
              className="px-7 text-sm font-medium"
            >
              Empieza gratis 14 días →
            </MovingBorderButton>
            <Link
              href="#como-funciona"
              className="text-sm text-[#a1a1aa] underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Ver cómo funciona
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#161618] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                stat: "30–40%",
                label: "de inasistencias en promedio",
                sublabel: "Costo real para tu consulta cada semana",
              },
              {
                stat: "+2 horas",
                label: "por semana en gestión administrativa",
                sublabel: "Tiempo que podrías dedicar a más pacientes",
              },
              {
                stat: "Sin herramienta",
                label: "dedicada para psicólogos",
                sublabel: "Excel y WhatsApp no son suficientes",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="rounded-[6px] border border-[#ffffff12] bg-[#0F0F11] p-8"
                {...motionProps(i)}
              >
                <p className="mb-2 text-3xl font-bold text-white">
                  {item.stat}
                </p>
                <p className="mb-1 text-sm font-medium text-[#a1a1aa]">
                  {item.label}
                </p>
                <p className="text-xs text-[#71717a]">{item.sublabel}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="funciones" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14 text-center" {...motionProps(0)}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Todo lo que necesitas para{" "}
              <span className="text-[#635BFF]">gestionar tu consulta</span>
            </h2>
            <p className="mx-auto max-w-xl text-sm text-[#71717a]">
              Diseñado específicamente para la práctica privada de psicólogos y
              terapeutas.
            </p>
          </motion.div>

          <motion.div {...motionProps(1)}>
            <BentoGrid>
              {features.map((feature, i) => (
                <BentoGridItem
                  key={i}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  highlight={feature.highlight}
                  className={i === 0 ? "md:col-span-2" : ""}
                />
              ))}
            </BentoGrid>
          </motion.div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#161618] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14 text-center" {...motionProps(0)}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Empieza en{" "}
              <span className="text-[#635BFF]">5 minutos</span>
            </h2>
            <p className="text-sm text-[#71717a]">
              Sin instalación, sin configuración técnica.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Crea tu cuenta",
                desc: "Registro gratuito, sin tarjeta de crédito.",
              },
              {
                step: "02",
                title: "Configura tu agenda",
                desc: "Agrega tus servicios y tu disponibilidad.",
              },
              {
                step: "03",
                title: "Comparte tu link",
                desc: "Tus pacientes reservan solos en tu página personalizada.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative flex flex-col items-start gap-4 rounded-[6px] border border-[#ffffff12] bg-[#0F0F11] p-6"
                {...motionProps(i)}
              >
                <span className="text-4xl font-bold text-[#635BFF]/30">
                  {item.step}
                </span>
                <div>
                  <p className="mb-1 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-[#71717a]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14 text-center" {...motionProps(0)}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Lo que dicen nuestros{" "}
              <span className="text-[#635BFF]">psicólogos</span>
            </h2>
            <p className="text-sm text-[#71717a]">
              Más de 500 terapeutas confían en AgendaPsy
            </p>
          </motion.div>
        </div>
        <InfiniteMovingCards items={testimonials} speed="normal" />
      </section>

      <section id="precios" className="bg-[#161618] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14 text-center" {...motionProps(0)}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Un plan,{" "}
              <span className="text-[#635BFF]">todo incluido</span>
            </h2>
            <p className="text-sm text-[#71717a]">
              Sin surpresas, sin límites artificiales.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-md"
            {...motionProps(1)}
          >
            <div className="relative overflow-hidden rounded-[6px] border border-[#635BFF]/40 bg-[#0F0F11]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#635BFF]/5 to-transparent" />
              <div className="relative p-8">
                <div className="mb-6 text-center">
                  <p className="mb-1 text-5xl font-bold text-white">
                    $29{" "}
                    <span className="text-xl font-normal text-[#71717a]">
                      USD /mes
                    </span>
                  </p>
                  <p className="text-sm text-[#a1a1aa]">
                    o{" "}
                    <span className="font-medium text-[#635BFF]">
                      $290/año
                    </span>{" "}
                    (2 meses gratis)
                  </p>
                </div>

                <ul className="mb-8 space-y-3">
                  {[
                    "Agenda ilimitada",
                    "Página de reservas personalizada",
                    "Recordatorios automáticos",
                    "Notas SOAP por sesión",
                    "Soporte por email",
                    "Cancelación en cualquier momento",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="size-4 shrink-0 text-[#635BFF]" />
                      <span className="text-sm text-[#a1a1aa]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <MovingBorderButton
                  as="a"
                  href="/signup"
                  containerClassName="h-12 w-full"
                  className="w-full justify-center px-7 text-sm font-medium"
                >
                  Empieza gratis 14 días
                </MovingBorderButton>

                <p className="mt-4 text-center text-xs text-[#71717a]">
                  Sin tarjeta de crédito. Cancela cuando quieras.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="faq" className="py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-14 text-center" {...motionProps(0)}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Preguntas{" "}
              <span className="text-[#635BFF]">frecuentes</span>
            </h2>
          </motion.div>

          <motion.div {...motionProps(1)}>
            {faqItems.map((item, i) => (
              <FaqItem key={i} question={item.question} answer={item.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#635BFF] to-[#4F46E5]" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.h2
            className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            {...motionProps(0)}
          >
            ¿Listo para llenar tu agenda?
          </motion.h2>
          <motion.p
            className="mb-10 text-base text-white/70 sm:text-lg"
            {...motionProps(1)}
          >
            Únete a cientos de psicólogos mexicanos que ya automatizaron su
            consulta.
          </motion.p>
          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            {...motionProps(2)}
          >
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-[6px] bg-white px-7 text-sm font-medium text-[#635BFF] transition-colors hover:bg-white/90"
            >
              Empieza gratis →
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center rounded-[6px] border border-white/30 px-7 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Ver demo
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-[#ffffff08] bg-[#0F0F11] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <p className="text-base font-semibold text-white">
                Agenda<span className="text-[#635BFF]">Psy</span>
              </p>
              <p className="text-xs text-[#71717a]">
                La agenda inteligente para psicólogos
              </p>
            </div>

            <nav className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-xs text-[#71717a] transition-colors hover:text-white"
              >
                Términos
              </Link>
              <Link
                href="/privacy"
                className="text-xs text-[#71717a] transition-colors hover:text-white"
              >
                Privacidad
              </Link>
              <Link
                href="/contact"
                className="text-xs text-[#71717a] transition-colors hover:text-white"
              >
                Contacto
              </Link>
            </nav>

            <p className="text-xs text-[#71717a]">© 2026 AgendaPsy</p>
          </div>
        </div>
      </footer>
    </>
  )
}
