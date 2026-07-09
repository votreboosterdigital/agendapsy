import Link from "next/link"
import { MovingBorderButton } from "@/components/ui/moving-border"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0F0F11]">
      <header className="sticky top-0 z-50 border-b border-[#ffffff08] bg-[#0F0F11]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-white">
              Agenda<span className="text-[#635BFF]">Psy</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#funciones"
              className="text-sm text-[#a1a1aa] transition-colors hover:text-white"
            >
              Funciones
            </Link>
            <Link
              href="#precios"
              className="text-sm text-[#a1a1aa] transition-colors hover:text-white"
            >
              Precios
            </Link>
            <Link
              href="#faq"
              className="text-sm text-[#a1a1aa] transition-colors hover:text-white"
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-[#a1a1aa] transition-colors hover:text-white sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <MovingBorderButton
              as="a"
              href="/signup"
              containerClassName="h-9"
              className="px-4 py-1.5 text-xs"
            >
              Empieza gratis
            </MovingBorderButton>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
