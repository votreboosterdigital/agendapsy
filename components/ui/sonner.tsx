'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: '#1a1a1d',
          border: '1px solid #ffffff12',
          color: '#ffffff',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
