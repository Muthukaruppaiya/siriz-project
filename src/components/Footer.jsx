import { Link } from "react-router-dom"
import { nav, studio } from "../data/site"
import { Drift } from "./Parallax"

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <p className="footer-brand">
        <Drift speed={0.06}>Siriz</Drift>
      </p>
      <div className="footer-grid">
        <div>
          <p className="kicker">Studio</p>
          <p>{studio.location}</p>
          <a href={studio.phoneHref}>{studio.phone}</a>
          <a href={`mailto:${studio.email}`}>{studio.email}</a>
          <a href={studio.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={studio.youtube} target="_blank" rel="noreferrer">
            YouTube
          </a>
        </div>
        <div>
          <p className="kicker">Signatures</p>
          <Link to="/signatures">Overview</Link>
          <Link to="/signatures/siriz-signature">Siriz Signature</Link>
          <Link to="/signatures/mood-board">Signature Mood Board</Link>
        </div>
        <div>
          <p className="kicker">Gallery</p>
          <Link to="/gallery">Overview</Link>
          <Link to="/gallery/interior">Interior Gallery</Link>
          <Link to="/gallery/video">Video Gallery</Link>
          <Link to="/gallery/projects">Projectwise Gallery</Link>
        </div>
        <div>
          <p className="kicker">Visit</p>
          {nav
            .filter((item) => ["Portfolio", "Guide", "Contact", "Home"].includes(item.label))
            .map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {year} Siriz Interiors</p>
        <p>Cream, warm beige, and deep brown.</p>
      </div>
    </footer>
  )
}
