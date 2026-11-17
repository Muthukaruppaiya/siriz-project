import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { articles, interiorImages, principles, process, projects, reviews, signatures, studio } from "../data/site"
import { ParallaxImage } from "../components/Parallax"
import { useScrollFrame } from "../scroll"
import { useTitle } from "../useTitle"


function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function Home() {
  useTitle("")
  const copyRef = useRef(null)
  const mediaRef = useRef(null)

  useScrollFrame((y) => {
    const hero = document.querySelector(".hero")
    if (!hero || reduced()) return
    const progress = Math.min(1, Math.max(0, y / hero.offsetHeight))
    const damp = window.innerWidth < 800 ? 0.75 : 1
    const distance = hero.offsetHeight
    if (copyRef.current) {
      copyRef.current.style.transform = `translate3d(0, ${progress * distance * 0.24 * damp}px, 0)`
      copyRef.current.style.opacity = String(1 - progress * 0.72)
    }
    const image = mediaRef.current?.querySelector("img")
    if (image) image.style.transform = `translate3d(0, ${progress * distance * 0.14 * damp}px, 0) scale(1.08)`
  })

  return (
    <>
      <section className="hero" data-header="light">
        <div className="hero-media" ref={mediaRef}>
          <img src={studio.hero} alt={studio.heroAlt} fetchPriority="high" />
        </div>
        <div className="hero-shade" />
        <div className="hero-copy" ref={copyRef}>
          <h1 className="hero-title">Siriz</h1>
          <div className="hero-bottom">
            <p className="hero-lede">
              Rooms composed to be lived in slowly — in cream, warm beige, and deep brown.
            </p>
            <p className="scroll-cue">Scroll</p>
          </div>
        </div>
      </section>

      <ScaleWord />
      <Studio />
      <FloatFrames />
      <WorkStack />
      <RoomIndex />
      <Practice />
      <RoomNotes />
      <Questions />

      <section className="teaser">
        <div className="teaser-head">
          <div>
            <p className="kicker">Gallery</p>
            <h2>Frames from the rooms</h2>
          </div>
          <Link to="/gallery" className="btn-line">
            Enter the gallery
          </Link>
        </div>
        <div className="teaser-grid">
          {interiorImages.slice(0, 4).map((image) => (
            <Link to="/gallery/interior" key={image.src} aria-label={image.caption}>
              <ParallaxImage src={image.src} alt={image.alt} speed={0.16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="guide-strip">
        <div>
          <p className="kicker">Guide</p>
          <h2>{articles[0].title}</h2>
          <p className="lede">{articles[0].summary}</p>
          <Link to={`/guide/${articles[0].slug}`} className="btn-line">
            Read the note
          </Link>
        </div>
        <div className="guide-visual">
          <ParallaxImage className="parallax--fill" src={articles[0].image} alt={articles[0].imageAlt} speed={0.2} />
        </div>
      </section>

      <section className="invite">
        <p className="kicker">Contact</p>
        <h2>Tell us about the room.</h2>
        <p className="lede">A commission begins with a conversation, not a catalogue.</p>
        <Link to="/contact" className="btn">
          Begin
        </Link>
      </section>
    </>
  )
}

function ScaleWord() {
  const sectionRef = useRef(null)
  const wordRef = useRef(null)

  useScrollFrame(() => {
    const section = sectionRef.current
    const word = wordRef.current
    if (!section || !word) return
    if (reduced() || window.innerWidth < 760) {
      word.style.transform = "translate3d(-50%, -50%, 0) scale(1)"
      word.style.opacity = "1"
      return
    }
    const distance = section.offsetHeight - window.innerHeight
    const progress = distance <= 0 ? 0 : Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance))
    const scale = 0.62 + progress * 3.1
    word.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`
    word.style.opacity = progress > 0.9 ? String(Math.max(0, 1 - (progress - 0.9) / 0.1)) : "1"
  })

  return (
    <section className="scale-section" ref={sectionRef} data-header="light" aria-label="Slowly">
      <div className="scale-pin">
        <p className="scale-kicker">The atelier</p>
        <p className="scale-word" ref={wordRef}>
          Slowly
        </p>
      </div>
    </section>
  )
}

function Studio() {
  return (
    <section className="manifesto studio-block">
      <p className="kicker">Chennai office</p>
      <h2 className="display">We design your dream home.</h2>
      <p className="lede">
        Siriz Interiors, with 11 years in practice, plans, designs, and builds homes from the Medavakkam
        studio. The work is custom, priced in the open, and finished to move into.
      </p>
      <dl className="studio-stats">
        <div>
          <dt>Completed</dt>
          <dd>{studio.completed}</dd>
        </div>
        <div>
          <dt>Ongoing</dt>
          <dd>{studio.ongoing}</dd>
        </div>
        <div>
          <dt>Clients</dt>
          <dd>{studio.clients}</dd>
        </div>
      </dl>
      <div className="end-links">
        {signatures.map((item) => (
          <Link className="btn-line" to={`/signatures/${item.slug}`} key={item.slug}>
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  )
}

function FloatFrames() {
  const sectionRef = useRef(null)
  const frames = projects.slice(0, 3)

  useScrollFrame(() => {
    const section = sectionRef.current
    if (!section || reduced() || window.innerWidth < 760) return
    const cards = section.querySelectorAll(".float-card")
    const rect = section.getBoundingClientRect()
    const view = window.innerHeight || 1
    const progress = (view - rect.top) / (view + rect.height)
    const speeds = [140, -90, 180]
    const tilts = [-8, 6, -3]
    cards.forEach((card, index) => {
      const y = (progress - 0.5) * speeds[index]
      card.style.transform = `translate3d(0, ${y}px, 0) rotate(${tilts[index]}deg)`
    })
  })

  return (
    <section className="float-stage" ref={sectionRef} data-header="light" aria-label="Selected frames">
      <div className="float-pin">
        <p className="float-mark">Selected frames</p>
        {frames.map((project) => (
          <Link className="float-card" to={`/portfolio/${project.slug}`} key={project.slug}>
            <img src={project.cover} alt={project.coverAlt} />
            <span>{project.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function WorkStack() {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)

  useScrollFrame(() => {
    const section = sectionRef.current
    if (!section) return
    const narrow = window.innerWidth < 760 || reduced()
    if (narrow) {
      section.style.height = "auto"
      cardsRef.current.forEach((card) => {
        if (!card) return
        card.style.transform = "none"
        card.style.opacity = "1"
      })
      return
    }
    const count = projects.length
    section.style.height = `${window.innerHeight * count * 0.72}px`
    const distance = section.offsetHeight - window.innerHeight
    const rect = section.getBoundingClientRect()
    const progress = distance <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / distance))
    const pos = progress * (count - 1)
    const next = Math.round(pos)
    if (next !== activeRef.current) {
      activeRef.current = next
      setActive(next)
    }
    cardsRef.current.forEach((card, index) => {
      if (!card) return
      const delta = index - pos
      const scale = Math.max(0.84, 1 - Math.max(0, -delta) * 0.07)
      card.style.transform = `translate3d(0, ${delta * 72}px, 0) scale(${scale})`
      card.style.opacity = delta < -1.35 || delta > 2.4 ? "0" : "1"
      card.style.zIndex = String(30 - Math.round(Math.abs(delta) * 4))
    })
  })

  const current = projects[active]

  return (
    <section className="stack-section" ref={sectionRef} data-header="light" aria-label="Selected works">
      <div className="stack-pin">
        <div className="stack-copy">
          <p className="kicker">Portfolio</p>
          <p className="stack-count">
            {String(active + 1).padStart(2, "0")}
            <span> / {String(projects.length).padStart(2, "0")}</span>
          </p>
          <h2>{current.title}</h2>
          <p className="stack-type">{current.typology}</p>
          <p className="stack-hint">Scroll to explore</p>
          <Link className="btn-line" to={`/portfolio/${current.slug}`}>
            Enter
          </Link>
        </div>
        <div className="stack-deck">
          {projects.map((project, index) => (
            <Link
              className="stack-card"
              to={`/portfolio/${project.slug}`}
              key={project.slug}
              ref={(node) => {
                cardsRef.current[index] = node
              }}
            >
              <img src={project.cover} alt={project.coverAlt} />
              <span className="stack-caption">
                <span>
                  {String(index + 1).padStart(2, "0")} — {project.typology}
                </span>
                <strong>{project.title}</strong>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function RoomIndex() {
  const [active, setActive] = useState(0)
  const project = projects[active]

  return (
    <section className="room-index" data-header="light">
      <div className="room-head">
        <p className="kicker">Portfolio</p>
        <h2>Every room, recomposed.</h2>
        <p>Choose a house. The photograph follows.</p>
      </div>
      <div className="room-layout">
        <ol>
          {projects.map((item, index) => (
            <li key={item.slug}>
              <button
                className={`room-row ${index === active ? "is-on" : ""}`}
                type="button"
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
                <span aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ol>
        <Link className="room-photo" to={`/portfolio/${project.slug}`}>
          <img key={project.slug} src={project.cover} alt={project.coverAlt} />
          <span>
            <small>{project.typology}</small>
            {project.summary}
          </span>
        </Link>
      </div>
    </section>
  )
}

function Practice() {
  const listRef = useRef(null)

  useScrollFrame(() => {
    const list = listRef.current
    if (!list) return
    const rows = [...list.querySelectorAll(".practice-row")]
    if (reduced()) {
      rows.forEach((row) => row.classList.add("is-on"))
      return
    }
    const view = window.innerHeight || 1
    let best = 0
    let bestDist = Infinity
    rows.forEach((row, index) => {
      const rect = row.getBoundingClientRect()
      const dist = Math.abs(rect.top + rect.height / 2 - view * 0.46)
      if (dist < bestDist) {
        best = index
        bestDist = dist
      }
    })
    rows.forEach((row, index) => row.classList.toggle("is-on", index === best))
  })

  return (
    <section className="practice" data-header="light">
      <p className="kicker">Why Siriz</p>
      <ol ref={listRef}>
        {principles.map((item) => (
          <li className="practice-row" key={item.no}>
            <span className="practice-no">{item.no}</span>
            <div>
              <h2 className="practice-name">{item.title}</h2>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RoomNotes() {
  const [index, setIndex] = useState(0)
  const note = reviews[index]
  const last = reviews.length - 1

  return (
    <section className="notes" data-header="light">
      <div className="notes-head">
        <p className="kicker">Clients</p>
        <h2>What clients say.</h2>
        <p>
          {String(index + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}
        </p>
      </div>
      <figure className="note-card">
        <blockquote>
          <q>{note.quote}</q>
        </blockquote>
        <figcaption>
          <strong>{note.name}</strong>
          <span>Client</span>
        </figcaption>
      </figure>
      <div className="note-nav">
        <button type="button" onClick={() => setIndex((value) => (value === 0 ? last : value - 1))}>
          Previous
        </button>
        <button type="button" onClick={() => setIndex((value) => (value === last ? 0 : value + 1))}>
          Next
        </button>
      </div>
    </section>
  )
}

function Questions() {
  const [open, setOpen] = useState(0)

  return (
    <section className="questions">
      <p className="kicker">Work process</p>
      <h2>From the first meeting to move-in.</h2>
      <div>
        {process.map((item, index) => {
          const on = open === index
          return (
            <article className={`faq-item ${on ? "is-open" : ""}`} key={item.no}>
              <h3>
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? -1 : index)}
                >
                  {item.no} {item.title}
                  <span aria-hidden="true">{on ? "–" : "+"}</span>
                </button>
              </h3>
              {on && <p>{item.body}</p>}
            </article>
          )
        })}
      </div>
      <Link className="btn-line" to="/contact">
        Book a free consultation
      </Link>
    </section>
  )
}
