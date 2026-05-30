"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  color: string
  duration: number
  delay: number
}

interface SparklesCoreProps {
  className?: string
  particleCount?: number
  colors?: string[]
}

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.6 + 0.1,
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 4,
  }))
}

export function SparklesCore({
  className,
  particleCount = 80,
  colors = ["#635BFF", "#818CF8", "#A78BFA", "#C4B5FD", "#ffffff"],
}: SparklesCoreProps) {
  const prefersReducedMotion = useReducedMotion()
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    setParticles(generateParticles(particleCount, colors))
  }, [particleCount, colors])

  if (prefersReducedMotion) {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity * 0.5,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            opacity: [0, p.opacity, 0],
            scale: [0, 1, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
