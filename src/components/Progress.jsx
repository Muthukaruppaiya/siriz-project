import { useRef } from "react"
import { useScrollFrame } from "../scroll"

export function Progress() {
  const ref = useRef(null)
  useScrollFrame((y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
    if (ref.current) ref.current.style.transform = `scaleX(${progress})`
  })
  return <div className="progress" ref={ref} />
}
