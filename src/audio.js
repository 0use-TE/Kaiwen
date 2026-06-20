// Jump scare audio stingers — sudden loud hits synced with visuals
export class HorrorAmbience {
  constructor() {
    this.ctx = null
    this.master = null
    this.playing = false
    this.nodes = []
    this.timers = []
    this.baseVolume = 0.4
  }

  async start() {
    if (this.playing) return true

    this.ctx = new AudioContext()

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        this._cleanupFailedStart()
        return false
      }
    }

    if (this.ctx.state !== 'running') {
      this._cleanupFailedStart()
      return false
    }

    this.master = this.ctx.createGain()
    this.master.gain.value = this.baseVolume
    this.master.connect(this.ctx.destination)

    this._createBreathingMaster()
    this._createPitchDrone()
    this._createHorrorMelody()
    this._createGlissandoStings()
    this._createShriekSweeps()
    this._createNoise()
    this._createHeartbeat()

    this.playing = true
    return true
  }

  _cleanupFailedStart() {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
    this.master = null
    this.playing = false
  }

  stop() {
    if (!this.ctx) return
    this.playing = false
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.nodes.forEach((n) => {
      try { n.stop?.(); n.disconnect?.() } catch (_) { /* noop */ }
    })
    this.nodes = []
    this.ctx.close()
    this.ctx = null
    this.master = null
  }

  _schedule(fn, delay) {
    const id = setTimeout(fn, delay)
    this.timers.push(id)
    return id
  }

  // ===== JUMP SCARE STINGER =====
  playJumpScare(intensity = 1) {
    if (!this.ctx || !this.playing) return
    const t = this.ctx.currentTime
    const vol = 0.5 + intensity * 0.3

    // 先静音一瞬间 — 然后猛砸
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(0.02, t + 0.08)
    this.master.gain.linearRampToValueAtTime(vol, t + 0.09)

    // 1. 白噪声爆炸
    this._noiseBurst(t + 0.09, 0.15, vol * 0.9)

    // 2. 刺耳尖啸
    this._screamStinger(t + 0.09, vol * 0.7)

    // 3. 低频重击
    this._bassSlam(t + 0.09, vol * 0.8)

    // 4. 金属刮擦
    this._metalScrape(t + 0.12, vol * 0.5)

    // 5. 不和谐和弦猛砸
    this._dissonantHit(t + 0.09, vol * 0.6)

    // 恢复音量
    this.master.gain.linearRampToValueAtTime(this.baseVolume, t + 1.2)
  }

  // 骷髅贴脸 — 鬼叫（音调上上下下）
  playGhostScream() {
    if (!this.ctx || !this.playing) return
    const t = this.ctx.currentTime

    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(0.05, t)
    this.master.gain.linearRampToValueAtTime(0.9, t + 0.04)

    // 三声重叠鬼叫，音高起伏
    this._ghostWail(t, 0, 1.0)
    this._ghostWail(t + 0.12, 1, 0.85)
    this._ghostWail(t + 0.25, 2, 0.7)

    // 回响鬼叫
    this._ghostWail(t + 0.6, 0, 0.35)
    this._ghostWail(t + 0.8, 2, 0.3)

    this._bassSlam(t + 0.04, 0.6)
    this._noiseBurst(t + 0.04, 0.12, 0.4)

    this.master.gain.linearRampToValueAtTime(this.baseVolume, t + 2.8)
  }

  // 单声鬼叫 — 音调大起大落
  _ghostWail(start, variant, vol) {
    const bases = [380, 450, 310]
    const base = bases[variant % 3]
    const dur = 2.0

    const osc = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sine'
    osc2.type = 'triangle'
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 1.5

    // 鬼叫核心：音高上上下下
    const setWail = (o, mult) => {
      const b = base * mult
      o.frequency.setValueAtTime(b * 0.6, start)
      o.frequency.linearRampToValueAtTime(b * 2.5, start + 0.35)   // 拔高
      o.frequency.linearRampToValueAtTime(b * 0.5, start + 0.7)    // 跌落
      o.frequency.linearRampToValueAtTime(b * 3.0, start + 1.1)    // 再拔高
      o.frequency.linearRampToValueAtTime(b * 0.4, start + 1.5)    // 再跌落
      o.frequency.linearRampToValueAtTime(b * 2.0, start + 1.8)    // 最后一抖
      o.frequency.exponentialRampToValueAtTime(b * 0.2, start + dur)
    }

    setWail(osc, 1)
    setWail(osc2, 1.3)

    // 颤音让鬼叫更凄厉
    const vib = this.ctx.createOscillator()
    const vibG = this.ctx.createGain()
    vib.frequency.value = 6 + variant * 3
    vibG.gain.value = 50 + variant * 15
    vib.connect(vibG)
    vibG.connect(osc.frequency)

    const vib2 = this.ctx.createOscillator()
    const vib2G = this.ctx.createGain()
    vib2.frequency.value = 8 + variant * 2
    vib2G.gain.value = 30
    vib2.connect(vib2G)
    vib2G.connect(osc2.frequency)

    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(vol * 0.55, start + 0.06)
    env.gain.setValueAtTime(vol * 0.5, start + 1.2)
    env.gain.exponentialRampToValueAtTime(0.001, start + dur)

    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(env)
    env.connect(this.master)

    osc.start(start)
    osc2.start(start)
    vib.start(start)
    vib2.start(start)
    osc.stop(start + dur + 0.1)
    osc2.stop(start + dur + 0.1)
    vib.stop(start + dur + 0.1)
    vib2.stop(start + dur + 0.1)
  }

  // 保留旧名兼容
  playFaceScare() {
    this.playGhostScream()
  }

  _noiseBurst(start, dur, vol) {
    const len = Math.floor(this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + dur)
    src.connect(g)
    g.connect(this.master)
    src.start(start)
    src.stop(start + dur + 0.01)
  }

  _screamStinger(start, vol, peakFreq = 1400) {
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, start)
    osc.frequency.exponentialRampToValueAtTime(peakFreq, start + 0.04)
    osc.frequency.exponentialRampToValueAtTime(200, start + 0.5)
    env.gain.setValueAtTime(vol, start)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.6)
    const f = this.ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 300
    osc.connect(f)
    f.connect(env)
    env.connect(this.master)
    osc.start(start)
    osc.stop(start + 0.65)
  }

  _inhumanShriek(start, vol) {
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'square'
      const f = 900 + i * 200 + Math.random() * 100
      osc.frequency.setValueAtTime(f, start + i * 0.02)
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, start + i * 0.02 + 0.08)
      env.gain.setValueAtTime(vol * 0.3, start + i * 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, start + i * 0.02 + 0.3)
      osc.connect(env)
      env.connect(this.master)
      osc.start(start + i * 0.02)
      osc.stop(start + i * 0.02 + 0.35)
    }
  }

  _bassSlam(start, vol) {
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, start)
    osc.frequency.exponentialRampToValueAtTime(25, start + 0.3)
    env.gain.setValueAtTime(vol, start)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
    osc.connect(env)
    env.connect(this.master)
    osc.start(start)
    osc.stop(start + 0.55)
  }

  _metalScrape(start, vol) {
    const len = Math.floor(this.ctx.sampleRate * 0.4)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.3) * 0.8
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 2000
    f.Q.value = 5
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
    src.connect(f)
    f.connect(g)
    g.connect(this.master)
    src.start(start)
    src.stop(start + 0.4)
  }

  _dissonantHit(start, vol) {
    const freqs = [110, 116.5, 123.5, 130.8]
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = f
      env.gain.setValueAtTime(0, start)
      env.gain.linearRampToValueAtTime(vol * 0.25, start + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.8)
      osc.connect(env)
      env.connect(this.master)
      osc.start(start)
      osc.stop(start + 0.85)
    })
  }

  _createBreathingMaster() {
    const lfo = this.ctx.createOscillator()
    const lfoG = this.ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.12
    lfoG.gain.value = 0.18
    lfo.connect(lfoG)
    lfoG.connect(this.master.gain)
    lfo.start()
    this.nodes.push(lfo)
  }

  _createPitchDrone() {
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.value = 65
    filter.type = 'lowpass'
    filter.frequency.value = 300
    g.gain.value = 0.2
    const pitchLfo = this.ctx.createOscillator()
    const pitchLfoG = this.ctx.createGain()
    pitchLfo.type = 'sine'
    pitchLfo.frequency.value = 0.18
    pitchLfoG.gain.value = 25
    pitchLfo.connect(pitchLfoG)
    pitchLfoG.connect(osc.frequency)
    const pitchLfo2 = this.ctx.createOscillator()
    const pitchLfo2G = this.ctx.createGain()
    pitchLfo2.type = 'triangle'
    pitchLfo2.frequency.value = 0.7
    pitchLfo2G.gain.value = 8
    pitchLfo2.connect(pitchLfo2G)
    pitchLfo2G.connect(osc.frequency)
    osc.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    osc.start()
    pitchLfo.start()
    pitchLfo2.start()
    this.nodes.push(osc, pitchLfo, pitchLfo2)
  }

  _createHorrorMelody() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)
    const scale = [130.81, 146.83, 155.56, 174.61, 185.00, 196.00, 207.65, 220.00,
                   233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63]
    let index = 0
    let direction = 1
    const playNote = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime
      const dur = 1.2 + Math.random() * 1.5
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      const vibrato = this.ctx.createOscillator()
      const vibratoG = this.ctx.createGain()
      osc.type = 'sine'
      const baseFreq = scale[index]
      osc.frequency.setValueAtTime(baseFreq, t)
      const slide = (Math.random() - 0.5) * 30
      osc.frequency.linearRampToValueAtTime(baseFreq + slide, t + dur * 0.6)
      osc.frequency.linearRampToValueAtTime(baseFreq, t + dur)
      vibrato.frequency.value = 5 + Math.random() * 3
      vibratoG.gain.value = 3 + Math.random() * 4
      vibrato.connect(vibratoG)
      vibratoG.connect(osc.frequency)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.08, t + 0.15)
      env.gain.setValueAtTime(0.1, t + dur * 0.7)
      env.gain.linearRampToValueAtTime(0, t + dur)
      osc.connect(env)
      env.connect(g)
      osc.start(t)
      vibrato.start(t)
      osc.stop(t + dur + 0.1)
      vibrato.stop(t + dur + 0.1)
      index += direction
      if (index >= scale.length - 1) direction = -1
      if (index <= 0) direction = 1
      if (Math.random() < 0.15) direction *= -1
      this._schedule(playNote, dur * 800 + Math.random() * 600)
    }
    playNote()
    this.nodes.push(g)
  }

  _createGlissandoStings() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)
    const sting = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime
      const dur = 3 + Math.random() * 4
      const rising = Math.random() > 0.5
      const startFreq = rising ? 80 + Math.random() * 40 : 400 + Math.random() * 300
      const endFreq = rising ? 500 + Math.random() * 400 : 60 + Math.random() * 30
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'sawtooth'
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 600
      filter.Q.value = 2
      osc.frequency.setValueAtTime(startFreq, t)
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + dur)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.08, t + dur * 0.2)
      env.gain.linearRampToValueAtTime(0.06, t + dur * 0.6)
      env.gain.linearRampToValueAtTime(0, t + dur)
      osc.connect(filter)
      filter.connect(env)
      env.connect(g)
      osc.start(t)
      osc.stop(t + dur + 0.1)
      this._schedule(sting, 4000 + Math.random() * 6000)
    }
    this._schedule(sting, 2000)
    this.nodes.push(g)
  }

  _createShriekSweeps() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)
    const shriek = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime
      const dur = 1.5 + Math.random() * 2
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, t)
      osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 800, t + dur * 0.35)
      osc.frequency.exponentialRampToValueAtTime(150 + Math.random() * 100, t + dur)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.06, t + dur * 0.15)
      env.gain.linearRampToValueAtTime(0.04, t + dur * 0.5)
      env.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.connect(env)
      env.connect(g)
      osc.start(t)
      osc.stop(t + dur + 0.1)
      this._schedule(shriek, 5000 + Math.random() * 10000)
    }
    this._schedule(shriek, 3000)
    this.nodes.push(g)
  }

  _createNoise() {
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
    filter.frequency.value = 500
    filter.Q.value = 0.8
    const g = this.ctx.createGain()
    g.gain.value = 0.03
    const filterLfo = this.ctx.createOscillator()
    const filterLfoG = this.ctx.createGain()
    filterLfo.frequency.value = 0.25
    filterLfoG.gain.value = 350
    filterLfo.connect(filterLfoG)
    filterLfoG.connect(filter.frequency)
    const volLfo = this.ctx.createOscillator()
    const volLfoG = this.ctx.createGain()
    volLfo.frequency.value = 0.1
    volLfoG.gain.value = 0.025
    volLfo.connect(volLfoG)
    volLfoG.connect(g.gain)
    source.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    source.start()
    filterLfo.start()
    volLfo.start()
    this.nodes.push(source, filterLfo, volLfo)
  }

  _createHeartbeat() {
    const g = this.ctx.createGain()
    g.gain.value = 0
    g.connect(this.master)
    const beat = () => {
      if (!this.playing) return
      const t = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const env = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(70, t)
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.2)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.3, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(env)
      env.connect(g)
      osc.start(t)
      osc.stop(t + 0.4)
      const osc2 = this.ctx.createOscillator()
      const env2 = this.ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(55, t + 0.4)
      osc2.frequency.exponentialRampToValueAtTime(28, t + 0.6)
      env2.gain.setValueAtTime(0, t + 0.4)
      env2.gain.linearRampToValueAtTime(0.15, t + 0.42)
      env2.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      osc2.connect(env2)
      env2.connect(g)
      osc2.start(t + 0.4)
      osc2.stop(t + 0.75)
      this._schedule(beat, 1400 + Math.random() * 800)
    }
    beat()
    this.nodes.push(g)
  }
}

