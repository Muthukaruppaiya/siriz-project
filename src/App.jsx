import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

if ("scrollRestoration" in history) history.scrollRestoration = "manual"
import CornerBot from "./components/CornerBot"
import Footer from "./components/Footer"
import Header from "./components/Header"
// Door opening intro. Uncomment this import, the introOn state, and the <Intro> block below to bring the cupboard doors back.
// import Intro from "./components/Intro"
import { ParallaxLayers } from "./components/Parallax"
import { Progress } from "./components/Progress"
import Home from "./pages/Home"
import { SmoothScroll, useSmooth } from "./scroll"

export default function App() {
  const { pathname } = useLocation()
  const [loading, setLoading] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  useEffect(() => {
    document.documentElement.classList.toggle("is-intro", loading)
    return () => document.documentElement.classList.remove("is-intro")
  }, [loading])

  return (
    <SmoothScroll>
      <a className="skip" href="#content">
        Skip to content
      </a>
      {loading && <LoadFilm onDone={() => setLoading(false)} />}
      <Progress />
      {/* Door opening intro — cupboard doors. Uncomment to play them again on open.
      {introOn && (
        <Intro
          onDone={() => {
            setIntroOn(false)
            window.scrollTo(0, 0)
          }}
        />
      )}
      */}
      <Header />
      <ParallaxLayers />
      <ScrollReset />
      <main id="content" className="view" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CornerBot />
    </SmoothScroll>
  )
}

function LoadFilm({ onDone }) {
  useEffect(() => {
    const film = document.querySelector(".load-film")
    const videos = [...(film?.querySelectorAll("video") || [])]
    if (!videos.length) {
      onDone()
      return undefined
    }
    let closed = false
    let fade = 0
    const finish = () => {
      if (closed) return
      closed = true
      film.classList.add("is-done")
      fade = window.setTimeout(onDone, 460)
    }
    const main = videos[videos.length - 1]
    const cue = (video) => new Promise((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const go = () => {
        if (video.currentTime >= 0.45) {
          done()
          return
        }
        video.addEventListener("seeked", done, { once: true })
        try {
          video.currentTime = 0.5
        } catch {
          done()
        }
      }
      if (video.readyState >= 1) go()
      else video.addEventListener("loadedmetadata", go, { once: true })
      window.setTimeout(done, 900)
    })
    Promise.all(videos.map(cue)).then(() => {
      if (closed) return
      videos.forEach((video) => {
        video.muted = true
        const attempt = video.play()
        if (attempt && attempt.catch) attempt.catch(() => {})
      })
      film.classList.add("is-on")
    })
    main.addEventListener("ended", finish)
    main.addEventListener("error", finish)
    const backup = window.setTimeout(finish, 5600)
    return () => {
      main.removeEventListener("ended", finish)
      main.removeEventListener("error", finish)
      window.clearTimeout(fade)
      window.clearTimeout(backup)
    }
  }, [onDone])

  return (
    <div className="load-film" role="dialog" aria-label="Siriz Interiors">
      <video className="load-wash" src="/loader.mp4" muted playsInline preload="auto" aria-hidden="true" />
      <video className="load-main" src="/loader.mp4" muted playsInline preload="auto" />
    </div>
  )
}

function ScrollReset() {
  const { pathname } = useLocation()
  const api = useSmooth()
  useEffect(() => {
    api.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [pathname, api])
  return null
}
