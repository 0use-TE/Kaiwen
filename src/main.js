import { initHorrorAudio } from './audio.js'

// ===== 3D Tilt Effect =====
function initTilt() {
  const tiltElements = document.querySelectorAll('[data-tilt]')

  tiltElements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -8
      const rotateY = ((x - centerX) / centerX) * 8

      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    })

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
      el.style.transition = 'transform 0.5s ease'
    })

    el.addEventListener('mouseenter', () => {
      el.style.transition = 'transform 0.1s ease'
    })
  })
}

// ===== Card Flip on Click (mobile) =====
function initCardFlip() {
  const cards = document.querySelectorAll('.card-3d')
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped')
    })
  })
}

// ===== Scroll Reveal =====
function initScrollReveal() {
  const reveals = document.querySelectorAll(
    '.section-header, .about-card, .hobby-panel, .dream-stage, .stat-card'
  )

  reveals.forEach((el) => el.classList.add('reveal'))

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )

  reveals.forEach((el) => observer.observe(el))
}

// ===== Skill Bar Animation =====
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated')
        }
      })
    },
    { threshold: 0.5 }
  )

  fills.forEach((fill) => observer.observe(fill))
}

// ===== Hero Parallax =====
function initHeroParallax() {
  const scene = document.getElementById('heroScene')
  if (!scene) return

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2
    const y = (e.clientY / window.innerHeight - 0.5) * 2

    scene.querySelectorAll('.floating-badge').forEach((badge, i) => {
      const depth = (i + 1) * 8
      badge.style.transform = `translate(${x * depth}px, ${y * depth}px)`
    })
  })
}

// ===== Dream Emblem Mouse Follow =====
function initDreamEmblem() {
  const emblem = document.getElementById('dreamEmblem')
  if (!emblem) return

  const section = emblem.closest('.dream')
  if (!section) return

  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    emblem.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`
  })

  section.addEventListener('mouseleave', () => {
    emblem.style.transform = 'rotateY(0) rotateX(0)'
    emblem.style.transition = 'transform 0.6s ease'
  })

  section.addEventListener('mouseenter', () => {
    emblem.style.transition = 'transform 0.1s ease'
  })
}

// ===== Nav Background on Scroll =====
function initNavScroll() {
  const nav = document.querySelector('.nav')

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.style.background = 'rgba(10, 10, 15, 0.95)'
      nav.style.borderBottom = '1px solid rgba(139, 0, 0, 0.2)'
    } else {
      nav.style.background = 'linear-gradient(180deg, rgba(10, 10, 15, 0.95), transparent)'
      nav.style.borderBottom = 'none'
    }
  })
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initTilt()
  initCardFlip()
  initScrollReveal()
  initSkillBars()
  initHeroParallax()
  initDreamEmblem()
  initNavScroll()
  initHorrorAudio()
})
