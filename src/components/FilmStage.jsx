import { useEffect, useState } from "react"

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function FilmStage({ frames, className = "" }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!frames?.length || reduced()) return undefined
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % frames.length)
    }, 4600)
    return () => window.clearInterval(timer)
  }, [frames])

  if (!frames?.length) return null

  return (
    <div className={`film-stage ${className}`}>
      {frames.map((frame, frameIndex) => (
        <img
          key={frame.src}
          src={frame.src}
          alt={frameIndex === index ? frame.alt || "" : ""}
          className={frameIndex === index ? "is-on" : ""}
        />
      ))}
    </div>
  )
}
