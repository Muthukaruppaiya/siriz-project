import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

/**
 * Work Process: a real-time 3D living room that is built one step at a time.
 *
 *   -1  intro       faint blueprint grid
 *    0  meet        the plan is drawn on the floor (top-down camera)
 *    1  design      walls rise as blueprint glass
 *    2  3D view     furniture appears as wireframe, a scan sweeps through
 *    3  plan        plaster and wood come in, wireframes stay
 *    4  production  real furniture drops into place
 *    5  move-in     decor, pendant light on, warm sun
 *
 * Units are metres. The room is 5 x 5 m, open towards the camera.
 */

const ROOM = 5
const HALF = ROOM / 2
const WALL_H = 2.8
const WALL_T = 0.12
const BLUE = new THREE.Color("#a9c8ec")
const GOLD = new THREE.Color("#e2c48a")

function seeded(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(size, draw, repeat = 1) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  draw(canvas.getContext("2d"), size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  return texture
}

// Oak planks with grain, seams and tone variation.
function woodFloor() {
  const rand = seeded(7)
  return canvasTexture(1024, (ctx, size) => {
    const rows = 8
    const h = size / rows
    for (let row = 0; row < rows; row += 1) {
      let x = -rand() * size * 0.6
      while (x < size) {
        const len = size * (0.45 + rand() * 0.5)
        const tone = 160 + rand() * 18
        ctx.fillStyle = `rgb(${tone + 34}, ${tone * 0.7 + 18}, ${tone * 0.44})`
        ctx.fillRect(x, row * h, len, h)
        ctx.globalAlpha = 0.11
        for (let g = 0; g < 34; g += 1) {
          ctx.strokeStyle = rand() > 0.5 ? "#5a3718" : "#f3d3a4"
          ctx.lineWidth = 0.6 + rand() * 1.4
          ctx.beginPath()
          const gy = row * h + rand() * h
          ctx.moveTo(x, gy)
          ctx.bezierCurveTo(x + len * 0.3, gy + (rand() - 0.5) * 8, x + len * 0.7, gy + (rand() - 0.5) * 8, x + len, gy + (rand() - 0.5) * 4)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = "rgba(60, 36, 18, 0.55)"
        ctx.fillRect(x + len - 2, row * h, 2, h)
        x += len
      }
      ctx.fillStyle = "rgba(60, 36, 18, 0.5)"
      ctx.fillRect(0, row * h, size, 2)
    }
  }, 2.4)
}

function marble() {
  const rand = seeded(11)
  return canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = "#f3efe9"
    ctx.fillRect(0, 0, size, size)
    ctx.filter = "blur(1.2px)"
    for (let i = 0; i < 14; i += 1) {
      ctx.strokeStyle = `rgba(110, 108, 112, ${0.12 + rand() * 0.22})`
      ctx.lineWidth = 0.6 + rand() * 2.2
      ctx.beginPath()
      let x = rand() * size
      let y = 0
      ctx.moveTo(x, y)
      while (y < size) {
        x += (rand() - 0.5) * 60
        y += 20 + rand() * 40
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.filter = "none"
  })
}

function rug() {
  return canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = "#b5603d"
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = "#f1e2c8"
    ctx.lineWidth = 10
    ctx.strokeRect(26, 26, size - 52, size - 52)
    ctx.lineWidth = 3
    ctx.strokeRect(50, 50, size - 100, size - 100)
    ctx.fillStyle = "rgba(241, 226, 200, 0.85)"
    const step = 64
    for (let y = 96; y < size - 80; y += step) {
      for (let x = 96; x < size - 80; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, y - 14)
        ctx.lineTo(x + 14, y)
        ctx.lineTo(x, y + 14)
        ctx.lineTo(x - 14, y)
        ctx.closePath()
        ctx.fill()
      }
    }
    // woven texture
    ctx.globalAlpha = 0.08
    for (let i = 0; i < size; i += 3) {
      ctx.fillStyle = i % 6 ? "#000" : "#fff"
      ctx.fillRect(0, i, size, 1)
    }
    ctx.globalAlpha = 1
  })
}

function artPrint() {
  return canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = "#efe4d2"
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = "#c7764f"
    ctx.beginPath()
    ctx.arc(size * 0.38, size * 0.62, size * 0.24, Math.PI, 0)
    ctx.lineTo(size * 0.62, size * 0.86)
    ctx.lineTo(size * 0.14, size * 0.86)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "#8fa38f"
    ctx.beginPath()
    ctx.arc(size * 0.66, size * 0.34, size * 0.14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#2f2620"
    ctx.fillRect(size * 0.56, size * 0.52, size * 0.04, size * 0.34)
  })
}

