import { Link, useParams } from "react-router-dom"
import { getProject, projects } from "../data/site"
import { ParallaxImage } from "../components/Parallax"
import { useTitle } from "../useTitle"
import NotFound from "./NotFound"

export default function Project() {
  const { slug } = useParams()
  const project = getProject(slug)
  useTitle(project?.title || "Portfolio")
  if (!project) return <NotFound />

  const index = projects.findIndex((item) => item.slug === project.slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <>
      <section className="page-hero" data-header="light">
        <ParallaxImage className="parallax--fill" src={project.cover} alt={project.coverAlt} speed={0.26} priority />
        <div className="page-hero-shade" />
        <div className="page-hero-copy">
          <p className="kicker crumb">
            <Link to="/portfolio">Portfolio</Link>
            <span>/</span>
            {String(index + 1).padStart(2, "0")}
          </p>
          <h1>{project.title}</h1>
          <p className="lede">{project.summary}</p>
        </div>
      </section>

      <section className="block">
        <dl className="facts">
          <div>
            <dt>Typology</dt>
            <dd>{project.typology}</dd>
          </div>
          <div>
            <dt>Palette</dt>
            <dd>{project.palette}</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>{project.scope}</dd>
          </div>
        </dl>
        <div className="story">
          {project.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <blockquote className="quote-block quote-inline">
          <p>{project.quote}</p>
        </blockquote>
        {project.tour && (
          <a className="btn-line" href={project.tour} target="_blank" rel="noreferrer">
            Open the 360 tour
          </a>
        )}
      </section>

      <section className="frame-stack">
        {project.images.map((image) => (
          <figure key={image.src}>
            <ParallaxImage className="frame-wide" src={image.src} alt={image.alt} speed={0.18} />
            <figcaption>
              <span>{image.caption}</span>
              <span>{image.room}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <div className="end-links block">
        <Link to={`/gallery/projects/${project.slug}`} className="btn-line">
          Projectwise frames
        </Link>
      </div>

      <Link className="next-project" to={`/portfolio/${next.slug}`}>
        <span>
          <span className="kicker">Next project</span>
          <strong>{next.title}</strong>
        </span>
        <span className="btn-line">Continue</span>
      </Link>
    </>
  )
}
