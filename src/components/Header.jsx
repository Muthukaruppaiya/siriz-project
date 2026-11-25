import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { nav, studio } from "../data/site"
import { useScrollFrame, useSmooth } from "../scroll"

function isCurrent(pathname, to) {
  if (to === "/") return pathname === "/"
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Header() {
  const { pathname } = useLocation()
  const api = useSmooth()
  const [open, setOpen] = useState(false)
  const [light, setLight] = useState(false)
  const [tucked, setTucked] = useState(false)
  const skipLock = useRef(true)
  const lastY = useRef(0)

  useScrollFrame((y) => {
    const delta = y - lastY.current
    if (Math.abs(delta) > 6) {
      const hide = delta > 0 && y > 160
      setTucked((value) => (value === hide ? value : hide))
      lastY.current = y
    }
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
      <header className={`site-header ${light && !open ? "is-light" : ""} ${open ? "is-open" : ""} ${tucked && !open ? "is-tucked" : ""}`}>
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
            {nav
              .filter((item) => item.to === "/")
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`glass-row ${isCurrent(pathname, item.to) ? "is-current" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="glass-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>
                  </span>
                  <span>{item.label}</span>
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
