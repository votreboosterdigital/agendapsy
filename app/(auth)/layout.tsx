import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgendaPsy — Acceso',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0F0F11' }}
    >
      <header className="flex justify-center pt-10 pb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
            style={{ backgroundColor: '#635BFF' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2C8 2 4 5 4 9C4 11.2 5.8 13 8 13C10.2 13 12 11.2 12 9C12 5 8 2 8 2Z"
                fill="white"
                fillOpacity="0.9"
              />
              <circle cx="8" cy="9" r="2" fill="#0F0F11" />
            </svg>
          </div>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: '#ffffff' }}
          >
            AgendaPsy
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
