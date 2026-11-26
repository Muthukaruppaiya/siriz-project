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

// ---------- remember where the visitor was, so a refresh keeps them there ----------
const MEMORY_KEY = "siriz-scroll"

function isReload() {
  const nav = performance.getEntriesByType?.("navigation")?.[0]
  return nav ? nav.type === "reload" : performance.navigation?.type === 1
}

/** True while a saved position is waiting to be restored after a reload. */
export const restoringScroll = { pending: typeof window !== "undefined" && isReload() && Boolean(sessionStorage.getItem(MEMORY_KEY)) }

function sections() {
  return [...document.querySelectorAll("main section, footer.site-footer")]
}

// Save the section the page is in and how far through it, not the raw pixel
// offset: section heights are set by script, so this survives small changes.
function savePosition() {
  if (restoringScroll.pending) return
  const y = window.scrollY
  const list = sections()
  let index = -1
  list.forEach((el, i) => {
    if (el.offsetTop <= y + 2) index = i
  })
  const el = list[index]
  const record = el
    ? { index, ratio: (y - el.offsetTop) / Math.max(1, el.offsetHeight), y }
    : { index: -1, ratio: 0, y }
  try {
    sessionStorage.setItem(MEMORY_KEY, JSON.stringify(record))
  } catch {
    /* storage can be full or blocked; the page just starts at the top then */
  }
}

function savedTarget() {
  try {
    const record = JSON.parse(sessionStorage.getItem(MEMORY_KEY) || "null")
    if (!record) return null
    const el = sections()[record.index]
    const y = el ? el.offsetTop + record.ratio * el.offsetHeight : record.y
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    return Math.round(Math.min(max, Math.max(0, y)))
  } catch {
    return null
  }
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
    let saveTimer = 0
    const schedule = () => {
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(savePosition, 160)
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        emit()
      })
    }
    window.addEventListener("pagehide", savePosition)

    // After a reload, wait for the sections to size themselves and the fonts
    // to settle, then jump straight back to where the visitor was.
    let restoreFrame = 0
    let restoreTimer = 0
    const reveal = () => {
      const root = document.documentElement
      if (!root.classList.contains("is-restoring")) return
      root.classList.remove("is-restoring")
      root.classList.add("is-restored")
    }
    if (!restoringScroll.pending) reveal()
    if (restoringScroll.pending) {
      const apply = () => {
        const y = savedTarget()
        if (y != null) {
          window.scrollTo(0, y)
          lenis?.scrollTo(y, { immediate: true, force: true })
        }
        restoringScroll.pending = false
        emit()
        // let the sections draw at the restored place, then show the page
        restoreFrame = requestAnimationFrame(() => {
          restoreFrame = requestAnimationFrame(reveal)
        })
        // a second, late pass in case images or fonts shifted the layout
        restoreTimer = window.setTimeout(() => {
          const again = savedTarget()
          if (again != null && Math.abs(again - window.scrollY) > 4) {
            window.scrollTo(0, again)
            lenis?.scrollTo(again, { immediate: true, force: true })
            emit()
          }
        }, 450)
      }
      const settle = () => {
        restoreFrame = requestAnimationFrame(() => {
          restoreFrame = requestAnimationFrame(apply)
        })
      }
      const ready = document.fonts?.ready
      if (ready && ready.then) ready.then(settle)
      else settle()
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(restoreFrame)
      window.clearTimeout(restoreTimer)
      window.clearTimeout(saveTimer)
      window.removeEventListener("pagehide", savePosition)
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
