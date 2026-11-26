import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import ProcessRoom from "../components/ProcessRoom"
import RoomView from "../components/RoomView"
import { projects, studio } from "../data/site"
import { addScrollGuard, easeOutExpo, getLenis, useReveal, useSmooth } from "../scroll"
import { useTitle } from "../useTitle"

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const ROOM_TIMES = [0, 299 / 60, 569 / 60, 799 / 60]
const PLAY_RATE = 1.6

// The first step (door to the first room) is the longest stretch of film, so it
// plays faster to keep the opening scroll snappy.
const FIRST_STEP_BOOST = 1.5

function playRate(from = -1, to = -1) {
  const base = window.matchMedia("(max-width: 760px)").matches ? 2.25 : PLAY_RATE
  return Math.min(from, to) === 0 && Math.max(from, to) === 1 ? base * FIRST_STEP_BOOST : base
}

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

function pad(value) {
  return String(value).padStart(2, "0")
}

export default function Home() {
  useTitle("")
  const reelRef = useRef(null)
  const pinRef = useRef(null)
  const videoRef = useRef(null)
  const backRef = useRef(null)
  const transportRef = useRef(null)
  const nameRef = useRef(null)
  const lineRef = useRef(null)

  useEffect(() => {
    const section = reelRef.current
    const pin = pinRef.current
    const video = videoRef.current
    const back = backRef.current
    if (!section || !pin || !video || !back) return undefined

    let raf = 0
    let ticking = false
    let running = true
    let pinMode = ""
    let playToken = 0
    const calm = reduced()

    const prepare = (clip) => {
      clip.muted = true
      clip.playsInline = true
      clip.preload = "auto"
    }
    prepare(video)
    back.preload = "metadata"
    back.style.opacity = "0"

    const showForward = () => {
      video.style.opacity = "1"
      back.style.opacity = "0"
    }

    const wake = () => {
      if (!running || ticking) return
      ticking = true
      raf = requestAnimationFrame(tick)
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

    const finish = (clip, end, token, done) => {
      const began = performance.now()
      const step = () => {
        if (!running || token !== playToken) return
        const arrived = performance.now() - began > 90 && clip.currentTime >= end - 0.04
        if (arrived || clip.ended) {
          clip.pause()
          if (Number.isFinite(end)) clip.currentTime = end
          clip.dataset.playing = ""
          done()
          wake()
          return
        }
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    const hasRange = (clip, start, end) => {
      try {
        for (let index = 0; index < clip.buffered.length; index += 1) {
          if (clip.buffered.start(index) <= start + 0.2 && clip.buffered.end(index) >= end - 0.08) return true
        }
      } catch {
        return false
      }
      return false
    }

    const waitReady = (clip, start, end) => new Promise((resolve) => {
      if (clip.readyState >= 4 || (clip.readyState >= 3 && hasRange(clip, start, end))) {
        resolve()
        return
      }
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clip.removeEventListener("progress", check)
        clip.removeEventListener("canplay", check)
        resolve()
      }
      const check = () => {
        if (hasRange(clip, start, end) || clip.readyState >= 4) finish()
      }
      clip.addEventListener("progress", check)
      clip.addEventListener("canplay", check)
      window.setTimeout(finish, 420)
    })

    const begin = (clip, start, end, token, done, rate = playRate()) => {
      clip.dataset.playing = "1"
      clip.playbackRate = rate
      if (Math.abs(clip.currentTime - start) > 0.08) clip.currentTime = start
      const pending = clip.play()
      if (pending && pending.then) {
        pending.then(() => {
          clip.playbackRate = rate
        }).catch(() => {
          if (token !== playToken) return
          clip.pause()
          clip.dataset.playing = ""
          clip.currentTime = end
          done()
          wake()
        })
      }
      finish(clip, end, token, done)
    }

    transportRef.current = {
      async move(from, to) {
        const forwardStart = ROOM_TIMES[from]
        const forwardEnd = ROOM_TIMES[to]
        const rate = playRate(from, to)
        const duration = (Math.abs(forwardEnd - forwardStart) / rate) * 1000
        const token = ++playToken
        video.pause()
        back.pause()
        if (calm) {
          video.currentTime = forwardEnd
          showForward()
          return duration
        }
        if (to > from) {
          showForward()
          await waitReady(video, forwardStart, forwardEnd)
          if (token !== playToken) return duration
          begin(video, forwardStart, forwardEnd, token, showForward, rate)
          return duration
        }
        const length = back.duration || video.duration || 14.93
        const backStart = Math.max(0, length - forwardStart)
        const backEnd = Math.max(0, length - forwardEnd)
        video.style.opacity = "0"
        back.style.opacity = "1"
        await waitReady(back, backStart, backEnd)
        if (token !== playToken) return duration
        begin(back, backStart, backEnd, token, () => {
          const reveal = () => showForward()
          if (Math.abs(video.currentTime - forwardEnd) < 0.08) {
            reveal()
            return
          }
          video.addEventListener("seeked", reveal, { once: true })
          video.currentTime = forwardEnd
        }, rate)
        return duration
      },
      holdDoor() {
        playToken += 1
        video.pause()
        back.pause()
        video.dataset.playing = ""
        back.dataset.playing = ""
        if (video.currentTime > 0.08) video.currentTime = 0
        showForward()
      },
      parkEnd() {
        playToken += 1
        video.pause()
        back.pause()
        video.dataset.playing = ""
        back.dataset.playing = ""
        const end = ROOM_TIMES[ROOM_TIMES.length - 1]
        if (Math.abs(video.currentTime - end) > 0.08) video.currentTime = end
        showForward()
      },
    }

    const tick = () => {
      if (!running) return
      const rect = section.getBoundingClientRect()
      const view = window.innerHeight || 1
      const total = Math.max(1, section.offsetHeight - view)
      // The on-screen rect decides where the picture is pinned. While the portfolio's
      // curved reveal slides over this section it pins the section with a transform,
      // so the rect reads as "top of the reel" then: the room, the copy and the frame
      // must come from the real scroll position instead.
      const target = Math.min(1, Math.max(0, -rect.top / total))
      const pos = clamp((window.scrollY - section.offsetTop) / total) * (ROOM_TIMES.length - 1)
      const room = Math.round(pos)
      const settled = Math.abs(pos - room) < 0.06
      const parked = target >= 0.992
      const playing = video.dataset.playing === "1" || back.dataset.playing === "1"
      if (parked) {
        pin.style.position = "absolute"
        pin.style.top = "auto"
        pin.style.bottom = "0"
        pinMode = "end"
      } else place(rect, view)
      const visible = rect.bottom > -40 && rect.top < view + 40
      const held = settled && !playing
      // After a jump (back to top, scrollbar drag) keep the frame in step with the room.
      if (held && !video.seeking && Math.abs(video.currentTime - ROOM_TIMES[room]) > 0.15) {
        video.currentTime = ROOM_TIMES[room]
        showForward()
      }
      video.classList.toggle("is-held", held)
      back.classList.toggle("is-held", held)
      const line = lineRef.current
      if (line) {
        const copy = held && room > 0 ? ROOM_COPY[room] : null
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

    const prime = () => {
      const pending = video.play()
      if (pending && pending.then) {
        pending.then(() => {
          if (video.dataset.playing === "1") return
          video.pause()
        }).catch(() => {})
      }
    }
    video.addEventListener("canplay", prime, { once: true })
    wake()
    const onScroll = () => wake()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      running = false
      ticking = false
      playToken += 1
      cancelAnimationFrame(raf)
      video.removeEventListener("canplay", prime)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      video.pause()
      back.pause()
    }
  }, [])

  usePageTurn(transportRef)
  useCurvedReveal()
  useReveal()

  return (
    <>
      <section className="enter-reel" id="home" ref={reelRef} data-header="light" data-tone="photo">
        <div className="enter-reel-pin" ref={pinRef}>
          <video ref={videoRef} className="enter-film" src="/walk.mp4" poster="/walk-mobile/frame-001.jpg" muted playsInline preload="auto" />
          <video ref={backRef} className="enter-film is-back" src="/walk-back.mp4" muted playsInline preload="metadata" />
          <div className="enter-name" ref={nameRef}>
            <h1 aria-label="Siriz Interiors">
              <span className="rise-mask">
                <span>Siriz</span>
              </span>
              <span className="rise-mask">
                <span>Interiors</span>
              </span>
            </h1>
          </div>
          <div className="room-copy" ref={lineRef} />
        </div>
      </section>

      <PortfolioStage />
      <WhyPage />
      <CyclePage />
      <RecognitionPage />
    </>
  )
}

const WHY_LEFT = [
  {
    title: "The lowest price in the market",
    body: "Best quality and Unique interior styles at justified prices.",
    mark: <path d="M7 3h10v18l-5-4-5 4z" />,
  },
  {
    title: "10 years of warranty",
    body: "Warranty can be claimed for the wooden work from the dedicated customer login.",
    mark: <><circle cx="12" cy="9" r="5.5" /><path d="M8.6 13.6 7 21l5-3 5 3-1.6-7.4" /></>,
  },
  {
    title: "Customer-friendly experience",
    body: "Personalized assistance and suggestions will be provided with the customer's requirements.",
    mark: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  },
  {
    title: "45 days of guaranteed delivery",
    body: "Our company ensures on-time delivery for each & every project.",
    mark: <><path d="M2 6h11v10H2zM13 10h5l3 3v3h-8z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  },
]

const WHY_RIGHT = [
  {
    title: "Dedicated customer login portal",
    body: "Shows your interior work progress, designs, and payment details just in one login.",
    mark: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  },
  {
    title: "Innovation +",
    body: "Professionals in Unique interior designs with innovative ideas.",
    mark: <path d="m5 12.5 4.5 4.5L19 7" />,
  },
  {
    title: "Space planning designs",
    body: "Functional designs & ideas will be executed by our experts.",
    mark: <><path d="M4 20 14 10" /><path d="M16 3v4M14 5h4M20 10v4M18 12h4M9 4v2" /></>,
  },
  {
    title: "Post Installation services",
    body: "Provides warranty with lifetime services",
    mark: <path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8" />,
  },
]

const WHY_GEMS = [
  { src: "/why/why-1.webp", place: "t" },
  { src: "/why/why-2.webp", place: "l" },
  { src: "/why/why-3.webp", place: "r" },
  { src: "/why/why-4.webp", place: "b" },
]

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function rise(start, end, value) {
  const t = clamp((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

// Each reason is shown as a real interior material swatch, chosen to suit it.
const WHY_MATERIALS = [
  { key: "oak", name: "Oak", finish: "Laminate" },
  { key: "teak", name: "Teak", finish: "Veneer" },
  { key: "linen", name: "Linen", finish: "Weave" },
  { key: "brass", name: "Brass", finish: "Brushed" },
  { key: "glass", name: "Glass", finish: "Frosted" },
  { key: "terrazzo", name: "Terrazzo", finish: "Chip" },
  { key: "blueprint", name: "Blueprint", finish: "Plan" },
  { key: "marble", name: "Marble", finish: "Carrara" },
]

function WhyContent({ face = false }) {
  // Both copies use the same tags so they rise together. The face copy is what
  // shows through the letters; it is aria-hidden and inert.
  const reasons = [...WHY_LEFT, ...WHY_RIGHT]
  return (
    <div className="mb-wrap" data-face={face ? "true" : undefined}>
      <div className="mb-ruler" aria-hidden="true" />
      <header className="mb-head">
        <div className="mb-head-main">
          <p className="mb-kicker">The Siriz material board</p>
          <h2 className="mb-title">Why <em>Siriz Interiors</em></h2>
        </div>
        <div className="mb-head-side">
          <q className="mb-quote">We Design your Dream Home, the excellence of interior</q>
          <p className="mb-lede">
            Siriz Interiors provides a full range of planning and turnkey fit-out services in the interior industry.
          </p>
          <p className="mb-legend">
            <span>8 reasons</span><i /><span>8 materials</span><i /><span>1 studio</span>
          </p>
        </div>
      </header>
      <div className="mb-gallery">
        {projects.slice(0, 4).map((project) => (
          <figure className="mb-photo" key={project.slug}>
            <img src={project.cover} alt={project.coverAlt} loading="lazy" draggable={false} />
            <figcaption>{project.title}<small>{project.typology}</small></figcaption>
          </figure>
        ))}
      </div>
      <div className="mb-list">
        {reasons.map((item, index) => {
          const material = WHY_MATERIALS[index]
          return (
            <article className={`mb-swatch is-${material.key}`} key={item.title}>
              <div className="mb-chip">
                <span className="mb-name">{material.name}<small>{material.finish}</small></span>
                <span className="mb-no">{pad(index + 1)}</span>
              </div>
              <div className="mb-info">
                <span className="mb-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24">{item.mark}</svg>
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          )
        })}
      </div>
      <p className="mb-foot">Siriz Interiors · Feel your comfort</p>
    </div>
  )
}

/**
 * "Why Siriz Interiors": one scroll dives into the gold "I" of SIRIZ. The page
 * waits inside the letters (a copy sits under the multiply mask, so it only
 * shows through the letter shapes), grows with the zoom until it fills the
 * screen, then the real page takes over at the same spot.
 */
function WhyPage() {
  const rootRef = useRef(null)
  const pinRef = useRef(null)
  const stageRef = useRef(null)
  const lineRef = useRef(null)
  const letterRef = useRef(null)
  const maskRef = useRef(null)
  const statsRef = useRef(null)
  const hintRef = useRef(null)
  const glowRef = useRef(null)
  const auraRef = useRef(null)
  const faceRef = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const line = lineRef.current
    const letter = letterRef.current
    const sheet = sheetRef.current
    if (!root || !stage || !line || !letter || !sheet) return undefined
    const still = reduced()
    if (still) root.classList.add("is-still")
    const metrics = { dx: 0, dy: 0, smax: 6, cover: 0.9 }
    let frame = 0

    // Measure the ink of the "I" in the real font: the width of its stem, its
    // height, and where its ink sits inside the letter box. The zoom must make
    // the stem cover the whole screen before the letters are faded away,
    // otherwise the edges of the letter show as grey bands.
    const inkOfI = (font) => {
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      ctx.font = font
      ctx.fillStyle = "#000"
      ctx.textBaseline = "alphabetic"
      const base = 300
      ctx.fillText("I", 100, base)
      const m = ctx.measureText("I")
      const ascent = m.actualBoundingBoxAscent || 140
      const row = Math.round(base - ascent / 2)
      const data = ctx.getImageData(0, row, 400, 1).data
      let left = -1
      let right = -1
      for (let x = 0; x < 400; x += 1) {
        if (data[x * 4 + 3] > 128) {
          if (left < 0) left = x
          right = x
        }
      }
      const stem = left < 0 ? m.width * 0.25 : right - left + 1
      const inkCenter = left < 0 ? 100 + m.width / 2 : (left + right) / 2
      return {
        stem: stem / 200,
        height: ascent / 200,
        shiftX: (inkCenter - (100 + m.width / 2)) / 200,
        fontAscent: (m.fontBoundingBoxAscent || ascent * 1.25) / 200,
      }
    }

    const measure = () => {
      const view = window.innerHeight || 1
      if (pinRef.current) pinRef.current.style.height = still ? `${view}px` : `${view * 3}px`
      line.style.transform = "none"
      line.style.fontSize = "100px"
      const box = line.getBoundingClientRect()
      const size = 100 * Math.min((stage.clientWidth * 0.86) / box.width, (stage.clientHeight * 0.5) / box.height)
      line.style.fontSize = `${size}px`
      const stageBox = stage.getBoundingClientRect()
      const lineBox = line.getBoundingClientRect()
      const letterBox = letter.getBoundingClientRect()
      const tracking = parseFloat(getComputedStyle(letter).letterSpacing) || 0
      const style = getComputedStyle(letter)
      const ink = inkOfI(`${style.fontStyle} ${style.fontWeight} 200px ${style.fontFamily}`)
      // Aim at the middle of the stem's ink, not the middle of the letter box.
      const originX = letterBox.left - lineBox.left + (letterBox.width - tracking) / 2 + ink.shiftX * size
      const originY = letterBox.top - lineBox.top + (ink.fontAscent - ink.height / 2) * size
      metrics.dx = stage.clientWidth / 2 - (lineBox.left - stageBox.left + originX)
      metrics.dy = stage.clientHeight / 2 - (lineBox.top - stageBox.top + originY)
      // Scale at which the stem alone covers the screen. The 30% margin absorbs
      // sub-pixel aim error (measured at about 5% of the stem width).
      const cover = Math.max(stage.clientWidth / (size * ink.stem), stage.clientHeight / (size * ink.height)) * 1.3
      metrics.smax = cover * 1.35
      metrics.cover = Math.pow(Math.log(cover) / Math.log(metrics.smax), 1 / 1.6)
      line.style.transformOrigin = `${originX}px ${originY}px`
    }

    const draw = () => {
      if (still) return
      const view = stage.clientHeight || window.innerHeight || 1
      const local = window.scrollY - root.offsetTop
      const t = clamp(local / (2 * view))
      const scale = Math.exp(Math.log(metrics.smax) * Math.pow(t, 1.6))
      const weight = rise(0, 0.9, t)
      const tilt = -3 * Math.sin(Math.PI * clamp(t / 0.6))
      line.style.transform = `translate(${metrics.dx * weight}px, ${metrics.dy * weight}px) rotate(${tilt}deg) scale(${scale})`
      // Gold letters first, then the page shows inside them as we dive in.
      if (faceRef.current) faceRef.current.style.opacity = String(rise(0.22, 0.62, t))
      // Only drop the letters once the "I" fills the screen: no grey bands.
      if (maskRef.current) maskRef.current.style.opacity = String(1 - rise(metrics.cover, Math.min(0.975, metrics.cover + 0.035), t))
      if (auraRef.current) auraRef.current.style.opacity = String(1 - rise(0, 0.35, t))
      const fade = rise(0, 0.14, t)
      if (statsRef.current) {
        statsRef.current.style.opacity = String(1 - fade)
        statsRef.current.style.transform = `translateY(${fade * 34}px)`
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - rise(0, 0.05, t))
      if (glowRef.current) glowRef.current.style.transform = `scale(${1 + 0.14 * t}) translate3d(${-3 * t}%, 0, 0)`
      // The real page sits under the pinned letters until it reaches the top,
      // exactly where the copy inside the letter is, then comes to the front.
      const open = local >= 2 * view - 2
      root.classList.toggle("is-open", open)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }

    const relayout = () => {
      measure()
      draw()
    }
    measure()
    draw()
    const ready = document.fonts?.ready
    if (ready && ready.then) ready.then(relayout)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", relayout)
    // Follow Lenis inside its own frame so the swap lands on the same frame.
    let unhook = null
    let hookFrame = 0
    const hook = () => {
      const lenis = getLenis()
      if (lenis) unhook = lenis.on("scroll", draw)
      else if (!still) hookFrame = requestAnimationFrame(hook)
    }
    hook()
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(hookFrame)
      unhook?.()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", relayout)
    }
  }, [])

  return (
    <section className="why-story" id="why" ref={rootRef} aria-label="Why Siriz">
      <div className="why-pin" ref={pinRef}>
        <div className="why-stage" ref={stageRef} data-tone="dark">
          <div className="why-glow" ref={glowRef} />
          <div className="why-shade" />
          <div className="why-sheet is-face" ref={faceRef} aria-hidden="true" inert="">
            <WhyContent face />
          </div>
          <div className="why-mask" ref={maskRef}>
            <h2 className="why-line" ref={lineRef} aria-label="Why Siriz Interiors">
              <span>Why S<span ref={letterRef}>I</span>riz</span>
              <span>Interiors</span>
            </h2>
          </div>
          <div className="why-aura" ref={auraRef} aria-hidden="true" />
          <div className="why-stats" ref={statsRef}>
            <p><b>10 yrs</b><span>Warranty on wood work</span></p>
            <p><b>45 days</b><span>Guaranteed delivery</span></p>
            <p><b>Lifetime</b><span>Post-installation service</span></p>
            <p><b>1 login</b><span>Progress, designs, payments</span></p>
          </div>
          <p className="why-cue" ref={hintRef}>Scroll</p>
        </div>
      </div>
      <div className="why-sheet" ref={sheetRef} data-tone="dark">
        <WhyContent />
      </div>
    </section>
  )
}

const CYCLE = [
  {
    n: "1",
    color: "#8d9094",
    title: "Meet a designer",
    body: "Speak to our professional designer to plan & design your home.",
  },
  {
    n: "2",
    color: "#3cb54a",
    title: "Let's start designing",
    body: "Your Dream Home will be designed with the discussion and our architect's suggestion.",
  },
  {
    n: "3",
    color: "#7b4ea3",
    title: "View designs in 3D",
    body: "Discussed designs will be projected for your view.",
  },
  {
    n: "4",
    color: "#e6b325",
    title: "Plan",
    body: "Scheduling the production & execution process of interior work.",
  },
  {
    n: "5",
    color: "#e23b32",
    title: "Production begins at our factory",
    body: "Will commence the work of finalised materials.",
  },
  {
    n: "6",
    color: "#f47b20",
    title: "Move-in",
    body: "No more waiting to feel the comfort of your dream Home. Let's Move in.",
  },
]

// Work Process: a small isometric room that builds itself, one stage per step.
// x runs to the lower right, y to the lower left, z up; units are roughly 40 cm.
const ISO_U = 16
const ISO_CX = 200
const ISO_CY = 150
const ROOM = { w: 10, d: 10, h: 6.5 }
function iso(x, y, z = 0) {
  return `${(ISO_CX + (x - y) * 0.866 * ISO_U).toFixed(1)},${(ISO_CY + (x + y) * 0.5 * ISO_U - z * ISO_U).toFixed(1)}`
}
function poly(...points) {
  return points.map((point) => iso(...point)).join(" ")
}

function IsoBox({ x, y, z = 0, w, d, h, className = "" }) {
  return (
    <g className={`iso-box ${className}`}>
      <polygon className="f-y" points={poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} />
      <polygon className="f-x" points={poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} />
      <polygon className="f-top" points={poly([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} />
    </g>
  )
}

function RoomScene({ step }) {
  const on = (index) => (step >= index ? "is-on" : "")
  const furniture = step >= 4 ? "is-solid" : step >= 2 ? "is-wire" : ""
  const { w, d, h } = ROOM
  const grid = []
  for (let i = 1; i < 10; i += 1) {
    grid.push(<line key={`gx${i}`} x1={iso(i, 0).split(",")[0]} y1={iso(i, 0).split(",")[1]} x2={iso(i, d).split(",")[0]} y2={iso(i, d).split(",")[1]} />)
    grid.push(<line key={`gy${i}`} x1={iso(0, i).split(",")[0]} y1={iso(0, i).split(",")[1]} x2={iso(w, i).split(",")[0]} y2={iso(w, i).split(",")[1]} />)
  }
  const [lampX, lampY] = iso(5.4, 5.6, 4.3).split(",").map(Number)
  const [poolX, poolY] = iso(5.4, 5.6, 0).split(",").map(Number)
  const [plantX, plantY] = iso(8.85, 1.65, 1.1).split(",").map(Number)
  return (
    <svg className="wp-scene" viewBox="18 4 376 320" role="img" aria-label="A room being designed, planned, built and lived in">
      <defs>
        <radialGradient id="wp-pool">
          <stop offset="0" stopColor="#ffd88a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wp-bulb">
          <stop offset="0" stopColor="#fff2c8" stopOpacity="1" />
          <stop offset="0.35" stopColor="#ffd27a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1 · Meet a designer: the plan is sketched on the floor */}
      <g className={`wp-plan ${on(0)}`}>
        <g className="wp-grid">{grid}</g>
        <polygon className="wp-outline" pathLength="1" points={poly([0, 0], [w, 0], [w, d], [0, d])} />
        <polyline className="wp-dim" points={poly([0, d + 0.9], [w, d + 0.9])} />
        <polyline className="wp-dim" points={poly([w + 0.9, 0], [w + 0.9, d])} />
      </g>

      {/* 2 · Start designing: floor and walls go up, with a window and a door */}
      <g className={`wp-shell ${on(1)}`}>
        <polygon className="wp-floor" points={poly([0, 0], [w, 0], [w, d], [0, d])} />
        <g className="wp-rise">
          <polygon className="wp-wall wp-wall-l" points={poly([0, 0, 0], [0, d, 0], [0, d, h], [0, 0, h])} />
          <polygon className="wp-wall wp-wall-r" points={poly([0, 0, 0], [w, 0, 0], [w, 0, h], [0, 0, h])} />
          <polygon className="wp-window" points={poly([0, 3.6, 3], [0, 6.8, 3], [0, 6.8, 5.3], [0, 3.6, 5.3])} />
          <polyline className="wp-mullion" points={poly([0, 5.2, 3], [0, 5.2, 5.3])} />
          <polygon className="wp-door" points={poly([7.9, 0, 0], [9.4, 0, 0], [9.4, 0, 4.4], [7.9, 0, 4.4])} />
        </g>
      </g>

      {/* 5 · Move-in, part one: rug and light pool sit under the furniture */}
      <g className={`wp-life wp-life-floor ${on(5)}`}>
        <polygon className="wp-rug" points={poly([3.4, 3.7, 0.02], [7.4, 3.7, 0.02], [7.4, 8.2, 0.02], [3.4, 8.2, 0.02])} />
        <ellipse className="wp-pool" cx={poolX} cy={poolY} rx="96" ry="50" fill="url(#wp-pool)" />
      </g>

      {/* 3 · View in 3D (wireframe), 5 · Production (real materials drop in) */}
      <g className={`wp-furniture ${furniture}`}>
        <g className="wp-piece" style={{ "--i": 0 }}><IsoBox x={0.2} y={0.2} w={2.4} d={1.1} h={5.2} className="m-wood" /></g>
        <g className="wp-piece" style={{ "--i": 1 }}>
          <IsoBox x={3.2} y={0.2} w={4.2} d={1} h={1.1} className="m-wood-dark" />
          <polygon className="m-screen" points={poly([3.8, 0.06, 2], [6.8, 0.06, 2], [6.8, 0.06, 3.9], [3.8, 0.06, 3.9])} />
        </g>
        <g className="wp-piece" style={{ "--i": 2 }}>
          <IsoBox x={0.2} y={2.8} w={0.7} d={4.6} h={2.3} className="m-fabric" />
          <IsoBox x={0.2} y={2.6} w={2.6} d={0.5} h={1.6} className="m-fabric" />
          <IsoBox x={0.9} y={3.1} w={1.9} d={4.1} h={1.1} className="m-fabric-light" />
          <IsoBox x={0.2} y={7.2} w={2.6} d={0.5} h={1.6} className="m-fabric" />
        </g>
        <g className="wp-piece" style={{ "--i": 3 }}><IsoBox x={4.4} y={4.6} w={2.2} d={2.6} h={0.8} className="m-marble" /></g>
      </g>

      {/* 6 · Move-in: plant, pendant light on, window glow */}
      <g className={`wp-life ${on(5)}`}>
        <IsoBox x={8.4} y={1.2} w={0.9} d={0.9} h={0.9} className="m-pot" />
        <g className="wp-plant">
          <ellipse cx={plantX} cy={plantY} rx="13" ry="16" />
          <ellipse cx={plantX - 10} cy={plantY + 6} rx="9" ry="12" />
          <ellipse cx={plantX + 10} cy={plantY + 4} rx="9" ry="12" />
        </g>
        <line className="wp-cord" x1={lampX} y1={lampY - 36} x2={lampX} y2={lampY - 6} />
        <circle className="wp-glow" cx={lampX} cy={lampY + 4} r="46" fill="url(#wp-bulb)" />
        <polygon className="wp-shade" points={`${lampX - 11},${lampY + 4} ${lampX + 11},${lampY + 4} ${lampX + 5},${lampY - 7} ${lampX - 5},${lampY - 7}`} />
      </g>

      {/* 4 · Plan: the schedule card fills in */}
      <g className={`wp-schedule ${on(3)}`}>
        <rect className="wp-card" x="262" y="14" width="126" height="84" rx="8" />
        <text x="274" y="32">Schedule</text>
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <rect className="wp-track" x="274" y={42 + row * 13} width="100" height="6" rx="3" />
            <rect className="wp-bar" x={274 + row * 14} y={42 + row * 13} width={44 + (row % 2) * 12} height="6" rx="3" style={{ "--i": row }} />
          </g>
        ))}
      </g>

      {/* 1 · Meet a designer: the first conversation */}
      <g className={`wp-talk ${step === 0 ? "is-on" : ""}`}>
        <rect x="24" y="22" width="92" height="28" rx="14" />
        <circle cx="44" cy="36" r="3" /><circle cx="56" cy="36" r="3" /><circle cx="68" cy="36" r="3" />
        <rect x="60" y="58" width="72" height="24" rx="12" className="is-you" />
      </g>
    </svg>
  )
}

function CyclePage() {
  const rootRef = useRef(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const sticky = root.querySelector(".cycle-sticky")
    let frame = 0
    let lastY = window.scrollY
    const place = () => {
      const view = window.innerHeight || 1
      root.style.height = `${view * (1 + CYCLE.length * 0.75)}px`
      if (sticky) sticky.style.height = `${view}px`
      const span = Math.max(1, root.offsetHeight - view)
      const y = window.scrollY
      const progress = Math.min(1, Math.max(0, (y - root.offsetTop) / span))
      const step = progress * CYCLE.length
      const down = y >= lastY
      lastY = y
      root.style.setProperty("--p", String(Math.min(1, step / CYCLE.length)))
      const next = down
        ? (step < 0.08 ? -1 : Math.min(CYCLE.length - 1, Math.floor(step + 0.92) - 1))
        : Math.min(CYCLE.length - 1, Math.floor(step + 0.08) - 1)
      setActive((current) => (current === next ? current : next))
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }
    place()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  const open = (index) => {
    const root = rootRef.current
    if (!root) return
    const view = window.innerHeight || 1
    const span = Math.max(1, root.offsetHeight - view)
    const top = root.offsetTop + ((index + 1) / CYCLE.length) * span
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(top, { duration: 1.2, easing: easeOutExpo, force: true })
    else window.scrollTo({ top, behavior: "smooth" })
  }

  const current = active >= 0 ? CYCLE[active] : null
  // The colour story: blueprint while designing, workshop while building, golden at home.
  const phase = active >= 5 ? "home" : active >= 3 ? "build" : "design"

  return (
    <section className="cycle-page" id="process" ref={rootRef} aria-label="Work process" data-tone="dark" data-phase={phase}>
      <div className="cycle-sticky">
        <div className="wp-layout">
          <div className="wp-copy">
            <p className="cycle-kicker" data-reveal>How we work · Six steps</p>
            <h2 className="cycle-title" data-reveal style={{ "--d": "0.08s" }}>Work Process</h2>
            <ol className="wp-steps">
              {CYCLE.map((item, index) => (
                <li key={item.n}>
                  <button
                    type="button"
                    className={index === active ? "is-on" : index < active ? "is-done" : ""}
                    style={{ "--ink": item.color }}
                    onClick={() => open(index)}
                    aria-current={index === active ? "step" : undefined}
                  >
                    <b>{pad(item.n)}</b>
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="wp-detail" aria-live="polite">
              {current ? (
                <div className="wp-card-text" key={active} style={{ "--ink": current.color }}>
                  <span>{`Step ${current.n} of ${CYCLE.length}`}</span>
                  <strong>{current.title}</strong>
                  <p>{current.body}</p>
                </div>
              ) : (
                <div className="wp-card-text" key="intro">
                  <span>From first meeting to move-in</span>
                  <strong>Watch a room come together.</strong>
                  <p>Scroll and watch the room get planned, drawn, built and lived in, one step at a time.</p>
                </div>
              )}
            </div>
          </div>
          <div className="wp-stage">
            <ProcessRoom step={active} fallback={<RoomScene step={active} />} />
            <div className="wp-dots" aria-hidden="true">
              {CYCLE.map((item, index) => (
                <i key={item.n} className={index <= active ? "is-on" : ""} style={{ "--ink": item.color }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const AWARDS = [
  {
    color: "#c8624a",
    tag: "Award night",
    title: "On stage, 2023",
    summary: "The Great Indian Startup Awards",
    code: "GIA · 2023",
    image: "/awards/award-1.jpg",
    facts: [
      ["Event", "The Great Indian Entrepreneurship, Business, Design & Startup Awards 2023"],
      ["Presented by", "Beginup Research Intelligence Pvt Ltd, Bengaluru"],
      ["Moment", "Siriz Interiors receiving its recognition on stage"],
    ],
  },
  {
    color: "#d9a441",
    tag: "Trophy",
    title: "The Great Indian trophy",
    summary: "Siriz Interiors Private Limited",
    code: "GIA · 2023",
    image: "/awards/award-2.jpg",
    facts: [
      ["Awarded to", "Siriz Interiors Private Limited"],
      ["Event", "The Great Indian Entrepreneurship, Business, Design & Startup Awards 2023"],
      ["Presented by", "Beginup Research Intelligence Pvt Ltd"],
    ],
  },
  {
    color: "#5a79b0",
    tag: "Certificate · Goa",
    title: "Trendsetter Interior Design Awards",
    summary: "Excellent & Creative Interior Design Firm of the Year 2023, Tamil Nadu",
    code: "GOA · 2023",
    image: "/awards/award-3.jpg",
    facts: [
      ["Category", "Residential & Commercial Projects"],
      ["Presented to", "Siriz Interiors Private Limited · Mohamed Rizwan"],
      ["When & where", "25 Nov 2023 · Hyatt Centric Candolim, Goa"],
      ["Signed", "Mr. Anand Gopal Naik, Managing Director"],
    ],
  },
  {
    color: "#8a5a8f",
    tag: "Certificate · Bengaluru",
    title: "Great Indian Design & Start-up Awards",
    summary: "Outstanding & Rising Interior Design Firm of the Year 2023, Tamil Nadu",
    code: "BLR · 2023",
    image: "/awards/award-4.jpg",
    facts: [
      ["Category", "Residential Projects"],
      ["Presented to", "Siriz Interiors Private Limited · Mohamed Rizwan"],
      ["When & where", "30 Oct 2023 · The Taj West End, Bengaluru"],
      ["Edition", "National Edition 2023"],
    ],
  },
]

function RecognitionPage() {
  const railRef = useRef(null)
  const trackRef = useRef(null)
  const moveRef = useRef(null)
  const [flipped, setFlipped] = useState(() => AWARDS.map(() => false))

  // The rail drifts left on its own; drag, swipe, a sideways trackpad scroll or
  // the arrow buttons move it either way, and a fling eases back into the drift.
  useEffect(() => {
    const rail = railRef.current
    const track = trackRef.current
    if (!rail || !track) return undefined
    const calm = reduced()
    let width = track.scrollWidth / 2
    let offset = 0
    let velocity = 0
    let hover = false
    let visible = true
    let drag = null
    let slide = null
    let suppress = false
    let frame = 0
    let last = 0

    const drift = () => (calm ? 0 : -width / 34)
    const wrap = (value) => {
      if (!width) return value
      let next = value % width
      if (next > 0) next -= width
      return next
    }
    const paint = () => {
      track.style.transform = `translate3d(${wrap(offset).toFixed(2)}px, 0, 0)`
    }

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      if (slide) {
        const done = Math.min(1, (now - slide.start) / slide.time)
        offset = slide.from + (slide.to - slide.from) * (1 - (1 - done) ** 3)
        if (done >= 1) {
          slide = null
          velocity = 0
          offset = wrap(offset)
        }
      } else if (!drag) {
        const target = hover || rail.contains(document.activeElement) ? 0 : drift()
        velocity += (target - velocity) * Math.min(1, dt * 2.2)
        offset = wrap(offset + velocity * dt)
      }
      paint()
      if (visible) frame = requestAnimationFrame(step)
      else frame = 0
    }
    const wake = () => {
      if (frame || !visible) return
      last = performance.now()
      frame = requestAnimationFrame(step)
    }

    const slot = () => track.querySelector(".award-slot")?.offsetWidth || 250
    moveRef.current = (direction) => {
      const size = slot()
      const from = slide ? slide.to : offset
      const to = Math.round((from - direction * size) / size) * size
      if (calm) {
        offset = wrap(to)
        paint()
        return
      }
      slide = { from: offset, to, start: performance.now(), time: 520 }
      wake()
    }

    const onDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return
      drag = { id: event.pointerId, lastX: event.clientX, lastT: performance.now(), moved: 0, speed: 0, held: false }
      slide = null
    }
    const onMove = (event) => {
      if (!drag || event.pointerId !== drag.id) return
      const now = performance.now()
      const dx = event.clientX - drag.lastX
      drag.moved += Math.abs(dx)
      if (drag.moved > 6 && !drag.held) {
        drag.held = true
        rail.setPointerCapture?.(event.pointerId)
        rail.classList.add("is-dragging")
      }
      offset += dx
      drag.speed = drag.speed * 0.6 + (dx / Math.max(1, now - drag.lastT)) * 1000 * 0.4
      drag.lastX = event.clientX
      drag.lastT = now
      paint()
    }
    const onUp = (event) => {
      if (!drag || event.pointerId !== drag.id) return
      if (drag.held) {
        velocity = Math.max(-2600, Math.min(2600, drag.speed))
        suppress = true
        window.setTimeout(() => {
          suppress = false
        }, 60)
      }
      drag = null
      rail.classList.remove("is-dragging")
      wake()
    }
    // A drag must not also turn the badge it started on.
    const onClick = (event) => {
      if (!suppress) return
      event.preventDefault()
      event.stopPropagation()
    }
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      slide = null
      velocity = 0
      offset -= event.deltaX
      paint()
      wake()
    }
    const onEnter = (event) => {
      if (event.pointerType === "mouse") hover = true
    }
    const onLeave = () => {
      hover = false
    }
    const onResize = () => {
      width = track.scrollWidth / 2
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      wake()
    })
    observer.observe(rail)
    rail.addEventListener("pointerdown", onDown)
    rail.addEventListener("pointermove", onMove)
    rail.addEventListener("pointerup", onUp)
    rail.addEventListener("pointercancel", onUp)
    rail.addEventListener("click", onClick, true)
    rail.addEventListener("wheel", onWheel, { passive: false })
    rail.addEventListener("pointerenter", onEnter)
    rail.addEventListener("pointerleave", onLeave)
    window.addEventListener("resize", onResize)
    paint()
    wake()
    return () => {
      visible = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      moveRef.current = null
      rail.removeEventListener("pointerdown", onDown)
      rail.removeEventListener("pointermove", onMove)
      rail.removeEventListener("pointerup", onUp)
      rail.removeEventListener("pointercancel", onUp)
      rail.removeEventListener("click", onClick, true)
      rail.removeEventListener("wheel", onWheel)
      rail.removeEventListener("pointerenter", onEnter)
      rail.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail || reduced()) return undefined
    const items = [...rail.querySelectorAll(".award-swing")].map((el, index) => ({
      el,
      slot: el.parentElement,
      a: 0,
      v: 0,
      index,
    }))
    let lastX = null
    let last = 0
    let visible = true
    let frame = 0

    const nudge = (event) => {
      const box = event.currentTarget.getBoundingClientRect()
      const item = items.find((entry) => entry.slot === event.currentTarget)
      if (!item) return
      item.v += (box.left + box.width / 2 < event.clientX ? 1 : -1) * 0.35
    }

    const onMove = (event) => {
      const rect = rail.getBoundingClientRect()
      const dx = lastX == null ? 0 : event.clientX - lastX
      lastX = event.clientX
      if (event.clientY - rect.top > 230 && !event.target.closest(".award-card")) return
      const softened = event.target.closest(".award-card") ? 0.4 : 1
      items.forEach((item) => {
        const box = item.slot.getBoundingClientRect()
        const center = box.left + box.width / 2
        const reach = Math.exp(-((((event.clientX - center) / 130) ** 2)))
        item.v += dx * reach * 0.02 * softened
      })
    }

    const step = (now) => {
      if (!visible) return
      const dt = Math.min((now - last) / 1000 || 0.016, 0.04)
      last = now
      items.forEach((item) => {
        item.v += (-18 * item.a - 1.7 * item.v) * dt
        item.a += item.v * dt
        item.a = Math.max(-0.55, Math.min(0.55, item.a))
        item.el.style.transform = `rotate(${(item.a * 57.3).toFixed(2)}deg)`
      })
      frame = requestAnimationFrame(step)
    }

    const onLeave = () => {
      lastX = null
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) {
        last = 0
        frame = requestAnimationFrame(step)
      }
    })
    observer.observe(rail)
    rail.addEventListener("pointermove", onMove)
    rail.addEventListener("pointerleave", onLeave)
    items.forEach((item) => item.slot.addEventListener("pointerenter", nudge))
    const timers = items.map((item, index) => window.setTimeout(() => {
      item.v += (index % 2 ? -1 : 1) * 1.3
    }, 500 + index * 160))
    frame = requestAnimationFrame(step)

    return () => {
      visible = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      rail.removeEventListener("pointermove", onMove)
      rail.removeEventListener("pointerleave", onLeave)
      items.forEach((item) => item.slot.removeEventListener("pointerenter", nudge))
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const turn = (index) => {
    setFlipped((current) => current.map((open, item) => (item === index ? !open : open)))
  }

  return (
    <section className="award-page" id="recognition" aria-label="Recognition" data-tone="dark">
      <p className="award-kicker" data-reveal>Recognition · Four honours</p>
      <h2 className="award-title" data-reveal style={{ "--d": "0.08s" }}>Recognised for the rooms we build.</h2>
      <div className="award-rail" ref={railRef}>
        <div className="award-track" ref={trackRef}>
        {[0, 1].map((copy) => (
          <div className="award-set" key={copy} aria-hidden={copy === 1 || undefined}>
          {AWARDS.map((award, index) => (
          <div className="award-slot" key={`${copy}-${award.tag}`} style={{ "--c": award.color }}>
            <i className="award-ring" />
            <div className="award-swing">
              <div className="award-strap" />
              <div className="award-clip" />
              <button
                type="button"
                className={flipped[index] ? "award-card is-flipped" : "award-card"}
                aria-pressed={flipped[index]}
                tabIndex={copy === 1 ? -1 : 0}
                aria-label={`Turn badge over: ${award.title}`}
                onClick={() => turn(index)}
              >
                <span className="award-in">
                  <span className="award-face award-front">
                    <span className="award-band"><span>{award.tag}</span><span>2023</span></span>
                    <span className="award-pic"><img src={award.image} alt="" draggable={false} /></span>
                    <span className="award-copy">
                      <strong>{award.title}</strong>
                      <em>{award.summary}</em>
                    </span>
                    <span className="award-foot">Siriz Interiors · {award.code}</span>
                  </span>
                  <span className="award-face award-back">
                    <span className="award-band"><span>Details</span><span>2023</span></span>
                    <span className="award-body">
                      <strong>{award.title}</strong>
                      <dl>
                        {award.facts.map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </span>
                    <span className="award-foot">Click to turn back</span>
                  </span>
                </span>
              </button>
            </div>
          </div>
          ))}
          </div>
        ))}
        </div>
      </div>
      <div className="award-controls" data-reveal style={{ "--d": "0.16s" }}>
        <button type="button" aria-label="Previous badge" onClick={() => moveRef.current?.(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" aria-label="Next badge" onClick={() => moveRef.current?.(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>
        </button>
      </div>
      <p className="award-hint" data-reveal style={{ "--d": "0.2s" }}>Drag or swipe the rail to move it. Click a badge to turn it over.</p>
    </section>
  )
}

function PortfolioStage() {
  const rootRef = useRef(null)
  const total = pad(projects.length)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const cards = [...root.querySelectorAll(".folio-card")]
    const ambient = [...root.querySelectorAll(".folio-ambient img")]
    let frame = 0
    const draw = () => {
      const view = window.innerHeight || 1
      const span = Math.max(1, root.offsetHeight - view)
      const progress = Math.min(1, Math.max(0, (window.scrollY - root.offsetTop) / span))
      const ready = root.dataset.folioReady === "1"
      const active = ready ? progress * (cards.length - 1) : 0
      const narrow = window.matchMedia("(max-width: 760px)").matches
      const spread = narrow ? 0.4 : 0.38
      cards.forEach((card, index) => {
        const delta = index - active
        const distance = Math.abs(delta)
        const angle = delta * spread
        const focus = Math.max(0, 1 - distance)
        const x = (Math.cos(angle) - 1) * (narrow ? 460 : 780)
        const y = Math.sin(angle) * (narrow ? 500 : 740)
        const turn = (angle * 180) / Math.PI
        const scale = 0.82 + focus * 0.28
        card.style.opacity = distance > 2.4 ? "0" : String(0.55 + focus * 0.45)
        card.style.zIndex = String(20 + Math.round(focus * 30))
        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${turn}deg) scale(${scale})`
        card.style.clipPath = "inset(0 round 22px)"
        card.style.filter = focus > 0.72 ? "none" : "brightness(0.62)"
        card.style.boxShadow = focus > 0.72
          ? "0 0 0 2px #f6f3ec, 0 16px 34px rgba(0, 0, 0, 0.42)"
          : "0 8px 18px rgba(0, 0, 0, 0.28)"
      })
      const shown = Math.round(active)
      const project = projects[shown]
      const count = `${pad(shown + 1)} / ${total}`
      root.querySelectorAll("[data-folio-count]").forEach((node) => {
        node.textContent = count
      })
      ambient.forEach((layer, index) => {
        layer.style.opacity = String(Math.max(0, 1 - Math.abs(index - active)))
      })
      if (root.dataset.folioShown !== String(shown)) {
        root.dataset.folioShown = String(shown)
        const title = root.querySelector("[data-folio-title]")
        const kind = root.querySelector("[data-folio-kind]")
        const summary = root.querySelector("[data-folio-summary]")
        if (title) title.textContent = project.title
        if (kind) kind.textContent = `${project.typology} / ${project.scope}`
        if (summary) summary.textContent = project.summary
        const meta = root.querySelector(".folio-meta")
        if (meta) {
          meta.classList.remove("is-swap")
          void meta.offsetWidth
          meta.classList.add("is-swap")
        }
      }
      const fill = root.querySelector(".folio-meter span")
      if (fill) fill.style.width = `${((shown + 1) / cards.length) * 100}%`
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    const step = (direction) => {
      if (root.dataset.folioReady !== "1") return
      const view = window.innerHeight || 1
      const span = Math.max(1, root.offsetHeight - view)
      const jump = span / Math.max(1, projects.length - 1)
      const index = Math.round((window.scrollY - root.offsetTop) / jump)
      const next = Math.min(projects.length - 1, Math.max(0, index + direction))
      const top = root.offsetTop + next * jump
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(top, { duration: 1.1, easing: easeOutExpo, force: true })
      else window.scrollTo(0, top)
    }
    root.querySelector("[data-folio-prev]").onclick = () => step(-1)
    root.querySelector("[data-folio-next]").onclick = () => step(1)
    const award = root.querySelector(".folio-award")
    const awardTransform = (settled) => {
      const narrow = window.matchMedia("(max-width: 760px)").matches
      if (settled) return "translate(0vw, 0vh) scale(1)"
      const x = narrow ? -30 : -28
      const scale = narrow ? 1.28 : 1.48
      return `translate(${x}vw, -1.5vh) scale(${scale})`
    }
    root.dataset.folioReady = "0"
    if (award) {
      award.style.transition = "none"
      award.style.transform = awardTransform(false)
    }
    let played = false
    let alive = true
    const playTitle = () => {
      if (played || !award) return
      if (root.getBoundingClientRect().top > 40) return
      played = true
      if (reduced()) {
        award.style.transform = awardTransform(true)
        root.dataset.folioReady = "1"
        draw()
        return
      }
      const began = performance.now()
      const stop = () => {
        if (!alive || root.dataset.folioReady === "1") return
        award.style.transform = awardTransform(true)
        root.dataset.folioReady = "1"
        draw()
      }
      const tick = (now) => {
        if (!alive || root.dataset.folioReady === "1") return
        const travel = 1 - (1 - Math.min(1, (now - began) / 1100)) ** 3
        const narrow = window.matchMedia("(max-width: 760px)").matches
        const x = (narrow ? -30 : -28) * (1 - travel)
        const y = -1.5 * (1 - travel)
        const scale = 1 + (narrow ? 0.28 : 0.48) * (1 - travel)
        award.style.transform = `translate(${x}vw, ${y}vh) scale(${scale})`
        if (travel < 1) requestAnimationFrame(tick)
        else stop()
      }
      requestAnimationFrame(tick)
      window.setTimeout(stop, 1150)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("scroll", playTitle, { passive: true })
    window.addEventListener("resize", onScroll)
    draw()
    playTitle()
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("scroll", playTitle)
      window.removeEventListener("resize", onScroll)
    }
  }, [total])

  return (
    <section
      className="folio-stage is-curve"
      id="works"
      ref={rootRef}
      data-header="light"
      data-tone="dark"
      style={{ height: `${projects.length * 100}svh` }}
      aria-label="Portfolio"
    >
      <div className="folio-pin">
        <div className="folio-ambient" aria-hidden="true">
          {projects.map((project, index) => (
            <img key={project.slug} src={project.cover} alt="" loading="lazy" style={{ opacity: index === 0 ? 1 : 0 }} />
          ))}
        </div>
        <div className="folio-stack">
          {projects.map((project, index) => (
            <figure className="folio-card" key={project.slug}>
              <button type="button" className="folio-open" onClick={() => setOpen(index)} aria-label={`Open ${project.title}`}>
                <img src={project.cover} alt="" />
              </button>
            </figure>
          ))}
        </div>
        <div className="folio-meta">
          <p data-folio-count>{`01 / ${total}`}</p>
          <h2 data-folio-title>{projects[0].title}</h2>
          <p data-folio-kind>{`${projects[0].typology} / ${projects[0].scope}`}</p>
          <p className="folio-summary" data-folio-summary>{projects[0].summary}</p>
          <button
            type="button"
            className="folio-view"
            onClick={() => setOpen(Number(rootRef.current?.dataset.folioShown || 0))}
          >
            <span>View project</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
        <div className="folio-award">
          <strong>Our<br />Works</strong>
          <div className="folio-nav">
            <button type="button" data-folio-prev aria-label="Previous project">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6" /></svg>
            </button>
            <button type="button" data-folio-next aria-label="Next project">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10l6 6 6-6" /></svg>
            </button>
          </div>
        </div>
        <p className="folio-meter">
          <span data-folio-count>{`01 / ${total}`}</span>
          <i><span style={{ width: `${100 / projects.length}%` }} /></i>
        </p>
      </div>
      {open != null && <WorkSheet index={open} total={projects.length} onClose={() => setOpen(null)} onStep={setOpen} />}
    </section>
  )
}

function WorkSheet({ index, total, onClose, onStep }) {
  const project = projects[index]
  const api = useSmooth()
  const [view3d, setView3d] = useState(false)
  useEffect(() => {
    api.stop()
    return () => api.start()
  }, [api])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (view3d) setView3d(false)
        else onClose()
        return
      }
      if (view3d) return
      if (event.key === "ArrowUp") onStep((index - 1 + total) % total)
      if (event.key === "ArrowDown") onStep((index + 1) % total)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, total, onClose, onStep, view3d])

  return createPortal(
    <div className="work-pop" role="dialog" aria-modal="true" aria-label={project.title} onClick={onClose}>
      <article className="work-sheet" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="work-close" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClose() }} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <figure className="work-photo">
          <img src={project.cover} alt={project.coverAlt} />
        </figure>
        <div className="work-copy">
          <p className="work-kicker">{`${pad(index + 1)} / ${pad(total)} · ${project.typology}`}</p>
          <h2>{project.title}</h2>
          <p className="work-kind">{`${project.typology} / ${project.scope}`}</p>
          <p>{project.summary}</p>
          {project.story.map((line) => <p key={line}>{line}</p>)}
          <dl className="work-facts">
            <div><dt>Type</dt><dd>{project.typology}</dd></div>
            <div><dt>Scope</dt><dd>{project.scope}</dd></div>
          </dl>
          <div className="work-actions">
            <a className="work-cta" href={studio.whatsapp} target="_blank" rel="noreferrer">Start a similar project</a>
            <div className="work-step">
              <button type="button" aria-label="Previous project" onClick={() => onStep((index - 1 + total) % total)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6" /></svg>
              </button>
              <button type="button" aria-label="Next project" onClick={() => onStep((index + 1) % total)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10l6 6 6-6" /></svg>
              </button>
            </div>
          </div>
          <div className="work-links">
            <button type="button" className="work-tour work-3d" onClick={() => setView3d(true)}>View in 3D</button>
            {project.tour && <a className="work-tour" href={project.tour} target="_blank" rel="noreferrer">View the 360 tour</a>}
          </div>
        </div>
      </article>
      {view3d && <RoomView title={project.title} src={project.model} onClose={() => setView3d(false)} />}
    </div>,
    document.body
  )
}

function useCurvedReveal() {
  useEffect(() => {
    const curve = document.querySelector(".is-curve")
    const sheet = curve?.querySelector(".folio-pin") || curve
    const previous = curve?.previousElementSibling
    if (!curve || !sheet || !previous || reduced()) return undefined

    let frame = 0
    const place = () => {
      const view = window.innerHeight || 1
      const top = curve.getBoundingClientRect().top
      const entering = top > 0 && top < view
      if (!entering) {
        sheet.style.clipPath = ""
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
      // Pin the walkthrough's picture in this same frame; otherwise it sits at the
      // section's bottom for a frame and the page background flashes through.
      const film = previous.querySelector(".enter-reel-pin")
      if (film) {
        film.style.position = "fixed"
        film.style.top = "0"
        film.style.bottom = "auto"
      }
      curve.style.zIndex = "2"
      const open = 1 - top / view
      const bow = Math.pow(Math.max(0, 1 - open), 0.22)
      const rx = 48 + (1 - bow) * 110
      const ry = 52 + (1 - bow) * 110
      const cy = 62 - (1 - bow) * 12
      sheet.style.clipPath = bow < 0.05 ? "" : `ellipse(${rx}% ${ry}% at 50% ${cy}%)`
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    // Lenis moves the page inside its own frame; following it there keeps the
    // pinned walkthrough glued to the top instead of trailing a frame behind.
    let unhook = null
    let hookFrame = 0
    const hook = () => {
      const lenis = getLenis()
      if (lenis) unhook = lenis.on("scroll", place)
      else hookFrame = requestAnimationFrame(hook)
    }
    hook()
    place()
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(hookFrame)
      unhook?.()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      sheet.style.clipPath = ""
      previous.style.transform = ""
      previous.style.zIndex = ""
      curve.style.zIndex = ""
    }
  }, [])
}

/**
 * Scroll behaviour for the home page.
 *
 * Everywhere except the walkthrough, Lenis gives free, inertial smooth scroll.
 * Inside the walkthrough the page still steps room by room, because each
 * step plays a stretch of the walk video and has to land on a fixed frame.
 */
function usePageTurn(transportRef) {
  useEffect(() => {
    if (reduced()) return undefined
    let animating = false
    let touchY = 0
    let touchX = 0
    let armed = false
    let armTimer = 0
    let wheelSum = 0
    let wheelStamp = 0

    const holdWheel = (ms) => {
      armed = true
      window.clearTimeout(armTimer)
      armTimer = window.setTimeout(() => {
        armed = false
      }, ms)
    }

    const reelRange = () => {
      const reel = document.querySelector(".enter-reel")
      const view = window.innerHeight || 1
      if (!reel) return { start: 0, end: 0 }
      return { start: reel.offsetTop, end: reel.offsetTop + reel.offsetHeight - view }
    }

    const roomStops = () => {
      const { start, end } = reelRange()
      return [0, 1, 2, 3].map((step) => Math.round(start + ((end - start) * step) / 3))
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

    // Hold the page at the top of the portfolio until its title has settled.
    const folioHold = (direction) => {
      const folio = document.querySelector(".folio-stage")
      return direction > 0 && folio && folio.dataset.folioReady !== "1" && window.scrollY >= folio.offsetTop - 24
    }

    // Below the walkthrough, every wheel tick or swipe glides to the next "page":
    // the portfolio curtain, each project card, the Why Siriz zoom, each screen of
    // its content panel, each Work Process step, Recognition and the footer.
    const pageStops = () => {
      const view = window.innerHeight || 1
      const stops = []
      const folio = document.querySelector(".folio-stage")
      if (folio) {
        stops.push(folio.offsetTop)
        if (folio.dataset.folioReady === "1") {
          const count = folio.querySelectorAll(".folio-card").length
          const jump = Math.max(1, folio.offsetHeight - view) / Math.max(1, count - 1)
          for (let index = 1; index < count; index += 1) stops.push(folio.offsetTop + index * jump)
        }
      }
      const why = document.querySelector(".why-story")
      if (why) {
        const top = why.offsetTop
        const end = top + why.offsetHeight - view
        stops.push(top)
        const sheet = why.querySelector(":scope > .why-sheet")
        // One glide runs the whole zoom and lands with the content panel at the top.
        const start = sheet ? sheet.getBoundingClientRect().top + window.scrollY : end
        // Even steps through the panel: none longer than 85% of the screen (so no
        // content is skipped) and none a short sliver (which feels stuck).
        const steps = Math.max(1, Math.ceil((end - start) / (view * 0.85)))
        for (let index = 0; index < steps; index += 1) stops.push(start + ((end - start) * index) / steps)
        stops.push(end)
      }
      const cycle = document.querySelector(".cycle-page")
      if (cycle) {
        const span = Math.max(1, cycle.offsetHeight - view)
        stops.push(cycle.offsetTop)
        // Step i shows at the same spot whichever way you scroll.
        for (let index = 1; index <= CYCLE.length; index += 1) stops.push(cycle.offsetTop + (index / CYCLE.length) * span)
      }
      const award = document.querySelector(".award-page")
      if (award) stops.push(award.offsetTop)
      stops.push(Math.max(0, document.documentElement.scrollHeight - view))
      const first = folio ? folio.offsetTop : 0
      return [...new Set(stops.map((stop) => Math.round(stop)))].filter((stop) => stop >= first).sort((x, z) => x - z)
    }

    const pageTarget = (direction) => {
      const y = window.scrollY
      const lastRoom = roomStops().at(-1) || 0
      if (y < lastRoom - 2) return null
      const stops = pageStops()
      if (direction > 0) return stops.find((stop) => stop > y + 8) ?? null
      return [...stops].reverse().find((stop) => stop < y - 8) ?? null
    }

    const goPage = (direction) => {
      const target = pageTarget(direction)
      if (target == null) return false
      const view = window.innerHeight || 1
      const distance = Math.abs(target - window.scrollY) / view
      const duration = Math.min(1900, Math.max(900, 700 + distance * 450))
      if (!glide(target, duration)) holdWheel(380)
      return true
    }

    const glide = (top, duration, linear = false) => {
      const lenis = getLenis()
      if (Math.abs(top - window.scrollY) < 2) return false
      animating = true
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        animating = false
        holdWheel(380)
      }
      if (lenis) {
        lenis.scrollTo(top, {
          duration: duration / 1000,
          easing: linear ? (t) => t : (t) => 1 - (1 - t) ** 4,
          lock: true,
          force: true,
          onComplete: done,
        })
      } else {
        window.scrollTo(0, top)
      }
      window.setTimeout(done, duration + 260)
      return true
    }

    const goRoom = (direction) => {
      if (animating) return
      const points = roomStops()
      const y = window.scrollY
      let from = 0
      points.forEach((point, index) => {
        if (point <= y + 16) from = index
      })
      const to = from + direction
      if (to < 0 || to >= points.length) {
        armed = false
        window.clearTimeout(armTimer)
        return
      }
      const last = points[points.length - 1]
      if (direction < 0 && y > last + 24) {
        transportRef.current?.parkEnd?.()
        if (!glide(last, 1100)) holdWheel(380)
        return
      }
      animating = true
      const pending = transportRef.current?.move(from, to)
      const startGlide = (duration) => {
        animating = false
        const time = duration || 3200
        if (!glide(points[to], time, time > 1400)) holdWheel(380)
      }
      if (pending && pending.then) pending.then(startGlide)
      else startGlide(pending)
    }

    const blocked = () => document.querySelector(".menu.is-open")
    const locked = () => document.documentElement.classList.contains("is-scroll-locked")
    const ownScroll = (target) => target?.closest?.(".bot-panel, .bot-stage, .work-pop, .menu, [data-lenis-prevent]")

    // Tell Lenis to keep its hands off the gestures this hook handles itself.
    const removeGuard = addScrollGuard((data) => {
      if (blocked() || locked() || ownScroll(data.event?.target)) return true
      // Sideways gestures belong to the award rail, not to the page.
      if (Math.abs(data.deltaX || 0) > Math.abs(data.deltaY)) return false
      if (animating) return false
      const direction = data.deltaY > 0 ? 1 : data.deltaY < 0 ? -1 : 0
      if (!direction) return true
      return !insideReel(direction) && !folioHold(direction) && pageTarget(direction) == null
    })

    const onWheel = (event) => {
      if (blocked() || locked() || ownScroll(event.target)) return
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0
      if (!direction) return
      if (animating) {
        event.preventDefault()
        return
      }
      if (insideReel(direction)) {
        event.preventDefault()
        if (armed) return
        const now = performance.now()
        if (now - wheelStamp > 180) wheelSum = 0
        wheelStamp = now
        wheelSum += event.deltaY
        if (Math.abs(wheelSum) < 28) return
        wheelSum = 0
        holdWheel(8000)
        goRoom(direction)
        return
      }
      if (folioHold(direction)) {
        event.preventDefault()
        return
      }
      if (pageTarget(direction) != null) {
        event.preventDefault()
        if (armed) return
        const now = performance.now()
        if (now - wheelStamp > 180) wheelSum = 0
        wheelStamp = now
        wheelSum += event.deltaY
        if (Math.abs(wheelSum) < 28) return
        wheelSum = 0
        // Trackpads keep firing after the glide: ignore the rest of this gesture.
        holdWheel(8000)
        if (!goPage(direction)) holdWheel(380)
      }
    }

    const onTouchStart = (event) => {
      touchY = event.touches[0].clientY
      touchX = event.touches[0].clientX
    }
    // A mostly sideways swipe on the award rail moves the rail only.
    const railSwipe = (event, point) => Boolean(event.target?.closest?.(".award-rail"))
      && Math.abs(point.clientX - touchX) > Math.abs(point.clientY - touchY)

    const onTouchMove = (event) => {
      if (blocked() || locked() || ownScroll(event.target)) return
      if (railSwipe(event, event.touches[0])) return
      const direction = touchY - event.touches[0].clientY >= 0 ? 1 : -1
      if (animating || insideReel(direction) || folioHold(direction) || pageTarget(direction) != null) {
        if (event.cancelable) event.preventDefault()
      }
    }

    const onTouchEnd = (event) => {
      if (blocked() || ownScroll(event.target)) return
      if (railSwipe(event, event.changedTouches[0])) return
      const delta = touchY - event.changedTouches[0].clientY
      if (Math.abs(delta) < 28) return
      const direction = delta > 0 ? 1 : -1
      if (animating || armed) return
      if (insideReel(direction)) {
        holdWheel(8000)
        goRoom(direction)
        return
      }
      if (pageTarget(direction) != null) {
        holdWheel(8000)
        goPage(direction)
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      removeGuard()
      window.clearTimeout(armTimer)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [transportRef])
}
