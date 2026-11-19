import { useEffect } from "react"
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
  // const [introOn, setIntroOn] = useState(() => {
  //   return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  // })
  //
  // useEffect(() => {
  //   document.documentElement.classList.toggle("is-intro", introOn)
  //   return () => document.documentElement.classList.remove("is-intro")
  // }, [introOn])

  return (
    <SmoothScroll>
      <a className="skip" href="#content">
        Skip to content
      </a>
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

function ScrollReset() {
  const { pathname } = useLocation()
  const api = useSmooth()
  useEffect(() => {
    api.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [pathname, api])
  return null
}
