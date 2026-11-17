import { useEffect, useState } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import Footer from "./components/Footer"
import Header from "./components/Header"
import Intro from "./components/Intro"
import { ParallaxLayers } from "./components/Parallax"
import { Progress } from "./components/Progress"
import Contact from "./pages/Contact"
import { GalleryHome, InteriorGallery, ProjectFrames, ProjectGallery, VideoGallery } from "./pages/Gallery"
import { Article, Guide } from "./pages/Guide"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import Portfolio from "./pages/Portfolio"
import Project from "./pages/Project"
import { SignaturePage, Signatures } from "./pages/Signatures"
import { SmoothScroll, useSmooth } from "./scroll"

export default function App() {
  const { pathname } = useLocation()
  const [introOn, setIntroOn] = useState(() => {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("is-intro", introOn)
    return () => document.documentElement.classList.remove("is-intro")
  }, [introOn])

  return (
    <SmoothScroll>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Progress />
      {introOn && <Intro onDone={() => setIntroOn(false)} />}
      <Header />
      <ParallaxLayers />
      <ScrollReset />
      <main id="content" className="view" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signatures" element={<Signatures />} />
          <Route path="/signatures/:slug" element={<SignaturePage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<Project />} />
          <Route path="/gallery" element={<GalleryHome />} />
          <Route path="/gallery/interior" element={<InteriorGallery />} />
          <Route path="/gallery/video" element={<VideoGallery />} />
          <Route path="/gallery/projects" element={<ProjectGallery />} />
          <Route path="/gallery/projects/:slug" element={<ProjectFrames />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/guide/:slug" element={<Article />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
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
