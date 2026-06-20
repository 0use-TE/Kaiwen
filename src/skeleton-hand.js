import { getAmbience } from './audio.js'

let handActive = false

export function initSkeletonHand() {
  const hand = document.getElementById('skeletonHand')
  if (!hand) return

  function creepFrom(side = 'left') {
    if (handActive) return
    handActive = true

    hand.className = `skeleton-hand from-${side}`
    void hand.offsetWidth
    hand.classList.add('creeping')

    if (Math.random() < 0.6) {
      getAmbience()?.playJumpScare(0.4)
    }

    const duration = 6000 + Math.random() * 4000

    setTimeout(() => {
      hand.classList.add('retreating')
      setTimeout(() => {
        hand.className = 'skeleton-hand'
        handActive = false
      }, 3000)
    }, duration)
  }

  function scheduleHand() {
    const delay = 18000 + Math.random() * 25000
    setTimeout(() => {
      creepFrom(Math.random() > 0.5 ? 'left' : 'right')
      scheduleHand()
    }, delay)
  }

  const check = setInterval(() => {
    if (getAmbience()?.playing) {
      clearInterval(check)
      setTimeout(() => {
        creepFrom('left')
        scheduleHand()
      }, 12000)
    }
  }, 500)

  return { creepFrom }
}

export function triggerHandCreep(side) {
  const hand = document.getElementById('skeletonHand')
  if (!hand || handActive) return false

  hand.className = `skeleton-hand from-${side || (Math.random() > 0.5 ? 'left' : 'right')}`
  void hand.offsetWidth
  hand.classList.add('creeping')
  handActive = true
  getAmbience()?.playJumpScare(0.5)

  setTimeout(() => {
    hand.classList.add('retreating')
    setTimeout(() => {
      hand.className = 'skeleton-hand'
      handActive = false
    }, 3000)
  }, 7000)
  return true
}
