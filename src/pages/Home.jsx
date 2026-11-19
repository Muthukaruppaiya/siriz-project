import { useEffect, useRef } from "react"
import { principles, projects, studio } from "../data/site"
import { useTitle } from "../useTitle"

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

const ROOM_FRAMES = [0, 299, 569, 799]

const ROOM_COPY = [
  null,
  {
    tone: "welcome",
    lines: [
      { kind: "welcome", text: "Welcome to Siriz Interiors" },
      { kind: "tag", text: "Feel your comfort" },
    ],
  },
  {
    tone: "story",
    lines: [
      { kind: "title", text: "About" },
      {
        kind: "body",
        text: "We at Siriz Interiors, with 11 years of solid experience, ensure we consistently exceed our customer's expectations through quality service.",
      },
      {
        kind: "body",
        text: "We provide you with special and unique touches to their interiors and make your dreams come true.",
      },
    ],
  },
  {
    tone: "quote",
    lines: [
      { kind: "title", text: "We design your dream home," },
      { kind: "body", text: "the excellence of interior" },
    ],
  },
]

const pages = [
  {
    kicker: "Siriz",
    title: "Feel your comfort",
    image: studio.hero,
    alt: studio.heroAlt,
    photo: 0.46,
    copy: 0.12,
  },
  {
    kicker: projects[0].title,
    title: "We design your dream home.",
    image: projects[0].cover,
    alt: projects[0].coverAlt,
    photo: 0.32,
    copy: 0.16,
  },
  {
    kicker: principles[0].no,
    title: principles[0].title,
    note: principles[0].body,
    image: projects[1].cover,
    alt: projects[1].coverAlt,
    photo: 0.4,
    copy: 0.1,
  },
  {
    kicker: principles[1].no,
    title: principles[1].title,
    note: principles[1].body,
    image: projects[2].cover,
    alt: projects[2].coverAlt,
    photo: 0.28,
    copy: 0.18,
  },
  {
    kicker: principles[2].no,
    title: principles[2].title,
    note: principles[2].body,
    image: projects[3].cover,
    alt: projects[3].coverAlt,
    photo: 0.38,
    copy: 0.14,
  },
  {
    kicker: "Visit",
    title: "Medavakkam",
    note: studio.location,
    image: studio.about,
    alt: studio.aboutAlt,
    photo: 0.24,
    copy: 0.16,
  },
]

