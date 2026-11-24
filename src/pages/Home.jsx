import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { projects, studio } from "../data/site"
import { useTitle } from "../useTitle"

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const ROOM_TIMES = [0, 299 / 60, 569 / 60, 799 / 60]
const PLAY_RATE = 1.6

function playRate() {
  return window.matchMedia("(max-width: 760px)").matches ? 2.25 : PLAY_RATE
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

    const begin = (clip, start, end, token, done) => {
      const rate = playRate()
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
        const duration = (Math.abs(forwardEnd - forwardStart) / playRate()) * 1000
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
          begin(video, forwardStart, forwardEnd, token, showForward)
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
        })
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
      const target = Math.min(1, Math.max(0, -rect.top / total))
      const pos = target * (ROOM_TIMES.length - 1)
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

  return (
    <>
      <section className="enter-reel" ref={reelRef} data-header="light">
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
            <p className="enter-note">Welcome to Siriz Interiors</p>
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

function WhyPage() {
  const rootRef = useRef(null)
  const pinRef = useRef(null)
  const stageRef = useRef(null)
  const lineRef = useRef(null)
  const letterRef = useRef(null)
  const maskRef = useRef(null)
  const statsRef = useRef(null)
  const hintRef = useRef(null)
  const statementRef = useRef(null)
  const glowRef = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const line = lineRef.current
    const letter = letterRef.current
    if (!root || !stage || !line || !letter) return undefined
    const still = reduced()
    if (still) root.classList.add("is-still")
    const metrics = { dx: 0, dy: 0, smax: 6 }
    let frame = 0

    const measure = () => {
      const view = window.innerHeight || 1
      if (pinRef.current) pinRef.current.style.height = still ? `${view}px` : `${view * 3.4}px`
      line.style.transform = "none"
      line.style.fontSize = "100px"
      const box = line.getBoundingClientRect()
      const size = 100 * Math.min((stage.clientWidth * 0.86) / box.width, (stage.clientHeight * 0.5) / box.height)
      line.style.fontSize = `${size}px`
      const stageBox = stage.getBoundingClientRect()
      const lineBox = line.getBoundingClientRect()
      const letterBox = letter.getBoundingClientRect()
      const tracking = parseFloat(getComputedStyle(letter).letterSpacing) || 0
      const originX = letterBox.left - lineBox.left + (letterBox.width - tracking) / 2
      const originY = letterBox.top - lineBox.top + letterBox.height / 2
      metrics.dx = stage.clientWidth / 2 - (lineBox.left - stageBox.left + originX)
      metrics.dy = stage.clientHeight / 2 - (lineBox.top - stageBox.top + originY)
      metrics.smax = Math.max(stage.clientWidth / (size * 0.11), stage.clientHeight / (size * 0.45)) * 1.1
      line.style.transformOrigin = `${originX}px ${originY}px`
    }

    const draw = () => {
      const view = stage.clientHeight || window.innerHeight || 1
      const local = window.scrollY - root.offsetTop
      if (still) {
        if (statementRef.current) statementRef.current.style.opacity = "1"
        return
      }
      const t = clamp(local / (2 * view))
      const scale = Math.exp(Math.log(metrics.smax) * Math.pow(t, 1.6))
      const weight = rise(0, 0.9, t)
      const tilt = -3 * Math.sin(Math.PI * clamp(t / 0.6))
      line.style.transform = `translate(${metrics.dx * weight}px, ${metrics.dy * weight}px) rotate(${tilt}deg) scale(${scale})`
      if (maskRef.current) maskRef.current.style.opacity = String(1 - rise(0.84, 0.97, t))
      const fade = rise(0, 0.14, t)
      if (statsRef.current) {
        statsRef.current.style.opacity = String(1 - fade)
        statsRef.current.style.transform = `translateY(${fade * 34}px)`
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - rise(0, 0.05, t))
      const shown = rise(1.7 * view, 2.25 * view, local)
      if (statementRef.current) {
        statementRef.current.style.opacity = String(shown)
        statementRef.current.style.transform = `translateY(${(1 - shown) * 26}px)`
      }
      if (glowRef.current) glowRef.current.style.transform = `scale(${1 + 0.14 * t}) translate3d(${-3 * t}%, 0, 0)`
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }

    const items = [...root.querySelectorAll(".why-reveal")]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in")
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    items.forEach((item) => observer.observe(item))

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
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", relayout)
    }
  }, [])

  const points = (list, side) => (
    <div className={side === "right" ? "why-col is-right" : "why-col"}>
      {list.map((item, index) => (
        <article className="why-feat why-reveal" style={{ "--d": `${index * 0.1}s` }} key={item.title}>
          <span className="why-ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">{item.mark}</svg>
          </span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <section className="why-story" ref={rootRef} aria-label="Why Siriz">
      <div className="why-pin" ref={pinRef}>
        <div className="why-stage" ref={stageRef}>
          <div className="why-glow" ref={glowRef} />
          <div className="why-shade" />
          <div className="why-mask" ref={maskRef}>
            <h2 className="why-line" ref={lineRef} aria-label="Why Siriz Interiors">
              <span>Why S<span ref={letterRef}>I</span>riz</span>
              <span>Interiors</span>
            </h2>
          </div>
          <div className="why-stats" ref={statsRef}>
            <p><b>10 yrs</b><span>Warranty on wood work</span></p>
            <p><b>45 days</b><span>Guaranteed delivery</span></p>
            <p><b>Lifetime</b><span>Post-installation service</span></p>
            <p><b>1 login</b><span>Progress, designs, payments</span></p>
          </div>
          <p className="why-cue" ref={hintRef}>Scroll</p>
          <div className="why-statement" ref={statementRef}>
            <small>Siriz Interiors</small>
            <i />
            <h2>We design your dream home, <em>the excellence of interior</em></h2>
            <p>A full range of planning and turnkey fit-out services in the interior industry.</p>
          </div>
        </div>
      </div>
      <div className="why-sheet" ref={sheetRef}>
        <div className="why-wrap">
          <h2 className="why-heading why-reveal">Why <span>Siriz Interiors</span></h2>
          <div className="why-lede why-reveal">
            <q>We Design your Dream Home, the excellence of interior</q>
            <p>Siriz Interiors provides a full range of planning and turnkey fit-out services in the interior industry.</p>
          </div>
          <div className="why-cols">
            {points(WHY_LEFT, "left")}
            <div className="why-gems" aria-hidden="true">
              {WHY_GEMS.map((gem, index) => (
                <img className={`why-gem is-${gem.place} why-reveal`} style={{ "--d": `${0.1 + index * 0.12}s` }} key={gem.src} src={gem.src} alt="" />
              ))}
            </div>
            {points(WHY_RIGHT, "right")}
          </div>
          <p className="why-foot why-reveal">Siriz Interiors</p>
        </div>
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

const CYCLE_SPOTS = [
  { x: "50%", y: "10%" },
  { x: "84%", y: "30%" },
  { x: "84%", y: "70%" },
  { x: "50%", y: "90%" },
  { x: "16%", y: "70%" },
  { x: "16%", y: "30%" },
]

function CyclePage() {
  const rootRef = useRef(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const sticky = root.querySelector(".cycle-sticky")
    let frame = 0
    const place = () => {
      const view = window.innerHeight || 1
      root.style.height = `${view * (CYCLE.length + 1)}px`
      if (sticky) sticky.style.height = `${view}px`
      const span = Math.max(1, root.offsetHeight - view)
      const y = window.scrollY
      const progress = Math.min(1, Math.max(0, (y - root.offsetTop) / span))
      const step = progress * CYCLE.length
      const down = y >= root.dataset.cycleY
      root.dataset.cycleY = String(y)
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
    window.scrollTo({ top: root.offsetTop + ((index + 1) / CYCLE.length) * span, behavior: "smooth" })
  }

  return (
    <section className="cycle-page" ref={rootRef} aria-label="Work process">
      <div className="cycle-sticky">
        <h2 className="cycle-title">Work Process</h2>
        <div className={active >= 0 ? "cycle-ring is-open" : "cycle-ring"}>
          <div className="cycle-veil" aria-hidden="true" />
          {CYCLE.map((item, index) => (
            <button
              key={item.n}
              type="button"
              className={index === active ? "cycle-node is-pop" : "cycle-node"}
              style={{ "--x": CYCLE_SPOTS[index].x, "--y": CYCLE_SPOTS[index].y, "--ink": item.color }}
              onClick={() => open(index)}
              aria-pressed={index === active}
            >
              <b>{item.n}</b>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </button>
          ))}
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
  const [flipped, setFlipped] = useState(() => AWARDS.map(() => false))

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
    <section className="award-page" aria-label="Recognition">
      <p className="award-kicker">Recognition · Four honours</p>
      <h2 className="award-title">Recognised for the rooms we build.</h2>
      <div className="award-rail" ref={railRef}>
        <div className="award-track">
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
                    <span className="award-pic"><img src={award.image} alt="" /></span>
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
      <p className="award-hint">The badges travel along the rail. Click a badge to turn it over.</p>
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
      const title = root.querySelector("[data-folio-title]")
      const kind = root.querySelector("[data-folio-kind]")
      if (title) title.textContent = project.title
      if (kind) kind.textContent = `${project.typology} / ${project.scope}`
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
      window.scrollTo(0, root.offsetTop + next * jump)
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
        const travel = 1 - (1 - Math.min(1, (now - began) / 1700)) ** 3
        const narrow = window.matchMedia("(max-width: 760px)").matches
        const x = (narrow ? -30 : -28) * (1 - travel)
        const y = -1.5 * (1 - travel)
        const scale = 1 + (narrow ? 0.28 : 0.48) * (1 - travel)
        award.style.transform = `translate(${x}vw, ${y}vh) scale(${scale})`
        if (travel < 1) requestAnimationFrame(tick)
        else stop()
      }
      requestAnimationFrame(tick)
      window.setTimeout(stop, 1750)
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
      ref={rootRef}
      data-header="light"
      style={{ height: `${projects.length * 100}svh` }}
      aria-label="Portfolio"
    >
      <div className="folio-pin">
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
  useEffect(() => {
    const y = window.scrollY
    document.body.style.top = `-${y}px`
    document.documentElement.classList.add("is-scroll-locked")
    return () => {
      document.documentElement.classList.remove("is-scroll-locked")
      document.body.style.top = ""
      window.scrollTo(0, y)
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowUp") onStep((index - 1 + total) % total)
      if (event.key === "ArrowDown") onStep((index + 1) % total)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, total, onClose, onStep])

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
          {project.tour && <a className="work-tour" href={project.tour} target="_blank" rel="noreferrer">View the 360 tour</a>}
        </div>
      </article>
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
    place()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      sheet.style.clipPath = ""
      previous.style.transform = ""
      previous.style.zIndex = ""
      curve.style.zIndex = ""
    }
  }, [])
}

function usePageTurn(transportRef) {
  useEffect(() => {
    if (reduced()) return undefined
    let animating = false
    let touchY = 0
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

    const glide = (top, duration = 1080, smooth = false) => {
      const start = window.scrollY
      const change = top - start
      if (Math.abs(change) < 2) return false
      animating = true
      const began = performance.now()
      const ease = smooth
        ? (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2)
        : duration > 1400 ? (t) => t : duration < 700 ? (t) => 1 - (1 - t) ** 2 : (t) => 1 - (1 - t) ** 4
      const step = (now) => {
        const progress = Math.min(1, (now - began) / duration)
        window.scrollTo(0, start + change * ease(progress))
        if (progress < 1) requestAnimationFrame(step)
        else {
          animating = false
          holdWheel(380)
        }
      }
      requestAnimationFrame(step)
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
        animating = true
        transportRef.current?.parkEnd?.()
        const moved = glide(last, 1080)
        if (!moved) {
          animating = false
          holdWheel(380)
        }
        return
      }
      animating = true
      const pending = transportRef.current?.move(from, to)
      const startGlide = (duration) => {
        const moved = glide(points[to], duration || 3200)
        if (!moved) {
          animating = false
          holdWheel(380)
        }
      }
      if (pending && pending.then) pending.then(startGlide)
      else startGlide(pending)
    }

    const go = (direction) => {
      if (animating || insideReel(direction)) return
      const folio = document.querySelector(".folio-stage")
      if (direction > 0 && folio && folio.dataset.folioReady !== "1" && window.scrollY >= folio.offsetTop - 24) return
      const points = stops()
      const y = window.scrollY
      const cycle = document.querySelector(".cycle-page")
      const view = window.innerHeight || 1
      const cycleStart = cycle ? cycle.offsetTop - 4 : -1
      const cycleEnd = cycle ? cycle.offsetTop + Math.max(0, cycle.offsetHeight - view) + 4 : -1
      const cycleGlide = (target) => {
        const inside = y >= cycleStart && y <= cycleEnd && target >= cycleStart && target <= cycleEnd
        return glide(target, inside ? 1320 : 1080, inside)
      }
      if (direction > 0) {
        const next = points.find((point) => point > y + 16)
        if (next != null) cycleGlide(next)
        return
      }
      const prev = [...points].reverse().find((point) => point < y - 16)
      if (prev == null) return
      const lastRoom = roomStops().at(-1) || 0
      if (y > lastRoom + 24 && prev <= lastRoom + 24) {
        goRoom(-1)
        return
      }
      cycleGlide(prev)
    }

    const blocked = () => document.querySelector(".menu.is-open")
    const locked = () => document.documentElement.classList.contains("is-scroll-locked")

    const whyPin = () => {
      const why = document.querySelector(".why-story")
      const pin = why?.querySelector(".why-pin")
      if (!why || !pin) return null
      const view = window.innerHeight || 1
      return { start: why.offsetTop, end: why.offsetTop + pin.offsetHeight - view }
    }

    const scrubWhy = (direction) => {
      const range = whyPin()
      if (!range) return false
      const y = window.scrollY
      if (direction > 0) return y >= range.start - 2 && y < range.end - 16
      return y > range.start + 16 && y <= range.end + 16
    }

    const onWheel = (event) => {
      if (blocked() || locked()) return
      const wheelDirection = event.deltaY > 0 ? 1 : -1
      if (scrubWhy(wheelDirection)) return
      if (insideReel(wheelDirection)) {
        event.preventDefault()
        if (animating || armed) return
        const now = performance.now()
        if (now - wheelStamp > 180) wheelSum = 0
        wheelStamp = now
        wheelSum += event.deltaY
        if (Math.abs(wheelSum) < 28) return
        wheelSum = 0
        holdWheel(8000)
        goRoom(wheelDirection)
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

    let touchScrub = false

    const onTouchStart = (event) => {
      touchY = event.touches[0].clientY
      touchScrub = false
    }

    const onTouchMove = (event) => {
      if (blocked() || locked()) return
      if (event.target.closest(".bot-panel, .bot-stage, .menu")) return
      const y = event.touches[0].clientY
      const direction = touchY - y >= 0 ? 1 : -1
      if (scrubWhy(direction)) {
        if (event.cancelable) event.preventDefault()
        const range = whyPin()
        const next = Math.min(range.end, Math.max(range.start, window.scrollY + (touchY - y)))
        touchY = y
        touchScrub = true
        window.scrollTo(0, next)
        return
      }
      if (event.cancelable) event.preventDefault()
    }

    const onTouchEnd = (event) => {
      if (blocked()) return
      if (event.target.closest(".bot-panel, .bot-stage, .menu")) return
      if (touchScrub) {
        touchScrub = false
        return
      }
      const delta = touchY - event.changedTouches[0].clientY
      if (Math.abs(delta) < 28) return
      const touchDirection = delta > 0 ? 1 : -1
      if (insideReel(touchDirection)) {
        if (animating || armed) return
        holdWheel(8000)
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
