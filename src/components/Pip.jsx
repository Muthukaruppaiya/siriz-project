import { useEffect, useRef } from "react"
import * as THREE from "three"

function createPip(container, opts = {}) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const state = {
    yaw: 0,
    holdUntil: 0,
    drag: false,
    talkUntil: 0,
    happyUntil: 0,
    waveUntil: 0,
    blinkAt: 2,
    blinkEnd: 0,
    look: { x: 0, y: 0 },
    thinking: false,
  }
  const parts = {}
  let running = false
  let raf = 0
  const now = () => performance.now() / 1000

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1.3, 0.1, 60)
  camera.position.set(0, 0.9, 8.8)
  camera.lookAt(0, 0.7, 0)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;"
  container.appendChild(renderer.domElement)

  const physical = (color, roughness, clearcoat) => new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat: clearcoat == null ? 0.35 : clearcoat,
    clearcoatRoughness: 0.35,
  })
  const basic = (color, opacity) => new THREE.MeshBasicMaterial({
    color,
    transparent: opacity != null,
    opacity: opacity == null ? 1 : opacity,
  })

  const cream = physical(0xf4e7d6, 0.5)
  const creamS = physical(0xe3d0ba, 0.55)
  const ivory = physical(0xfdf8f1, 0.45)
  const peach = physical(0xeaa766, 0.45)
  const peachL = physical(0xf5c490, 0.45)
  const steel = physical(0x8fb1c6, 0.3, 0.8)
  const black = physical(0x0b0b0e, 0.12, 1)
  const glow = basic(0xffffff)
  const blush = basic(0xf48a8a, 0.7)
  const line = basic(0x2b1d1a)
  const sphere = new THREE.SphereGeometry(1, 40, 30)
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 32)

  function rounded(width, height, radius) {
    const x = -width / 2
    const y = -height / 2
    const shape = new THREE.Shape()
    shape.moveTo(x + radius, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    shape.lineTo(x + radius, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - radius)
    shape.lineTo(x, y + radius)
    shape.quadraticCurveTo(x, y, x + radius, y)
    return shape
  }

  function smooth(geometry) {
    const position = geometry.attributes.position
    const normal = geometry.attributes.normal
    const groups = {}
    const keyOf = (index) => `${position.getX(index).toFixed(3)},${position.getY(index).toFixed(3)},${position.getZ(index).toFixed(3)}`
    for (let index = 0; index < position.count; index += 1) {
      const key = keyOf(index)
      const group = groups[key] || [0, 0, 0]
      groups[key] = group
      group[0] += normal.getX(index)
      group[1] += normal.getY(index)
      group[2] += normal.getZ(index)
    }
    for (let index = 0; index < position.count; index += 1) {
      const group = groups[keyOf(index)]
      const length = Math.hypot(group[0], group[1], group[2]) || 1
      normal.setXYZ(index, group[0] / length, group[1] / length, group[2] / length)
    }
    return geometry
  }

  function slab(width, height, radius, depth, bevel, segments) {
    const geometry = new THREE.ExtrudeGeometry(rounded(width, height, radius), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: segments || 6,
      curveSegments: 18,
    })
    geometry.translate(0, 0, -depth / 2)
    return smooth(geometry)
  }

  function place(parent, geometry, material, position, scale) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position[0], position[1], position[2])
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2])
    parent.add(mesh)
    return mesh
  }

  function bar(parent, from, to, radius, material) {
    const start = new THREE.Vector3(from[0], from[1], from[2])
    const end = new THREE.Vector3(to[0], to[1], to[2])
    const delta = end.clone().sub(start)
    const mesh = new THREE.Mesh(cylinder, material)
    mesh.position.copy(start.clone().add(end).multiplyScalar(0.5))
    mesh.scale.set(radius, delta.length(), radius)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize())
    parent.add(mesh)
    return mesh
  }

  parts.root = new THREE.Group()
  scene.add(parts.root)
  parts.upper = new THREE.Group()
  parts.root.add(parts.upper)
  parts.head = new THREE.Group()
  parts.head.position.set(0, 1.5, 0)
  parts.upper.add(parts.head)

  ;[-1, 1].forEach((side) => {
    place(parts.root, cylinder, creamS, [side * 0.3, -0.85, 0], [0.16, 0.22, 0.16])
    place(parts.root, sphere, cream, [side * 0.3, -1.15, 0.1], [0.3, 0.2, 0.4])
  })
  place(parts.upper, sphere, cream, [0, 0, 0], [0.78, 0.72, 0.64])
  place(parts.upper, sphere, peach, [-0.36, 0.14, 0.52], [0.12, 0.15, 0.04])
  place(parts.upper, sphere, steel, [-0.36, 0.14, 0.53], [0.085, 0.11, 0.04])
  place(parts.upper, slab(0.3, 0.2, 0.07, 0.01, 0.03, 3), peach, [0.22, -0.12, 0.58])
  place(parts.upper, slab(0.24, 0.14, 0.05, 0.01, 0.025, 3), ivory, [0.22, -0.12, 0.6])
  ;[0.15, 0.29].forEach((x) => place(parts.upper, sphere, peach, [x, -0.1, 0.64], [0.025, 0.025, 0.015]))
  const smileMark = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16, Math.PI), peach)
  smileMark.position.set(0.22, -0.14, 0.64)
  smileMark.rotation.z = Math.PI
  parts.upper.add(smileMark)
  place(parts.upper, slab(0.5, 0.6, 0.2, 0.16, 0.12, 5), cream, [0, 0.05, -0.78])
  const backpack = place(parts.upper, slab(0.3, 0.36, 0.1, 0.01, 0.03, 3), creamS, [0, 0.05, -0.99])
  backpack.rotation.y = Math.PI

  function arm(side) {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * 0.8, 0.22, 0)
    parts.upper.add(shoulder)
    place(shoulder, sphere, cream, [0, 0, 0], [0.2, 0.2, 0.2])
    place(shoulder, cylinder, cream, [0, -0.2, 0], [0.16, 0.22, 0.16])
    place(shoulder, cylinder, peach, [0, -0.17, 0], [0.18, 0.07, 0.18])
    const elbow = new THREE.Group()
    elbow.position.y = -0.42
    shoulder.add(elbow)
    place(elbow, sphere, cream, [0, 0, 0], [0.15, 0.15, 0.15])
    place(elbow, cylinder, cream, [0, -0.17, 0], [0.14, 0.17, 0.14])
    place(elbow, sphere, cream, [0, -0.4, 0], [0.2, 0.19, 0.18])
    place(elbow, sphere, cream, [side * 0.14, -0.36, 0.05], [0.08, 0.1, 0.08])
    return { shoulder, elbow }
  }
  parts.left = arm(-1)
  parts.right = arm(1)

  place(parts.head, slab(1.6, 1.2, 0.5, 1, 0.45, 10), cream, [0, 0, 0])
  ;[-1, 1].forEach((side) => place(parts.head, sphere, creamS, [side * 0.3, 0.93, 0.84], [0.035, 0.035, 0.02]))
  place(parts.head, slab(1.38, 0.98, 0.4, 0.02, 0.04, 4), creamS, [0, 0, 0.97])
  place(parts.head, slab(1.28, 0.88, 0.36, 0.02, 0.035, 4), ivory, [0, 0, 0.985])
  parts.eyes = []
  parts.irises = []
  ;[-1, 1].forEach((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * 0.38, 0.06, 0)
    parts.head.add(eye)
    const iris = new THREE.Group()
    eye.add(iris)
    place(iris, sphere, black, [0, 0, 1.04], [0.15, 0.17, 0.1])
    place(iris, sphere, glow, [0.05, 0.07, 1.13], [0.045, 0.045, 0.02])
    place(iris, sphere, glow, [-0.045, -0.06, 1.12], [0.02, 0.02, 0.015])
    parts.eyes.push(eye)
    parts.irises.push(iris)
    place(parts.head, sphere, blush, [side * 0.58, -0.14, 1.045], [0.14, 0.09, 0.015])
  })
  parts.smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI), line)
  parts.smile.position.set(0, -0.04, 1.05)
  parts.smile.rotation.z = Math.PI
  parts.smile.scale.set(1, 0.6, 1)
  parts.head.add(parts.smile)
  parts.mouth = place(parts.head, sphere, line, [0, -0.1, 1.05], [0.09, 0.02, 0.02])

  ;[-1, 1].forEach((side) => {
    const cup = place(parts.head, cylinder, peach, [side * 1.37, -0.05, 0], [0.45, 0.24, 0.3])
    cup.rotation.z = Math.PI / 2
    const ring = place(parts.head, cylinder, peachL, [side * 1.5, -0.05, 0], [0.3, 0.06, 0.19])
    ring.rotation.z = Math.PI / 2
  })
  parts.antenna = new THREE.Group()
  parts.antenna.position.set(1.36, 0.4, -0.1)
  parts.head.add(parts.antenna)
  bar(parts.antenna, [0, 0, 0], [0.4, 1, 0], 0.035, peach)
  place(parts.antenna, sphere, peach, [0.4, 1.02, 0], [0.14, 0.14, 0.14])

  parts.ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.025, 8, 64), basic(0xeaa766, 0.8))
  parts.ring.rotation.x = Math.PI / 2
  parts.ring.position.y = -1.36
  scene.add(parts.ring)
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), basic(0x000000, 0.28))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.37
  scene.add(shadow)
  parts.shadow = shadow
  if (opts.floor === false) {
    parts.ring.visible = false
    parts.shadow.visible = false
  }

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a4658, 0.95))
  const key = new THREE.DirectionalLight(0xffffff, 0.9)
  key.position.set(2.5, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffc48a, 0.8)
  rim.position.set(-3, 2, -3)
  scene.add(rim)

  const ease = (object, keyName, value, rate) => {
    object[keyName] += (value - object[keyName]) * rate
  }

  function tick(ms) {
    if (!running) return
    raf = requestAnimationFrame(tick)
    const time = ms / 1000
    const talk = time < state.talkUntil
    const happy = time < state.happyUntil
    const wave = time < state.waveUntil
    const think = state.thinking && !talk
    const sway = reduce ? 0 : Math.sin(time * 1.7)
    const lookX = think ? 0.5 : state.look.x
    const lookY = think ? -0.6 : state.look.y
    parts.upper.position.y = sway * 0.035
    parts.upper.scale.y = 1 + sway * 0.01
    if (!state.drag && time > state.holdUntil) state.yaw *= 0.965
    ease(parts.root.rotation, "y", state.yaw + (Math.abs(state.yaw) < 0.25 ? lookX * 0.22 : 0), 0.12)
    const nod = talk && !reduce ? Math.sin(time * 7) * 0.05 : 0
    ease(parts.head.rotation, "y", lookX * 0.5, 0.08)
    ease(parts.head.rotation, "x", lookY * 0.3 + nod, 0.08)
    ease(parts.head.rotation, "z", think ? 0.14 : (reduce ? 0 : Math.sin(time * 0.7) * 0.02), 0.08)
    parts.irises.forEach((iris) => {
      ease(iris.position, "x", lookX * 0.07, 0.2)
      ease(iris.position, "y", -lookY * 0.05, 0.2)
    })
    if (time > state.blinkAt) {
      state.blinkEnd = time + 0.13
      state.blinkAt = time + 2 + Math.random() * 3.5
    }
    const eyeScale = happy ? 0.3 : (time < state.blinkEnd ? 0.08 : 1)
    parts.eyes.forEach((eye) => ease(eye.scale, "y", eyeScale, 0.45))
    const open = talk ? 0.03 + (Math.sin(time * 17 + Math.sin(time * 5) * 2) * 0.5 + 0.5) * 0.11 : 0
    ease(parts.mouth.scale, "y", Math.max(0.02, open), 0.4)
    ease(parts.mouth.scale, "x", talk ? 0.13 : 0.15, 0.2)
    parts.smile.visible = parts.mouth.scale.y < 0.045
    ease(parts.smile.scale, "x", happy ? 1.3 : 1, 0.2)
    ease(parts.smile.scale, "y", happy ? 0.9 : 0.55, 0.2)
    const right = parts.right
    const left = parts.left
    if (wave) {
      ease(right.shoulder.rotation, "z", 2.5, 0.15)
      ease(right.shoulder.rotation, "x", 0, 0.15)
      ease(right.elbow.rotation, "z", Math.sin(time * 11) * 0.55, 0.3)
      ease(right.elbow.rotation, "x", 0, 0.15)
    } else if (talk) {
      ease(right.shoulder.rotation, "z", 0.25, 0.1)
      ease(right.shoulder.rotation, "x", -0.35, 0.1)
      ease(right.elbow.rotation, "z", 0, 0.1)
      ease(right.elbow.rotation, "x", -0.9 + Math.sin(time * 3) * 0.3, 0.15)
    } else {
      ease(right.shoulder.rotation, "z", 0.16 + sway * 0.02, 0.1)
      ease(right.shoulder.rotation, "x", 0, 0.1)
      ease(right.elbow.rotation, "z", 0, 0.15)
      ease(right.elbow.rotation, "x", -0.12, 0.1)
    }
    if (think) {
      ease(left.shoulder.rotation, "z", -0.1, 0.1)
      ease(left.shoulder.rotation, "x", -0.9, 0.1)
      ease(left.elbow.rotation, "x", -2.2, 0.1)
    } else if (talk) {
      ease(left.shoulder.rotation, "z", -0.25, 0.1)
      ease(left.shoulder.rotation, "x", -0.3, 0.1)
      ease(left.elbow.rotation, "x", -0.8 + Math.sin(time * 3.3 + 1) * 0.3, 0.15)
    } else {
      ease(left.shoulder.rotation, "z", -0.16 - sway * 0.02, 0.1)
      ease(left.shoulder.rotation, "x", 0, 0.1)
      ease(left.elbow.rotation, "x", -0.12, 0.1)
    }
    parts.antenna.rotation.z = reduce ? 0 : Math.sin(time * (talk ? 9 : 2)) * (talk ? 0.1 : 0.04)
    parts.ring.material.opacity = 0.55 + (reduce ? 0 : Math.sin(time * 2) * 0.2)
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

  const clamp = (value) => Math.max(-1, Math.min(1, value))
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
    wave(seconds) {
      state.waveUntil = now() + (seconds == null ? 2.2 : seconds)
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
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    },
  }
}

export default function Pip({ speaking, listening, waveTick = 0 }) {
  const hostRef = useRef(null)
  const apiRef = useRef(null)
  const speakingRef = useRef(speaking)
  const listeningRef = useRef(listening)
  speakingRef.current = speaking
  listeningRef.current = listening

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const pip = createPip(host, { floor: true })
    apiRef.current = pip
    return () => {
      apiRef.current = null
      pip.destroy()
    }
  }, [])

  useEffect(() => {
    const pip = apiRef.current
    if (!pip) return
    if (speaking) pip.talk(30)
    else pip.stopTalking()
    pip.thinking(listening && !speaking)
  }, [speaking, listening])

  useEffect(() => {
    if (!waveTick) return
    apiRef.current?.wave(2.2)
  }, [waveTick])

  return <span ref={hostRef} className="pip-view" aria-hidden="true" />
}
