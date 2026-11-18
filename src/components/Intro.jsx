import { useEffect, useRef, useState } from "react"
import { useSmooth } from "../scroll"

export default function Intro({ onDone }) {
  const api = useSmooth()
  const [leaving, setLeaving] = useState(false)
  const [fading, setFading] = useState(false)
  const done = useRef(false)
  const closed = useRef(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    api.stop()
    document.body.dataset.scrollY = "0"
    document.body.style.top = "0"
    return () => {
      document.body.dataset.scrollY = "0"
      api.start()
      window.scrollTo(0, 0)
    }
  }, [api])

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 680px)").matches
    const hold = window.setTimeout(finish, mobile ? 700 : 900)
    return () => window.clearTimeout(hold)
  }, [])

  function close() {
    if (closed.current) return
    closed.current = true
    setFading(true)
    window.setTimeout(onDone, 520)
  }

  function finish() {
    if (done.current) return
    done.current = true
    setLeaving(true)
    window.setTimeout(close, 1100)
  }

  return (
    <div className={`intro ${leaving ? "is-leave" : ""} ${fading ? "is-fade" : ""}`} role="dialog" aria-label="Siriz Interiors">
      <div className="intro-door intro-door-left">
        <span className="cupboard-face">
          <span className="cupboard-panel" />
          <span className="cupboard-sheen" />
          <span className="cupboard-hinge cupboard-hinge-a" />
          <span className="cupboard-hinge cupboard-hinge-b" />
          <span className="cupboard-pull" />
        </span>
        <span className="cupboard-edge" />
      </div>
      <div className="intro-door intro-door-right">
        <span className="cupboard-face">
          <span className="cupboard-panel" />
          <span className="cupboard-sheen" />
          <span className="cupboard-hinge cupboard-hinge-a" />
          <span className="cupboard-hinge cupboard-hinge-b" />
          <span className="cupboard-pull" />
        </span>
        <span className="cupboard-edge" />
      </div>
      <div className="intro-top">
        <img src="/logo.png" alt="Siriz Interiors" />
      </div>
    </div>
  )
}
