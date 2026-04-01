window.JA = window.JA || {};

/**
 * Firebase Realtime Database Backend
 * Sistema de rankings para Jetpack Ascender V2
 */
JA.backend = {
  // Cache simple
  _cache: {
    ranking: null,
    lastFetch: 0
  },

  // ─────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN DE FIREBASE
  // ─────────────────────────────────────────────────────────────────

  async init() {
    if (window.firebase?.db) return; // Ya inicializado

    try {
      console.log('🔥 Inicializando Firebase...');

      // Cargar Firebase SDK
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
        import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';
        
        const firebaseConfig = ${JSON.stringify(JA.config.backend.firebase)};
        const app = initializeApp(firebaseConfig);
        window.firebase = { app, db: getDatabase(app) };
        console.log('✓ Firebase inicializado');
      `;
      document.head.appendChild(script);

      // Esperar a que Firebase se inicialice
      for (let i = 0; i < 50; i++) {
        if (window.firebase?.db) {
          await new Promise(r => setTimeout(r, 100));
          console.log('✓ Base de datos lista');
          return;
        }
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('Firebase timeout');
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error.message);
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
      await JA.backend.init();

      if (!window.firebase?.db) {
        throw new Error('Firebase no disponible');
      }

      const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');

      const snapshot = await get(ref(window.firebase.db, 'ranking'));
      let ranking = snapshot.val() || [];

      // Convertir de objeto a array si es necesario
      if (ranking && typeof ranking === 'object' && !Array.isArray(ranking)) {
        ranking = Object.values(ranking);
      }

      ranking = Array.isArray(ranking) ? ranking : [];

      if (!JA.backend._validateRankingArray(ranking)) {
        console.warn('⚠️ Estructura de ranking inválida, usando fallback local');
        return JA.storage.getLocalRanking();
      }

      JA.backend._cache.ranking = ranking;
      JA.backend._cache.lastFetch = Date.now();

      return ranking;
    } catch (error) {
      console.error('❌ Error en _getBin:', error.message);
      if (JA.backend._cache.ranking) {
        console.log('⚠️ Usando cache de ranking');
        return JA.backend._cache.ranking;
      }
      throw error;
    }
  },

  async _putBin(ranking) {
    try {
      if (!JA.backend._validateRankingArray(ranking)) {
        throw new Error('Datos de ranking inválidos antes de guardar');
      }

      await JA.backend.init();

      if (!window.firebase?.db) {
        throw new Error('Firebase no disponible');
      }

      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');

      const normalized = ranking.map(r => JA.backend._normalizeRankingRow(r));

      await set(ref(window.firebase.db, 'ranking'), normalized);

      JA.backend._cache.ranking = normalized;
      JA.backend._cache.lastFetch = Date.now();

      console.log('✓ Ranking guardado en Firebase');
    } catch (error) {
      console.error('❌ Error en _putBin:', error.message);
      throw error;
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