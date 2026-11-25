import { useRef } from "react"
import { studio } from "../data/site"
import { useReveal, useSmooth } from "../scroll"

function Chevron() {
  return <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
}

export default function Footer() {
  const year = new Date().getFullYear()
  const api = useSmooth()
  const rootRef = useRef(null)
  useReveal(rootRef)

  return (
    <footer className="site-footer" ref={rootRef} data-tone="light">
      <div className="footer-sheet">
        <div className="footer-intro">
          <p className="footer-kicker" data-reveal>Visit · Call · Write</p>
          <p className="footer-hello" data-reveal style={{ "--d": "0.06s" }}>
            Let’s design your <em>dream home.</em>
          </p>
          <p className="footer-lead" data-reveal style={{ "--d": "0.12s" }}>{studio.location}</p>
          <div className="footer-cta" data-reveal style={{ "--d": "0.18s" }}>
            <a className="footer-btn is-solid" href={studio.phoneHref}>Call the studio</a>
            <a className="footer-btn" href={studio.whatsapp} target="_blank" rel="noreferrer">WhatsApp us</a>
          </div>
        </div>
        <div className="footer-rows" data-reveal style={{ "--d": "0.1s" }}>
          <a className="glass-row" href={studio.phoneHref}>
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 4h3l1.2 3.2-1.8 1.1a12 12 0 0 0 5.3 5.3l1.1-1.8L20 13v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4z" /></svg>
            </span>
            <span>{studio.phone}</span>
            <Chevron />
          </a>
          <a className="glass-row" href={`mailto:${studio.email}`}>
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
            </span>
            <span>{studio.email}</span>
            <Chevron />
          </a>
          <a className="glass-row" href={studio.whatsapp} target="_blank" rel="noreferrer">
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 19l1.2-3.4A8 8 0 1 1 8.4 18L5 19z" /></svg>
            </span>
            <span>WhatsApp</span>
            <Chevron />
          </a>
          <a className="glass-row" href={studio.instagram} target="_blank" rel="noreferrer">
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /></svg>
            </span>
            <span>Instagram</span>
            <Chevron />
          </a>
          <a className="glass-row" href={studio.youtube} target="_blank" rel="noreferrer">
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 8.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM11 9.5v5l4.5-2.5z" /></svg>
            </span>
            <span>YouTube</span>
            <Chevron />
          </a>
        </div>
      </div>
      <p className="footer-mark" aria-hidden="true">Siriz Interiors</p>
      <div className="footer-bottom">
        <span>© {year} Siriz Interiors · Medavakkam, Chennai</span>
        <button type="button" className="footer-top" onClick={() => api.scrollTo(0, { duration: 2.2 })}>
          Back to top
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
      </div>
    </footer>
  )
}
