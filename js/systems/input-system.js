window.JA = window.JA || {};
JA.input = {
  touch: { left: false, right: false, thrust: false, shoot: false }
};
JA.input.isTouchDevice = function () {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
JA.input.setTouchButton = function (key, value, el) {
  JA.input.touch[key] = value;
  if (el) el.classList.toggle('active', value);
};
JA.input.bindTouchHold = function (id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    JA.initAudio();
    JA.input.setTouchButton(key, true, el);
  };
  const up = (e) => {
    e.preventDefault();
    JA.input.setTouchButton(key, false, el);
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
};
JA.input.initTouchControls = function () {
  JA.input.bindTouchHold('btn-left', 'left');
  JA.input.bindTouchHold('btn-right', 'right');
  JA.input.bindTouchHold('btn-thrust', 'thrust');
  JA.input.bindTouchHold('btn-shoot', 'shoot');
};
JA.input.showTouchControls = function () {
  const el = document.getElementById('touch-controls');
  if (!el) return;
  el.style.display = JA.input.isTouchDevice() ? 'block' : 'none';
};
JA.input.hideTouchControls = function () {
  const el = document.getElementById('touch-controls');
  if (el) el.style.display = 'none';
  Object.keys(JA.input.touch).forEach(key => JA.input.touch[key] = false);
  document.querySelectorAll('.touch-btn.active').forEach(btn => btn.classList.remove('active'));
};
