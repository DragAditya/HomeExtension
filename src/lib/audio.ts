let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

export function unlockAudio(): void {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume().catch(() => {});
}

export function playChime(): void {
  const audio = getContext();
  if (!audio) return;
  const play = () => {
    const now = audio.currentTime;
    const tones = [
      { frequency: 659.25, start: 0, duration: 0.5 },
      { frequency: 880, start: 0.18, duration: 0.7 },
    ];
    for (const tone of tones) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0, now + tone.start);
      gain.gain.linearRampToValueAtTime(0.12, now + tone.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now + tone.start);
      oscillator.stop(now + tone.start + tone.duration + 0.03);
    }
  };
  if (audio.state === 'suspended') {
    void audio
      .resume()
      .then(play)
      .catch(() => {});
  } else {
    play();
  }
}
