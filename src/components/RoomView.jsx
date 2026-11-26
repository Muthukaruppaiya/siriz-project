import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const MODEL_URL = "/models/pixellabs-house-3842.glb"

function frameObject(camera, controls, object) {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.1)
  const dist = maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))
  controls.target.copy(center)
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.35, center.z + dist * 0.9)
  camera.near = Math.max(0.05, maxDim / 100)
  camera.far = maxDim * 30
  camera.updateProjectionMatrix()
  controls.minDistance = dist * 0.35
  controls.maxDistance = dist * 4
  controls.maxPolarAngle = Math.PI * 0.92
  controls.update()
}

function disposeObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) return
    child.geometry?.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!material) return
      ;["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"].forEach((key) => {
        material[key]?.dispose()
      })
      material.dispose()
    })
  })
}

export default function RoomView({ title, src = MODEL_URL, onClose }) {
  const mountRef = useRef(null)
  const [status, setStatus] = useState("loading")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return undefined
    let cancelled = false

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#e7dccb")
    const camera = new THREE.PerspectiveCamera(38, 1, 0.08, 200)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xc4a882, 0.85))
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.2)
    sun.position.set(4, 8, 6)
    scene.add(sun)

    const held = []
    const loader = new GLTFLoader()
    loader.load(
      src,
      (gltf) => {
        if (cancelled) {
          disposeObject(gltf.scene)
          return
        }
        scene.add(gltf.scene)
        held.push(gltf.scene)
        frameObject(camera, controls, gltf.scene)
        setStatus("ready")
      },
      (event) => {
        if (!event.total) return
        setProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      },
      () => {
        if (!cancelled) setStatus("error")
      }
    )

    const resize = () => {
      const width = el.clientWidth || 1
      const height = el.clientHeight || 1
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)

    let frame = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      controls.update()
      renderer.render(scene, camera)
    }
    draw()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      held.forEach(disposeObject)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [src])

  const note = status === "error"
    ? "The 3D file could not be opened."
    : status === "loading"
      ? `Opening the model… ${progress ? `${progress}%` : ""}`.trim()
      : "Drag to turn · scroll to zoom"

  return createPortal(
    <div className="room-view" role="dialog" aria-modal="true" aria-label={`${title} 3D view`} onClick={(event) => event.stopPropagation()}>
      <div className="room-bar">
        <p>{title}</p>
        <span>{note}</span>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="room-stage" ref={mountRef} />
      {status === "loading" && <p className="room-status">Opening the model… {progress ? `${progress}%` : ""}</p>}
    </div>,
    document.body
  )
}
