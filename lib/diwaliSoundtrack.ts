export function startDiwaliSoundtrack() {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 2.5);
  master.connect(context.destination);

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

  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880, 783.99, 659.25, 587.33];
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
  };

  const interval = window.setInterval(playBell, 1150);
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
