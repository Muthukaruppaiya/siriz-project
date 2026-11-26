import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { studio } from "../data/site"
import { useScrollFrame, useSmooth } from "../scroll"

const pages = [
  { id: "home", label: "Home", icon: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" },
  { id: "works", label: "Our Works", icon: "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" },
  { id: "why", label: "Why Siriz", icon: "M12 4l1.6 4.2L18 10l-4.4 1.8L12 16l-1.6-4.2L6 10l4.4-1.8z" },
  { id: "process", label: "Work Process", icon: "M5 7h14M5 12h14M5 17h9" },
  { id: "recognition", label: "Recognition", icon: "M8 4h8v3a4 4 0 0 1-8 0zM8 6H6v1a3 3 0 0 0 3 3M16 6h2v1a3 3 0 0 1-3 3M12 14v3M9 20h6" },
  { id: "instagram", label: "Instagram", icon: "M7 4.5h10a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 7 4.5zM12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM16.4 7.6h.01" },
]

export default function Header() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const currentPage = (hash || "#home").slice(1)

  const goTo = (event, id) => {
    event.preventDefault()
    setOpen(false)
    navigate(`/#${id}`)
    window.setTimeout(() => {
      const node = document.getElementById(id)
      const top = node ? node.getBoundingClientRect().top + window.scrollY : 0
      window.scrollTo({ top, behavior: "smooth" })
    }, 90)
  }
  const api = useSmooth()
  const [open, setOpen] = useState(false)
  const [light, setLight] = useState(false)
  const skipLock = useRef(true)

  useScrollFrame(() => {
    const nodes = document.querySelectorAll("[data-header='light']")
    let over = false
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (rect.top < 72 && rect.bottom > 72) over = true
    })
    setLight((value) => (value === over ? value : over))
  })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (skipLock.current) {
      skipLock.current = false
      return
    }
    if (open) api.stop()
    else api.start()
  }, [open, api])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <header className={`site-header ${light && !open ? "is-light" : ""} ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand" aria-label="Siriz Interiors, home">
          <img src="/logo.png" alt="Siriz Interiors" />
        </Link>
        <button
          className={`nav-toggle ${open ? "is-open" : ""}`}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path className="nav-bar nav-bar-a" d="M5 9h14" />
            <path className="nav-bar nav-bar-b" d="M5 15h14" />
          </svg>
        </button>
      </header>
      <div
        className={`menu ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        {...(!open ? { inert: "" } : {})}
      >
        <div className="menu-sheet">
          <p className="menu-hello">Where should we begin?</p>
          <nav className="menu-rows" aria-label="Pages">
            {pages.map((page) => (
              <Link
                key={page.id}
                to={`/#${page.id}`}
                className={`glass-row ${currentPage === page.id ? "is-current" : ""}`}
                onClick={(event) => goTo(event, page.id)}
              >
                <span className="glass-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d={page.icon} /></svg>
                </span>
                <span>{page.label}</span>
                <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </Link>
            ))}
            <a className="glass-row" href={studio.phoneHref}>
              <span className="glass-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M8 4h3l1.2 3.2-1.8 1.1a12 12 0 0 0 5.3 5.3l1.1-1.8L20 13v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4z" /></svg>
              </span>
              <span>{studio.phone}</span>
              <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
            <a className="glass-row" href={`mailto:${studio.email}`}>
              <span className="glass-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
              </span>
              <span>{studio.email}</span>
              <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
            <a className="glass-row" href={studio.instagram} target="_blank" rel="noreferrer">
              <span className="glass-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.2" cy="6.8" r="0.8" /></svg>
              </span>
              <span>Instagram</span>
              <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
            <a className="glass-row" href={studio.youtube} target="_blank" rel="noreferrer">
              <span className="glass-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 8.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM11 9.5v5l4.5-2.5z" /></svg>
              </span>
              <span>YouTube</span>
              <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          </nav>
        </div>
      </div>
    </>
  )
}
