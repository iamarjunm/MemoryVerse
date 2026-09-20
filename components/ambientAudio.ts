// Procedural Web Audio Ambient Soundscape Generator
// Generates rich, relaxing ambient audio for Ocean, Forest, Space, and Train without external files.

export class AmbientSoundscape {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private currentTheme: string = 'space';
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private intervalId: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.1);
    }
  }

  public start(theme: string = 'space') {
    this.initContext();
    if (!this.ctx) return;
    this.stop();
    this.isRunning = true;
    this.currentTheme = theme;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 1.5);
    this.gainNode.connect(this.ctx.destination);

    switch (theme) {
      case 'ocean':
        this.startOcean();
        break;
      case 'forest':
        this.startForest();
        break;
      case 'train':
        this.startTrain();
        break;
      case 'space':
      default:
        this.startSpace();
        break;
    }
  }

  public changeTheme(theme: string) {
    if (!this.isRunning) {
      this.currentTheme = theme;
      return;
    }
    if (this.currentTheme === theme) return;
    this.start(theme);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
    setTimeout(() => {
      this.activeNodes.forEach(node => {
        if (typeof node !== 'number') {
          try {
            (node as any).stop?.();
            (node as any).disconnect?.();
          } catch (e) {}
        }
      });
      this.activeNodes = [];
    }, 500);
  }

  // --- OCEAN THEME: Deep watery rumble, resonant swells, sonar chime ---
  private startOcean() {
    if (!this.ctx || !this.gainNode) return;
    const ctx = this.ctx;

    // Pink/Brown noise generator for water waves
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.4;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant low-pass filter for underwater muffled feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    // LFO for wave surges
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // one wave cycle every ~8 seconds

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(180, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);

    whiteNoise.start();
    lfo.start();
    this.activeNodes.push(whiteNoise, lfo, filter, lfoGain);

    // Deep sub bass ocean drone
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, ctx.currentTime);

    subOsc.connect(subGain);
    subGain.connect(this.gainNode);
    subOsc.start();
    this.activeNodes.push(subOsc, subGain);

    // Occasional gentle underwater sonar/water droplet chime
    this.intervalId = setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.gainNode) return;
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chime.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], this.ctx.currentTime);
      chime.type = 'sine';

      chimeGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);

      chime.connect(chimeGain);
      chimeGain.connect(this.gainNode);
      chime.start();
      chime.stop(this.ctx.currentTime + 2.6);
    }, 4500);
  }

  // --- FOREST THEME: Night breeze, gentle forest chord, crickets ---
  private startForest() {
    if (!this.ctx || !this.gainNode) return;
    const ctx = this.ctx;

    // Warm wooden chord drone (C major 9: C3, G3, B3, D4)
    const chordNotes = [130.81, 196.0, 246.94, 293.66];
    chordNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.02 / (idx + 1), ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.gainNode!);
      osc.start();
      this.activeNodes.push(osc, gain);
    });

    // Gentle wind noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(450, ctx.currentTime);
    windFilter.Q.setValueAtTime(2, ctx.currentTime);

    wind.connect(windFilter);
    windFilter.connect(this.gainNode);
    wind.start();
    this.activeNodes.push(wind, windFilter);

    // Subtle cricket chirps
    this.intervalId = setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.gainNode) return;
      const cricket = this.ctx.createOscillator();
      const cricketGain = this.ctx.createGain();
      cricket.type = 'sine';
      cricket.frequency.setValueAtTime(4200 + Math.random() * 300, this.ctx.currentTime);

      cricketGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      cricketGain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.05);
      cricketGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

      cricket.connect(cricketGain);
      cricketGain.connect(this.gainNode);
      cricket.start();
      cricket.stop(this.ctx.currentTime + 0.4);
    }, 1800);
  }

  // --- SPACE THEME: Deep cosmic synth drone & ethereal shimmer ---
  private startSpace() {
    if (!this.ctx || !this.gainNode) return;
    const ctx = this.ctx;

    // Dual detuned oscillators for shimmering cosmic pad
    const freqs = [65.41, 98.0, 146.83]; // C2, G2, D3
    freqs.forEach(f => {
      [-2, 2].forEach(detune => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.detune.setValueAtTime(detune, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        gain.gain.setValueAtTime(0.02, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.gainNode!);
        osc.start();
        this.activeNodes.push(osc, filter, gain);
      });
    });

    // Shimmering celestial intervals
    this.intervalId = setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.gainNode) return;
      const shimmer = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C major pentatonic
      shimmer.frequency.setValueAtTime(scale[Math.floor(Math.random() * scale.length)], this.ctx.currentTime);
      shimmer.type = 'sine';

      sGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      sGain.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 0.8);
      sGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 4.0);

      shimmer.connect(sGain);
      sGain.connect(this.gainNode);
      shimmer.start();
      shimmer.stop(this.ctx.currentTime + 4.1);
    }, 3200);
  }

  // --- TRAIN THEME: Rhythmic railroad tracks chug & atmospheric carriage rumble ---
  private startTrain() {
    if (!this.ctx || !this.gainNode) return;
    const ctx = this.ctx;

    // Low mechanical rumble
    const rumble = ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(48, ctx.currentTime);
    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0.09, ctx.currentTime);
    rumble.connect(rGain);
    rGain.connect(this.gainNode);
    rumble.start();
    this.activeNodes.push(rumble, rGain);

    // Continuous air/friction hiss
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.1;
    }
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuffer;
    hiss.loop = true;

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(600, ctx.currentTime);
    hissFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    hiss.connect(hissFilter);
    hissFilter.connect(this.gainNode);
    hiss.start();
    this.activeNodes.push(hiss, hissFilter);

    // Rhythmic rail clickety-clack (4-beat train cadence: ta-ta-dum, ta-ta-dum)
    let beat = 0;
    this.intervalId = setInterval(() => {
      if (!this.isRunning || !this.ctx || !this.gainNode) return;
      beat++;
      // Pattern: click on 1, 2, 3, slight pause on 4
      if (beat % 4 === 0) return;

      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(beat % 2 === 0 ? 140 : 190, this.ctx.currentTime);

      clickGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      clickGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.02);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      click.connect(clickGain);
      clickGain.connect(this.gainNode);
      click.start();
      click.stop(this.ctx.currentTime + 0.13);
    }, 280);
  }
}

// Global singleton instance
export const ambientAudio = new AmbientSoundscape();
