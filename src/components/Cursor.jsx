import { useEffect, useRef } from "react"

export default function Cursor() {
  const ref = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    if (!fine) return undefined
    document.documentElement.classList.add("has-cursor")
    const el = ref.current
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let frame = 0
    let hot = false

    const move = (event) => {
      x = event.clientX
      y = event.clientY
      el.classList.add("is-on")
    }
    const over = (event) => {
      hot = Boolean(event.target.closest("a, button"))
      el.classList.toggle("is-hot", hot)
    }
    const loop = () => {
      cx += (x - cx) * 0.18
      cy += (y - cy) * 0.18
      const scale = hot ? 1.65 : 1
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${scale})`
      frame = requestAnimationFrame(loop)
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerover", over)
    frame = requestAnimationFrame(loop)
    return () => {
      document.documentElement.classList.remove("has-cursor")
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerover", over)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <div className="cursor" ref={ref} />
}
