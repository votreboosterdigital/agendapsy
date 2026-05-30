"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Testimonial {
  quote: string
  name: string
  title: string
}

interface InfiniteMovingCardsProps {
  items: Testimonial[]
  direction?: "left" | "right"
  speed?: "fast" | "normal" | "slow"
  className?: string
}

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "normal",
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const [ready, setReady] = useState(false)

  const durationMap = {
    fast: "20s",
    normal: "40s",
    slow: "60s",
  }

  useEffect(() => {
    if (!scrollerRef.current || prefersReducedMotion) {
      setReady(true)
      return
    }
    const scroller = scrollerRef.current
    const items = Array.from(scroller.children)
    items.forEach((item) => {
      const clone = item.cloneNode(true)
      scroller.appendChild(clone)
    })
    setReady(true)
  }, [prefersReducedMotion])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={
        ready && !prefersReducedMotion
          ? ({
              "--animation-duration": durationMap[speed],
              "--animation-direction":
                direction === "left" ? "normal" : "reverse",
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0F0F11] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0F0F11] to-transparent" />
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 gap-4 py-4",
          ready &&
            !prefersReducedMotion &&
            "animate-[scroll_var(--animation-duration)_linear_infinite_var(--animation-direction)]",
          prefersReducedMotion && "flex-wrap justify-center"
        )}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            className="relative w-[320px] shrink-0 rounded-[6px] border border-[#ffffff12] bg-[#161618] px-6 py-5"
          >
            <blockquote>
              <p className="mb-4 text-sm leading-relaxed text-[#a1a1aa]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-[#71717a]">{item.title}</p>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  )
}
