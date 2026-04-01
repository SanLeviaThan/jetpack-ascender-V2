window.JA = window.JA || {};
JA.storage = {
  getSavedName() {
    try { return localStorage.getItem(JA.config.storage.playerNameKey) || ''; }
    catch (_) { return ''; }
  },
  setSavedName(name) {
    try { localStorage.setItem(JA.config.storage.playerNameKey, name); }
    catch (_) { }
  },
  getLocalRanking() {
    try {
      const raw = localStorage.getItem(JA.config.storage.localRankingKey);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  },
  saveLocalRanking(rows) {
    try { localStorage.setItem(JA.config.storage.localRankingKey, JSON.stringify(rows)); }
    catch (_) { }
  }
};
JA.normalizeName = function (name) {
  return String(name || '').replace(/\s+/g, ' ').trim();
};
JA.isValidName = function (name) {
  return /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ_ ]{3,12}$/.test(name);
};
JA.renderRanking = function (rows, olId, classes) {
  const ol = document.getElementById(olId);
  if (!ol) return;
  ol.innerHTML = '';
  if (!Array.isArray(rows) || rows.length === 0) {
    const li = document.createElement('li');
    li.style.color = '#1e2e44';
    li.textContent = 'Sin registros';
    ol.appendChild(li);
    return;
  }
  const medals = ['1°', '2°', '3°'];
  const cls = classes || ['r1', 'r2', 'r3'];
  rows.forEach((row, index) => {
    const li = document.createElement('li');
    if (cls[index]) li.className = cls[index];
    const prefix = document.createTextNode(`${medals[index] || (index + 1) + '.'} ${row.nombre || ''} — `);
    const span = document.createElement('span');
    span.textContent = `${(Number(row.metros) || 0).toLocaleString('es-AR')} m`;
    li.appendChild(prefix);
    li.appendChild(span);
    ol.appendChild(li);
  });
};
