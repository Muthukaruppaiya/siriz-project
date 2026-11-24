import { Link } from "react-router-dom"
import { studio } from "../data/site"

function Chevron() {
  return <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
}

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-sheet">
        <p className="footer-hello">How can we help?</p>
        <p className="footer-lead">{studio.location}</p>
        <div className="footer-rows">
          <Link className="glass-row" to="/">
            <span className="glass-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>
            </span>
            <span>Home</span>
            <Chevron />
          </Link>
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
        <p className="footer-bottom">© {year} Siriz Interiors</p>
      </div>
    </footer>
  )
}
