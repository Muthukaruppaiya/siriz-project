import { useRef } from "react"
import { studio } from "../data/site"
import { useReveal, useSmooth } from "../scroll"

/* ── Brand-accurate filled icons ── */
function IcoPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6.5c0-.6.4-1 1-1H7.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  )
}

function IcoEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function IcoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.09-1.34A9.93 9.93 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.95 13.9c-.21.59-1.21 1.13-1.66 1.2-.43.06-.97.08-1.56-.1a14.34 14.34 0 0 1-1.42-.52c-2.5-1.08-4.13-3.6-4.25-3.77-.12-.16-.97-1.29-.97-2.46 0-1.17.61-1.74.83-1.98.21-.24.46-.3.62-.3l.44.01c.14 0 .33-.05.52.4.19.47.65 1.6.71 1.72.06.11.1.24.02.39-.08.15-.12.24-.23.37-.11.13-.24.29-.34.39-.11.11-.23.23-.1.45.13.22.59.97 1.26 1.57.86.78 1.59 1.02 1.81 1.13.22.11.35.09.48-.05.13-.14.55-.64.7-.86.14-.22.29-.18.49-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.06.09.06.52-.15 1.1z" />
    </svg>
  )
}

function IcoInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="footer-ig" cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285aeb" />
        </radialGradient>
      </defs>
      <path fill="url(#footer-ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function IcoYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const api = useSmooth()
  const rootRef = useRef(null)
  useReveal(rootRef)

  const links = [
    { key: "phone", label: "Call", href: studio.phoneHref, Icon: IcoPhone },
    { key: "mail", label: "Email", href: `mailto:${studio.email}`, Icon: IcoEmail },
    { key: "whatsapp", label: "WhatsApp", href: studio.whatsapp, Icon: IcoWhatsApp, external: true },
    { key: "instagram", label: "Instagram", href: studio.instagram, Icon: IcoInstagram, external: true },
    { key: "youtube", label: "YouTube", href: studio.youtube, Icon: IcoYouTube, external: true },
  ]

  return (
    <footer className="site-footer" ref={rootRef} data-tone="light">
      <div className="footer-sheet">
        <p className="footer-kicker" data-reveal>Visit · Call · Write</p>
        <p className="footer-hello" data-reveal style={{ "--d": "0.06s" }}>
          Let's design your <em>dream home.</em>
        </p>
        <p className="footer-lead" data-reveal style={{ "--d": "0.12s" }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></svg>
          <span>{studio.location}</span>
        </p>
        <div className="footer-cta" data-reveal style={{ "--d": "0.18s" }}>
          <a className="footer-btn is-solid" href={studio.phoneHref}>Call the studio</a>
          <a className="footer-btn" href={studio.whatsapp} target="_blank" rel="noreferrer">WhatsApp us</a>
        </div>
        <i className="footer-rule" data-reveal style={{ "--d": "0.22s" }} aria-hidden="true" />
        <ul className="footer-social" data-reveal style={{ "--d": "0.26s" }}>
          {links.map(({ key, label, href, Icon, external }) => (
            <li key={key}>
              <a
                className={`footer-logo is-${key}`}
                href={href}
                aria-label={label}
                data-label={label}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <Icon />
              </a>
            </li>
          ))}
        </ul>
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
