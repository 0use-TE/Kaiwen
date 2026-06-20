import { getAmbience } from './audio.js'
import { triggerHandCreep } from './skeleton-hand.js'

const WHISPER_TEXTS = [
  '在你身后……',
  '别回头……',
  '它来了……',
  '你听到了吗……',
  '跑……',
  '一直在看着你……',
]

// 随机惊吓类型（skull 权重高）
const RANDOM_TYPES = ['skull', 'skull', 'hand', 'hand', 'flash', 'whisper', 'corner', 'glitch']

const COOLDOWN_MS = 4000

export function initJumpScares() {
  const overlay = document.getElementById('scareOverlay')
  const flash = document.getElementById('scareFlash')
  const skull = document.getElementById('scareSkull')
  const corner = document.getElementById('scareCorner')
  const whisper = document.getElementById('scareWhisper')
  const glitch = document.getElementById('scareGlitch')

  if (!overlay || !skull) return

  let active = false
  let enabled = false
  let lastScrollY = window.scrollY
  let scrollDownTotal = 0
  let lastScareAt = 0

  const passedMilestones = new Set()
  const milestones = [350, 700, 1100, 1500, 2000, 2600, 3200, 4000, 4800, 5600]

  function canScare() {
    return enabled && !active && Date.now() - lastScareAt >= COOLDOWN_MS
  }

  function lockScare() {
    active = true
    lastScareAt = Date.now()
  }

  function unlockScare() {
    active = false
  }

  function shakeScreen() {
    document.body.classList.add('screen-shake')
    setTimeout(() => document.body.classList.remove('screen-shake'), 700)
  }

  function redFlash(duration = 250) {
    flash?.classList.add('active')
    setTimeout(() => flash?.classList.remove('active'), duration)
  }

  function flickerThen(fn) {
    let count = 0
    const id = setInterval(() => {
      document.body.classList.toggle('flicker')
      count++
      if (count >= 3) {
        clearInterval(id)
        document.body.classList.remove('flicker')
        fn()
      }
    }, 70)
  }

  // ===== 骷髅贴脸 =====
  function scareSkull() {
    if (!canScare()) return
    lockScare()

    getAmbience()?.playGhostScream()

    overlay.classList.add('active')
    skull.classList.remove('pop')
    void skull.offsetWidth
    skull.classList.add('pop')

    redFlash()
    shakeScreen()

    setTimeout(() => {
      skull.classList.remove('pop')
      overlay.classList.remove('active')
      unlockScare()
    }, 900)
  }

  // ===== 全屏闪红 =====
  function scareFlash() {
    if (!canScare()) return
    lockScare()

    getAmbience()?.playJumpScare(1)

    flash?.classList.add('active', 'full')
    document.body.classList.add('invert-flash')
    shakeScreen()

    setTimeout(() => {
      flash?.classList.remove('active', 'full')
      document.body.classList.remove('invert-flash')
      unlockScare()
    }, 450)
  }

  // ===== 角落骷髅 =====
  function scareCorner() {
    if (!canScare()) return
    lockScare()

    getAmbience()?.playGhostScream()

    const side = Math.random() > 0.5 ? 'left' : 'right'
    corner.className = `scare-corner peek-${side} active`
    shakeScreen()
    redFlash(150)

    setTimeout(() => {
      corner.className = 'scare-corner'
      unlockScare()
    }, 1000)
  }

  // ===== 耳语文字 =====
  function scareWhisper() {
    if (!canScare()) return
    lockScare()

    getAmbience()?.playJumpScare(0.5)

    whisper.textContent = WHISPER_TEXTS[Math.floor(Math.random() * WHISPER_TEXTS.length)]
    whisper.classList.add('active')

    setTimeout(() => {
      whisper.classList.remove('active')
      unlockScare()
    }, 2200)
  }

  // ===== 画面撕裂 =====
  function scareGlitch() {
    if (!canScare()) return
    lockScare()

    getAmbience()?.playJumpScare(0.9)

    glitch?.classList.add('active')
    shakeScreen()
    redFlash(200)

    setTimeout(() => {
      glitch?.classList.remove('active')
      unlockScare()
    }, 800)
  }

  // ===== 骷髅手伸进来 =====
  function scareHand() {
    if (!canScare()) return
    lockScare()
    const side = Math.random() > 0.5 ? 'left' : 'right'
    triggerHandCreep(side)
    setTimeout(() => unlockScare(), 10000)
  }

  const randomHandlers = {
    skull: scareSkull,
    hand: scareHand,
    flash: () => flickerThen(scareFlash),
    whisper: scareWhisper,
    corner: scareCorner,
    glitch: scareGlitch,
  }

  function triggerRandomScare() {
    if (!canScare()) return
    const type = RANDOM_TYPES[Math.floor(Math.random() * RANDOM_TYPES.length)]
    const handler = randomHandlers[type]
    if (type === 'skull') {
      flickerThen(scareSkull)
    } else {
      handler()
    }
  }

  function scheduleRandom() {
    const delay = 12000 + Math.random() * 18000
    setTimeout(() => {
      if (enabled) triggerRandomScare()
      scheduleRandom()
    }, delay)
  }

  // ===== 往下滚 → 骷髅贴脸 =====
  window.addEventListener(
    'scroll',
    () => {
      if (!canScare()) return

      const currentY = window.scrollY
      const delta = currentY - lastScrollY
      lastScrollY = currentY

      if (delta <= 0) return

      scrollDownTotal += delta

      for (const m of milestones) {
        if (currentY >= m && !passedMilestones.has(m)) {
          passedMilestones.add(m)
          scareSkull()
          scrollDownTotal = 0
          return
        }
      }

      if (scrollDownTotal > 100 && Math.random() < 0.65) {
        scareSkull()
        scrollDownTotal = 0
      }
    },
    { passive: true }
  )

  // ===== 鼠标不动 → 随机惊吓 =====
  let mouseIdleTimer = null
  document.addEventListener('mousemove', () => {
    clearTimeout(mouseIdleTimer)
    mouseIdleTimer = setTimeout(() => {
      if (canScare() && Math.random() < 0.5) {
        flickerThen(scareSkull)
      }
    }, 10000 + Math.random() * 8000)
  })

  // 等音频开启后启用
  const checkEnabled = setInterval(() => {
    if (getAmbience()?.playing) {
      enabled = true
      clearInterval(checkEnabled)
      setTimeout(scheduleRandom, 10000)
    }
  }, 500)
}
