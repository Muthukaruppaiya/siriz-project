import { useEffect, useRef, useState } from "react"
import { useSmooth } from "../scroll"

export default function Intro({ onDone }) {
  const api = useSmooth()
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    api.stop()
    return () => api.start()
  }, [api])

  useEffect(() => {
    const hold = window.setTimeout(finish, 3200)
    return () => window.clearTimeout(hold)
  }, [])

  function finish() {
    if (done.current) return
    done.current = true
    setLeaving(true)
    window.setTimeout(onDone, 1450)
  }

  return (
    <div className={`intro ${leaving ? "is-leave" : ""}`} aria-hidden="true">
      <div className="intro-door intro-door-left">
        <span className="intro-line intro-line-a" />
      </div>
      <div className="intro-door intro-door-right">
        <span className="intro-line intro-line-c" />
      </div>
      <div className="intro-center">
        <div className="intro-seal">
          <svg className="intro-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="48" />
          </svg>
          <img src="/logo.png" alt="" />
        </div>
        <p className="intro-caption">Interior Atelier</p>
      </div>
      <button className="intro-skip" type="button" onClick={finish}>
        Skip
      </button>
    </div>
  )
}
