"use client"

import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoGridItemProps {
  title: string
  description: string
  icon: LucideIcon
  className?: string
  highlight?: boolean
}

export function BentoGridItem({
  title,
  description,
  icon: Icon,
  className,
  highlight = false,
}: BentoGridItemProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-[6px] border border-[#ffffff12] bg-[#161618] p-6 transition-colors",
        highlight && "border-[#635BFF]/30 bg-[#161628]",
        className
      )}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-br from-[#635BFF]/5 via-transparent to-transparent"
        )}
      />
      <div className="relative z-10">
        <div
          className={cn(
            "mb-4 inline-flex items-center justify-center rounded-[6px] p-2.5",
            highlight
              ? "bg-[#635BFF]/20 text-[#818CF8]"
              : "bg-[#ffffff08] text-[#a1a1aa]"
          )}
        >
          <Icon className="size-5" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-[#71717a]">{description}</p>
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-gradient-to-r from-transparent via-[#635BFF]/50 to-transparent"
        )}
      />
    </motion.div>
  )
}