export default function Home() {
  useTitle("")
  const reelRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
  const nameRef = useRef(null)
  const lineRef = useRef(null)

  useEffect(() => {
    const section = reelRef.current
    const pin = pinRef.current
    const canvas = canvasRef.current
    if (!section || !pin || !canvas) return undefined

    const phone = phoneView()
    const step = phone ? 4 : 3
    const ahead = phone ? 20 : 28
    const behind = phone ? 8 : 10
    const slots = phone ? 4 : 6
    const keep = phone ? 48 : 90
    const decodeWidth = phone ? 640 : 1100
    const ctx = canvas.getContext("2d", { alpha: false })
    const bitmaps = new Map()
    const loading = new Set()
    let queue = []
    let planKey = ""
    let raf = 0
    let ticking = false
    let running = true
    let pinMode = ""
    let previous = 0
    const calm = reduced()
    const lastFrame = 890

    const snap = (index) => {
      const clamped = Math.max(0, Math.min(lastFrame, Math.round(index)))
      let best = Math.max(0, Math.min(lastFrame, Math.round(clamped / step) * step))
      ROOM_FRAMES.forEach((room) => {
        if (Math.abs(room - clamped) < Math.abs(best - clamped)) best = room
      })
      return best
    }

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
        ctx.imageSmoothingQuality = "low"
      }
      return true
    }

    const wake = () => {
      if (!running || ticking) return
      ticking = true
      raf = requestAnimationFrame(tick)
    }

    const evict = (center) => {
      const held = [...bitmaps.keys()]
      if (held.length <= keep) return
      held.sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
      held.slice(keep).forEach((frame) => {
        bitmaps.get(frame)?.close?.()
        bitmaps.delete(frame)
      })
    }

    const store = (frame, bitmap) => {
      loading.delete(frame)
      if (!running) {
        bitmap?.close?.()
        return
      }
      const previous = bitmaps.get(frame)
      bitmaps.set(frame, bitmap)
      previous?.close?.()
      wake()
      pump()
    }

    const pump = () => {
      while (loading.size < slots && queue.length) {
        const frame = queue.shift()
        if (bitmaps.has(frame) || loading.has(frame)) continue
        loading.add(frame)
        const url = frameSrc(frame, phone)
        if (typeof createImageBitmap === "function") {
          fetch(url, { cache: "force-cache" })
            .then((response) => {
              if (!response.ok) throw new Error("frame")
              return response.blob()
            })
            .then((blob) =>
              createImageBitmap(blob, { resizeWidth: decodeWidth, resizeQuality: "low" }).catch(() => createImageBitmap(blob))
            )
            .then((bitmap) => store(frame, bitmap))
            .catch(() => {
              loading.delete(frame)
              pump()
            })
        } else {
          const image = new Image()
          image.onload = () => store(frame, image)
          image.onerror = () => {
            loading.delete(frame)
            pump()
          }
          image.src = url
        }
      }
    }

    const enqueue = (index) => {
      const frame = snap(index)
      if (bitmaps.has(frame) || loading.has(frame) || queue.includes(frame)) return
      queue.push(frame)
    }

    const prioritize = (center, direction) => {
      const key = `${snap(center)}:${direction}`
      if (key === planKey) {
        pump()
        return
      }
      planKey = key
      queue = []
      for (let jump = 0; jump <= ahead; jump += 1) enqueue(center + direction * jump * step)
      for (let jump = 1; jump <= behind; jump += 1) enqueue(center - direction * jump * step)
      ROOM_FRAMES.forEach((room) => {
        if (Math.abs(room - center) < step * 4) enqueue(room)
      })
      pump()
    }

    for (let frame = 0; frame <= step * 8; frame += step) enqueue(frame)
    ROOM_FRAMES.forEach((room) => enqueue(room))
    pump()

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

    const nearest = (frame, direction) => {
      for (let jump = 0; jump <= 4; jump += 1) {
        const index = snap(frame + direction * jump * step)
        const bitmap = bitmaps.get(index)
        if (bitmap) return { index, bitmap }
      }
      return null
    }

    const draw = (frame) => {
      if (!sizeCanvas()) return
      const current = nearest(frame, -1)
      if (!current) return
      paintCover(current.bitmap, 1)
      const next = nearest(frame + step, 1)
      if (!next || next.index === current.index) return
      const gap = next.index - current.index
      if (gap <= 0 || gap > step * 1.6) return
      const mix = Math.min(1, Math.max(0, (frame - current.index) / gap))
      if (mix > 0.02) paintCover(next.bitmap, mix)
    }

    const tick = () => {
      if (!running) return
      const rect = section.getBoundingClientRect()
      const view = window.innerHeight || 1
      const total = Math.max(1, section.offsetHeight - view)
      const target = Math.min(1, Math.max(0, -rect.top / total))
      const pos = target * (ROOM_FRAMES.length - 1)
      const span = Math.min(ROOM_FRAMES.length - 2, Math.floor(pos))
      const along = Math.min(1, Math.max(0, pos - span))
      const room = Math.round(pos)
      const settled = Math.abs(pos - room) < 0.06
      const parked = target >= 0.992
      const frame = calm || parked
        ? ROOM_FRAMES[parked ? ROOM_FRAMES.length - 1 : room]
        : ROOM_FRAMES[span] + (ROOM_FRAMES[span + 1] - ROOM_FRAMES[span]) * along
      const direction = target + 0.001 < previous ? -1 : 1
      previous = target
      prioritize(frame, direction)
      evict(frame)
      if (parked) {
        pin.style.position = "absolute"
        pin.style.top = "auto"
        pin.style.bottom = "0"
        pinMode = "end"
      } else place(rect, view)
      const visible = rect.bottom > -40 && rect.top < view + 40
      if (visible) draw(frame)
      canvas.classList.toggle("is-held", settled)
      const line = lineRef.current
      if (line) {
        const copy = settled && room > 0 ? ROOM_COPY[room] : null
        if (copy && line.dataset.room !== String(room)) {
          line.dataset.room = String(room)
          line.className = `room-copy is-${copy.tone}`
          line.replaceChildren()
          copy.lines.forEach((item) => {
            const mask = document.createElement("span")
            mask.className = `rise-line ${item.kind}`
            const inner = document.createElement("span")
            inner.textContent = item.text
            mask.appendChild(inner)
            line.appendChild(mask)
          })
          void line.offsetWidth
          line.classList.add("is-on")
        } else if (!copy && line.dataset.room) {
          line.dataset.room = ""
          line.classList.remove("is-on")
        }
      }
      nameRef.current?.classList.toggle("is-quiet", pos > 0.12)
      if (visible) raf = requestAnimationFrame(tick)
      else ticking = false
    }

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
  useCurvedReveal()

  return (
    <>
      <section className="enter-reel" ref={reelRef} data-header="light">
        <div className="enter-reel-pin" ref={pinRef}>
          <canvas ref={canvasRef} className="enter-film" />
          <h1 className="enter-name" ref={nameRef}>
            <span className="rise-mask">
              <span>Siriz</span>
            </span>
            <span className="rise-mask">
              <span>Interiors</span>
            </span>
          </h1>
          <div className="room-copy" ref={lineRef} />
        </div>
      </section>

      {pages.map((page, index) => (
        <section className={`turn-page${index === 4 ? " is-curve" : ""}`} key={page.title} data-header="light">
          <div className="turn-photo">
            <img src={page.image} alt={page.alt} data-parallax={page.photo} />
          </div>
          <div className="turn-copy" data-parallax={page.copy}>
            <p className="kicker">{page.kicker}</p>
            <h2>{page.title}</h2>
            {page.note ? <p>{page.note}</p> : null}
          </div>
        </section>
      ))}
    </>
  )
}

