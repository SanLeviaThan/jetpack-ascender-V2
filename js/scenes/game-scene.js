window.JA = window.JA || {};
JA.GameScene = class GameScene extends Phaser.Scene {

  constructor() { super('GameScene'); }

  create() {
    if (JA.cache.panelInicio) JA.cache.panelInicio.style.display = 'none';

    const W = JA.config.game.width;
    const H = JA.config.game.height;
    const WALL = JA.config.game.wall;

    this.vivo = true;
    this.nivelActual = 0;
    this.metrosJuego = 0;
    this.metrosReales = 0;
    this.fuel = 100;
    this.maxFuel = 100;
    this.vida = 3;
    this.iFrames = 0;
    this.shootCD = 0;
    this.alturaBase = H - 60;
    this.ultimaGenY = H - 16;
    this.heartSpawned = {};
    this.isThrusting = false;
    this.isShooting = false;
    this.facingLeft = false;
    this.isMovingHoriz = false;
    this.superBoost = 0;

    this.plats = []; this.platGfx = [];
    this.enems = []; this.enemGfx = [];
    this.pickups = []; this.pickGfx = [];
    this.heartItems = []; this.heartGfx = [];
    this.balas = []; this.balaGfx = [];
    this.speedups = []; this.speedupGfx = [];
    this.enemProjs = [];
    this.enemProjSprites = [];

    JA.state.activeScene = this;
    JA.state.isGameOver = false;
    JA.hud.show();
    JA.input.showTouchControls();
    this.cameras.main.setBackgroundColor(JA.layers[0].bg);

    const bg = this.add.graphics().setScrollFactor(0.04);
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-6000, H);
      const s = Math.random() * 1.4 + 0.2;
      const a = 0.15 + Math.random() * 0.5;
      bg.fillStyle([0xffffff, 0xaaaaff, 0x88ccff][Math.floor(Math.random() * 3)], a);
      bg.fillRect(x, y, s, s);
    }

    this.wallGfx = this.add.graphics();
    this.playerVisual = JA.playerEntity.createVisual(this, W / 2, H - 60);

    this.player = this.add.rectangle(W / 2, H - 60, 20, 30, 0x000000, 0);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(false);

    this.platGroup = this.physics.add.staticGroup();
    this.physics.add.collider(this.player, this.platGroup, null, this.canPassThrough, this);

    this.floorVisual = JA.worldItems.drawPlatform(this, W / 2, H - 8, W - WALL * 2, 0x223344, 0x00ffcc, 0);
    const floor = this.add.rectangle(W / 2, H - 8, W - WALL * 2, 14, 0x000000, 0);
    this.physics.add.existing(floor, true);
    this.physics.add.collider(this.player, floor);

    JA.spawn.generateChunk(this, H - 16, H - 820);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.cameras.main.startFollow(this.player, true, 1, 0.09);

    JA.startGameMusic();
  }

  canPassThrough() {
    return this.superBoost <= 0;
  }

  updatePlayerMovement() {
    const W = JA.config.game.width;
    const H = JA.config.game.height;
    const WALL = JA.config.game.wall;
    const pb = this.player.body;
    const touch = JA.input.touch;

    const left = this.cursors.left.isDown || this.keyA.isDown || touch.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || touch.right;
    const thrust = this.cursors.up.isDown || this.keyW.isDown || touch.thrust;

    this.isMovingHoriz = (left && !right) || (right && !left);

    if (left && !right) this.facingLeft = true;
    else if (right && !left) this.facingLeft = false;

    this.isGrounded = pb.blocked.down || pb.touching.down;
    this.isThrusting = thrust && this.fuel > 0;

    pb.setVelocityX(left ? -250 : right ? 250 : 0);

    if (this.player.x < WALL + 10) {
      this.player.x = WALL + 10;
      if (pb.velocity.x < 0) pb.setVelocityX(0);
    }
    if (this.player.x > W - WALL - 10) {
      this.player.x = W - WALL - 10;
      if (pb.velocity.x > 0) pb.setVelocityX(0);
    }

    if (this.isThrusting) {
      JA.startJetpackSound();
      JA.updateJetpackSound();
      pb.setVelocityY(-400);
      this.fuel = Math.max(0, this.fuel - 0.6);
    } else {
      JA.stopJetpackSound();
      if (!thrust) this.fuel = Math.min(this.maxFuel, this.fuel + 0.14);
      if (thrust && this.fuel <= 0 && pb.velocity.y < 0) pb.setVelocityY(0);
    }

    if (this.iFrames <= 0) {
      if (this.fuel <= 0) JA.playerEntity.setState(this.playerVisual, 'nofuel');
      else if (this.isThrusting) JA.playerEntity.setState(this.playerVisual, 'fly');
      else if (this.isGrounded) JA.playerEntity.setState(this.playerVisual, 'ground');
      else JA.playerEntity.setState(this.playerVisual, 'fly');
    }

    JA.playerEntity.syncVisual(this.playerVisual, this.player, this.facingLeft);
    if (this.player.y > this.cameras.main.scrollY + H + 100) this.finishRun();
  }

  updateMetersAndLayer() {
    this.metrosJuego = Math.max(0, Math.floor((this.alturaBase - this.player.y) / 8));
    this.metrosReales = this.metrosJuego * JA.config.game.metersScale;
    const newLayer = JA.getLayerIndex(this.metrosReales);
    if (newLayer !== this.nivelActual) {
      this.nivelActual = newLayer;
      this.cameras.main.setBackgroundColor(JA.layers[this.nivelActual].bg);
      JA.sfxLayerUp();
    }
  }

  updatePickupsAndHearts() {
    const W = JA.config.game.width;
    const WALL = JA.config.game.wall;
    const H = JA.config.game.height;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const pg = this.pickGfx[i];
      if (!p || !p.active) { this.pickups.splice(i, 1); this.pickGfx.splice(i, 1); continue; }
      if (pg) { pg.x = p.x; pg.y = p.y; }
      if (JA.worldItems.hit(this.player, p)) {
        const fl = this.add.graphics();
        fl.fillStyle(0x00ff88, 0.5); fl.fillCircle(p.x, p.y, 20);
        this.tweens.add({ targets: fl, alpha: 0, scaleX: 2, scaleY: 2, duration: 250, onComplete: () => fl.destroy() });
        p.destroy(); if (pg) pg.destroy();
        this.pickups.splice(i, 1); this.pickGfx.splice(i, 1);
        this.fuel = Math.min(this.maxFuel, this.fuel + 40);
        JA.sfxFuel();
      }
    }

    for (let i = this.heartItems.length - 1; i >= 0; i--) {
      const h = this.heartItems[i];
      const hg = this.heartGfx[i];
      if (!h || !h.active) { if (hg) hg.destroy(); this.heartItems.splice(i, 1); this.heartGfx.splice(i, 1); continue; }
      if (hg) { hg.x = h.x; hg.y = h.y; }
      if (h.x < WALL + 14) h.body.setVelocityX(Math.abs(h.moveSpeed || 100));
      if (h.x > W - WALL - 14) h.body.setVelocityX(-Math.abs(h.moveSpeed || 100));
      if (JA.worldItems.hit(this.player, h, 2)) {
        const fx = this.add.graphics();
        fx.fillStyle(0xff6699, 0.6); fx.fillCircle(h.x, h.y, 18);
        this.tweens.add({ targets: fx, alpha: 0, scaleX: 2, scaleY: 2, duration: 260, onComplete: () => fx.destroy() });
        h.destroy(); if (hg) hg.destroy();
        this.heartItems.splice(i, 1); this.heartGfx.splice(i, 1);
        this.vida = Math.min(4, this.vida + 1);
        JA.sfxHeart();
      } else if (h.y > this.cameras.main.scrollY + H + 120) {
        h.destroy(); if (hg) hg.destroy();
        this.heartItems.splice(i, 1); this.heartGfx.splice(i, 1);
      }
    }
  }

  updateSpeedups() {
    const H = JA.config.game.height;
    for (let i = this.speedups.length - 1; i >= 0; i--) {
      const s = this.speedups[i];
      const sg = this.speedupGfx[i];
      if (!s || !s.active) {
        if (sg) sg.destroy();
        this.speedups.splice(i, 1);
        this.speedupGfx.splice(i, 1);
        continue;
      }
      if (sg) { sg.x = s.x; sg.y = s.y; }

      if (JA.worldItems.hit(this.player, s, 2)) {
        this.player.body.setVelocityY(-2000);
        this.superBoost = 30;
        this.fuel = Math.min(this.maxFuel, this.fuel + 25);
        JA.playerEntity.triggerTurbo(this.playerVisual);
        JA.sfxTurboPickup();

        const fx = this.add.graphics();
        fx.fillStyle(0x00eeff, 0.6);
        fx.fillCircle(s.x, s.y, 32);
        this.tweens.add({ targets: fx, alpha: 0, scaleX: 4, scaleY: 4, duration: 400, onComplete: () => fx.destroy() });

        this.cameras.main.shake(150, 0.012);
        s.destroy();
        if (sg) sg.destroy();
        this.speedups.splice(i, 1);
        this.speedupGfx.splice(i, 1);
      } else if (s.y > this.cameras.main.scrollY + H + 140) {
        s.destroy();
        if (sg) sg.destroy();
        this.speedups.splice(i, 1);
        this.speedupGfx.splice(i, 1);
      }
    }
  }

  updateBullets() {
    const fire = this.keyX.isDown || JA.input.touch.shoot;
    this.shootCD--;
    this.isShooting = false;

    if (fire && this.shootCD <= 0) {
      this.isShooting = true;
      JA.sfxShoot();
      JA.playerEntity.triggerShoot(this.playerVisual);
      this.shootCD = 16;

      const dir = this.facingLeft ? -1 : 1;
      const spawnX = this.player.x + (dir * 36);
      const spawnY = this.player.y - 2;

      const br = this.add.rectangle(spawnX, spawnY, 14, 4, 0x000000, 0);
      this.physics.add.existing(br);
      br.body.setAllowGravity(false);
      br.body.setVelocityX(dir * 680);
      br.body.setVelocityY(0);
      br.dir = dir;

      const bgfx = JA.worldItems.drawBullet(this);
      this.balas.push(br);
      this.balaGfx.push(bgfx);

      this.time.delayedCall(1500, () => {
        if (br && br.active) {
          br.destroy();
          bgfx.destroy();
        }
      });
    }

    for (let i = 0; i < this.balas.length; i++) {
      const b = this.balas[i];
      const g = this.balaGfx[i];
      if (!b || !b.active || !g) continue;
      g.x = b.x;
      g.y = b.y;
      g.scaleX = (b.dir || 1) < 0 ? -1 : 1;
      g.rotation = 0;
    }

    for (let i = this.balas.length - 1; i >= 0; i--) {
      const b = this.balas[i];
      if (!b || !b.active) {
        this.balas.splice(i, 1);
        this.balaGfx.splice(i, 1);
        continue;
      }

      let hit = false;

      for (let p = this.plats.length - 1; p >= 0; p--) {
        if (!this.plats[p] || !this.plats[p].active) continue;
        if (JA.worldItems.hit(b, this.plats[p], 2)) {
          const spark = this.add.graphics();
          spark.fillStyle(0x66ccff, 0.75);
          spark.fillCircle(b.x, b.y, 6);
          this.tweens.add({
            targets: spark,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 180,
            onComplete: () => spark.destroy()
          });
          b.destroy();
          this.balaGfx[i].destroy();
          this.balas.splice(i, 1);
          this.balaGfx.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      for (let j = this.enems.length - 1; j >= 0; j--) {
        const e = this.enems[j];
        if (!e || !e.active) {
          this.enems.splice(j, 1);
          this.enemGfx.splice(j, 1);
          continue;
        }
        if (JA.worldItems.hit(b, e)) {
          // Efecto de explosión
          const ex = this.add.graphics();
          ex.fillStyle(0xff4400, 0.8);
          ex.fillCircle(e.x, e.y, 18);
          ex.fillStyle(0xffcc00, 0.6);
          ex.fillCircle(e.x, e.y, 10);
          this.tweens.add({
            targets: ex,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 300,
            onComplete: () => ex.destroy()
          });

          // Destruir la bala
          b.destroy();
          if (this.balaGfx[i]) this.balaGfx[i].destroy();
          this.balas.splice(i, 1);
          this.balaGfx.splice(i, 1);

          // Matar al enemigo con animación (usando la nueva función)
          JA.enemies.killEnemy(this, e, this.enemGfx[j], j);

          break; // Salir del loop
        }
      }
    }
  }

  updateDamage() {
    if (this.iFrames > 0) {
      this.iFrames--;
      JA.playerEntity.setAlpha(this.playerVisual, this.iFrames % 8 < 4 ? 0.3 : 1);
      if (this.iFrames === 0) {
        JA.playerEntity.setAlpha(this.playerVisual, 1);
        if (this.playerVisual.state === 'hurt') JA.playerEntity.setState(this.playerVisual, 'fly');
      }
      return;
    }
    JA.playerEntity.setAlpha(this.playerVisual, 1);
    for (const e of this.enems) {
      if (!e || !e.active) continue;
      if (JA.worldItems.hit(this.player, e, 4)) {
        this.vida--;
        this.iFrames = 100;
        this.cameras.main.shake(200, 0.013);
        JA.playerEntity.setState(this.playerVisual, 'hurt');
        if (this.vida <= 0) this.finishRun();
        break;
      }
    }
  }

  finishRun() {
    if (!this.vivo) return;
    this.vivo = false;
    JA.stopJetpackSound();
    JA.stopGameMusic();
    JA.sfxDeath();
    JA.playerEntity.setState(this.playerVisual, 'hurt');
    JA.ui.showGameOver(this.metrosReales);
  }

  update() {
    if (!this.vivo) return;

    if (this.superBoost > 0) {
      this.superBoost--;
      if (this.playerVisual && this.playerVisual.node) {
        this.playerVisual.node.alpha = 0.5 + Math.sin(Date.now() * 0.03) * 0.3;
      }
    } else {
      if (this.playerVisual && this.playerVisual.node) this.playerVisual.node.alpha = 1;
    }

    JA.worldItems.drawWalls(this);
    this.updateMetersAndLayer();
    this.updatePlayerMovement();
    this.updatePickupsAndHearts();
    this.updateSpeedups();
    this.updateBullets();
    JA.enemies.update(this);
    this.updateDamage();

    JA.playerEntity.update(
      this.playerVisual,
      this.time.now,
      this.fuel,
      this.isShooting,
      this.isThrusting,
      this.isGrounded,
      this.isMovingHoriz
    );

    if (this.cameras.main.scrollY < this.ultimaGenY + 400) {
      JA.spawn.generateChunk(this, this.ultimaGenY, this.ultimaGenY - 800);
    }

    JA.hud.update(this);
  }
  shutdown() {
    // Limpiar todos los objetos para evitar fugas
    this.plats = [];
    this.platGfx = [];
    this.enems = [];
    this.enemGfx = [];
    this.pickups = [];
    this.pickGfx = [];
    this.heartItems = [];
    this.heartGfx = [];
    this.balas = [];
    this.balaGfx = [];
    this.speedups = [];
    this.speedupGfx = [];
    this.enemProjs = [];
    this.enemProjSprites = [];
    if (this.platGroup) this.platGroup.clear(true);
    if (this.wallGfx) this.wallGfx.clear();
    this.wallLeftImg = null;
    this.wallRightImg = null;
    this.wallLeftSprite = null;
    this.wallRightSprite = null;
    JA.stopJetpackSound();
  }
};