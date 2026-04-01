window.JA = window.JA || {};

/**
 * Firebase Realtime Database Backend
 * Sistema de rankings para Jetpack Ascender V2
 */
JA.backend = {
  MAX_RANKING_SIZE: 100,

  // ─────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN DE FIREBASE
  // ─────────────────────────────────────────────────────────────────

  async init() {
    // Si ya está inicializado, salir
    if (window.firebase?.db) {
      return;
    }

    try {
      console.log('🔥 Inicializando Firebase...');

      // Cargar Firebase App
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
      const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');

      const firebaseConfig = JA.config.backend.firebase;
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);

      // Guardar en window
      window.firebase = { app, db };

      console.log('✓ Firebase inicializado correctamente');
      return db;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error.message);
      console.error('Usando fallback localStorage');
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // VALIDACIÓN
  // ─────────────────────────────────────────────────────────────────

  _validateScore(name, meters) {
    const validName = typeof name === 'string' && name.length > 0;
    const validMeters = typeof meters === 'number' && meters >= 0 && isFinite(meters);
    return validName && validMeters;
  },

  _validateRankingArray(data) {
    return Array.isArray(data) && data.every(row =>
      row.nombre && typeof row.metros === 'number' && isFinite(row.metros)
    );
  },

  _normalizeRankingRow(row) {
    return {
      nombre: String(row.nombre || '').trim(),
      metros: Math.floor(Math.max(0, Number(row.metros || 0)))
    };
  },

  // ─────────────────────────────────────────────────────────────────
  // OPERACIONES CON FIREBASE
  // ─────────────────────────────────────────────────────────────────

  async _getBin() {
    try {
      // Intentar inicializar Firebase
      await JA.backend.init();

      // Si no hay Firebase disponible, usar localStorage
      if (!window.firebase?.db) {
        console.warn('⚠️ Firebase no disponible, usando localStorage');
        return JA.storage.getLocalRanking();
      }

      // Firebase está disponible, obtener datos
      const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');

      const snapshot = await get(ref(window.firebase.db, 'ranking'));
      let ranking = snapshot.val() || [];

      // Convertir de objeto a array si es necesario
      if (ranking && typeof ranking === 'object' && !Array.isArray(ranking)) {
        ranking = Object.values(ranking);
      }

      ranking = Array.isArray(ranking) ? ranking : [];

      if (!JA.backend._validateRankingArray(ranking)) {
        console.warn('⚠️ Estructura de ranking inválida, usando localStorage');
        return JA.storage.getLocalRanking();
      }

      return ranking;
    } catch (error) {
      console.error('⚠️ Error en _getBin:', error.message);
      console.log('Usando localStorage como fallback');
      return JA.storage.getLocalRanking();
    }
  },

  async _putBin(ranking) {
    try {
      if (!JA.backend._validateRankingArray(ranking)) {
        // Si los datos son inválidos, guardar en localStorage
        return JA.backend.saveScoreLocal(ranking[0]?.nombre || 'Unknown', ranking[0]?.metros || 0);
      }

      await JA.backend.init();

      // Si Firebase no está disponible, guardar en localStorage
      if (!window.firebase?.db) {
        console.warn('⚠️ Firebase no disponible, guardando en localStorage');
        return JA.storage.saveLocalRanking(ranking);
      }

      // Firebase está disponible, guardar datos
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');

      const normalized = ranking.map(r => JA.backend._normalizeRankingRow(r));
      await set(ref(window.firebase.db, 'ranking'), normalized);

      console.log('✓ Ranking guardado en Firebase');
      return true;
    } catch (error) {
      console.error('⚠️ Error en _putBin:', error.message);
      console.log('Guardando en localStorage como fallback');
      if (ranking && Array.isArray(ranking)) {
        JA.storage.saveLocalRanking(ranking);
      }
      return true;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA: GUARDAR SCORE
  // ─────────────────────────────────────────────────────────────────

  async saveScore(name, meters) {
    if (!JA.backend._validateScore(name, meters)) {
      console.warn('⚠️ Score inválido:', { name, meters });
      return JA.backend.saveScoreLocal(name, meters);
    }

    try {
      const rows = await JA.backend._getBin();

      // Buscar si ya existe el jugador (case-insensitive)
      const idx = rows.findIndex(r =>
        String(r.nombre).toLowerCase() === String(name).toLowerCase()
      );

      if (idx >= 0) {
        // Actualizar solo si el nuevo score es mejor
        if (Number(meters) > Number(rows[idx].metros || 0)) {
          rows[idx].metros = Number(meters);
        }
      } else {
        // Agregar nuevo jugador
        rows.push({ nombre: name, metros: Number(meters) });
      }

      // Ordenar y limitar
      rows.sort((a, b) => Number(b.metros) - Number(a.metros));
      await JA.backend._putBin(rows.slice(0, 100));

      console.log(`✓ Score guardado para ${name}: ${meters}m`);
      return true;
    } catch (error) {
      console.error('⚠️ Firebase falló, usando fallback local:', error.message);
      return JA.backend.saveScoreLocal(name, meters);
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA: OBTENER RANKING
  // ─────────────────────────────────────────────────────────────────

  async getRanking() {
    try {
      const rows = await JA.backend._getBin();
      return rows
        .sort((a, b) => Number(b.metros) - Number(a.metros))
        .slice(0, 10);
    } catch (error) {
      console.error('⚠️ Error obteniendo ranking:', error.message);
      return JA.backend.getRankingLocal();
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA: OBTENER RÉCORD PERSONAL
  // ─────────────────────────────────────────────────────────────────

  async getRecord(name) {
    try {
      const rows = await JA.backend.getRanking();
      const row = rows.find(r =>
        String(r.nombre).toLowerCase() === String(name).toLowerCase()
      );
      return row ? Math.floor(Number(row.metros || 0)) : 0;
    } catch (error) {
      console.warn('⚠️ Error obteniendo record personal:', error.message);
      return 0;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA: VERIFICAR SI NOMBRE EXISTE
  // ─────────────────────────────────────────────────────────────────

  async existsName(name) {
    try {
      const rows = await JA.backend.getRanking();
      return rows.some(r =>
        String(r.nombre).toLowerCase() === String(name).toLowerCase()
      );
    } catch (error) {
      console.warn('⚠️ Error verificando nombre:', error.message);
      return false;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // FALLBACK LOCAL (localStorage)
  // ─────────────────────────────────────────────────────────────────

  saveScoreLocal(name, meters) {
    try {
      if (!JA.backend._validateScore(name, meters)) {
        return false;
      }

      const rows = JA.storage.getLocalRanking();
      const idx = rows.findIndex(r =>
        String(r.nombre).toLowerCase() === String(name).toLowerCase()
      );

      if (idx >= 0) {
        // Actualizar si es mejor
        rows[idx].metros = Math.max(Number(rows[idx].metros || 0), Number(meters));
      } else {
        // Agregar nuevo
        rows.push({ nombre: name, metros: Number(meters) });
      }

      rows.sort((a, b) => Number(b.metros) - Number(a.metros));
      JA.storage.saveLocalRanking(rows.slice(0, JA.backend.MAX_RANKING_SIZE));

      console.log(`✓ Score guardado localmente para ${name}: ${meters}m`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando score local:', error.message);
      return false;
    }
  },

  getRankingLocal() {
    try {
      const rows = JA.storage.getLocalRanking();
      return rows
        .sort((a, b) => Number(b.metros) - Number(a.metros))
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Error obteniendo ranking local:', error.message);
      return [];
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// INICIALIZAR FIREBASE EN EL DOCUMENTO
// ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  JA.backend.init().catch(err => {
    console.warn('⚠️ Firebase no disponible, usando localStorage:', err.message);
  });
});