// Soft noise so flat colours read as plaster and fabric, not plastic.
function noise(base, amount, seed, size = 256) {
  const rand = seeded(seed)
  const color = new THREE.Color(base)
  return canvasTexture(size, (ctx) => {
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 1 + (rand() - 0.5) * amount
      img.data[i] = Math.min(255, color.r * 255 * n)
      img.data[i + 1] = Math.min(255, color.g * 255 * n)
      img.data[i + 2] = Math.min(255, color.b * 255 * n)
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, 3)
}

/** A value that eases towards 0 or 1 over `dur` seconds, after an optional delay. */
class Anim {
  constructor(dur = 0.9, delay = 0) {
    this.p = 0
    this.target = 0
    this.dur = dur
    this.delay = delay
    this.wait = 0
  }
  set(on, now) {
    const next = on ? 1 : 0
    if (next === this.target) return
    this.target = next
    this.wait = on ? now + this.delay : now
  }
  tick(dt, now, instant) {
    if (instant) {
      this.p = this.target
      return
    }
    if (now < this.wait) return
    const speed = dt / (this.target ? this.dur : this.dur * 0.6)
    this.p = this.target ? Math.min(1, this.p + speed) : Math.max(0, this.p - speed)
  }
}

const ease = (t) => 1 - (1 - t) ** 3
const easeBack = (t) => {
  const c = 1.4
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

function setOpacity(material, value) {
  const o = Math.max(0, Math.min(1, value))
  material.opacity = o
  const solid = o >= 0.999
  if (material.transparent === solid) {
    material.transparent = !solid
    material.depthWrite = solid
    material.needsUpdate = true
  }
}

function buildScene(scene, { lowPower }) {
  const disposables = []
  const keep = (item) => {
    disposables.push(item)
    return item
  }
  const std = (params) => keep(new THREE.MeshStandardMaterial(params))
  const box = (w, h, d, r = 0) => keep(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d))

  const tex = {
    wood: keep(woodFloor()),
    marble: keep(marble()),
    rug: keep(rug()),
    art: keep(artPrint()),
    plaster: keep(noise("#efe6d8", 0.05, 3)),
    plaster2: keep(noise("#e6d8c3", 0.05, 4)),
    fabric: keep(noise("#8fa193", 0.16, 5, 128)),
    fabricLight: keep(noise("#a9b8aa", 0.14, 6, 128)),
  }

  const mat = {
    floor: std({ map: tex.wood, roughness: 0.55, metalness: 0 }),
    wallL: std({ map: tex.plaster, roughness: 0.95 }),
    wallR: std({ map: tex.plaster2, roughness: 0.95 }),
    trim: std({ color: "#f7f2ea", roughness: 0.6 }),
    oak: std({ color: "#c4955f", roughness: 0.55 }),
    walnut: std({ color: "#6b4329", roughness: 0.5 }),
    seam: std({ color: "#3a2516", roughness: 0.8 }),
    brass: std({ color: "#c9a25a", roughness: 0.32, metalness: 0.9 }),
    fabric: std({ map: tex.fabric, roughness: 1 }),
    fabricLight: std({ map: tex.fabricLight, roughness: 1 }),
    pillow: std({ color: "#d9a441", roughness: 1 }),
    marble: std({ map: tex.marble, roughness: 0.2, metalness: 0 }),
    tv: std({ color: "#111214", roughness: 0.25, metalness: 0.3 }),
    screen: std({ color: "#0b0d12", roughness: 0.15, emissive: new THREE.Color("#2a4a6e"), emissiveIntensity: 0 }),
    rug: std({ map: tex.rug, roughness: 1 }),
    pot: std({ color: "#c27a52", roughness: 0.85 }),
    leaf: std({ color: "#4f7f4a", roughness: 0.7, side: THREE.DoubleSide }),
    leaf2: std({ color: "#628f57", roughness: 0.7, side: THREE.DoubleSide }),
    art: std({ map: tex.art, roughness: 0.9 }),
    frame: std({ color: "#2b211b", roughness: 0.6 }),
    glass: keep(new THREE.MeshStandardMaterial({ color: "#d6e8f1", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.25, emissive: new THREE.Color("#cfe6f2"), emissiveIntensity: 0.35 })),
    sky: keep(new THREE.MeshBasicMaterial({ color: "#fff3d9" })),
    shade: std({ color: "#c9a25a", roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }),
    bulb: std({ color: "#fff4d6", emissive: new THREE.Color("#ffd88a"), emissiveIntensity: 0 }),
    cord: std({ color: "#1c1712", roughness: 0.8 }),
    ghost: keep(new THREE.MeshBasicMaterial({ color: "#7fb2ea", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })),
    ghostFloor: keep(new THREE.MeshBasicMaterial({ color: "#7fb2ea", transparent: true, opacity: 0, depthWrite: false })),
  }

  const lineMat = keep(new THREE.LineBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, depthWrite: false }))
  const planMat = keep(new THREE.LineBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, depthWrite: false }))
  const dashMat = keep(new THREE.LineDashedMaterial({ color: BLUE.clone(), dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0, depthWrite: false }))

  const mesh = (geometry, material, x, y, z, { shadow = true, rx = 0, ry = 0, rz = 0 } = {}) => {
    const m = new THREE.Mesh(geometry, material)
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, rz)
    m.castShadow = shadow
    m.receiveShadow = true
    return m
  }

  // ---------- plan: grid, outline, furniture footprints ----------
  const plan = new THREE.Group()
  const gridPoints = []
  for (let i = -HALF; i <= HALF + 0.001; i += 0.5) {
    gridPoints.push(-HALF, 0.004, i, HALF, 0.004, i, i, 0.004, -HALF, i, 0.004, HALF)
  }
  const gridGeo = keep(new THREE.BufferGeometry())
  gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridPoints, 3))
  const gridMat = keep(new THREE.LineBasicMaterial({ color: BLUE.clone(), transparent: true, opacity: 0, depthWrite: false }))
  plan.add(new THREE.LineSegments(gridGeo, gridMat))
  // Plan lines are cut into many short pieces so they can be revealed as if drawn.
  const drawn = []
  const sketch = (corners, y, material, order) => {
    const points = []
    for (let i = 0; i < corners.length - 1; i += 1) {
      const [ax, az] = corners[i]
      const [bx, bz] = corners[i + 1]
      for (let k = 0; k < 40; k += 1) points.push(new THREE.Vector3(ax + ((bx - ax) * k) / 40, y, az + ((bz - az) * k) / 40))
    }
    const [lx, lz] = corners[corners.length - 1]
    points.push(new THREE.Vector3(lx, y, lz))
    const line = new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(points)), material)
    line.computeLineDistances()
    line.geometry.setDrawRange(0, 0)
    plan.add(line)
    drawn.push({ line, count: points.length, order })
  }
  sketch([[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF], [-HALF, -HALF]], 0.006, planMat, 0)
  const footprints = [
    [-1.93, 0.2, 0.9, 1.9], [-0.75, 0.2, 0.7, 1.1], [0.5, -2.29, 1.6, 0.42], [-1.9, -2.21, 1.0, 0.58], [-0.95, 0.2, 1.9, 2.6],
  ]
  footprints.forEach(([x, z, w, d], index) => {
    sketch([[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2], [x - w / 2, z - d / 2]], 0.008, dashMat, 1 + index)
  })
  scene.add(plan)

  // a soft contact shadow so the built room sits on something
  const groundTex = keep(canvasTexture(256, (ctx, size) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2)
    g.addColorStop(0, "rgba(0,0,0,0.55)")
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }))
  const groundMat = keep(new THREE.MeshBasicMaterial({ map: groundTex, transparent: true, opacity: 0, depthWrite: false }))
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(9, 9)), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(-0.2, -0.02, -0.2)
  scene.add(ground)

  // ---------- shell: floor, walls with a window, door ----------
  const floor = mesh(keep(new THREE.PlaneGeometry(ROOM, ROOM)), mat.floor, 0, 0, 0, { shadow: false, rx: -Math.PI / 2 })
  scene.add(floor)
  const ghostFloor = mesh(keep(new THREE.PlaneGeometry(ROOM, ROOM)), mat.ghostFloor, 0, 0.002, 0, { shadow: false, rx: -Math.PI / 2 })
  scene.add(ghostFloor)

  const walls = new THREE.Group()
  const realWalls = []
  const ghostWalls = []
  const wall = (w, h, d, x, y, z, material) => {
    const geometry = box(w, h, d)
    const real = mesh(geometry, material, x, y, z)
    const ghost = mesh(geometry, mat.ghost, x, y, z, { shadow: false })
    const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(geometry)), lineMat)
    ghost.add(edges)
    walls.add(real, ghost)
    realWalls.push(real)
    ghostWalls.push(ghost)
  }
  const wx = -HALF - WALL_T / 2
  const win = { z0: -0.6, z1: 1.0, y0: 1.0, y1: 2.25 }
  wall(WALL_T, win.y0, ROOM, wx, win.y0 / 2, 0, mat.wallL)
  wall(WALL_T, WALL_H - win.y1, ROOM, wx, (WALL_H + win.y1) / 2, 0, mat.wallL)
  wall(WALL_T, win.y1 - win.y0, win.z0 + HALF, wx, (win.y0 + win.y1) / 2, (-HALF + win.z0) / 2, mat.wallL)
  wall(WALL_T, win.y1 - win.y0, HALF - win.z1, wx, (win.y0 + win.y1) / 2, (win.z1 + HALF) / 2, mat.wallL)
  wall(ROOM + WALL_T, WALL_H, WALL_T, -WALL_T / 2, WALL_H / 2, -HALF - WALL_T / 2, mat.wallR)

  // window: frame, mullion, glass and bright sky behind it
  const windowGroup = new THREE.Group()
  const wz = (win.z0 + win.z1) / 2
  const wy = (win.y0 + win.y1) / 2
  const ww = win.z1 - win.z0
  const wh = win.y1 - win.y0
  ;[
    [0.06, 0.06, ww + 0.12, wx + 0.02, win.y0 - 0.03, wz],
    [0.06, 0.06, ww + 0.12, wx + 0.02, win.y1 + 0.03, wz],
    [0.06, wh, 0.06, wx + 0.02, wy, win.z0 - 0.03],
    [0.06, wh, 0.06, wx + 0.02, wy, win.z1 + 0.03],
    [0.05, wh, 0.04, wx, wy, wz],
    [0.16, 0.04, ww + 0.2, wx + 0.1, win.y0 - 0.02, wz],
  ].forEach(([w, h, d, x, y, z]) => windowGroup.add(mesh(box(w, h, d), mat.trim, x, y, z)))
  const glass = mesh(keep(new THREE.PlaneGeometry(ww, wh)), mat.glass, wx - 0.01, wy, wz, { shadow: false, ry: Math.PI / 2 })
  glass.castShadow = false
  windowGroup.add(glass)
  // only as big as the window, so it never shows past the wall
  const sky = mesh(keep(new THREE.PlaneGeometry(ww + 0.5, wh + 0.4)), mat.sky, wx - 0.3, wy, wz, { shadow: false, ry: Math.PI / 2 })
  sky.castShadow = false
  windowGroup.add(sky)
  walls.add(windowGroup)

  // skirting and door on the right wall
  const trims = new THREE.Group()
  trims.add(mesh(box(0.02, 0.1, ROOM), mat.trim, -HALF + 0.01, 0.05, 0))
  trims.add(mesh(box(ROOM, 0.1, 0.02), mat.trim, 0, 0.05, -HALF + 0.01))
  trims.add(mesh(box(0.92, 2.12, 0.05), mat.oak, 1.92, 1.06, -HALF + 0.025))
  trims.add(mesh(box(1.04, 2.2, 0.03), mat.trim, 1.92, 1.1, -HALF + 0.012))
  trims.add(mesh(keep(new THREE.SphereGeometry(0.035, 16, 12)), mat.brass, 1.58, 1.0, -HALF + 0.07))
  // dark caps on the cut wall tops, as on an architect's cut-away model
  const cap = std({ color: "#2f241c", roughness: 0.9 })
  trims.add(mesh(box(WALL_T + 0.004, 0.014, ROOM), cap, wx, WALL_H + 0.007, 0, { shadow: false }))
  trims.add(mesh(box(ROOM + WALL_T + 0.004, 0.014, WALL_T + 0.004), cap, -WALL_T / 2, WALL_H + 0.007, -HALF - WALL_T / 2, { shadow: false }))
  walls.add(trims)
  scene.add(walls)

  // ---------- furniture and decor ----------
  const pieces = []
  const piece = (kind, order, build) => {
    const group = new THREE.Group()
    build(group)
    const meshes = []
    group.traverse((child) => {
      if (!child.isMesh) return
      child.material = child.material.clone()
      keep(child.material)
      meshes.push(child)
      if (kind === "furniture") {
        // Rounded shapes have no sharp edges to outline, so draw their bounding box;
        // round legs keep their own silhouette.
        let outline = child.geometry
        if (!(child.geometry instanceof THREE.CylinderGeometry)) {
          child.geometry.computeBoundingBox()
          const size = child.geometry.boundingBox.getSize(new THREE.Vector3())
          outline = keep(new THREE.BoxGeometry(size.x, size.y, size.z))
        }
        const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(outline, 28)), lineMat)
        edges.userData.wire = true
        child.add(edges)
      }
    })
    scene.add(group)
    pieces.push({ kind, group, meshes, solid: new Anim(0.95, order * 0.14) })
  }

  piece("furniture", 0, (g) => {
    // wardrobe in the back corner
    g.add(mesh(box(1.0, 2.2, 0.58, 0.015), mat.oak, -1.9, 1.1, -2.21))
    g.add(mesh(box(0.012, 2.08, 0.01), mat.seam, -1.9, 1.1, -1.915))
    g.add(mesh(box(1.04, 0.04, 0.6), mat.walnut, -1.9, 2.22, -2.21))
    ;[-1.96, -1.84].forEach((x) => g.add(mesh(keep(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 10)), mat.brass, x, 1.15, -1.9)))
  })
  piece("furniture", 1, (g) => {
    // TV unit and TV on the right wall
    g.add(mesh(box(1.6, 0.42, 0.42, 0.012), mat.walnut, 0.5, 0.31, -2.27))
    ;[-0.27, 0.27].forEach((dx) => g.add(mesh(box(0.008, 0.36, 0.01), mat.seam, 0.5 + dx, 0.31, -2.055)))
    ;[-0.65, 0.65].forEach((dx) => g.add(mesh(keep(new THREE.CylinderGeometry(0.018, 0.012, 0.1, 10)), mat.brass, 0.5 + dx, 0.05, -2.12)))
    g.add(mesh(box(1.3, 0.74, 0.04, 0.01), mat.tv, 0.5, 1.3, -2.42))
    const screen = mesh(keep(new THREE.PlaneGeometry(1.24, 0.68)), mat.screen, 0.5, 1.3, -2.398, { shadow: false })
    screen.userData.screen = true
    g.add(screen)
  })
  piece("furniture", 2, (g) => {
    // sofa under the window
    const x = -1.93
    const z = 0.2
    ;[[-0.38, -0.85], [0.38, -0.85], [-0.38, 1.25], [0.38, 1.25]].forEach(([dx, dz]) =>
      g.add(mesh(keep(new THREE.CylinderGeometry(0.025, 0.018, 0.12, 10)), mat.walnut, x + dx, 0.06, z + dz * 0.75)))
    g.add(mesh(box(0.9, 0.22, 1.9, 0.05), mat.fabric, x, 0.23, z))
    g.add(mesh(box(0.22, 0.62, 1.9, 0.07), mat.fabric, -2.29, 0.5, z))
    g.add(mesh(box(0.9, 0.5, 0.18, 0.07), mat.fabric, x, 0.37, z - 1.02))
    g.add(mesh(box(0.9, 0.5, 0.18, 0.07), mat.fabric, x, 0.37, z + 1.02))
    ;[-0.42, 0.42].forEach((dz) => {
      g.add(mesh(box(0.68, 0.16, 0.82, 0.07), mat.fabricLight, x + 0.08, 0.42, z + dz))
      g.add(mesh(box(0.18, 0.46, 0.8, 0.08), mat.fabricLight, -2.12, 0.72, z + dz, { rz: -0.12 }))
    })
    g.add(mesh(box(0.12, 0.34, 0.34, 0.08), mat.pillow, -1.98, 0.64, z + 0.72, { rz: -0.25, ry: 0.3 }))
  })
  piece("furniture", 3, (g) => {
    // marble-top coffee table on brass legs
    g.add(mesh(box(0.7, 0.05, 1.1, 0.02), mat.marble, -0.75, 0.42, 0.2))
    ;[[-0.29, -0.49], [0.29, -0.49], [-0.29, 0.49], [0.29, 0.49]].forEach(([dx, dz]) =>
      g.add(mesh(keep(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 10)), mat.brass, -0.75 + dx, 0.2, 0.2 + dz)))
    g.add(mesh(box(0.22, 0.04, 0.3, 0.01), mat.walnut, -0.8, 0.465, 0.05))
    g.add(mesh(keep(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 16)), mat.pot, -0.68, 0.495, 0.42))
  })

  piece("decor", 0, (g) => {
    const r = mesh(keep(new THREE.PlaneGeometry(1.9, 2.6)), mat.rug, -1.0, 0.006, 0.2, { shadow: false, rx: -Math.PI / 2 })
    g.add(r)
  })
  piece("decor", 1, (g) => {
    // framed print between wardrobe and TV
    g.add(mesh(box(0.64, 0.84, 0.03), mat.frame, -0.85, 1.6, -2.48))
    g.add(mesh(keep(new THREE.PlaneGeometry(0.56, 0.76)), mat.art, -0.85, 1.6, -2.462, { shadow: false }))
  })
  piece("decor", 2, (g) => {
    // potted plant by the sofa
    const px = -2.08
    const pz = 1.85
    g.add(mesh(keep(new THREE.CylinderGeometry(0.17, 0.13, 0.38, 24)), mat.pot, px, 0.19, pz))
    const rand = seeded(19)
    for (let i = 0; i < 11; i += 1) {
      const a = (i / 11) * Math.PI * 2
      const leaf = mesh(keep(new THREE.SphereGeometry(1, 12, 8)), i % 2 ? mat.leaf : mat.leaf2, px + Math.cos(a) * 0.12, 0.72 + rand() * 0.25, pz + Math.sin(a) * 0.12, { rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5 })
      leaf.scale.set(0.07, 0.3, 0.03)
      g.add(leaf)
    }
  })
  piece("decor", 3, (g) => {
    // pendant over the table
    g.add(mesh(keep(new THREE.CylinderGeometry(0.006, 0.006, 1.05, 6)), mat.cord, -0.75, WALL_H - 0.52, 0.2, { shadow: false }))
    g.add(mesh(keep(new THREE.ConeGeometry(0.24, 0.22, 32, 1, true)), mat.shade, -0.75, 1.67, 0.2))
    const bulb = mesh(keep(new THREE.SphereGeometry(0.06, 16, 12)), mat.bulb, -0.75, 1.6, 0.2, { shadow: false })
    bulb.userData.bulb = true
    g.add(bulb)
  })

  // ---------- 3D-view scan sweep ----------
  const scanMat = keep(new THREE.MeshBasicMaterial({ color: "#9cc7ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  const scan = new THREE.Mesh(keep(new THREE.PlaneGeometry(ROOM + 0.4, ROOM + 0.4)), scanMat)
  scan.rotation.x = -Math.PI / 2
  scene.add(scan)

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight("#f6efe4", "#6b5642", 0.15)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight("#fff0d4", 0)
  sun.position.set(-7.5, 5.2, 1.4)
  sun.target.position.set(0, 0, 0.3)
  sun.castShadow = true
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048)
  sun.shadow.camera.left = -5
  sun.shadow.camera.right = 5
  sun.shadow.camera.top = 5
  sun.shadow.camera.bottom = -5
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 20
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 4
  scene.add(sun, sun.target)
  const fill = new THREE.DirectionalLight("#ffffff", 0)
  fill.position.set(6, 4, 7)
  scene.add(fill)
  const lamp = new THREE.PointLight("#ffc979", 0, 7, 2)
  lamp.position.set(-0.75, 1.55, 0.2)
  lamp.castShadow = !lowPower
  lamp.shadow.mapSize.set(512, 512)
  lamp.shadow.bias = -0.002
  scene.add(lamp)

  return { disposables, drawn, groundMat, mat, lineMat, planMat, dashMat, gridMat, plan, walls, realWalls, ghostWalls, trims, windowGroup, floor, ghostFloor, pieces, scan, scanMat, hemi, sun, fill, lamp }
}

export default function ProcessRoom({ step, fallback }) {
  const mountRef = useRef(null)
  const stepRef = useRef(step)
  const [failed, setFailed] = useState(false)
  stepRef.current = step

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch {
      setFailed(true)
      return undefined
    }
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const lowPower = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envScene = new RoomEnvironment()
    const env = pmrem.fromScene(envScene, 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    const world = buildScene(scene, { lowPower })

    const anim = {
      plan: new Anim(1.1),
      footprints: new Anim(0.8, 0.5),
      walls: new Anim(1.2),
      real: new Anim(1.1),
      wire: new Anim(0.8),
      scan: new Anim(0.6),
      lights: new Anim(1.6),
      top: new Anim(1.4),
      draw: new Anim(1.8),
    }
    anim.top.p = 1
    anim.top.target = 1

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointer = (event) => {
      if (event.pointerType !== "mouse") return
      const box = mount.getBoundingClientRect()
      pointer.x = ((event.clientX - box.left) / box.width - 0.5) * 2
      pointer.y = ((event.clientY - box.top) / box.height - 0.5) * 2
    }
    window.addEventListener("pointermove", onPointer, { passive: true })

    let width = 0
    let height = 0
    const resize = () => {
      width = mount.clientWidth
      height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    }, { rootMargin: "120px" })
    io.observe(mount)

    // ----- framing: keep the whole room centred and inside the canvas -----
    const corners = [
      [-HALF - WALL_T, 0, -HALF - WALL_T], [HALF, 0, -HALF - WALL_T], [HALF, 0, HALF], [-HALF - WALL_T, 0, HALF],
      [-HALF - WALL_T, 1, -HALF - WALL_T], [-HALF - WALL_T, 1, HALF], [HALF, 1, -HALF - WALL_T],
    ]
    const probe = new THREE.Vector3()
    const goal = new THREE.Vector3()
    const right = new THREE.Vector3()
    const upward = new THREE.Vector3()
    const framed = { target: new THREE.Vector3(0, 0.6, 0), dist: 16, ready: false }
    const place = (center, azimuth, elevation, dist) => {
      camera.position.set(
        center.x + Math.cos(elevation) * Math.cos(azimuth) * dist,
        center.y + Math.sin(elevation) * dist,
        center.z + Math.cos(elevation) * Math.sin(azimuth) * dist,
      )
      camera.lookAt(center)
      camera.updateMatrixWorld()
    }
    // Project the room's corners, centre them and zoom so they fit with a margin.
    const fitRoom = (azimuth, elevation, wallHeight, reserveTop) => {
      goal.set(-0.2, wallHeight * 0.35, -0.2)
      let dist = 16
      for (let pass = 0; pass < 4; pass += 1) {
        place(goal, azimuth, elevation, dist)
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        corners.forEach(([x, y, z]) => {
          probe.set(x, y * wallHeight, z).project(camera)
          minX = Math.min(minX, probe.x)
          maxX = Math.max(maxX, probe.x)
          minY = Math.min(minY, probe.y)
          maxY = Math.max(maxY, probe.y)
        })
        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
        const halfW = halfH * camera.aspect
        right.setFromMatrixColumn(camera.matrixWorld, 0)
        upward.setFromMatrixColumn(camera.matrixWorld, 1)
        // leave room at the top for the chat bubbles or the schedule card
        const shiftY = (minY + maxY) / 2 + reserveTop * 0.5
        goal.addScaledVector(right, ((minX + maxX) / 2) * halfW).addScaledVector(upward, shiftY * halfH)
        const spanX = (maxX - minX) / 2 / 0.9
        const spanY = (maxY - minY) / 2 / (0.9 - reserveTop * 0.5)
        dist *= Math.max(spanX, spanY)
      }
      return dist
    }
    let reserveStep = null
    let reserveHeight = 0
    let reserveGoal = 0
    let reserveNow = 0
    let frame = 0
    let last = performance.now()
    let first = true
    const lerpColor = new THREE.Color()

    const render = (now) => {
      frame = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const s = stepRef.current
      const instant = calm || first
      first = false

      anim.plan.set(s >= -1, t)
      anim.footprints.set(s >= 0 && s < 4, t)
      anim.walls.set(s >= 1, t)
      anim.real.set(s >= 3, t)
      anim.wire.set(s >= 2 && s < 4, t)
      anim.scan.set(s === 2, t)
      anim.lights.set(s >= 5, t)
      anim.top.set(s <= 0, t)
      anim.draw.set(s >= 0, t)
      Object.values(anim).forEach((a) => a.tick(dt, t, instant))
      world.pieces.forEach((item) => {
        item.solid.set(item.kind === "furniture" ? s >= 4 : s >= 5, t)
        item.solid.tick(dt, t, instant)
      })

      const real = ease(anim.real.p)
      const lights = ease(anim.lights.p)
      const blue = 1 - real

      // plan
      world.gridMat.opacity = (s >= 0 ? 0.32 : 0.16) * (1 - real * 0.85) * (0.4 + 0.6 * ease(anim.plan.p))
      world.planMat.opacity = 0.9 * blue + 0.25 * real
      world.dashMat.opacity = 0.75 * ease(anim.footprints.p) * blue
      // the plan draws itself: outline first, then each piece of furniture
      const drawP = anim.draw.p
      world.drawn.forEach(({ line, count, order }) => {
        const local = Math.max(0, Math.min(1, (drawP - order * 0.09) / 0.55))
        line.geometry.setDrawRange(0, Math.round(count * ease(local)))
      })
      world.groundMat.opacity = 0.9 * real
      lerpColor.copy(BLUE).lerp(GOLD, real)
      world.lineMat.color.copy(lerpColor)
      world.planMat.color.copy(lerpColor)

      // walls rise, glass first, then plaster
      const up = Math.max(0.001, easeBack(anim.walls.p))
      world.walls.scale.y = up
      world.walls.visible = anim.walls.p > 0.002
      world.mat.ghost.opacity = 0.16 * blue
      world.ghostWalls.forEach((m) => { m.visible = blue > 0.01 })
      world.realWalls.forEach((m) => {
        setOpacity(m.material, real)
        m.visible = real > 0.01
      })
      world.trims.visible = real > 0.01
      world.trims.traverse((child) => { if (child.isMesh) setOpacity(child.material, real) })
      world.windowGroup.traverse((child) => {
        if (child.isMesh && child.material !== world.mat.glass && child.material !== world.mat.sky) setOpacity(child.material, real)
      })
      world.mat.sky.opacity = real
      world.mat.sky.transparent = true
      world.mat.glass.opacity = 0.18 + 0.12 * real
      world.mat.glass.emissiveIntensity = 0.25 + 0.6 * lights
      setOpacity(world.mat.floor, real)
      world.floor.visible = real > 0.01
      world.mat.ghostFloor.opacity = 0.09 * blue * (0.3 + 0.7 * ease(anim.walls.p))
      world.lineMat.opacity = 0.85 * blue * ease(anim.walls.p) + 0.0

      // furniture: wireframe preview, then the real piece drops in
      const wire = ease(anim.wire.p)
      world.pieces.forEach((item) => {
        const p = item.solid.p
        const drop = item.solid.target ? (1 - easeBack(p)) * 1.3 : 0
        item.group.position.y = drop
        item.group.visible = p > 0.002 || (item.kind === "furniture" && wire > 0.002)
        item.meshes.forEach((m) => {
          setOpacity(m.material, Math.min(1, p * 1.6))
          m.castShadow = p > 0.98
          m.children.forEach((child) => {
            if (child.userData.wire) child.visible = wire > 0.002
          })
          if (m.userData.screen) m.material.emissiveIntensity = 0.35 * lights
          if (m.userData.bulb) m.material.emissiveIntensity = 6 * lights
        })
      })
      // wire material is shared with the walls' edges; use the brighter of the two
      world.lineMat.opacity = Math.max(world.lineMat.opacity, 0.9 * wire)

      // 3D-view scan sweep
      const scanOn = ease(anim.scan.p)
      world.scanMat.opacity = 0.14 * scanOn
      world.scan.visible = scanOn > 0.01
      world.scan.position.y = ((t * 0.55) % 1) * WALL_H

      // light: none on the blueprint, daylight once built, warm and lit at move-in
      scene.environmentIntensity = 0.35 * real + 0.1 * lights
      world.hemi.intensity = 0.15 + 0.55 * real + 0.25 * lights
      world.sun.intensity = 2.4 * real + 0.6 * lights
      world.sun.color.set(lights > 0.5 ? "#ffe2b0" : "#fff0d4")
      world.fill.intensity = 0.45 * real
      world.lamp.intensity = 9 * lights
      renderer.toneMappingExposure = 0.95 + 0.15 * lights

      // camera: top-down for the plan, a three-quarter view once the room exists.
      // Framing is worked out without the sway, then eased, so it never jumps.
      pointer.sx += (pointer.x - pointer.sx) * 0.04
      pointer.sy += (pointer.y - pointer.sy) * 0.04
      const top = ease(anim.top.p)
      const baseAzimuth = Math.PI / 4
      const baseElevation = THREE.MathUtils.lerp(0.58, 1.12, top)
      const wallHeight = WALL_H * ease(anim.walls.p)
      // keep clear the strip that the chat bubbles or the schedule card use
      if (s !== reserveStep || height !== reserveHeight) {
        reserveStep = s
        reserveHeight = height
        const overlay = s === 0 ? mount.querySelector(".wp-chat") : s >= 3 && s < 5 ? mount.querySelector(".wp-plan-card") : null
        reserveGoal = overlay && height ? Math.min(0.5, Math.max(0, (2 * (overlay.offsetHeight + overlay.offsetTop + 10)) / height - 0.1)) : 0
      }
      reserveNow += (reserveGoal - reserveNow) * (instant ? 1 : 1 - Math.exp(-dt * 3.2))
      const reserveTop = reserveNow
      const fitDist = fitRoom(baseAzimuth, baseElevation, wallHeight, reserveTop)
      const follow = instant || !framed.ready ? 1 : 1 - Math.exp(-dt * 3.2)
      framed.target.lerp(goal, follow)
      framed.dist += (fitDist - framed.dist) * follow
      framed.ready = true
      const sway = calm ? 0 : Math.sin(t * 0.25) * 0.045
      place(
        framed.target,
        baseAzimuth + sway + (calm ? 0 : pointer.sx * 0.05),
        baseElevation + (calm ? 0 : pointer.sy * 0.03),
        framed.dist * 1.03,
      )

      renderer.render(scene, camera)
      if (visible && !document.hidden) frame = requestAnimationFrame(render)
    }
    const start = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(render)
    }
    const onVisibility = () => {
      if (!document.hidden) start()
    }
    document.addEventListener("visibilitychange", onVisibility)
    start()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onPointer)
      document.removeEventListener("visibilitychange", onVisibility)
      world.disposables.forEach((item) => item.dispose?.())
      env.dispose()
      envScene.traverse?.((child) => {
        child.geometry?.dispose?.()
        child.material?.dispose?.()
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  if (failed) return fallback || null

  return (
    <div className="wp-3d" ref={mountRef}>
      <div className={`wp-chat ${step === 0 ? "is-on" : ""}`} aria-hidden="true">
        <span className="is-them"><i /><i /><i /></span>
        <span className="is-you">Our dream home…</span>
      </div>
      <div className={`wp-plan-card ${step >= 3 && step < 5 ? "is-on" : ""}`} aria-hidden="true">
        <small>Schedule</small>
        {["Design sign-off", "Material order", "Factory build", "Site install"].map((label, index) => (
          <p key={label} style={{ "--i": index }}>
            <span>{label}</span>
            <i><b /></i>
          </p>
        ))}
      </div>
    </div>
  )
}
