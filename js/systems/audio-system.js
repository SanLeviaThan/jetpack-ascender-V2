window.JA = window.JA || {};
JA.audio = {
  ctx: null,
  master: null,
  unlocked: false,
  musicEl: null,
  turbinePlaying: false,
  pool: {}        // HTMLAudio elements
};

/* ── Init Web Audio API ───────────────────────────────────────────────── */
JA.initAudio = function () {
  if (!JA.audio.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    JA.audio.ctx = new AC();
    JA.audio.master = JA.audio.ctx.createGain();
    JA.audio.master.gain.value = 0.16;
    JA.audio.master.connect(JA.audio.ctx.destination);
  }
  if (JA.audio.ctx.state === 'suspended') JA.audio.ctx.resume();
  JA.audio.unlocked = true;
};

/* ── Pool HTMLAudio (llamado desde boot-scene después de preload) ─────── */
JA.audio.initPool = function () {
  const files = {
    shot: 'assets/music/shot.mp3',
    turbina: 'assets/music/turbina.mp3',
    bonus: 'assets/music/bonus.mp3',
    vida: 'assets/music/vida.mp3',
    buttons: 'assets/music/buttons.mp3'
  };
  Object.entries(files).forEach(([k, src]) => {
    const a = new Audio(src);
    a.preload = 'auto';
    JA.audio.pool[k] = a;
  });
  JA.audio.musicMenu = new Audio('assets/music/menu.mp3');
  JA.audio.musicMenu.loop = true;
  JA.audio.musicMenu.volume = 0.45;
  JA.audio.musicPlaying = new Audio('assets/music/playing.mp3');
  JA.audio.musicPlaying.loop = true;
  JA.audio.musicPlaying.volume = 0.38;
  // turbina en loop mientras vuelas
  if (JA.audio.pool.turbina) {
    JA.audio.pool.turbina.loop = true;
    JA.audio.pool.turbina.volume = 0.35;
  }
};

/* ── Helpers SFX HTML ────────────────────────────────────────────────── */
JA._playSfx = function (key, vol) {
  const a = JA.audio.pool[key];
  if (!a) return;
  a.volume = vol || 0.55;
  a.currentTime = 0;
  a.play().catch(() => { });
};

/* ── Música de menú ───────────────────────────────────────────────────── */
JA.startMenuMusic = function () {
  JA.stopMusic();
  if (JA.audio.musicMenu) {
    JA.audio.musicMenu.currentTime = 0;
    JA.audio.musicMenu.play().catch(() => { });
  }
};
JA.stopMenuMusic = function () {
  if (JA.audio.musicMenu) { JA.audio.musicMenu.pause(); JA.audio.musicMenu.currentTime = 0; }
};

/* ── Música de juego ──────────────────────────────────────────────────── */
JA.startGameMusic = function () {
  JA.stopMusic();
  if (JA.audio.musicPlaying) {
    JA.audio.musicPlaying.currentTime = 0;
    JA.audio.musicPlaying.play().catch(() => { });
  }
};
JA.stopGameMusic = function () {
  if (JA.audio.musicPlaying) { JA.audio.musicPlaying.pause(); JA.audio.musicPlaying.currentTime = 0; }
};

/* Para que ui-system.js pueda llamar stopMusic genéricamente */
JA.stopMusic = function () {
  JA.stopMenuMusic();
  JA.stopGameMusic();
};

/* ── Jetpack ─────────────────────────────────────────────────────────── */
JA.startJetpackSound = function () {
  const a = JA.audio.pool.turbina;
  if (!a || JA.audio.turbinePlaying) return;
  a.currentTime = 0;
  a.play().catch(() => { });
  JA.audio.turbinePlaying = true;
};
JA.updateJetpackSound = function () { /* no-op: HTMLAudio maneja el loop */ };
JA.stopJetpackSound = function () {
  const a = JA.audio.pool.turbina;
  if (!a) return;
  a.pause(); a.currentTime = 0;
  JA.audio.turbinePlaying = false;
};

