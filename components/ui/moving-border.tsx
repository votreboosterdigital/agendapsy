"use client"

import { useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MovingBorderButtonProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  borderClassName?: string
  duration?: number
  as?: React.ElementType
  onClick?: () => void
  href?: string
  type?: "button" | "submit" | "reset"
}

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 3000,
  as: Component = "button",
  ...props
}: MovingBorderButtonProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <Component
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-[6px] p-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F11] cursor-pointer",
        containerClassName
      )}
      {...props}
    >
      {prefersReducedMotion ? (
        <span className="absolute inset-0 rounded-[6px] bg-gradient-to-r from-[#635BFF] via-[#818CF8] to-[#4F46E5]" />
      ) : (
        <motion.span
          className={cn(
            "absolute inset-[-1000%] rounded-[6px]",
            borderClassName
          )}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #635BFF 20%, #818CF8 40%, #C4B5FD 60%, transparent 80%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: duration / 1000,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      <span
        className={cn(
          "relative z-10 inline-flex h-full w-full items-center justify-center gap-2 rounded-[5px] bg-[#0F0F11] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#161618]",
          className
        )}
      >
        {children}
      </span>
    </Component>
  )
}
