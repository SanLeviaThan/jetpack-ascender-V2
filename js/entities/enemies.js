window.JA = window.JA || {};
JA.enemies = {
  _cfg: {
    flyingeye: {
      scale: 1.44,
      detect: 170,
      attackCD: 100,
      projSpeed: 220,
      projScale: 0.99,
      isFlying: true,
    },
    goblin: {
      scale: 1.44,
      detect: 110,
      attackCD: 95,
      projSpeed: 150,
      projScale: 1.44,
      isFlying: false,
    },
    mushroom: {
      scale: 1.46,
      detect: 150,
      attackCD: 105,
      projSpeed: 200,
      projScale: 1.56,
      isFlying: false,
    },
    skeleton: {
      scale: 1.46,
      detect: 90,
      attackCD: 70,
      projSpeed: 240,
      projScale: 1.34,
      isFlying: false,
    },
  },

  draw(scene, x, y, layer) {
    const type = layer.enemyType || "flyingeye";

    if (type === "asteroid") {
      const g = scene.add.graphics();
      g.fillStyle(0x666666, 1);
      g.fillCircle(0, 0, 15);
      g.fillStyle(0x8f8f8f, 0.85);
      g.fillCircle(-4, -1, 5);
      g.fillCircle(5, 4, 3);
      g.fillStyle(0x333333, 1);
      g.fillCircle(2, -5, 3);
      g.x = x;
      g.y = y;
      g.setDepth(5);
      return {
        sprite: g,
        type: "asteroid",
        isGraphics: true,
        currentAnim: null,
      };
    }

    const cfg = JA.enemies._cfg[type];
    let animKey = "";
    if (type === "flyingeye") animKey = "e_flyingeye_flight";
    else if (type === "goblin") animKey = "e_goblin_run";
    else if (type === "mushroom") animKey = "e_mushroom_run";
    else if (type === "skeleton") animKey = "e_skeleton_walk";

    const textureKey = animKey.split("_")[0] + "_" + animKey.split("_")[1];
    const spr = scene.add.sprite(x, y, textureKey);
    spr.setScale(cfg.scale);
    if (scene.anims.exists(animKey)) spr.play(animKey);
    spr.setDepth(5);

    return {
      sprite: spr,
      type: type,
      isGraphics: false,
      currentAnim: animKey,
      attacking: false,
      dying: false,
    };
  },

  // Cambiar animación del enemigo de forma segura
  setAnimation(enemyGfx, newAnimKey, scene) {
    if (!enemyGfx || enemyGfx.isGraphics || !enemyGfx.sprite) return;
    if (enemyGfx.dying) return; // si ya está muriendo, no cambiar
    if (enemyGfx.currentAnim === newAnimKey) return;
    if (!scene.anims.exists(newAnimKey)) return;

    enemyGfx.sprite.play(newAnimKey, true);
    enemyGfx.currentAnim = newAnimKey;
  },

  // Hacer que el enemigo ataque (cambia animación y dispara)
  doAttack(scene, enemy, enemyGfx) {
    if (enemyGfx.dying) return;
    let attackAnim = "";
    if (enemy.enemyType === "flyingeye") attackAnim = "e_flyingeye_attack";
    else if (enemy.enemyType === "goblin") attackAnim = "e_goblin_attack";
    else if (enemy.enemyType === "mushroom") attackAnim = "e_mushroom_attack";
    else if (enemy.enemyType === "skeleton") attackAnim = "e_skeleton_attack";
    else return;

    JA.enemies.setAnimation(enemyGfx, attackAnim, scene);
    JA.enemies.spawnProjectile(scene, enemy);

    // Volver a la animación normal después de que termine el ataque
    if (enemyGfx.sprite) {
      enemyGfx.sprite.once("animationcomplete", () => {
        if (!enemyGfx.dying && enemyGfx.sprite && enemyGfx.sprite.active) {
          let normalAnim = "";
          if (enemy.enemyType === "flyingeye")
            normalAnim = "e_flyingeye_flight";
          else if (enemy.enemyType === "goblin") normalAnim = "e_goblin_run";
          else if (enemy.enemyType === "mushroom")
            normalAnim = "e_mushroom_run";
          else if (enemy.enemyType === "skeleton")
            normalAnim = "e_skeleton_walk";
          if (normalAnim) JA.enemies.setAnimation(enemyGfx, normalAnim, scene);
        }
      });
    }
  },

  // Matar al enemigo con animación
  killEnemy(scene, enemy, enemyGfx, index) {
    if (enemyGfx.dying) return;
    enemyGfx.dying = true;

    let deathAnim = "";
    if (enemy.enemyType === "flyingeye") deathAnim = "e_flyingeye_death";
    else if (enemy.enemyType === "goblin") deathAnim = "e_goblin_death";
    else if (enemy.enemyType === "mushroom") deathAnim = "e_mushroom_death";
    else if (enemy.enemyType === "skeleton") deathAnim = "e_skeleton_death";
    else {
      // Para asteroides o sin animación, destruir directamente
      if (enemy && enemy.destroy) enemy.destroy();
      if (enemyGfx && enemyGfx.sprite) enemyGfx.sprite.destroy();
      scene.enems.splice(index, 1);
      scene.enemGfx.splice(index, 1);
      return;
    }

    JA.enemies.setAnimation(enemyGfx, deathAnim, scene);
    // Destruir después de que termine la animación
    if (enemyGfx.sprite) {
      enemyGfx.sprite.once("animationcomplete", () => {
        if (enemy && enemy.destroy) enemy.destroy();
        if (enemyGfx && enemyGfx.sprite) enemyGfx.sprite.destroy();
        scene.enems.splice(index, 1);
        scene.enemGfx.splice(index, 1);
      });
    } else {
      // Fallback
      if (enemy && enemy.destroy) enemy.destroy();
      scene.enems.splice(index, 1);
      scene.enemGfx.splice(index, 1);
    }
  },

  spawnProjectile(scene, enemy) {
    const type = enemy.enemyType;
    if (!type || type === "asteroid") return;
    const cfg = JA.enemies._cfg[type];
    if (!cfg || !scene.enemProjs) return;

    const dx = scene.player.x - enemy.x;
    const dy = scene.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const vx = (dx / dist) * cfg.projSpeed;
    const vy = (dy / dist) * cfg.projSpeed;

    const pr = scene.add.rectangle(enemy.x, enemy.y, 14, 14, 0x000000, 0);
    scene.physics.add.existing(pr);
    pr.body.setVelocity(vx, vy);
    pr.body.setAllowGravity(false);
    pr.enemyType = type;

    let projAnim = "";
    if (type === "flyingeye") projAnim = "e_flyingeye_proj";
    else if (type === "goblin") projAnim = "e_goblin_proj";
    else if (type === "mushroom") projAnim = "e_mushroom_proj";
    else if (type === "skeleton") projAnim = "e_skeleton_proj";

    const ps = scene.textures.exists(projAnim)
      ? scene.add
          .sprite(enemy.x, enemy.y, projAnim)
          .setScale(cfg.projScale)
          .setDepth(6)
      : null;
    if (ps && scene.anims.exists(projAnim)) ps.play(projAnim);

    scene.enemProjs.push(pr);
    scene.enemProjSprites.push(ps);

    scene.time.delayedCall(2200, () => {
      if (pr && pr.active) {
        pr.destroy();
        if (ps && ps.active) ps.destroy();
      }
    });
  },

  update(scene) {
    const W = JA.config.game.width;
    const WALL = JA.config.game.wall;
    const H = JA.config.game.height;

    for (let i = scene.enems.length - 1; i >= 0; i--) {
      const e = scene.enems[i];
      const eg = scene.enemGfx[i];
      if (!e || !e.active || (eg && eg.dying)) {
        if (eg && eg.sprite) eg.sprite.destroy();
        scene.enems.splice(i, 1);
        scene.enemGfx.splice(i, 1);
        continue;
      }

      if (eg && eg.sprite) {
        eg.sprite.x = e.x;
        eg.sprite.y = e.y;
        if (!eg.isGraphics && e.body.velocity.x < 0) eg.sprite.setFlipX(true);
        else if (!eg.isGraphics && e.body.velocity.x > 0)
          eg.sprite.setFlipX(false);
      }

      const type = e.enemyType || e.moveType;
      const cfg = JA.enemies._cfg[type];
      const isFlying = cfg ? cfg.isFlying : type === "flyingeye";

      if (type === "asteroid") {
        if (eg && eg.sprite && eg.isGraphics)
          eg.sprite.rotation += e.rotSpeed || 0.02;
        if (e.x < WALL + 12 || e.x > W - WALL - 12)
          e.body.setVelocityX(-e.body.velocity.x);
      } else if (isFlying) {
        if (e.x < WALL + 14)
          e.body.setVelocityX(Math.abs(e.body.velocity.x || e.enemySpeed));
        if (e.x > W - WALL - 14)
          e.body.setVelocityX(-Math.abs(e.body.velocity.x || e.enemySpeed));
        const t = scene.time.now * 0.001;
        e.y = e.spawnY + Math.sin(t * 2.2 + e.phase) * 18;
        if (eg && eg.sprite) eg.sprite.y = e.y;
        e.body.y = e.y;
      } else {
        e.y = e.spawnY;
        e.body.setVelocityY(0);
        if (eg && eg.sprite) eg.sprite.y = e.y;

        const minX =
          typeof e.patrolMinX === "number" ? e.patrolMinX : WALL + 14;
        const maxX =
          typeof e.patrolMaxX === "number" ? e.patrolMaxX : W - WALL - 14;

        if (e.x <= minX) {
          e.x = minX;
          e.body.setVelocityX(Math.abs(e.enemySpeed));
        }
        if (e.x >= maxX) {
          e.x = maxX;
          e.body.setVelocityX(-Math.abs(e.enemySpeed));
        }
        if (Math.abs(e.body.velocity.x) < 5) {
          e.body.setVelocityX(
            Math.random() > 0.5
              ? Math.abs(e.enemySpeed)
              : -Math.abs(e.enemySpeed),
          );
        }
      }

      // Ataque solo si no está muriendo y no está ya atacando
      if (type !== "asteroid" && eg && !eg.dying && !eg.attacking) {
        if (e.attackCD > 0) {
          e.attackCD--;
        } else {
          const dx = Math.abs(scene.player.x - e.x);
          const dy = Math.abs(scene.player.y - e.y);
          if (cfg && dx < cfg.detect && dy < cfg.detect) {
            eg.attacking = true;
            JA.enemies.doAttack(scene, e, eg);
            e.attackCD = cfg.attackCD;
            // Permitir atacar de nuevo después de un tiempo
            scene.time.delayedCall(cfg.attackCD, () => {
              if (eg) eg.attacking = false;
            });
          }
        }
      }

      if (e.y > scene.cameras.main.scrollY + H + 250) {
        e.destroy();
        if (eg && eg.sprite) eg.sprite.destroy();
        scene.enems.splice(i, 1);
        scene.enemGfx.splice(i, 1);
      }
    }

    // Proyectiles de enemigos (contra el jugador)
    if (scene.enemProjs) {
      for (let i = scene.enemProjs.length - 1; i >= 0; i--) {
        const pr = scene.enemProjs[i];
        const ps = scene.enemProjSprites[i];
        if (!pr || !pr.active) {
          if (ps && ps.active) ps.destroy();
          scene.enemProjs.splice(i, 1);
          scene.enemProjSprites.splice(i, 1);
          continue;
        }
        if (ps && ps.active) {
          ps.x = pr.x;
          ps.y = pr.y;
        }

        if (
          JA.worldItems.hit(pr, scene.player, 2) &&
          scene.iFrames <= 0 &&
          scene.vivo &&
          !scene.invincible
        ) {
          scene.vida--;
          scene.iFrames = 100;
          scene.cameras.main.shake(180, 0.012);
          JA.playerEntity.setState(scene.playerVisual, "hurt");

          const fx = scene.add.graphics();
          fx.fillStyle(0xff4400, 0.7);
          fx.fillCircle(pr.x, pr.y, 14);
          scene.tweens.add({
            targets: fx,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 220,
            onComplete: () => fx.destroy(),
          });

          pr.destroy();
          if (ps && ps.active) ps.destroy();
          scene.enemProjs.splice(i, 1);
          scene.enemProjSprites.splice(i, 1);

          if (scene.vida <= 0) scene.finishRun();
        }
      }
    }
  },
};
