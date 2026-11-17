import { Link } from "react-router-dom"
import { projects } from "../data/site"
import { ParallaxImage } from "../components/Parallax"
import { useTitle } from "../useTitle"

export default function Portfolio() {
  useTitle("Portfolio")
  return (
    <>
      <section className="text-hero">
        <p className="kicker">Portfolio</p>
        <h1>Selected rooms.</h1>
        <p className="lede">
          Private houses, an apartment, a dining room, and a loft. Each one stays inside the same three
          colours, and none of them repeats the last.
        </p>
      </section>
      <div className="folio">
        {projects.map((project, index) => (
          <Link className="folio-row" to={`/portfolio/${project.slug}`} key={project.slug}>
            <div className="folio-copy">
              <p className="kicker">
                {String(index + 1).padStart(2, "0")} — {project.typology}
              </p>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
            </div>
            <ParallaxImage className="frame-std" src={project.cover} alt={project.coverAlt} speed={0.16} />
          </Link>
        ))}
      </div>
    </>
  )
}
