import { useEffect, useRef } from "react"
import { projects, studio } from "../data/site"
import { useTitle } from "../useTitle"

const FRAME_COUNT = 891

function frameSrc(index, phone) {
  const folder = phone ? "walk-mobile" : "walk-smooth"
  return `/${folder}/frame-${String(index + 1).padStart(3, "0")}.jpg`
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function phoneView() {
  return window.matchMedia("(max-width: 760px)").matches
}

const stories = [
  { line: "Slowly", image: studio.hero, alt: studio.heroAlt, photo: 0.46, title: 0.12 },
  { line: "The studio", image: studio.about, alt: studio.aboutAlt, photo: 0.32, title: 0.18 },
  { line: "A quiet room", image: projects[2].cover, alt: projects[2].coverAlt, photo: 0.4, title: 0.1 },
  { line: "The kitchen", image: projects[3].cover, alt: projects[3].coverAlt, photo: 0.28, title: 0.16 },
]

export default function Home() {
  useTitle("")
  const reelRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const section = reelRef.current
    const pin = pinRef.current
    const canvas = canvasRef.current
    if (!section || !pin || !canvas) return undefined

    const phone = phoneView()
    const stride = phone ? 2 : 1
    const count = Math.ceil(FRAME_COUNT / stride)
    const maxIndex = count - 1
    const ctx = canvas.getContext("2d", { alpha: false })
    const bitmaps = new Array(count)
    const loading = new Set()
    let queue = []
    let raf = 0
    let ticking = false
    let running = true
    let target = 0
    let shown = 0
    let pinMode = ""
    let last = performance.now()
    const calm = reduced()
    const ahead = phone ? 8 : 18
    const slots = phone ? 3 : 4
    const cache = phone ? 12 : 16
    const decodeWidth = phone ? 420 : 960
    const decodeHeight = Math.round((decodeWidth * 16) / 9)

    const paintCover = (image, alpha) => {
      const width = image.width || image.naturalWidth
      const height = image.height || image.naturalHeight
      if (!width || !height) return
      const scale = Math.max(canvas.width / width, canvas.height / height)
      const dw = width * scale
      const dh = height * scale
      ctx.globalAlpha = alpha
      ctx.drawImage(image, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
    }

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.5)
      const width = Math.round(canvas.clientWidth * dpr)
      const height = Math.round(canvas.clientHeight * dpr)
      if (width < 2 || height < 2) return false
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = phone ? "low" : "medium"
      }
      return true
    }

    const wake = () => {
      if (!running || ticking) return
      ticking = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const decode = (blob) => {
      const options = {
        resizeWidth: decodeWidth,
        resizeHeight: decodeHeight,
        resizeQuality: phone ? "low" : "medium",
      }
      return createImageBitmap(blob, options).catch(() => createImageBitmap(blob))
    }

    const evict = (center) => {
      const held = []
      for (let index = 0; index < count; index += 1) if (bitmaps[index]) held.push(index)
      if (held.length <= cache) return
      held.sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
      for (let index = cache; index < held.length; index += 1) {
        bitmaps[held[index]]?.close?.()
        bitmaps[held[index]] = null
      }
    }

    const store = (index, bitmap) => {
      loading.delete(index)
      if (!running) {
        bitmap?.close?.()
        return
      }
      const previous = bitmaps[index]
      bitmaps[index] = bitmap
      previous?.close?.()
      evict(Math.round(shown * maxIndex))
      wake()
      pump()
    }

    const pump = () => {
      while (loading.size < slots && queue.length) {
        const index = queue.shift()
        if (bitmaps[index] || loading.has(index)) continue
        loading.add(index)
        const url = frameSrc(index * stride, phone)
        if (typeof createImageBitmap === "function") {
          fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error("frame")
              return response.blob()
            })
            .then((blob) => decode(blob))
            .then((bitmap) => store(index, bitmap))
            .catch(() => {
              loading.delete(index)
              pump()
            })
        } else {
          const image = new Image()
          image.onload = () => store(index, image)
          image.onerror = () => {
            loading.delete(index)
            pump()
          }
          image.src = url
        }
      }
    }

    const enqueue = (index) => {
      if (index < 0 || index >= count) return
      if (bitmaps[index] || loading.has(index) || queue.includes(index)) return
      queue.push(index)
    }

    const prioritize = (center, direction) => {
      queue = []
      for (let step = 0; step <= ahead; step += 1) enqueue(center + direction * step)
      enqueue(center - direction)
      pump()
    }

    const nearest = (from, direction) => {
      if (direction < 0) {
        for (let index = from; index >= 0; index -= 1) if (bitmaps[index]) return index
      } else {
        for (let index = from; index < count; index += 1) if (bitmaps[index]) return index
      }
      return -1
    }

    const readyIndex = (desired) => {
      const low = Math.floor(desired)
      const high = Math.min(maxIndex, low + 1)
      if (bitmaps[low] && (high === low || bitmaps[high])) return desired
      let cursor = Math.round(shown * maxIndex)
      if (!bitmaps[cursor]) {
        const back = nearest(cursor, -1)
        const forward = nearest(cursor, 1)
        cursor = back >= 0 ? back : forward
        if (cursor < 0) return shown * maxIndex
      }
      const direction = desired >= cursor ? 1 : -1
      while ((direction > 0 && cursor + direction <= desired) || (direction < 0 && cursor + direction >= desired)) {
        if (!bitmaps[cursor + direction]) break
        cursor += direction
      }
      const next = cursor + direction
      if (bitmaps[cursor] && bitmaps[next] && ((direction > 0 && desired < next) || (direction < 0 && desired > next))) {
        return desired
      }
      return cursor
    }

    const place = (rect, view) => {
      const mode = rect.top > 0 ? "top" : rect.bottom > view ? "fixed" : "bottom"
      if (mode === pinMode) return
      pinMode = mode
      if (mode === "bottom") {
        pin.style.position = "absolute"
        pin.style.top = "auto"
        pin.style.bottom = "0"
      } else {
        pin.style.position = mode === "fixed" ? "fixed" : "absolute"
        pin.style.top = "0"
        pin.style.bottom = "auto"
      }
    }

    const draw = () => {
      if (!sizeCanvas()) return
      const pos = Math.min(maxIndex, Math.max(0, shown * maxIndex))
      const below = nearest(Math.floor(pos), -1)
      if (below < 0) return
      paintCover(bitmaps[below], 1)
      const above = nearest(Math.max(below + 1, Math.ceil(pos)), 1)
      if (above < 0 || above === below) return
      const mix = Math.min(1, Math.max(0, (pos - below) / (above - below)))
      const eased = mix * mix * (3 - 2 * mix)
      if (eased > 0.004) paintCover(bitmaps[above], eased)
    }

    const tick = (now) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016
      last = now
      const rect = section.getBoundingClientRect()
      const view = window.innerHeight || 1
      const total = Math.max(1, section.offsetHeight - view)
      target = Math.min(1, Math.max(0, -rect.top / total))
      const desired = target * maxIndex
      const limit = calm ? desired : readyIndex(desired)
      const capped = limit / maxIndex
      if (calm) shown = capped
      else shown += (capped - shown) * (1 - Math.exp(-(phone ? 14 : 11) * dt))
      if (Math.abs(capped - shown) < 0.00008) shown = capped
      const center = Math.round(shown * maxIndex)
      prioritize(center, desired >= shown * maxIndex ? 1 : -1)
      evict(center)
      place(rect, view)
      const visible = rect.bottom > -40 && rect.top < view + 40
      if (visible) draw()
      if (visible || Math.abs(capped - shown) > 0.00008) raf = requestAnimationFrame(tick)
      else ticking = false
    }

    prioritize(0, 1)
    wake()
    const onScroll = () => wake()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      running = false
      ticking = false
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      bitmaps.forEach((bitmap) => bitmap?.close?.())
    }
  }, [])

  usePageTurn()

  return (
    <>
      <section className="enter-reel" ref={reelRef} data-header="light">
        <div className="enter-reel-pin" ref={pinRef}>
          <canvas ref={canvasRef} className="enter-film" />
          <h1 className="enter-name">
            <span className="rise-mask">
              <span>Siriz</span>
            </span>
            <span className="rise-mask">
              <span>Interiors</span>
            </span>
          </h1>
        </div>
      </section>

      {stories.map((story) => (
        <section className="story" key={story.line}>
          <div className="story-photo">
            <img src={story.image} alt={story.alt} data-parallax={story.photo} />
          </div>
          <h2 data-parallax={story.title}>{story.line}</h2>
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
      if (phoneView() || blocked() || insideReel() || document.documentElement.classList.contains("is-scroll-locked")) return
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
      if (phoneView() || blocked() || insideReel() || document.documentElement.classList.contains("is-scroll-locked")) return
      if (event.cancelable) event.preventDefault()
    }

    const onTouchEnd = (event) => {
      if (phoneView() || blocked() || insideReel()) return
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
