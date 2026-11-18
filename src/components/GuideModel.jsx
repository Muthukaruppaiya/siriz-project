import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export default function GuideModel({ speaking, listening }) {
  const canvasRef = useRef(null)
  const speakingRef = useRef(speaking)
  const listeningRef = useRef(listening)
  speakingRef.current = speaking
  listeningRef.current = listening

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      })
    } catch {
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10)
    camera.position.set(0, 0.15, 0.58)
    camera.lookAt(0, 0.12, 0)

    scene.add(new THREE.HemisphereLight(0xfff6ec, 0x6b4b38, 1.35))
    const key = new THREE.DirectionalLight(0xffffff, 1.05)
    key.position.set(0.35, 0.7, 0.8)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xf0d7b0, 0.4)
    rim.position.set(-0.4, 0.4, -0.3)
    scene.add(rim)

    const rig = new THREE.Group()
    scene.add(rig)

    let alive = true
    const loader = new GLTFLoader()
    loader.load("/guide.glb", (gltf) => {
      if (!alive) return
      const model = gltf.scene
      model.traverse((obj) => {
        if (!obj.isMesh) return
        obj.frustumCulled = false
        ;[].concat(obj.material || []).forEach((material) => {
          material.side = THREE.FrontSide
        })
      })
      rig.add(model)
      canvas.classList.add("is-ready")
    })

    const look = { x: 0, y: 0 }
    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height
      look.y = Math.max(-0.55, Math.min(0.55, dx * 0.7))
      look.x = Math.max(-0.28, Math.min(0.28, dy * 0.35))
    }
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true })

    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    let frame = 0
    const started = performance.now()
    const loop = (now) => {
      if (!alive) return
      const t = (now - started) / 1000
      const nod = speakingRef.current && !reduce ? Math.sin(t * 9) * 0.06 : 0
      const sway = reduce ? 0 : Math.sin(t * 0.9) * 0.08
      rig.rotation.y += (look.y + sway - rig.rotation.y) * 0.12
      rig.rotation.x += (look.x + nod - rig.rotation.x) * 0.12
      const bob = listeningRef.current && !reduce ? Math.sin(t * 3) * 0.004 : 0
      rig.position.y += (bob - rig.position.y) * 0.1
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("pointermove", onMove)
      scene.traverse((obj) => {
        if (!obj.isMesh) return
        obj.geometry?.dispose()
        ;[].concat(obj.material || []).forEach((material) => {
          material.map?.dispose()
          material.dispose()
        })
      })
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [])

  return <canvas ref={canvasRef} className="guide-canvas" aria-hidden="true" />
}
