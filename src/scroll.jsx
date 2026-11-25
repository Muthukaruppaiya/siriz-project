import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import Lenis from "lenis"

const ScrollContext = createContext(null)

let lenisInstance = null
const guards = new Set()

/** The live Lenis instance, or null when motion is reduced or not mounted yet. */
export function getLenis() {
  return lenisInstance
}

/**
 * Register a function that may veto Lenis for a wheel or touch gesture.
 * Return false to let the caller handle that gesture itself.
 */
export function addScrollGuard(fn) {
  guards.add(fn)
  return () => guards.delete(fn)
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Expo-out: quick to respond, long soft landing. */
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t))

export function SmoothScroll({ children }) {
  const subs = useRef(new Set())
  const locks = useRef(0)
  const emitRef = useRef(() => {})

  const api = useMemo(
    () => ({
      subscribe(fn) {
        subs.current.add(fn)
        fn(window.scrollY)
        return () => subs.current.delete(fn)
      },
      stop() {
        locks.current += 1
        if (locks.current !== 1) return
        lenisInstance?.stop()
        const y = window.scrollY
        document.body.dataset.scrollY = String(y)
        document.body.style.top = `-${y}px`
        document.documentElement.classList.add("is-scroll-locked")
      },
      start() {
        locks.current = Math.max(0, locks.current - 1)
        if (locks.current !== 0) return
        const y = Number(document.body.dataset.scrollY || 0)
        document.documentElement.classList.remove("is-scroll-locked")
        document.body.style.top = ""
        window.scrollTo(0, y)
        lenisInstance?.scrollTo(y, { immediate: true, force: true })
        lenisInstance?.start()
      },
      scrollTo(target, options = {}) {
        const lenis = lenisInstance
        if (lenis) {
          lenis.scrollTo(target, { duration: 1.4, easing: easeOutExpo, force: true, ...options })
        } else {
          const top = typeof target === "number" ? target : 0
          window.scrollTo(0, top)
        }
        emitRef.current()
      },
    }),
    []
  )

  useEffect(() => {
    const emit = () => {
      const y = window.scrollY
      subs.current.forEach((fn) => {
        try {
          fn(y)
        } catch (error) {
          console.error(error)
        }
      })
    }
    emitRef.current = emit

    let lenis = null
    let raf = 0
    if (!reduced()) {
      lenis = new Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        prevent: (node) => Boolean(node.closest?.("[data-lenis-prevent], .bot-panel, .work-pop, .menu")),
        virtualScroll: (data) => {
          const root = document.documentElement
          if (root.classList.contains("is-intro") || root.classList.contains("is-scroll-locked")) return false
          for (const guard of guards) {
            if (guard(data) === false) return false
          }
          return true
        },
      })
      lenisInstance = lenis
      const loop = (time) => {
        lenis.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    emit()
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        emit()
      })
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      document.documentElement.classList.remove("is-scroll-locked")
      lenis?.destroy()
      if (lenisInstance === lenis) lenisInstance = null
    }
  }, [])

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>
}

export function useSmooth() {
  const api = useContext(ScrollContext)
  if (!api) throw new Error("useSmooth must be used within SmoothScroll")
  return api
}

export function useScrollFrame(callback) {
  const api = useSmooth()
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => api.subscribe((y) => ref.current(y)), [api])
}

/**
 * Adds `is-in` to every `[data-reveal]` element once it scrolls into view.
 * Elements can stagger with style="--d: 0.2s".
 */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef?.current || document
    const items = [...root.querySelectorAll("[data-reveal]")]
    if (!items.length) return undefined
    if (reduced()) {
      items.forEach((item) => item.classList.add("is-in"))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("is-in")
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [rootRef])
}
