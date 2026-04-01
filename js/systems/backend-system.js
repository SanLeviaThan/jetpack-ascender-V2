window.JA = window.JA || {};
JA.backend = {
  // ─────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN Y UTILIDADES
  // ─────────────────────────────────────────────────────────────────
  REQUEST_TIMEOUT: 8000,  // 8 segundos de timeout
  RETRY_ATTEMPTS: 2,      // Reintentos en caso de fallo
  MAX_RANKING_SIZE: 50,   // Máximo de registros guardados

  _jsonbinUrl() {
    return `https://api.jsonbin.io/v3/b/${JA.config.backend.jsonbinId}`;
  },

  _headers() {
    return {
      'Content-Type': 'application/json',
      'X-Master-Key': JA.config.backend.jsonbinKey
    };
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
  // PETICIONES CON TIMEOUT Y REINTENTOS
  // ─────────────────────────────────────────────────────────────────

  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JA.backend.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: No hay respuesta de JSONBin');
      }
      throw error;
    }
  },

  async _fetchWithRetry(url, options = {}, attempts = JA.backend.RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await JA.backend._fetchWithTimeout(url, options);
      } catch (error) {
        if (i === attempts - 1) throw error;
        // Espera antes de reintentar (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // OPERACIONES SOBRE JSONBIN O PROXY
  // ─────────────────────────────────────────────────────────────────

  async _getBin() {
    try {
      const r = await JA.backend._fetchWithRetry(
        `${JA.backend._jsonbinUrl()}/latest`,
        { headers: JA.backend._headers() }
      );

      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }

      const d = await r.json();

      // JSONBin devuelve { record: { ... } }
      // Puede tener "ranking" array o "players" objeto
      // Si es un objeto, convertir a array
      if (ranking && typeof ranking === 'object' && !Array.isArray(ranking)) {
        ranking = Object.values(ranking);
      }

      if (!JA.backend._validateRankingArray(ranking)) {
        console.warn('⚠️ Estructura de ranking inválida, usando fallback local');
        return JA.storage.getLocalRanking();
      }

      return ranking;
    } catch (error) {
      console.error('❌ Error en _getBin:', error.message);
      throw error;
    }
  },

  async _putBin(ranking) {
    try {
      // Validar antes de enviar
      if (!JA.backend._validateRankingArray(ranking)) {
        throw new Error('Datos de ranking inválidos antes de guardar');
      }

      // Normalizar datos
      const normalized = ranking.map(r => JA.backend._normalizeRankingRow(r));

      const r = await JA.backend._fetchWithRetry(
        JA.backend._jsonbinUrl(),
        {
          method: 'PUT',
          headers: JA.backend._headers(),
          body: JSON.stringify({ ranking: normalized })
        }
      );

      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }

      console.log('✓ Ranking guardado en JSONBin');
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

    if (JA.config.backend.mode === 'jsonbin') {
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
        await JA.backend._putBin(rows.slice(0, JA.backend.MAX_RANKING_SIZE));

        console.log(`✓ Score guardado para ${name}: ${meters}m`);
        return true;
      } catch (error) {
        console.error('⚠️ JSONBin falló, usando fallback local:', error.message);
        return JA.backend.saveScoreLocal(name, meters);
      }
    }

    return JA.backend.saveScoreLocal(name, meters);
  },

  // ─────────────────────────────────────────────────────────────────
  // API PÚBLICA: OBTENER RANKING
  // ─────────────────────────────────────────────────────────────────

  async getRanking() {
    if (JA.config.backend.mode === 'jsonbin') {
      try {
        const rows = await JA.backend._getBin();
        return rows
          .sort((a, b) => Number(b.metros) - Number(a.metros))
          .slice(0, 10);
      } catch (error) {
        console.error('⚠️ Error obteniendo ranking remoto:', error.message);
        return JA.backend.getRankingLocal();
      }
    }

    return JA.backend.getRankingLocal();
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