// Procedural horror ambient soundscape (no external audio files)
export class HorrorAmbience {
  constructor() {
    this.ctx = null
    this.master = null
    this.playing = false
    this.nodes = []
  }

  async start() {
    if (this.playing) return

    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.35
    this.master.connect(this.ctx.destination)

    // Low ominous drone
    const drone = this._createDrone(55, 0.12)
    const drone2 = this._createDrone(55.5, 0.06) // slight detune for unease
    const sub = this._createDrone(27.5, 0.18)

    // Dark noise layer (wind/static)
    const noise = this._createNoise(0.04)

    // Heartbeat pulse
    const heartbeat = this._createHeartbeat()

    // Occasional dissonant whispers
    const whispers = this._createWhispers()

    this.nodes.push(drone, drone2, sub, noise, heartbeat, whispers)
    this.playing = true
  }

  stop() {
    if (!this.ctx) return
    clearTimeout(this._heartbeatTimer)
    clearTimeout(this._whisperTimer)
    this.playing = false
    this.nodes.forEach((n) => {
      try { n.stop?.(); n.disconnect?.() } catch (_) { /* noop */ }
    })
    this.nodes = []
    this.ctx.close()
    this.ctx = null
    this.master = null
  }

  toggle() {
    if (this.playing) {
      this.stop()
      return false
    }
    this.start()
    return true
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v
  }

  _createDrone(freq, gain) {
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.value = freq
    filter.type = 'lowpass'
    filter.frequency.value = 180
    filter.Q.value = 8
    g.gain.value = gain

    // Slow LFO wobble
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.08 + Math.random() * 0.05
    lfoGain.gain.value = 15
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    osc.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    osc.start()
    lfo.start()

    this.nodes.push(osc, lfo)
    return osc
  }

  _createNoise(gain) {
    const bufferSize = this.ctx.sampleRate * 4
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.5

    const g = this.ctx.createGain()
    g.gain.value = gain

    // Breathing modulation
    const lfo = this.ctx.createOscillator()
    const lfoG = this.ctx.createGain()
    lfo.frequency.value = 0.15
    lfoG.gain.value = 0.03
    lfo.connect(lfoG)
    lfoG.connect(g.gain)

    source.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    source.start()
    lfo.start()

    this.nodes.push(source, lfo)
    return source
  }

  _createHeartbeat() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)

    const beat = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime

      // Thump
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(60, t)
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.15)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.25, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(env)
      env.connect(g)
      osc.start(t)
      osc.stop(t + 0.35)

      // Second softer beat
      const osc2 = this.ctx.createOscillator()
      const env2 = this.ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(50, t + 0.35)
      osc2.frequency.exponentialRampToValueAtTime(25, t + 0.5)
      env2.gain.setValueAtTime(0, t + 0.35)
      env2.gain.linearRampToValueAtTime(0.12, t + 0.37)
      env2.gain.exponentialRampToValueAtTime(0.001, t + 0.65)
      osc2.connect(env2)
      env2.connect(g)
      osc2.start(t + 0.35)
      osc2.stop(t + 0.7)

      const next = 1800 + Math.random() * 1200
      this._heartbeatTimer = setTimeout(beat, next)
    }

    beat()
    return g
  }

  _createWhispers() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)

    const whisper = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime
      const freqs = [220, 233, 247, 262, 277, 294] // dissonant cluster

      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator()
        const env = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f + (Math.random() - 0.5) * 10
        const start = t + i * 0.05
        env.gain.setValueAtTime(0, start)
        env.gain.linearRampToValueAtTime(0.04, start + 0.8)
        env.gain.linearRampToValueAtTime(0, start + 3)
        osc.connect(env)
        env.connect(g)
        osc.start(start)
        osc.stop(start + 3.5)
      })

      const next = 6000 + Math.random() * 8000
      this._whisperTimer = setTimeout(whisper, next)
    }

    whisper()
    return g
  }
}

export function initHorrorAudio() {
  const ambience = new HorrorAmbience()
  const btn = document.getElementById('audioToggle')
  if (!btn) return

  btn.addEventListener('click', async () => {
    if (!ambience.playing) {
      await ambience.start()
      btn.classList.add('playing')
      btn.setAttribute('aria-label', '关闭背景音乐')
      btn.querySelector('.audio-label').textContent = '♪ ON'
    } else {
      ambience.stop()
      btn.classList.remove('playing')
      btn.setAttribute('aria-label', '开启背景音乐')
      btn.querySelector('.audio-label').textContent = '♪ OFF'
    }
  })

  // Auto-prompt on first interaction (browsers block autoplay)
  const prompt = document.getElementById('audioPrompt')
  if (prompt) {
    const dismiss = async () => {
      prompt.classList.add('hidden')
      await ambience.start()
      btn.classList.add('playing')
      btn.querySelector('.audio-label').textContent = '♪ ON'
      document.removeEventListener('click', dismiss)
    }
    document.addEventListener('click', dismiss, { once: true })
  }
}
