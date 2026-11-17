import { useEffect, useRef, useState } from "react"
import { useScrollFrame } from "../scroll"

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ParallaxImage({ src, alt, className = "", speed = 0.22, priority = false }) {
  const frameRef = useRef(null)
  const imgRef = useRef(null)

  useScrollFrame(() => {
    const frame = frameRef.current
    const image = imgRef.current
    if (!frame || !image) return
    if (reduced()) {
      image.style.transform = "none"
      return
    }
    const rect = frame.getBoundingClientRect()
    const view = window.innerHeight || 1
    if (rect.bottom < -view * 0.25 || rect.top > view * 1.25) return
    const progress = (view - rect.top) / (view + rect.height)
    const damp = window.innerWidth < 800 ? 0.72 : 1
    const travel = rect.height * 0.22 * damp * (speed / 0.22)
    const shift = (progress - 0.5) * travel
    image.style.transform = `translate3d(0, ${shift}px, 0) scale(1.06)`
  })

  return (
    <div className={`parallax ${className}`} ref={frameRef}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
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
  useScrollFrame(() => {
    if (reduced()) return
    const view = window.innerHeight || 1
    const damp = window.innerWidth < 800 ? 0.7 : 1
    document.querySelectorAll(".band-copy, .page-hero-copy").forEach((el) => {
      const parent = el.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      if (rect.bottom < -80 || rect.top > view + 80) return
      const progress = (view - rect.top) / (view + rect.height)
      const shift = (0.5 - progress) * Math.min(110, rect.height * 0.14) * damp
      el.style.transform = `translate3d(0, ${shift}px, 0)`
    })
    document.querySelectorAll(".masonry-item").forEach((frame, index) => {
      const rect = frame.getBoundingClientRect()
      if (rect.bottom < -80 || rect.top > view + 80) return
      const progress = (view - rect.top) / (view + rect.height)
      const depth = index % 3 === 0 ? 0.16 : index % 3 === 1 ? 0.08 : 0.22
      const shift = (progress - 0.5) * rect.height * depth * damp
      frame.style.setProperty("--py", `${shift}px`)
    })
  })
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
