window.JA = window.JA || {};
JA.spawn = {
  metersFromY(scene, y) {
    const mg = Math.max(0, Math.floor((scene.alturaBase - y) / 8));
    return mg * JA.config.game.metersScale;
  },

  generateChunk(scene, fromY, toY) {
    const W = JA.config.game.width;
    const WALL = JA.config.game.wall;
    let speedupRowCount = 0;

    for (let y = fromY - 110; y > toY; y -= Phaser.Math.Between(120, 170)) {
      const rowMeters = JA.spawn.metersFromY(scene, y);
      const layerIndex = JA.getLayerIndex(rowMeters);
      const layer = JA.layers[layerIndex];
      const inSpace = layer.move === 'asteroid';

      let platData = null;

      /* ── Plataformas ─────────────────────────────────────────────── */
      if (!inSpace) {
        const minWidth = Math.max(130, 220 - layerIndex * 14);
        const maxWidth = Math.max(190, 300 - layerIndex * 16);
        const platW = Phaser.Math.Between(minWidth, maxWidth);
        const platX = Phaser.Math.Between(
          Math.floor(platW / 2) + WALL + 12,
          W - Math.floor(platW / 2) - WALL - 12
        );
        const rot = 0;

        const gfx = JA.worldItems.drawPlatform(scene, platX, y, platW, layer.platColor, layer.glow, rot);
        const plat = scene.add.rectangle(platX, y + 6, platW - 8, 12, 0x000000, 0);
        scene.physics.add.existing(plat, true);

        if (scene.platGroup) scene.platGroup.add(plat);
        else scene.physics.add.collider(scene.player, plat);

        scene.plats.push(plat);
        scene.platGfx.push(gfx);

        platData = { x: platX, y, w: platW };

        /* ── Fuel pickup ─────────────────────────────────────────── */
        if (Phaser.Math.Between(0, 6) === 0) {
          const fx = Phaser.Math.Between(WALL + 20, W - WALL - 20);
          const fg = JA.worldItems.drawPickup(scene, fx, y - 28);
          const fu = scene.add.rectangle(fx, y - 28, 14, 14, 0x000000, 0);
          scene.physics.add.existing(fu, true);
          scene.pickups.push(fu);
          scene.pickGfx.push(fg);
          scene.tweens.add({
            targets: fg,
            y: '+=7',
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }

        // Speed-up pickup - aparece cada 8 filas (no en todas)
        if (speedupRowCount % 8 === 0 && layerIndex > 0) {
          const sx = Phaser.Math.Between(WALL + 50, W - WALL - 50);
          const sg = JA.worldItems.drawSpeedup(scene, sx, y - 34);
          const su = scene.add.rectangle(sx, y - 34, 20, 20, 0x000000, 0);
          scene.speedups.push(su);
          scene.speedupGfx.push(sg);
          scene.tweens.add({
            targets: sg,
            y: '+=6',
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }

      /* ── Heart al final de cada capa ─────────────────────────── */
      if (!inSpace && layerIndex < JA.layers.length - 1) {
        const nearEnd = rowMeters >= (layer.hasta - 7000);
        if (nearEnd && !scene.heartSpawned[layerIndex]) {
          const hx = Phaser.Math.Between(WALL + 40, W - WALL - 40);
          const hy = y - 56;
          const hg = JA.worldItems.drawHeart(scene, hx, hy);
          const heart = scene.add.rectangle(hx, hy, 22, 20, 0x000000, 0);
          scene.physics.add.existing(heart);
          heart.body.setAllowGravity(false);
          heart.body.setVelocityX(Phaser.Math.Between(90, 140) * (Math.random() > 0.5 ? 1 : -1));
          heart.moveSpeed = Math.abs(heart.body.velocity.x);
          scene.heartItems.push(heart);
          scene.heartGfx.push(hg);
          scene.heartSpawned[layerIndex] = true;
          scene.tweens.add({
            targets: hg,
            y: '+=8',
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }

      /* ── Enemigos ────────────────────────────────────────────── */
      if (!inSpace) {
        const isAirEnemy = (layer.enemyType === 'flyingeye');
        const enemyChance = isAirEnemy ? 0.34 : 0.26;

        if (Math.random() < enemyChance) {
          let ex = null;
          let ey = null;

          if (isAirEnemy) {
            ex = Phaser.Math.Between(WALL + 40, W - WALL - 40);
            ey = y - Phaser.Math.Between(70, 120);
          } else if (platData) {
            const margin = 28;

            const minPatrolX = Math.floor(platData.x - platData.w / 2 + margin);
            const maxPatrolX = Math.floor(platData.x + platData.w / 2 - margin);

            ex = Phaser.Math.Between(minPatrolX, maxPatrolX);
            ey = y - 20;
          }

          if (ex !== null && ey !== null) {
            const eg = JA.enemies.draw(scene, ex, ey, layer);
            const hitSize = isAirEnemy ? 42 : 50;
            const en = scene.add.rectangle(ex, ey, hitSize, hitSize, 0x000000, 0);
            scene.physics.add.existing(en);
            en.body.setAllowGravity(false);

            en.moveType = layer.move;
            en.enemyType = layer.enemyType;
            en.enemySpeed = isAirEnemy ? layer.speed : Math.max(45, layer.speed - 10);
            en.spawnY = ey;
            en.baseX = ex;
            en.baseY = ey;
            en.phase = Math.random() * Math.PI * 2;
            en.radius = Phaser.Math.Between(20, 35);
            en.dashCD = Phaser.Math.Between(30, 70);

            const cfg = JA.enemies._cfg ? JA.enemies._cfg[layer.enemyType] : null;
            en.attackCD = cfg ? cfg.attackCD : 80;

            if (!isAirEnemy && platData) {
              const margin = 28;
              en.patrolMinX = Math.floor(platData.x - platData.w / 2 + margin);
              en.patrolMaxX = Math.floor(platData.x + platData.w / 2 - margin);
              en.spawnY = y - 20;
            }

            en.body.setVelocityX(en.enemySpeed * (Math.random() > 0.5 ? 1 : -1));

            scene.enems.push(en);
            scene.enemGfx.push(eg);
          }
        }
      }
    }

    /* ── Asteroides en capa ESPACIO ───────────────────────────── */
    const midMeters = JA.spawn.metersFromY(scene, (fromY + toY) / 2);
    const midLayer = JA.getLayer(midMeters);

    if (midLayer.move === 'asteroid') {
      for (let i = 0; i < 4; i++) {
        const ex = Phaser.Math.Between(WALL + 20, W - WALL - 20);
        const ey = Phaser.Math.Between(toY, fromY - 100);
        const eg = JA.enemies.draw(scene, ex, ey, midLayer);
        const en = scene.add.rectangle(ex, ey, 30, 30, 0x000000, 0);
        scene.physics.add.existing(en);
        en.body.setAllowGravity(false);
        en.body.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(90, 170));
        en.moveType = 'asteroid';
        en.enemyType = 'asteroid';
        en.enemySpeed = midLayer.speed;
        en.spawnY = ey;
        en.baseX = ex;
        en.baseY = ey;
        en.phase = Math.random() * Math.PI * 2;
        en.radius = Phaser.Math.Between(20, 35);
        en.dashCD = Phaser.Math.Between(30, 70);
        en.rotSpeed = Phaser.Math.FloatBetween(-0.05, 0.05);
        en.attackCD = 999;
        scene.enems.push(en);
        scene.enemGfx.push(eg);
      }
    }

    scene.ultimaGenY = toY;
  }
};