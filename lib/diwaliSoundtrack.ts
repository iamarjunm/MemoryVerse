export function startDiwaliSoundtrack() {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 2.5);
  master.connect(context.destination);
  const echo = context.createDelay(1.2);
  const echoFeedback = context.createGain();
  const echoWet = context.createGain();
  echo.delayTime.value = 0.38;
  echoFeedback.gain.value = 0.2;
  echoWet.gain.value = 0.16;
  master.connect(echo);
  echo.connect(echoFeedback);
  echoFeedback.connect(echo);
  echo.connect(echoWet);
  echoWet.connect(context.destination);

  const droneOscillators: OscillatorNode[] = [];
  [130.81, 196, 261.63].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 1 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 2 ? 4 : -2;
    gain.gain.value = index === 0 ? 0.22 : 0.1;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    droneOscillators.push(oscillator);
  });

  const notes = [523.25, 659.25, 739.99, 783.99, 880, 783.99, 739.99, 659.25, 587.33, 659.25];
  let noteIndex = 0;
  const playBell = () => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const tone = notes[noteIndex++ % notes.length];
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone, now);
    oscillator.frequency.exponentialRampToValueAtTime(tone * 1.006, now + 0.8);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 2.4);

    const overtone = context.createOscillator();
    const overtoneGain = context.createGain();
    overtone.type = 'sine';
    overtone.frequency.value = tone * 2.01;
    overtoneGain.gain.setValueAtTime(0.0001, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.035, now + 0.025);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    overtone.connect(overtoneGain);
    overtoneGain.connect(master);
    overtone.start(now);
    overtone.stop(now + 1.5);
  };

  const playSoftBeat = () => {
    const now = context.currentTime;
    const drum = context.createOscillator();
    const envelope = context.createGain();
    drum.type = 'sine';
    drum.frequency.setValueAtTime(158, now);
    drum.frequency.exponentialRampToValueAtTime(82, now + 0.16);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    drum.connect(envelope);
    envelope.connect(master);
    drum.start(now);
    drum.stop(now + 0.27);
  };

  playBell();
  let beat = 0;
  const interval = window.setInterval(() => {
    playBell();
    if (++beat % 2 === 0) playSoftBeat();
  }, 1150);
  void context.resume();

  return {
    stop() {
      window.clearInterval(interval);
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0.0001, now, 0.4);
      droneOscillators.forEach(oscillator => {
        try { oscillator.stop(now + 1.5); } catch {}
      });
      window.setTimeout(() => { void context.close(); }, 1800);
    },
  };
}

export function playPataakaSound() {
  const context = new window.AudioContext();
  void context.resume();
  const output = context.createGain();
  output.gain.value = 0.48;
  output.connect(context.destination);

  const duration = 1.15;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;

  [0, 0.13, 0.31].forEach((offset, index) => {
    const now = context.currentTime + offset;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const snap = context.createGain();
    noise.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = index === 0 ? 900 : 1400;
    snap.gain.setValueAtTime(0.0001, now);
    snap.gain.exponentialRampToValueAtTime(index === 2 ? 0.48 : 0.3, now + 0.004);
    snap.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    noise.connect(filter);
    filter.connect(snap);
    snap.connect(output);
    noise.start(now, 0, 0.26);
  });

  const boom = context.createOscillator();
  const boomGain = context.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(105, context.currentTime);
  boom.frequency.exponentialRampToValueAtTime(38, context.currentTime + 0.38);
  boomGain.gain.setValueAtTime(0.0001, context.currentTime);
  boomGain.gain.exponentialRampToValueAtTime(0.42, context.currentTime + 0.012);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
  boom.connect(boomGain);
  boomGain.connect(output);
  boom.start();
  boom.stop(context.currentTime + 0.85);
  window.setTimeout(() => { void context.close(); }, 1600);
}
