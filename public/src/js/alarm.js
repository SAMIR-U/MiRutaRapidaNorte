(() => {
  const TURN_WAIT_SECONDS = 120;
  const $ = id => document.getElementById(id);
  let audioMuted = localStorage.audioMuted === 'true';
  let audioContext = null, alarmTimer = null, alarmActive = false;

  function stopSound() {
    if (alarmTimer !== null) { clearInterval(alarmTimer); alarmTimer = null; }
  }
  function playTone() {
    if (!audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.36);
  }
  function startSound() {
    if (!alarmActive || audioMuted || alarmTimer !== null) return;
    playTone();
    alarmTimer = setInterval(playTone, 1400);
  }
  function unlockAudio() {
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!audioContext && AudioContextType) audioContext = new AudioContextType();
    if (audioContext && audioContext.state === 'suspended')
      audioContext.resume().then(() => { if (alarmActive && !audioMuted) playTone(); });
  }
  function updateAudioButton() {
    const button = $('audioToggle');
    button.textContent = audioMuted ? '🔇' : '🔊';
    button.setAttribute('aria-label', audioMuted ? 'Activar audio' : 'Silenciar audio');
    button.setAttribute('aria-pressed', String(audioMuted));
    button.title = audioMuted ? 'Activar audio' : 'Silenciar audio';
  }
  function update(bus, now) {
    alarmActive = !!bus && bus.status === 'enParada' &&
      (now - bus.arrivedAt) / 1000 >= TURN_WAIT_SECONDS;
    document.body.classList.toggle('alarm-active', alarmActive);
    $('alarmBanner').hidden = !alarmActive;
    if (alarmActive) startSound(); else stopSound();
  }
  function reset() {
    stopSound();
    alarmActive = false;
    document.body.classList.remove('alarm-active');
    $('alarmBanner').hidden = true;
  }

  $('audioToggle').addEventListener('click', () => {
    audioMuted = !audioMuted;
    localStorage.audioMuted = String(audioMuted);
    updateAudioButton();
    if (audioMuted) stopSound();
    else { unlockAudio(); startSound(); }
  });
  updateAudioButton();
  addEventListener('pointerdown', () => { if (!audioMuted) unlockAudio(); }, true);
  addEventListener('keydown', () => { if (!audioMuted) unlockAudio(); }, true);

  window.turnAlarm = { waitSeconds: TURN_WAIT_SECONDS, update, reset };
})();
