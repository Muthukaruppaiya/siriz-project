import { createContext, useContext, useEffect, useMemo, useRef } from "react"

const ScrollContext = createContext(null)

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
      },
      scrollTo(target) {
        const top = typeof target === "number" ? target : 0
        window.scrollTo(0, top)
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
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      document.documentElement.classList.remove("is-scroll-locked")
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
