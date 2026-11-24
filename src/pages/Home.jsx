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
    </>
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

    const glide = (top, duration = 1080) => {
      const start = window.scrollY
      const change = top - start
      if (Math.abs(change) < 2) return false
      animating = true
      const began = performance.now()
      const ease = duration > 1400 ? (t) => t : duration < 700 ? (t) => 1 - (1 - t) ** 2 : (t) => 1 - (1 - t) ** 4
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
      if (direction > 0) {
        const next = points.find((point) => point > y + 16)
        if (next != null) glide(next)
        return
      }
      const prev = [...points].reverse().find((point) => point < y - 16)
      if (prev == null) return
      const lastRoom = roomStops().at(-1) || 0
      if (y > lastRoom + 24 && prev <= lastRoom + 24) {
        goRoom(-1)
        return
      }
      glide(prev)
    }

    const blocked = () => document.querySelector(".menu.is-open")
    const locked = () => document.documentElement.classList.contains("is-scroll-locked")

    const onWheel = (event) => {
      if (blocked() || locked()) return
      const wheelDirection = event.deltaY > 0 ? 1 : -1
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