function useCurvedReveal() {
  useEffect(() => {
    const curve = document.querySelector(".turn-page.is-curve")
    const previous = curve?.previousElementSibling
    if (!curve || !previous || reduced()) return undefined

    let frame = 0
    const place = () => {
      const view = window.innerHeight || 1
      const top = curve.getBoundingClientRect().top
      const entering = top > 0 && top < view
      if (!entering) {
        curve.style.borderRadius = ""
        previous.style.transform = ""
        previous.style.zIndex = ""
        curve.style.zIndex = ""
        delete previous.dataset.pinShift
        return
      }
      const shift = Number(previous.dataset.pinShift || 0)
      const naturalTop = previous.getBoundingClientRect().top - shift
      const nextShift = -naturalTop
      previous.dataset.pinShift = String(nextShift)
      previous.style.transform = `translateY(${nextShift}px)`
      previous.style.zIndex = "1"
      curve.style.zIndex = "2"
      const open = 1 - top / view
      const radius = 58 * (1 - open)
      curve.style.borderRadius = `${radius}% ${radius}% 0 0`
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    place()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      curve.style.borderRadius = ""
      previous.style.transform = ""
      previous.style.zIndex = ""
      curve.style.zIndex = ""
    }
  }, [])
}

function usePageTurn() {
  useEffect(() => {
    if (reduced()) return undefined
    let animating = false
    let touchY = 0
    let armed = false

    const pages = () =>
      [...document.querySelectorAll("main section"), document.querySelector(".site-footer")].filter(Boolean)

    const reelRange = () => {
      const reel = document.querySelector(".enter-reel")
      const view = window.innerHeight || 1
      if (!reel) return { start: 0, end: 0 }
      return { start: reel.offsetTop, end: reel.offsetTop + reel.offsetHeight - view }
    }

    const insideReel = (direction) => {
      const points = roomStops()
      const last = points[points.length - 1] || 0
      const y = window.scrollY
      if (direction < 0) {
        const nextPage = [...document.querySelectorAll("main section")].find((el) => !el.classList.contains("enter-reel"))
        const limit = nextPage ? nextPage.offsetTop + 8 : last
        return y > 24 && y <= Math.max(last + 24, limit)
      }
      return y + 2 < last
    }

    const roomStops = () => {
      const { start, end } = reelRange()
      return [0, 1, 2, 3].map((step) => Math.round(start + ((end - start) * step) / 3))
    }

    const stops = () => {
      const view = window.innerHeight || 1
      const points = [0]
      pages().forEach((el) => {
        if (el.classList.contains("enter-reel")) return
        const top = el.offsetTop
        const height = el.offsetHeight
        points.push(top)
        if (el.classList.contains("turn-page")) return
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

    const glide = (top, duration = 1080) => {
      const start = window.scrollY
      const change = top - start
      if (Math.abs(change) < 2) return
      animating = true
      const began = performance.now()
      const ease = duration > 1400 ? (t) => t : duration < 700 ? (t) => 1 - (1 - t) ** 2 : (t) => 1 - (1 - t) ** 4
      const step = (now) => {
        const progress = Math.min(1, (now - began) / duration)
        window.scrollTo(0, start + change * ease(progress))
        if (progress < 1) requestAnimationFrame(step)
        else animating = false
      }
      requestAnimationFrame(step)
    }

    const goRoom = (direction) => {
      if (animating) return
      const points = roomStops()
      const y = window.scrollY
      if (direction > 0) {
        const next = points.find((point) => point > y + 16)
        if (next != null) glide(next, 2700)
      } else {
        const prev = [...points].reverse().find((point) => point < y - 16)
        if (prev != null) glide(prev, 2700)
      }
    }

    const go = (direction) => {
      if (animating || insideReel(direction)) return
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
    const locked = () => document.documentElement.classList.contains("is-scroll-locked")

    const onWheel = (event) => {
      if (blocked() || locked()) return
      const wheelDirection = event.deltaY > 0 ? 1 : -1
      if (insideReel(wheelDirection)) {
        if (Math.abs(event.deltaY) < 6) return
        event.preventDefault()
        if (animating || armed) return
        armed = true
        goRoom(wheelDirection)
        window.setTimeout(() => {
          armed = false
        }, 2850)
        return
      }
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
      if (blocked() || locked()) return
      if (event.target.closest(".bot-panel, .bot-stage, .menu")) return
      if (event.cancelable) event.preventDefault()
    }

    const onTouchEnd = (event) => {
      if (blocked()) return
      if (event.target.closest(".bot-panel, .bot-stage, .menu")) return
      const delta = touchY - event.changedTouches[0].clientY
      if (Math.abs(delta) < 28) return
      const touchDirection = delta > 0 ? 1 : -1
      if (insideReel(touchDirection)) {
        goRoom(touchDirection)
        return
      }
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
