window.JA = window.JA || {};
JA.hud = {
  cache() {
    JA.cache.elMetros = document.getElementById('hud-metros');
    JA.cache.elFuel = document.getElementById('hud-fuel');
    JA.cache.elVida = document.getElementById('hud-vida');
    JA.cache.elNivel = document.getElementById('hud-nivel');
    JA.cache.elBar = document.getElementById('hud-bar');
    JA.cache.elHud = document.getElementById('hud');
  },
  show() { if (JA.cache.elHud) JA.cache.elHud.style.display = 'block'; },
  hide() { if (JA.cache.elHud) JA.cache.elHud.style.display = 'none'; },
  update(scene) {
    if (!scene || !JA.cache.elMetros) return;
    JA.cache.elMetros.textContent = `⬆ ${scene.metrosReales.toLocaleString('es-AR')} m`;
    JA.cache.elFuel.textContent = `⚡ Fuel: ${Math.floor(scene.fuel)}%`;
    JA.cache.elVida.textContent = `❤ Vida: ${scene.vida}`;
    JA.cache.elNivel.textContent = JA.layers[scene.nivelActual].nombre;
    JA.cache.elBar.style.width = `${Math.max(0, Math.min(100, (scene.fuel / scene.maxFuel) * 100))}px`;
  }
};
