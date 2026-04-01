window.JA = window.JA || {};
JA.worldItems = {

  /* ── Plataforma con sprites tileados ─────────────────────────────────── */
  drawPlatform(scene, x, y, width, color, glow, rotation) {
    const c = scene.add.container(x, y);
    const h = 22;
    if (!scene.textures.exists('plat_plataforma_simple')) {
      const g = scene.add.graphics();
      g.fillStyle(glow, 0.14);
      g.fillRect(-width / 2 - 3, 0, width + 6, 16);
      g.fillStyle(color, 1);
      g.fillRect(-width / 2, 2, width, 12);
      g.fillStyle(glow, 0.95);
      g.fillRect(-width / 2, 2, width, 3);
      c.add(g);
    } else if (width <= 120) {
      const img = scene.add.image(0, 8, 'plat_plataforma_simple');
      img.setDisplaySize(width, h);
      c.add(img);
    } else {
      const capW = Math.min(Math.floor(width * 0.22), 56);
      const midW = Math.max(width - capW * 2, 16);

      const left = scene.add.image(-width / 2 + capW / 2, 8, 'plat_plataforma_izquierda').setDisplaySize(capW, h);
      const mid = scene.add.image(0, 8, 'plat_tramo_plataforma').setDisplaySize(midW, h);
      const right = scene.add.image(width / 2 - capW / 2, 8, 'plat_plataforma_derecha').setDisplaySize(capW, h);

      c.add([left, mid, right]);
    }

    c.rotation = rotation || 0;
    c.setDepth(2);
    return c;
  },

  /* ── Paredes laterales ARREGLADAS (COMPLETO) ────────────────────────────────────── */
  drawWalls(scene) {
    const topY = scene.cameras.main.scrollY - 220;
    const W = JA.config.game.width;
    const WALL = JA.config.game.wall;
    const wallH = 1400;

    if (scene.wallLeftImg && !scene.wallLeftImg.active) {
      scene.wallLeftImg = null;
      scene.wallRightImg = null;
    }
    if (scene.wallLeftSprite && !scene.wallLeftSprite.active) {
      scene.wallLeftSprite = null;
      scene.wallRightSprite = null;
    }

    if (!scene.wallLeftImg && !scene.wallLeftSprite) {
      const tieneIzq = scene.textures.exists('plat_pared_izquierda');
      const tieneDer = scene.textures.exists('plat_pared_derecha');

      if (tieneIzq && tieneDer) {
        scene.wallLeftImg = scene.add.image(0, 0, 'plat_pared_izquierda').setOrigin(0, 0).setDepth(1);
        scene.wallRightImg = scene.add.image(W - WALL, 0, 'plat_pared_derecha').setOrigin(0, 0).setDepth(1);
      } else {
        scene.wallLeftSprite = scene.add.rectangle(0, 0, WALL, wallH, 0x00ffcc, 0.12).setOrigin(0, 0).setDepth(1);
        scene.wallRightSprite = scene.add.rectangle(W - WALL, 0, WALL, wallH, 0x00ffcc, 0.12).setOrigin(0, 0).setDepth(1);
      }

      scene.wallGfx = scene.add.graphics().setDepth(2);
    }

    if (scene.wallLeftImg) {
      scene.wallLeftImg.setPosition(0, topY).setDisplaySize(WALL, wallH).setVisible(true);
      scene.wallRightImg.setPosition(W - WALL, topY).setDisplaySize(WALL, wallH).setVisible(true);
    } else if (scene.wallLeftSprite) {
      scene.wallLeftSprite.setPosition(0, topY).setDisplaySize(WALL, wallH).setVisible(true);
      scene.wallRightSprite.setPosition(W - WALL, topY).setDisplaySize(WALL, wallH).setVisible(true);
    }

    scene.wallGfx.clear();
    scene.wallGfx.fillStyle(0x00ffcc, 0.45);
    scene.wallGfx.fillRect(WALL - 3, topY, 3, wallH);
    scene.wallGfx.fillRect(W - WALL, topY, 3, wallH);
    scene.wallGfx.fillStyle(0x00ffcc, 0.25);
    scene.wallGfx.fillRect(0, topY, 2, wallH);
    scene.wallGfx.fillRect(W - 2, topY, 2, wallH);
  },
  /* ── Fuel pickup ───────────────────────────────────────── */
  drawPickup(scene, x, y) {
    const g = scene.add.graphics();
    g.fillStyle(0x00ff88, 0.35); g.fillCircle(0, 0, 11);
    g.fillStyle(0x00ff88, 1); g.fillTriangle(0, -10, 9, 5, -9, 5);
    g.fillStyle(0xffffff, 0.9); g.fillRect(-1, -8, 2, 10); g.fillRect(-4, -2, 8, 2);
    g.x = x; g.y = y;
    g.setDepth(4);
    return g;
  },

  /* ── Heart pickup ──────────────────────────────────────── */
  drawHeart(scene, x, y) {
    const g = scene.add.graphics();
    g.fillStyle(0xff3366, 0.28); g.fillCircle(-6, -4, 8); g.fillCircle(6, -4, 8); g.fillTriangle(-14, 0, 14, 0, 0, 16);
    g.fillStyle(0xff5577, 1); g.fillCircle(-5, -3, 6); g.fillCircle(5, -3, 6); g.fillTriangle(-11, 1, 11, 1, 0, 13);
    g.fillStyle(0xffffff, 0.35); g.fillCircle(-7, -5, 2);
    g.x = x; g.y = y;
    g.setDepth(4);
    return g;
  },

  /* ── Speed-up pickup (turbo) ─────────────────────────────────────────── */
  drawSpeedup(scene, x, y) {
    const g = scene.add.graphics();
    g.fillStyle(0x00eeff, 0.25); g.fillCircle(0, 0, 14);
    g.fillStyle(0x00eeff, 1);
    g.fillTriangle(0, -14, 8, -2, -8, -2);
    g.fillTriangle(0, -4, 7, 6, -7, 6);
    g.fillStyle(0xffffff, 0.85); g.fillRect(-1.5, -10, 3, 14);
    g.x = x; g.y = y;
    g.setDepth(4);
    return g;
  },

  /* ── Bala del jugador (BOLITA) ────────────────────────────────────────────────── */
  drawBullet(scene) {
    const g = scene.add.graphics();

    g.fillStyle(0xff3300, 0.3);
    g.fillCircle(0, 0, 8);

    g.fillStyle(0xff2200, 1);
    g.fillCircle(0, 0, 5);

    g.fillStyle(0xff6600, 0.9);
    g.fillCircle(0, 0, 3.5);

    g.fillStyle(0xffcc88, 1);
    g.fillCircle(0, 0, 2);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, 1);

    g.setDepth(8);
    return g;
  },

  /* ── Colisión AABB simple ────────────────────────────────────────────── */
  hit(a, b, margin) {
    const mg = margin || 0;
    if (!a || !b || !a.active || !b.active) return false;
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 - mg &&
      Math.abs(a.y - b.y) < (a.height + b.height) / 2 - mg;
  }
};