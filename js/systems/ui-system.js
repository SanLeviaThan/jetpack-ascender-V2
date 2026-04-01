window.JA = window.JA || {};
JA.ui = {
  _starting: false,
  init() {
    JA.hud.cache();
    JA.cache.panelInicio = document.getElementById('panel-inicio');
    JA.cache.panelRanking = document.getElementById('panel-ranking');
    JA.cache.panelGameOver = document.getElementById('panel-gameover');
    JA.cache.inputNombre = document.getElementById('inicio-input');
    const saved = JA.storage.getSavedName();
    if (saved) JA.cache.inputNombre.value = saved;

    // ── Audio: arranca música cuando el usuario hace el PRIMER gesto real ──
    const tryStartMenuMusic = () => {
      JA.initAudio();
      // pequeño delay para que el contexto quede desbloqueado antes de play()
      setTimeout(() => { JA.startMenuMusic(); }, 80);
    };
    document.addEventListener('pointerdown', tryStartMenuMusic, { once: true });
    document.addEventListener('keydown', tryStartMenuMusic, { once: true });

    // ── Botón VER RANKING ─────────────────────────────────────────────────
    document.getElementById('btn-ver-ranking').addEventListener('click', async () => {
      JA.initAudio(); JA.sfxButton(); JA.sfxRanking();
      const ol = document.getElementById('ranking-ol');
      ol.innerHTML = '<li style="color:#1e2e44">Cargando...</li>';
      JA.cache.panelRanking.style.display = 'flex';
      try { JA.renderRanking(await JA.backend.getRanking(), 'ranking-ol'); }
      catch (_) { ol.innerHTML = '<li style="color:#1e2e44">Sin conexión</li>'; }
    });

    // ── Botón CERRAR RANKING ──────────────────────────────────────────────
    document.getElementById('btn-cerrar-ranking').addEventListener('click', () => {
      JA.sfxButton();
      JA.cache.panelRanking.style.display = 'none';
    });

    // ── Enter en el input ─────────────────────────────────────────────────
    JA.cache.inputNombre.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('inicio-btn').click();
    });

    // ── Botón JUGAR ───────────────────────────────────────────────────────
    document.getElementById('inicio-btn').addEventListener('click', () => {
      JA.sfxButton();
      JA.ui.handleStart();
    });

    // ── Botón REINICIAR (game over) ───────────────────────────────────────
    document.getElementById('go-reiniciar').addEventListener('click', (e) => {
      e.preventDefault();
      JA.sfxButton();
      JA.ui.startScene();
    });

    // ── Botón MENÚ (game over) ────────────────────────────────────────────
    document.getElementById('go-menu').addEventListener('click', (e) => {
      e.preventDefault();
      JA.sfxButton();
      JA.ui.showMenu();
    });
  },

  async handleStart() {
    if (JA.ui._starting) return;
    const input = JA.cache.inputNombre;
    const name = JA.normalizeName(input.value);
    const saved = JA.storage.getSavedName();
    input.value = name;
    if (!name) { input.focus(); return; }
    if (!JA.isValidName(name)) {
      alert('El nombre debe tener entre 3 y 12 caracteres. Solo letras, números, espacios y guion bajo.');
      input.focus(); input.select(); return;
    }
    const btn = document.getElementById('inicio-btn');
    JA.ui._starting = true;
    btn.disabled = true;
    btn.innerHTML = '⚡ &nbsp; INICIANDO...';
    let launched = false;
    try {
      if (saved && name.toLowerCase() === saved.toLowerCase()) {
        JA.state.playerName = saved;
        JA.state.playerBest = await JA.backend.getRecord(saved);
        JA.ui.startScene();
        launched = true;
        return;
      }
      if (saved && name.toLowerCase() !== saved.toLowerCase()) {
        alert('Este dispositivo ya tiene el jugador: ' + saved);
        input.value = saved; input.focus(); return;
      }
      const exists = await JA.backend.existsName(name);
      if (exists && JA.config.backend.mode !== 'local') {
        alert('Ese nombre ya está en uso. Elegí otro.');
        input.focus(); input.select(); return;
      }
      JA.storage.setSavedName(name);
      JA.state.playerName = name;
      JA.state.playerBest = await JA.backend.getRecord(name);
      JA.ui.startScene();
      launched = true;
    } finally {
      if (!launched) {
        JA.ui._starting = false;
        btn.disabled = false;
        btn.innerHTML = '▶ &nbsp; JUGAR';
      }
    }
  },

  startScene() {
    JA.initAudio();
    JA.stopMenuMusic();
    JA.cache.panelGameOver.style.display = 'none';
    JA.input.showTouchControls();
    JA.state.game.scene.start('GameScene');
  },

  showMenu() {
    JA.ui._starting = false;
    const btn = document.getElementById('inicio-btn');
    if (btn) { btn.disabled = false; btn.innerHTML = '▶ &nbsp; JUGAR'; }
    JA.initAudio();
    JA.startMenuMusic();
    JA.stopJetpackSound();
    JA.hud.hide();
    JA.input.hideTouchControls();
    JA.cache.panelGameOver.style.display = 'none';
    JA.cache.panelInicio.style.display = 'flex';
    JA.cache.inputNombre.value = JA.state.playerName;
    JA.state.game.scene.start('MenuScene');
  },

  async showGameOver(meters) {
    JA.state.isGameOver = true;
    JA.hud.hide();
    JA.input.hideTouchControls();
    document.getElementById('go-metros').textContent = `${meters.toLocaleString('es-AR')} m`;
    document.getElementById('go-ranking').innerHTML = '<li style="color:#1e2e44">Cargando...</li>';
    let message = '';
    if (meters > JA.state.playerBest) {
      JA.state.playerBest = meters;
      await JA.backend.saveScore(JA.state.playerName, meters);
      message = '★  NUEVO RÉCORD PERSONAL  ★';
    } else {
      message = `TU RÉCORD ES ${JA.state.playerBest.toLocaleString('es-AR')} m`;
    }
    document.getElementById('go-msg').textContent = message;
    JA.cache.panelGameOver.style.display = 'flex';
    const ranking = await JA.backend.getRanking();
    if (!JA.state.isGameOver) return;
    JA.renderRanking(ranking, 'go-ranking');
    JA.state.game.scene.pause('GameScene');
  }
};