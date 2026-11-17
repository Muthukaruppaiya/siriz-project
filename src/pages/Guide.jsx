import { Link, useParams } from "react-router-dom"
import { articles, getArticle } from "../data/site"
import { ParallaxImage } from "../components/Parallax"
import { useTitle } from "../useTitle"
import NotFound from "./NotFound"

export function Guide() {
  useTitle("Guide")
  const [feature, ...rest] = articles
  return (
    <>
      <section className="text-hero is-tight">
        <p className="kicker">Guide</p>
        <h1>Notes from the studio.</h1>
        <p className="lede">
          How we use colour, daylight, and material, and what it is like to commission a room.
        </p>
      </section>
      <Link className="band" to={`/guide/${feature.slug}`} data-header="light">
        <ParallaxImage className="parallax--fill" src={feature.image} alt={feature.imageAlt} speed={0.22} />
        <div className="band-copy">
          <p className="kicker">01 — Guide</p>
          <h2>{feature.title}</h2>
          <p>{feature.summary}</p>
          <span className="btn-line">Read</span>
        </div>
      </Link>
      <div className="essay-list">
        {rest.map((article, index) => (
          <Link className="essay-row" to={`/guide/${article.slug}`} key={article.slug}>
            <p className="kicker">{String(index + 2).padStart(2, "0")}</p>
            <div>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
            </div>
            <ParallaxImage className="frame-square" src={article.image} alt={article.imageAlt} speed={0.12} />
          </Link>
        ))}
      </div>
    </>
  )
}

export function Article() {
  const { slug } = useParams()
  const article = getArticle(slug)
  useTitle(article?.title || "Guide")
  if (!article) return <NotFound />

  const index = articles.findIndex((item) => item.slug === article.slug)
  const next = articles[(index + 1) % articles.length]

  return (
    <>
      <section className="text-hero">
        <p className="kicker crumb">
          <Link to="/guide">Guide</Link>
          <span>/</span>
          {String(index + 1).padStart(2, "0")}
        </p>
        <h1>{article.title}</h1>
        <p className="lede">{article.summary}</p>
      </section>
      <figure className="essay-figure">
        <ParallaxImage className="frame-wide" src={article.image} alt={article.imageAlt} speed={0.18} priority />
      </figure>
      <article className="essay">
        {article.paragraphs.map((paragraph, paragraphIndex) => (
          <p key={paragraph}>
            {paragraph}
            {paragraphIndex === 1 && <span className="pull">{article.pull}</span>}
          </p>
        ))}
      </article>
      <Link className="next-project" to={`/guide/${next.slug}`}>
        <span>
          <span className="kicker">Next note</span>
          <strong>{next.title}</strong>
        </span>
        <span className="btn-line">Continue</span>
      </Link>
    </>
  )
}