let ambienceInstance = null

export function getAmbience() {
  return ambienceInstance
}

export function initHorrorAudio() {
  ambienceInstance = new HorrorAmbience()
  const ambience = ambienceInstance
  const btn = document.getElementById('audioToggle')
  const prompt = document.getElementById('audioPrompt')

  function setPlayingUI(on) {
    if (!btn) return
    if (on) {
      btn.classList.add('playing')
      btn.setAttribute('aria-label', '关闭背景音乐')
      btn.querySelector('.audio-label').textContent = '♪ ON'
      prompt?.classList.add('hidden')
    } else {
      btn.classList.remove('playing')
      btn.setAttribute('aria-label', '开启背景音乐')
      btn.querySelector('.audio-label').textContent = '♪ OFF'
    }
  }

  async function enableAudio() {
    const ok = await ambience.start()
    if (ok) setPlayingUI(true)
    return ok
  }

  btn?.addEventListener('click', async () => {
    if (!ambience.playing) {
      await enableAudio()
    } else {
      ambience.stop()
      setPlayingUI(false)
    }
  })

  // 默认尝试自动播放
  enableAudio().then((ok) => {
    if (ok) return

    // 浏览器拦截了自动播放 → 显示提示，等用户任意操作再试
    prompt?.classList.remove('hidden')

    const retry = async () => {
      if (ambience.playing) return
      const started = await enableAudio()
      if (started) {
        ;['click', 'touchstart', 'keydown', 'scroll'].forEach((e) =>
          document.removeEventListener(e, retry)
        )
      }
    }

    ;['click', 'touchstart', 'keydown', 'scroll'].forEach((e) =>
      document.addEventListener(e, retry, { passive: true })
    )
  })

  return ambience
}
