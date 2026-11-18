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
  const [shot, setShot] = useState(studio.hero)
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
        <p className="header-mark">Atelier</p>
        <button
          className={`nav-toggle ${open ? "is-open" : ""}`}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>
      <div
        className={`menu ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        {...(!open ? { inert: "" } : {})}
      >
        <p className="menu-watermark">Siriz</p>
        <div className="menu-panel">
          <ol className="menu-list">
            {nav
              .filter((item) => item.to === "/")
              .map((item, index) => (
              <li className="menu-item" key={item.to}>
                <Link
                  to={item.to}
                  className={`menu-link ${isCurrent(pathname, item.to) ? "is-current" : ""}`}
                  onMouseEnter={() => item.image && setShot(item.image)}
                  onFocus={() => item.image && setShot(item.image)}
                  onClick={() => setOpen(false)}
                >
                  <small className="menu-index">{String(index + 1).padStart(2, "0")}</small>
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="menu-sub">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <Link
                          to={child.to}
                          className={isCurrent(pathname, child.to) ? "is-current" : ""}
                          onMouseEnter={() => item.image && setShot(item.image)}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <aside className="menu-aside">
            <div className="menu-shot">
              <img src={shot} alt="" />
            </div>
            <p className="menu-note">Rooms composed in cream, warm beige, and deep brown.</p>
          </aside>
        </div>
      </div>
    </>
  )
}
