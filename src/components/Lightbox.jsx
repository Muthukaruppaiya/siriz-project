import { useEffect, useRef } from "react"
import { useSmooth } from "../scroll"

export default function Lightbox({ images, index, onClose, onIndex }) {
  const api = useSmooth()
  const open = index >= 0
  const indexRef = useRef(index)
  const closeRef = useRef(onClose)
  const setRef = useRef(onIndex)
  indexRef.current = index
  closeRef.current = onClose
  setRef.current = onIndex

  useEffect(() => {
    if (!open) return undefined
    api.stop()
    const onKey = (event) => {
      const current = indexRef.current
      const count = images.length
      if (event.key === "Escape") closeRef.current()
      if (event.key === "ArrowRight") setRef.current((current + 1) % count)
      if (event.key === "ArrowLeft") setRef.current((current - 1 + count) % count)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      api.start()
    }
  }, [open, api, images.length])

  if (!open) return null
  const image = images[index]

  return (
    <div className="overlay lightbox" role="dialog" aria-modal="true" aria-label={image.alt || "Frame"} onClick={onClose}>
      <button className="lb-close" type="button" onClick={onClose}>
        Close
      </button>
      <button
        className="lb-nav"
        type="button"
        aria-label="Previous frame"
        onClick={(event) => {
          event.stopPropagation()
          onIndex((index - 1 + images.length) % images.length)
        }}
      >
        Prev
      </button>
      <figure className="lb-figure" onClick={(event) => event.stopPropagation()}>
        <img src={image.src} alt={image.alt || ""} />
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          {image.project && <span>{image.project}</span>}
        </figcaption>
        <p className="kicker">
          {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </p>
      </figure>
      <button
        className="lb-nav"
        type="button"
        aria-label="Next frame"
        onClick={(event) => {
          event.stopPropagation()
          onIndex((index + 1) % images.length)
        }}
      >
        Next
      </button>
    </div>
  )
}
