import { useEffect, useRef } from "react"
import { useTitle } from "../useTitle"


const ENTER_FRAMES = 240

function enterFrameSrc(index) {
  return `/enter-frames/frame-${String(index + 1).padStart(3, "0")}.jpg`
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function Home() {
  useTitle("")
  const reelRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const section = reelRef.current
    const pin = pinRef.current
    const canvas = canvasRef.current
    if (!section || !pin || !canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    const images = new Array(ENTER_FRAMES)
    let frame = 0
    let running = true
    let target = 0
    let shown = 0
    let sized = false
    let cursor = 0
    let pumpTimer = 0
    const calm = reduced()

    const loadFrame = (index) => {
      if (index < 0 || index >= ENTER_FRAMES || images[index]) return
      const image = new Image()
      image.decoding = "async"
      image.src = enterFrameSrc(index)
      images[index] = image
    }

    const pump = () => {
      if (!running) return
      const pos = Math.round(target * (ENTER_FRAMES - 1))
      for (let index = pos - 1; index <= pos + 4; index += 1) loadFrame(index)
      loadFrame(cursor)
      cursor += 1
      if (cursor < ENTER_FRAMES) pumpTimer = window.setTimeout(pump, 12)
    }
    pump()

    const place = () => {
      const rect = section.getBoundingClientRect()
      const view = window.innerHeight || 1
      if (rect.top > 0) {
        pin.style.position = "absolute"
        pin.style.top = "0"
        pin.style.bottom = "auto"
      } else if (rect.bottom > view) {
        pin.style.position = "fixed"
        pin.style.top = "0"
        pin.style.bottom = "auto"
      } else {
        pin.style.position = "absolute"
        pin.style.top = "auto"
        pin.style.bottom = "0"
      }
    }

    const draw = (progress) => {
      const max = ENTER_FRAMES - 1
      const pos = Math.min(max, Math.max(0, progress * max))
      const index = Math.floor(pos)
      const mix = pos - index
      const current = images[index]
      const next = images[Math.min(max, index + 1)]
      if (!current?.complete || !current.naturalWidth) return
      if (!sized) {
        canvas.width = current.naturalWidth
        canvas.height = current.naturalHeight
        canvas.style.opacity = "1"
        sized = true
      }
      ctx.globalAlpha = 1
      ctx.drawImage(current, 0, 0, canvas.width, canvas.height)
      if (next && next !== current && next.complete && next.naturalWidth && mix > 0.001) {
        ctx.globalAlpha = mix
        ctx.drawImage(next, 0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
      }
    }

    const tick = () => {
      if (!running) return
      const rect = section.getBoundingClientRect()
      const total = Math.max(1, section.offsetHeight - window.innerHeight)
      const scrolled = Math.min(total, Math.max(0, -rect.top))
      target = scrolled / total
      shown += (target - shown) * (calm ? 1 : 0.22)
      if (Math.abs(target - shown) < 0.0004) shown = target
      place()
      draw(shown)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      window.clearTimeout(pumpTimer)
      cancelAnimationFrame(frame)
    }
  }, [])

  usePageTurn()

  return (
    <>
      <section className="enter-reel" ref={reelRef} data-header="light">
        <div className="enter-reel-pin" ref={pinRef}>
          <img className="enter-poster" src={enterFrameSrc(0)} alt="" />
          <canvas ref={canvasRef} />
        </div>
      </section>

      {["Slowly", "The studio", "A quiet room", "The kitchen"].map((line) => (
        <section className="test-page" key={line}>
          <p data-parallax="0.18">{line}</p>
        </section>
      ))}
    </>
  )
}

function usePageTurn() {
  useEffect(() => {
    if (reduced()) return undefined
    let animating = false
    let touchY = 0
    let armed = false

    const pages = () =>
      [...document.querySelectorAll("main section"), document.querySelector(".site-footer")].filter(Boolean)

    const insideReel = () => {
      const reel = document.querySelector(".enter-reel")
      if (!reel) return false
      return window.scrollY + 4 < reel.offsetTop + reel.offsetHeight - window.innerHeight
    }

    const stops = () => {
      const view = window.innerHeight || 1
      const points = [0]
      pages().forEach((el) => {
        if (el.classList.contains("enter-reel")) return
        const top = el.offsetTop
        const height = el.offsetHeight
        points.push(top)
        if (height > view + 48) {
          const last = top + height - view
          let y = top + view
          while (y < last - 24) {
            points.push(y)
            y += view
          }
          points.push(last)
        }
      })
      const max = Math.max(0, document.documentElement.scrollHeight - view)
      points.push(max)
      return [...new Set(points.map((point) => Math.round(point)))].sort((a, b) => a - b)
    }

    const glide = (top) => {
      const start = window.scrollY
      const change = top - start
      if (Math.abs(change) < 2) return
      animating = true
      const began = performance.now()
      const duration = 1080
      const ease = (t) => 1 - (1 - t) ** 4
      const step = (now) => {
        const progress = Math.min(1, (now - began) / duration)
        window.scrollTo(0, start + change * ease(progress))
        if (progress < 1) requestAnimationFrame(step)
        else animating = false
      }
      requestAnimationFrame(step)
    }

    const go = (direction) => {
      if (animating || insideReel()) return
      const points = stops()
      const y = window.scrollY
      if (direction > 0) {
        const next = points.find((point) => point > y + 16)
        if (next != null) glide(next)
      } else {
        const prev = [...points].reverse().find((point) => point < y - 16)
        if (prev != null) glide(prev)
      }
    }

    const blocked = () => document.querySelector(".menu.is-open")

    const onWheel = (event) => {
      if (blocked() || insideReel() || document.documentElement.classList.contains("is-scroll-locked")) return
      if (Math.abs(event.deltaY) < 6) return
      event.preventDefault()
      if (animating || armed) return
      armed = true
      go(event.deltaY > 0 ? 1 : -1)
      window.setTimeout(() => {
        armed = false
      }, 1120)
    }

    const onTouchStart = (event) => {
      touchY = event.touches[0].clientY
    }

    const onTouchMove = (event) => {
      if (blocked() || insideReel() || document.documentElement.classList.contains("is-scroll-locked")) return
      if (event.cancelable) event.preventDefault()
    }

    const onTouchEnd = (event) => {
      if (blocked() || insideReel()) return
      const delta = touchY - event.changedTouches[0].clientY
      if (Math.abs(delta) < 28) return
      go(delta > 0 ? 1 : -1)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [])
}
