import { Link, useParams } from "react-router-dom"
import { getSignature, moodBoard, palette, signatures } from "../data/site"
import { ParallaxImage } from "../components/Parallax"
import { useTitle } from "../useTitle"
import NotFound from "./NotFound"

export function Signatures() {
  useTitle("Signatures")
  return (
    <>
      <section className="text-hero">
        <p className="kicker">Signatures</p>
        <h1>Two ways into the work.</h1>
        <p className="lede">
          The signature is the language. The mood board is the material memory we return to on every
          commission.
        </p>
      </section>
      <div className="bands">
        {signatures.map((item) => (
          <Link key={item.slug} to={`/signatures/${item.slug}`} className="band" data-header="light">
            <ParallaxImage className="parallax--fill" src={item.image} alt={item.imageAlt} speed={0.22} />
            <div className="band-copy">
              <p className="kicker">Signatures</p>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function SignaturePage() {
  const { slug } = useParams()
  const signature = getSignature(slug)
  useTitle(signature?.title || "Signatures")
  if (!signature) return <NotFound />
  if (slug === "mood-board") return <MoodBoard signature={signature} />
  return <SignatureEssay signature={signature} />
}

function SignatureEssay({ signature }) {
  return (
    <>
      <section className="page-hero" data-header="light">
        <ParallaxImage
          className="parallax--fill"
          src={signature.image}
          alt={signature.imageAlt}
          speed={0.24}
          priority
        />
        <div className="page-hero-shade" />
        <div className="page-hero-copy">
          <p className="kicker crumb">
            <Link to="/signatures">Signatures</Link>
            <span>/</span>
            Siriz Signature
          </p>
          <h1>{signature.title}</h1>
          <p className="lede">{signature.lede}</p>
        </div>
      </section>

      <section className="block">
        <div className="palette" aria-label="Studio palette">
          {palette.map((chip) => (
            <article key={chip.name} className="palette-chip" style={{ background: chip.hex, color: chip.ink }}>
              <p className="kicker">Palette</p>
              <div>
                <strong>{chip.name}</strong>
                <p>{chip.note}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="chapters">
          {signature.chapters.map((chapter) => (
            <article className="chapter-grid" key={chapter.no}>
              <p className="kicker">{chapter.no}</p>
              <div>
                <h2>{chapter.title}</h2>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <blockquote className="quote-block">
        <p>{signature.quote}</p>
      </blockquote>

      {signature.gallery && (
        <section className="frame-stack">
          {signature.gallery.map((shot) => (
            <figure key={shot.src}>
              <img src={shot.src} alt={shot.alt} />
            </figure>
          ))}
        </section>
      )}

      <section className="block end-links">
        <Link to="/signatures/mood-board" className="btn-line">
          Signature mood board
        </Link>
        <Link to="/portfolio" className="btn-line">
          See the portfolio
        </Link>
      </section>
    </>
  )
}

function MoodBoard({ signature }) {
  return (
    <>
      <section className="page-hero" data-header="light">
        <ParallaxImage
          className="parallax--fill"
          src={signature.image}
          alt={signature.imageAlt}
          speed={0.24}
          priority
        />
        <div className="page-hero-shade" />
        <div className="page-hero-copy">
          <p className="kicker crumb">
            <Link to="/signatures">Signatures</Link>
            <span>/</span>
            Mood board
          </p>
          <h1>{signature.title}</h1>
          <p className="lede">{signature.lede}</p>
        </div>
      </section>
      <section className="block">
        <div className="board">
          {moodBoard.map((item) => (
            <figure
              key={item.name}
              className={`board-item ${item.image ? "is-photo" : "is-color"} ${item.ink === "dark" ? "is-ink-dark" : ""}`}
              style={item.color ? { background: item.color } : undefined}
            >
              {item.image && <img src={item.image} alt={item.alt || ""} />}
              <figcaption>
                <strong>{item.name}</strong>
                <span>{item.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="block end-links">
        <Link to="/signatures/siriz-signature" className="btn-line">
          Read the signature
        </Link>
        <Link to="/gallery/interior" className="btn-line">
          Interior gallery
        </Link>
      </section>
    </>
  )
}
