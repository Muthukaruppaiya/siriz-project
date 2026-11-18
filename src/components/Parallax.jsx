import { useEffect, useRef, useState } from "react"
import { useScrollFrame } from "../scroll"

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ParallaxImage({ src, alt, className = "", speed = 0.22, priority = false }) {
  return (
    <div className={`parallax ${className}`}>
      <img
        src={src}
        alt={alt}
        data-parallax={speed}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
      />
    </div>
  )
}

export function Drift({ speed = 0.12, className = "", children }) {
  const ref = useRef(null)
  useScrollFrame(() => {
    const el = ref.current
    if (!el || reduced()) return
    const rect = el.getBoundingClientRect()
    const view = window.innerHeight || 1
    if (rect.bottom < -80 || rect.top > view + 80) return
    const delta = (rect.top + rect.height / 2 - view / 2) / view
    const damp = window.innerWidth < 800 ? 0.7 : 1
    el.style.transform = `translate3d(0, ${delta * speed * -220 * damp}px, 0)`
  })
  return (
    <span ref={ref} className={`drift ${className}`}>
      {children}
    </span>
  )
}

export function ParallaxLayers() {
  const shown = useRef(new WeakMap())

  useEffect(() => {
    let frame = 0
    let running = true

    const tick = () => {
      if (!running) return
      if (!reduced()) {
        const view = window.innerHeight || 1
        const damp = window.innerWidth < 800 ? 0.82 : 1
        document.querySelectorAll("[data-parallax]").forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (rect.bottom < -view * 0.35 || rect.top > view * 1.35) return
          const speed = Number(el.getAttribute("data-parallax")) || 0.16
          const progress = (rect.top + rect.height / 2 - view / 2) / view
          const target = progress * speed * -360 * damp
          const prev = shown.current.get(el) || 0
          const next = prev + (target - prev) * 0.14
          shown.current.set(el, next)
          el.style.transform = `translate3d(0, ${next.toFixed(2)}px, 0)`
        })
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}

export function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (reduced()) {
      setOn(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.16 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${on ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