/* ── SFX existentes ──────────────────────────────────────────────────── */
JA.sfxShoot  = () => JA._playSfx('shot', 0.50);
JA.sfxFuel   = () => JA._playSfx('bonus', 0.55);
JA.sfxHeart  = () => JA._playSfx('vida', 0.55);
JA.sfxButton = () => JA._playSfx('buttons', 0.45);
JA.sfxTurbo  = () => JA._playSfx('turbina', 0.65); // disparo corto para turbo

/* ── Síntesis Web Audio ──────────────────────────────────────────────── */
JA.beep = function (freq, duration, type, volume, when) {
  if (!JA.audio.ctx) return;
  const t = when || JA.audio.ctx.currentTime;
  const osc = JA.audio.ctx.createOscillator();
  const gain = JA.audio.ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume || 0.05, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain); gain.connect(JA.audio.master);
  osc.start(t); osc.stop(t + duration + 0.02);
};

JA.noiseBurst = function (duration, volume, when, hpFreq) {
  if (!JA.audio.ctx) return;
  const t = when || JA.audio.ctx.currentTime;
  const size = Math.max(1, Math.floor(JA.audio.ctx.sampleRate * duration));
  const buf = JA.audio.ctx.createBuffer(1, size, JA.audio.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = JA.audio.ctx.createBufferSource();
  src.buffer = buf;
  const filter = JA.audio.ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = hpFreq || 500;
  const gain = JA.audio.ctx.createGain();
  gain.gain.setValueAtTime(volume || 0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter); filter.connect(gain); gain.connect(JA.audio.master);
  src.start(t); src.stop(t + duration + 0.02);
};

/* sfxDeath y sfxRanking: síntesis */
JA.sfxDeath   = () => { if (!JA.audio.ctx) return; const t = JA.audio.ctx.currentTime; JA.beep(420, 0.12, 'sawtooth', 0.05, t); JA.beep(260, 0.18, 'sawtooth', 0.045, t + 0.08); JA.noiseBurst(0.18, 0.03, t + 0.02, 300); };
JA.sfxRanking = () => { if (!JA.audio.ctx) return; const t = JA.audio.ctx.currentTime; JA.beep(784, 0.08, 'triangle', 0.035, t); JA.beep(988, 0.08, 'triangle', 0.04, t + 0.08); JA.beep(1174, 0.14, 'triangle', 0.045, t + 0.16); };

/* ── NUEVO: Turbo pickup — acorde ascendente brillante ───────────────── */
JA.sfxTurboPickup = function () {
  if (!JA.audio.ctx) return;
  const t = JA.audio.ctx.currentTime;
  // Acorde de tres notas subiendo rápido, tono electrónico
  JA.beep(440,  0.10, 'sine', 0.06, t);
  JA.beep(660,  0.10, 'sine', 0.06, t + 0.07);
  JA.beep(1100, 0.18, 'sine', 0.07, t + 0.14);
  // Ruido de "whoosh" corto encima
  JA.noiseBurst(0.12, 0.025, t, 1200);
};

/* ── NUEVO: Transición de capa atmosférica — swoosh profundo ─────────── */
JA.sfxLayerUp = function () {
  if (!JA.audio.ctx) return;
  const t = JA.audio.ctx.currentTime;
  // Barrido de frecuencia descendente (efecto "entrar a nueva zona")
  const osc = JA.audio.ctx.createOscillator();
  const gain = JA.audio.ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.35);
  osc.frequency.exponentialRampToValueAtTime(280, t + 0.55);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  osc.connect(gain); gain.connect(JA.audio.master);
  osc.start(t); osc.stop(t + 0.6);
  // Campanilla encima para reforzar el "subiste de capa"
  JA.beep(1320, 0.12, 'triangle', 0.04, t + 0.15);
  JA.beep(1760, 0.10, 'triangle', 0.03, t + 0.28);
};
