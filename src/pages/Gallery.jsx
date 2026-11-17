import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { getProject, interiorImages, projects, roomsOf, rooms, videos } from "../data/site"
import FilmStage from "../components/FilmStage"
import Lightbox from "../components/Lightbox"
import { ParallaxImage } from "../components/Parallax"
import { useSmooth } from "../scroll"
import { useTitle } from "../useTitle"
import NotFound from "./NotFound"

const hubs = [
  {
    to: "/gallery/interior",
    kicker: "01 — Stills",
    title: "Interior Gallery",
    lede: "Frames gathered by the way a room is used: living, sleeping, dining, cooking, bathing.",
    image: interiorImages[0].src,
    alt: interiorImages[0].alt,
  },
  {
    to: "/gallery/video",
    kicker: "02 — Motion",
    title: "Video Gallery",
    lede: "Slow studies of light moving across the rooms. Each film is a short sequence from a project.",
    image: videos[2].frames[0].src,
    alt: videos[2].frames[0].alt,
  },
  {
    to: "/gallery/projects",
    kicker: "03 — By project",
    title: "Projectwise Gallery",
    lede: "The same rooms, kept together, so a house can be read from the first frame to the last.",
    image: projects[4].cover,
    alt: projects[4].coverAlt,
  },
]

export function GalleryHome() {
  useTitle("Gallery")
  return (
    <>
      <section className="text-hero is-tight">
        <p className="kicker">Gallery</p>
        <h1>Three ways to look.</h1>
      </section>
      {hubs.map((hub) => (
        <Link key={hub.to} to={hub.to} className="band" data-header="light">
          <ParallaxImage className="parallax--fill" src={hub.image} alt={hub.alt} speed={0.22} />
          <div className="band-copy">
            <p className="kicker">{hub.kicker}</p>
            <h2>{hub.title}</h2>
            <p>{hub.lede}</p>
            <span className="btn-line">Enter</span>
          </div>
        </Link>
      ))}
    </>
  )
}

export function InteriorGallery() {
  useTitle("Interior Gallery")
  const [room, setRoom] = useState("All")
  const [index, setIndex] = useState(-1)
  const images = roomsOf(room)

  return (
    <>
      <section className="page-hero page-hero-short" data-header="light">
        <ParallaxImage
          className="parallax--fill"
          src={interiorImages[1].src}
          alt={interiorImages[1].alt}
          speed={0.22}
          priority
        />
        <div className="page-hero-shade" />
        <div className="page-hero-copy">
          <p className="kicker crumb">
            <Link to="/gallery">Gallery</Link>
            <span>/</span>
            Interior
          </p>
          <h1>Interior Gallery</h1>
          <p className="lede">Still rooms, gathered by how they are lived in.</p>
        </div>
      </section>
      <div className="filters" role="tablist" aria-label="Filter by room">
        {rooms.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-btn ${room === item ? "is-on" : ""}`}
            aria-pressed={room === item}
            onClick={() => {
              setRoom(item)
              setIndex(-1)
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="block">
        <div className="masonry">
          {images.map((image, imageIndex) => (
            <button
              key={`${image.src}-${image.caption}`}
              type="button"
              className="masonry-item"
              style={{ aspectRatio: image.room === "Bath" || image.room === "Sleeping" ? "3 / 4" : "4 / 5" }}
              onClick={() => setIndex(imageIndex)}
            >
              <img src={image.src} alt={image.alt} />
              <span>
                {image.caption}
                {image.project ? ` — ${image.project}` : ""}
              </span>
            </button>
          ))}
        </div>
      </section>
      <Lightbox images={images} index={index} onClose={() => setIndex(-1)} onIndex={setIndex} />
    </>
  )
}

export function VideoGallery() {
  useTitle("Video Gallery")
  const [active, setActive] = useState(null)
  const closeFilm = useCallback(() => setActive(null), [])

  return (
    <>
      <section className="text-hero is-tight">
        <p className="kicker crumb">
          <Link to="/gallery">Gallery</Link>
          <span>/</span>
          Video
        </p>
        <h1>Video Gallery</h1>
        <p className="lede">Experience the interiors in a few clicks, anytime, from the Siriz video gallery.</p>
      </section>
      <section className="block films">
        {videos.map((film) => (
          <button key={film.slug} type="button" className="film-card" onClick={() => setActive(film)}>
            <FilmStage frames={film.frames} />
            <span className="play">Play</span>
            <span className="film-meta">
              <span className="kicker">{film.project}</span>
              <strong>{film.title}</strong>
            </span>
          </button>
        ))}
      </section>
      {active && <FilmModal film={active} onClose={closeFilm} />}
    </>
  )
}

function FilmModal({ film, onClose }) {
  const api = useSmooth()
  useEffect(() => {
    api.stop()
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      api.start()
    }
  }, [api, onClose])

  return (
    <div className="overlay film-modal" role="dialog" aria-modal="true" aria-label={film.title} onClick={onClose}>
      <button className="lb-close" type="button" onClick={onClose}>
        Close
      </button>
      <div className="film-dialog" onClick={(event) => event.stopPropagation()}>
        {film.youtube ? (
          <iframe
            src={`${film.youtube}?autoplay=1`}
            title={film.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <FilmStage frames={film.frames} />
        )}
        {!film.youtube && (
          <div className="film-dialog-copy">
            <p className="kicker">{film.project}</p>
            <h2>{film.title}</h2>
            <p>{film.lede}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProjectGallery() {
  useTitle("Projectwise Gallery")
  return (
    <>
      <section className="text-hero">
        <p className="kicker crumb">
          <Link to="/gallery">Gallery</Link>
          <span>/</span>
          Projectwise
        </p>
        <h1>Projectwise Gallery</h1>
        <p className="lede">Every frame kept with the room it belongs to.</p>
      </section>
      <div className="archive">
        {projects.map((project, index) => (
          <Link className="archive-row" to={`/gallery/projects/${project.slug}`} key={project.slug}>
            <p className="kicker">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h2>{project.title}</h2>
              <p>{project.typology}</p>
            </div>
            <p className="archive-count">{project.images.length} frames</p>
            <ParallaxImage className="frame-square" src={project.cover} alt={project.coverAlt} speed={0.14} />
          </Link>
        ))}
      </div>
    </>
  )
}

export function ProjectFrames() {
  const { slug } = useParams()
  const project = getProject(slug)
  useTitle(project ? `${project.title} frames` : "Gallery")
  if (!project) return <NotFound />

  return (
    <>
      <section className="text-hero">
        <p className="kicker crumb">
          <Link to="/gallery/projects">Projectwise Gallery</Link>
          <span>/</span>
          {project.title}
        </p>
        <h1>{project.title}</h1>
        <p className="lede">{project.summary}</p>
      </section>
      <section className="frame-stack">
        {project.images.map((image, index) => (
          <figure key={image.src}>
            <ParallaxImage className="frame-wide" src={image.src} alt={image.alt} speed={0.2} priority={index === 0} />
            <figcaption>
              <span>
                {String(index + 1).padStart(2, "0")} — {image.caption}
              </span>
              <span>{image.room}</span>
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="end-links block">
        <Link to={`/portfolio/${project.slug}`} className="btn-line">
          Read the project
        </Link>
      </div>
    </>
  )
}
