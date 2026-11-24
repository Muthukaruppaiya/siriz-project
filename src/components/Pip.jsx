import { useEffect, useRef } from "react"
import * as THREE from "three"

function createAura(container, opts = {}) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const state = {
    yaw: 0,
    holdUntil: 0,
    drag: false,
    talkUntil: 0,
    happyUntil: 0,
    spinAt: -9,
    look: { x: 0, y: 0 },
    thinking: false,
  }
  let running = false
  let raf = 0
  let last = 0
  let glow = 0.5
  let scale = 1
  const now = () => performance.now() / 1000
  const ease = (object, key, value, rate) => {
    object[key] += (value - object[key]) * rate
  }
  const clamp = (value) => Math.max(-1, Math.min(1, value))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
  camera.position.set(0, 0.1, opts.cameraZ || 7.2)
  camera.lookAt(0, 0, 0)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const canvas = renderer.domElement
  canvas.style.cssText = "display:block;width:100%;height:100%;pointer-events:none;"
  container.appendChild(canvas)

  const accent = new THREE.Color(opts.accent != null ? opts.accent : 0xffb347)
  const cream = new THREE.Color(0xfff6e8)

  function bladeMat(inner, outer, alpha) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        cIn: { value: inner.clone() },
        cOut: { value: outer.clone() },
        uAlpha: { value: alpha },
        uGlow: { value: 0.5 },
      },
      vertexShader: `
        attribute float aV;
        varying vec3 vN;
        varying vec3 vV;
        varying float vv;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vv = aV;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 cIn;
        uniform vec3 cOut;
        uniform float uAlpha;
        uniform float uGlow;
        varying vec3 vN;
        varying vec3 vV;
        varying float vv;
        void main() {
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
          vec3 c = mix(cIn, cOut, smoothstep(0.0, 1.0, vv));
          float g = pow(1.0 - vv, 3.0) * uGlow;
          c += g * cIn * 0.8;
          float a = uAlpha * (0.55 + 1.1 * f) * (0.7 + 0.5 * uGlow) + g * 0.22;
          gl_FragColor = vec4(c, clamp(a, 0.0, 0.9));
        }
      `,
    })
  }

  function point(start, span, width, radius, twistStart, twistRange, u, v) {
    const theta = start + u * span
    const envelope = Math.sin(Math.PI * u) ** 0.7
    const band = width * (0.08 + 0.92 * envelope)
    const twist = twistStart + u * twistRange
    const offset = (v - 0.5) * band
    const ring = radius * (1 + 0.07 * Math.cos(5 * theta)) + offset * Math.cos(twist)
    return [
      ring * Math.cos(theta),
      ring * Math.sin(theta),
      offset * Math.sin(twist) * 1.2 + (u - 0.5) * 0.5,
    ]
  }

  function blade(start, span, width, radius, twistStart, twistRange) {
    const stepsU = 64
    const stepsV = 12
    const positions = []
    const across = []
    const indices = []
    for (let i = 0; i <= stepsU; i += 1) {
      for (let j = 0; j <= stepsV; j += 1) {
        positions.push(...point(start, span, width, radius, twistStart, twistRange, i / stepsU, j / stepsV))
        across.push(j / stepsV)
      }
    }
    for (let i = 0; i < stepsU; i += 1) {
      for (let j = 0; j < stepsV; j += 1) {
        const a = i * (stepsV + 1) + j
        const b = a + stepsV + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute("aV", new THREE.Float32BufferAttribute(across, 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }

  function edge(start, span, width, radius, twistStart, twistRange, v, material) {
    const points = []
    for (let i = 0; i <= 64; i += 1) {
      const spot = point(start, span, width, radius, twistStart, twistRange, i / 64, v)
      points.push(new THREE.Vector3(spot[0], spot[1], spot[2]))
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material)
  }

  const root = new THREE.Group()
  scene.add(root)
  const tilt = new THREE.Group()
  root.add(tilt)
  const ringA = new THREE.Group()
  const ringB = new THREE.Group()
  tilt.add(ringA)
  tilt.add(ringB)
  const materialA = bladeMat(accent.clone().lerp(cream, 0.35), cream, 0.3)
  const materialB = bladeMat(accent, accent.clone().lerp(cream, 0.55), 0.24)
  const materials = [materialA, materialB]
  const lineA = new THREE.LineBasicMaterial({
    color: accent.clone().lerp(cream, 0.2),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  const lineB = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  })
  for (let step = 0; step < 5; step += 1) {
    const start = (step * Math.PI * 2) / 5
    ringA.add(new THREE.Mesh(blade(start, 2.7, 0.95, 1.15, -0.7, 1.4), materialA))
    ringA.add(edge(start, 2.7, 0.95, 1.15, -0.7, 1.4, 0, lineA))
    ringA.add(edge(start, 2.7, 0.95, 1.15, -0.7, 1.4, 1, lineB))
    const inner = start + Math.PI / 5
    ringB.add(new THREE.Mesh(blade(inner, 2.2, 0.62, 1.08, 0.9, -1.2), materialB))
    ringB.add(edge(inner, 2.2, 0.62, 1.08, 0.9, -1.2, 0, lineA))
  }
  ringB.rotation.z = 0.3

  const glowCanvas = document.createElement("canvas")
  glowCanvas.width = 128
  glowCanvas.height = 128
  const context = glowCanvas.getContext("2d")
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, "rgba(255,255,255,1)")
  gradient.addColorStop(0.35, "rgba(255,255,255,.4)")
  gradient.addColorStop(1, "rgba(255,255,255,0)")
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(glowCanvas)
  const glowMaterial = (opacity) => new THREE.MeshBasicMaterial({
    map: texture,
    color: accent,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial(0.3))
  halo.scale.set(4.4, 4.4, 1)
  halo.position.set(0, -0.3, -0.5)
  tilt.add(halo)

  function tick(ms) {
    if (!running) return
    raf = requestAnimationFrame(tick)
    const time = ms / 1000
    const delta = Math.min(time - last, 0.05)
    last = time
    const talking = time < state.talkUntil
    const happy = time < state.happyUntil
    const thinking = state.thinking && !talking
    const pace = reduce ? 0.3 : 1
    const voice = talking ? 0.5 + 0.5 * Math.sin(time * 9 + Math.sin(time * 3) * 2) : 0
    ringA.rotation.z += delta * pace * (thinking ? 1.2 : talking ? 0.5 : 0.12)
    ringB.rotation.z -= delta * pace * (thinking ? 1.6 : talking ? 0.7 : 0.18)
    const targetGlow = 0.5 + voice * 0.9 + (happy ? 0.5 : 0) + (thinking ? 0.15 + 0.2 * Math.sin(time * 4) : 0)
    glow += (targetGlow - glow) * 0.12
    materials.forEach((material) => {
      material.uniforms.uGlow.value = glow
    })
    halo.material.opacity = 0.2 + glow * 0.28
    const targetScale = 1 + voice * 0.07 + (happy ? 0.05 * Math.sin(time * 12) : 0) + (reduce ? 0 : Math.sin(time * 1.6) * 0.02)
    scale += (targetScale - scale) * 0.2
    tilt.scale.setScalar(scale)
    root.position.y = reduce ? 0 : Math.sin(time * 1.2) * 0.07
    const spun = time - state.spinAt
    let extra = 0
    if (spun >= 0 && spun < 1.4) {
      const progress = spun / 1.4
      extra = Math.PI * 2 * (progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2)
    }
    if (time > state.holdUntil) state.yaw *= 0.965
    ease(root.rotation, "y", state.yaw + extra + (Math.abs(state.yaw) < 0.25 ? state.look.x * 0.35 : 0), 0.12)
    ease(root.rotation, "x", state.look.y * 0.25, 0.08)
    renderer.render(scene, camera)
  }

  function resize() {
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  function onMove(event) {
    const rect = container.getBoundingClientRect()
    state.look.x = clamp((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.45))
    state.look.y = clamp((event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight * 0.45))
  }
  window.addEventListener("pointermove", onMove)

  function start() {
    if (running) return
    running = true
    raf = requestAnimationFrame(tick)
  }
  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }
  start()

  return {
    talk(seconds) { state.talkUntil = now() + (seconds == null ? 3 : seconds) },
    stopTalking() { state.talkUntil = 0 },
    wave() {
      state.spinAt = now()
      state.happyUntil = Math.max(state.happyUntil, now() + 1.6)
    },
    happy(seconds) { state.happyUntil = now() + (seconds == null ? 2 : seconds) },
    thinking(on) { state.thinking = !!on },
    start,
    stop,
    resize,
    destroy() {
      stop()
      window.removeEventListener("pointermove", onMove)
      observer.disconnect()
      renderer.dispose()
      renderer.forceContextLoss()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    },
  }
}

export default function Pip({ speaking, listening, waveTick = 0 }) {
  const hostRef = useRef(null)
  const apiRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const aura = createAura(host)
    apiRef.current = aura
    return () => {
      apiRef.current = null
      aura.destroy()
    }
  }, [])

  useEffect(() => {
    const aura = apiRef.current
    if (!aura) return
    if (speaking) aura.talk(30)
    else aura.stopTalking()
    aura.thinking(listening && !speaking)
  }, [speaking, listening])

  useEffect(() => {
    if (!waveTick) return
    apiRef.current?.wave()
  }, [waveTick])

  return <span ref={hostRef} className="pip-view" aria-hidden="true" />
}
