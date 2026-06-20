import * as THREE from 'three'

export function initThreeScene() {
  const canvas = document.getElementById('three-canvas')
  if (!canvas) return

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.035)

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.z = 18

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  // 灯光
  const ambient = new THREE.AmbientLight(0x330000, 0.6)
  scene.add(ambient)

  const redLight = new THREE.PointLight(0xff2200, 2, 50)
  redLight.position.set(5, 8, 10)
  scene.add(redLight)

  const blueLight = new THREE.PointLight(0x111133, 1, 40)
  blueLight.position.set(-8, -5, 5)
  scene.add(blueLight)

  // 漂浮粒子（灰烬/血雾）
  const particleCount = 800
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30
    const isRed = Math.random() > 0.6
    colors[i * 3] = isRed ? 0.8 : 0.3
    colors[i * 3 + 1] = isRed ? 0.05 : 0.25
    colors[i * 3 + 2] = isRed ? 0.05 : 0.3
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })
  )
  scene.add(particles)

  // 线框骷髅球体
  const skullGroup = new THREE.Group()
  const skullGeo = new THREE.IcosahedronGeometry(2.5, 1)
  const skullMat = new THREE.MeshBasicMaterial({
    color: 0xcc1111,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  })
  const skullMesh = new THREE.Mesh(skullGeo, skullMat)
  skullGroup.add(skullMesh)

  const innerSkull = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.8, 0),
    new THREE.MeshBasicMaterial({ color: 0x8b0000, wireframe: true, transparent: true, opacity: 0.15 })
  )
  skullGroup.add(innerSkull)
  skullGroup.position.set(-6, 2, -5)
  scene.add(skullGroup)

  // 第二个漂浮线框
  const ring = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.35, 80, 12),
    new THREE.MeshBasicMaterial({ color: 0x661111, wireframe: true, transparent: true, opacity: 0.2 })
  )
  ring.position.set(7, -3, -8)
  scene.add(ring)

  // 地面网格
  const grid = new THREE.GridHelper(40, 30, 0x440000, 0x1a0505)
  grid.position.y = -8
  grid.material.opacity = 0.15
  grid.material.transparent = true
  scene.add(grid)

  let mouseX = 0
  let mouseY = 0
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  })

  const clock = new THREE.Clock()

  function animate() {
    requestAnimationFrame(animate)
    const t = clock.getElapsedTime()

    particles.rotation.y = t * 0.02
    const pos = particles.geometry.attributes.position.array
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += Math.sin(t + i) * 0.002
    }
    particles.geometry.attributes.position.needsUpdate = true

    skullGroup.rotation.y = t * 0.3
    skullGroup.rotation.x = Math.sin(t * 0.5) * 0.2
    skullGroup.position.y = 2 + Math.sin(t * 0.8) * 0.5

    ring.rotation.x = t * 0.4
    ring.rotation.y = t * 0.25

    camera.position.x += (mouseX * 3 - camera.position.x) * 0.03
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.03
    camera.lookAt(0, 0, 0)

    redLight.position.x = Math.sin(t * 0.7) * 8
    redLight.position.z = Math.cos(t * 0.5) * 8

    renderer.render(scene, camera)
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', onResize)
  animate()
}
