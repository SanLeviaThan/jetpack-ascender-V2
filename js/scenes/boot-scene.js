window.JA = window.JA || {};

JA.BootScene = class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const BASE =
      (window.location.hostname.includes('github.io') &&
        window.location.pathname.includes('/jetpack-ascender-V2/'))
        ? '/jetpack-ascender-V2/'
        : './';

    const V = '?v=20260328d';
    const A = (p) => `${BASE}${p}${V}`;

    this.load.on('loaderror', (file) => {
      console.error('ASSET NO CARGÓ:', file.src);
    });

    // ── Body Parts del jugador ───────────────────────────────────────────
    const BP = 'assets/player/';
    [
      'body',
      'head_red_helmet',
      'upper_arm',
      'lower_arm',
      'gun_hand_top',
      'gun_hand_back',
      'button_hand_top',
      'button_hand_back',
      'upper_leg',
      'lower_leg',
      'foot',
      'boot_running',
      'jet_pack',
      'gun',
      'gun_flash'
    ].forEach((n) => this.load.image(`bp_${n}`, A(`${BP}${n}.png`)));

    ['01', '02', '03', '04'].forEach((n) =>
      this.load.image(`bp_burner_${n}`, A(`${BP}burner/burner_${n}.png`))
    );

    this.load.image('bp_mouth_smile', A(`${BP}mouths/smile.png`));
    this.load.image('bp_mouth_frown', A(`${BP}mouths/frown.png`));

    // ── SPRITESHEETS ENEMIGOS (con tamaños de frame correctos) ────────────

    // Flying Eye (volador)
    this.load.spritesheet('e_flyingeye_flight', A('assets/enemies/Flying eye/Flight.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_flyingeye_attack', A('assets/enemies/Flying eye/Attack3.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_flyingeye_hit', A('assets/enemies/Flying eye/Take Hit.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_flyingeye_death', A('assets/enemies/Flying eye/Death.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_flyingeye_proj', A('assets/enemies/Flying eye/projectile_sprite.png'), { frameWidth: 48, frameHeight: 48 });

    // Goblin
    this.load.spritesheet('e_goblin_idle', A('assets/enemies/Goblin/Idle.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_goblin_run', A('assets/enemies/Goblin/Run.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_goblin_attack', A('assets/enemies/Goblin/Attack3.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_goblin_hit', A('assets/enemies/Goblin/Take Hit.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_goblin_death', A('assets/enemies/Goblin/Death.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_goblin_proj', A('assets/enemies/Goblin/Bomb_sprite.png'), { frameWidth: 100, frameHeight: 100 });

    // Mushroom
    this.load.spritesheet('e_mushroom_idle', A('assets/enemies/Mushroom/Idle.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_mushroom_run', A('assets/enemies/Mushroom/Run.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_mushroom_attack', A('assets/enemies/Mushroom/Attack3.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_mushroom_hit', A('assets/enemies/Mushroom/Take Hit.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_mushroom_death', A('assets/enemies/Mushroom/Death.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_mushroom_proj', A('assets/enemies/Mushroom/Projectile_sprite.png'), { frameWidth: 50, frameHeight: 50 });

    // Skeleton
    this.load.spritesheet('e_skeleton_idle', A('assets/enemies/Skeleton/Idle.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_walk', A('assets/enemies/Skeleton/Walk.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_attack', A('assets/enemies/Skeleton/Attack3.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_hit', A('assets/enemies/Skeleton/Take Hit.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_death', A('assets/enemies/Skeleton/Death.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_shield', A('assets/enemies/Skeleton/Shield.png'), { frameWidth: 150, frameHeight: 150 });
    this.load.spritesheet('e_skeleton_proj', A('assets/enemies/Skeleton/Sword_sprite.png'), { frameWidth: 92, frameHeight: 102 });

    // ── Plataformas ───────────────────────────────────────────────────────
    [
      'plataforma_simple',
      'plataforma_izquierda',
      'plataforma_derecha',
      'tramo_plataforma',
      'pared_izquierda',
      'pared_derecha'
    ].forEach((n) =>
      this.load.image(`plat_${n}`, A(`assets/platforms/${n}.png`))
    );

    // ── Audio ─────────────────────────────────────────────────────────────
    this.load.audio('mus_menu', A('assets/music/menu.mp3'));
    this.load.audio('mus_playing', A('assets/music/playing.mp3'));
    this.load.audio('sfx_shot', A('assets/music/shot.mp3'));
    this.load.audio('sfx_turbina', A('assets/music/turbina.mp3'));
    this.load.audio('sfx_bonus', A('assets/music/bonus.mp3'));
    this.load.audio('sfx_vida', A('assets/music/vida.mp3'));
    this.load.audio('sfx_buttons', A('assets/music/buttons.mp3'));
  }

  create() {
    // ── ANIMACIONES FLYING EYE ──────────────────────────────────────────
    if (this.textures.exists('e_flyingeye_flight') && !this.anims.exists('e_flyingeye_flight')) {
      this.anims.create({
        key: 'e_flyingeye_flight',
        frames: this.anims.generateFrameNumbers('e_flyingeye_flight', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (this.textures.exists('e_flyingeye_attack') && !this.anims.exists('e_flyingeye_attack')) {
      this.anims.create({
        key: 'e_flyingeye_attack',
        frames: this.anims.generateFrameNumbers('e_flyingeye_attack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0  // una sola vez
      });
    }
    if (this.textures.exists('e_flyingeye_hit') && !this.anims.exists('e_flyingeye_hit')) {
      this.anims.create({
        key: 'e_flyingeye_hit',
        frames: this.anims.generateFrameNumbers('e_flyingeye_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_flyingeye_death') && !this.anims.exists('e_flyingeye_death')) {
      this.anims.create({
        key: 'e_flyingeye_death',
        frames: this.anims.generateFrameNumbers('e_flyingeye_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_flyingeye_proj') && !this.anims.exists('e_flyingeye_proj')) {
      this.anims.create({
        key: 'e_flyingeye_proj',
        frames: this.anims.generateFrameNumbers('e_flyingeye_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }

    // ── ANIMACIONES GOBLIN ──────────────────────────────────────────────
    if (this.textures.exists('e_goblin_idle') && !this.anims.exists('e_goblin_idle')) {
      this.anims.create({
        key: 'e_goblin_idle',
        frames: this.anims.generateFrameNumbers('e_goblin_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_goblin_run') && !this.anims.exists('e_goblin_run')) {
      this.anims.create({
        key: 'e_goblin_run',
        frames: this.anims.generateFrameNumbers('e_goblin_run', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (this.textures.exists('e_goblin_attack') && !this.anims.exists('e_goblin_attack')) {
      this.anims.create({
        key: 'e_goblin_attack',
        frames: this.anims.generateFrameNumbers('e_goblin_attack', { start: 0, end: 11 }),
        frameRate: 14,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_hit') && !this.anims.exists('e_goblin_hit')) {
      this.anims.create({
        key: 'e_goblin_hit',
        frames: this.anims.generateFrameNumbers('e_goblin_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_death') && !this.anims.exists('e_goblin_death')) {
      this.anims.create({
        key: 'e_goblin_death',
        frames: this.anims.generateFrameNumbers('e_goblin_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_proj') && !this.anims.exists('e_goblin_proj')) {
      this.anims.create({
        key: 'e_goblin_proj',
        frames: this.anims.generateFrameNumbers('e_goblin_proj', { start: 0, end: 18 }),
        frameRate: 14,
        repeat: -1
      });
    }

    // ── ANIMACIONES MUSHROOM ────────────────────────────────────────────
    if (this.textures.exists('e_mushroom_idle') && !this.anims.exists('e_mushroom_idle')) {
      this.anims.create({
        key: 'e_mushroom_idle',
        frames: this.anims.generateFrameNumbers('e_mushroom_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_mushroom_run') && !this.anims.exists('e_mushroom_run')) {
      this.anims.create({
        key: 'e_mushroom_run',
        frames: this.anims.generateFrameNumbers('e_mushroom_run', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (this.textures.exists('e_mushroom_attack') && !this.anims.exists('e_mushroom_attack')) {
      this.anims.create({
        key: 'e_mushroom_attack',
        frames: this.anims.generateFrameNumbers('e_mushroom_attack', { start: 0, end: 10 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_hit') && !this.anims.exists('e_mushroom_hit')) {
      this.anims.create({
        key: 'e_mushroom_hit',
        frames: this.anims.generateFrameNumbers('e_mushroom_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_death') && !this.anims.exists('e_mushroom_death')) {
      this.anims.create({
        key: 'e_mushroom_death',
        frames: this.anims.generateFrameNumbers('e_mushroom_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_proj') && !this.anims.exists('e_mushroom_proj')) {
      this.anims.create({
        key: 'e_mushroom_proj',
        frames: this.anims.generateFrameNumbers('e_mushroom_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }

    // ── ANIMACIONES SKELETON ────────────────────────────────────────────
    if (this.textures.exists('e_skeleton_idle') && !this.anims.exists('e_skeleton_idle')) {
      this.anims.create({
        key: 'e_skeleton_idle',
        frames: this.anims.generateFrameNumbers('e_skeleton_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_skeleton_walk') && !this.anims.exists('e_skeleton_walk')) {
      this.anims.create({
        key: 'e_skeleton_walk',
        frames: this.anims.generateFrameNumbers('e_skeleton_walk', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (this.textures.exists('e_skeleton_attack') && !this.anims.exists('e_skeleton_attack')) {
      this.anims.create({
        key: 'e_skeleton_attack',
        frames: this.anims.generateFrameNumbers('e_skeleton_attack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_hit') && !this.anims.exists('e_skeleton_hit')) {
      this.anims.create({
        key: 'e_skeleton_hit',
        frames: this.anims.generateFrameNumbers('e_skeleton_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_death') && !this.anims.exists('e_skeleton_death')) {
      this.anims.create({
        key: 'e_skeleton_death',
        frames: this.anims.generateFrameNumbers('e_skeleton_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_shield') && !this.anims.exists('e_skeleton_shield')) {
      this.anims.create({
        key: 'e_skeleton_shield',
        frames: this.anims.generateFrameNumbers('e_skeleton_shield', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_proj') && !this.anims.exists('e_skeleton_proj')) {
      this.anims.create({
        key: 'e_skeleton_proj',
        frames: this.anims.generateFrameNumbers('e_skeleton_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
    // ── ANIMACIONES FLYING EYE ──────────────────────────────────────────
    if (this.textures.exists('e_flyingeye_flight') && !this.anims.exists('e_flyingeye_flight')) {
      this.anims.create({
        key: 'e_flyingeye_flight',
        frames: this.anims.generateFrameNumbers('e_flyingeye_flight', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (this.textures.exists('e_flyingeye_attack') && !this.anims.exists('e_flyingeye_attack')) {
      this.anims.create({
        key: 'e_flyingeye_attack',
        frames: this.anims.generateFrameNumbers('e_flyingeye_attack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_flyingeye_hit') && !this.anims.exists('e_flyingeye_hit')) {
      this.anims.create({
        key: 'e_flyingeye_hit',
        frames: this.anims.generateFrameNumbers('e_flyingeye_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_flyingeye_death') && !this.anims.exists('e_flyingeye_death')) {
      this.anims.create({
        key: 'e_flyingeye_death',
        frames: this.anims.generateFrameNumbers('e_flyingeye_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_flyingeye_proj') && !this.anims.exists('e_flyingeye_proj')) {
      this.anims.create({
        key: 'e_flyingeye_proj',
        frames: this.anims.generateFrameNumbers('e_flyingeye_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }

    // ── ANIMACIONES GOBLIN ──────────────────────────────────────────────
    if (this.textures.exists('e_goblin_idle') && !this.anims.exists('e_goblin_idle')) {
      this.anims.create({
        key: 'e_goblin_idle',
        frames: this.anims.generateFrameNumbers('e_goblin_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_goblin_run') && !this.anims.exists('e_goblin_run')) {
      this.anims.create({
        key: 'e_goblin_run',
        frames: this.anims.generateFrameNumbers('e_goblin_run', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (this.textures.exists('e_goblin_attack') && !this.anims.exists('e_goblin_attack')) {
      this.anims.create({
        key: 'e_goblin_attack',
        frames: this.anims.generateFrameNumbers('e_goblin_attack', { start: 0, end: 11 }),
        frameRate: 14,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_hit') && !this.anims.exists('e_goblin_hit')) {
      this.anims.create({
        key: 'e_goblin_hit',
        frames: this.anims.generateFrameNumbers('e_goblin_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_death') && !this.anims.exists('e_goblin_death')) {
      this.anims.create({
        key: 'e_goblin_death',
        frames: this.anims.generateFrameNumbers('e_goblin_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_goblin_proj') && !this.anims.exists('e_goblin_proj')) {
      this.anims.create({
        key: 'e_goblin_proj',
        frames: this.anims.generateFrameNumbers('e_goblin_proj', { start: 0, end: 18 }),
        frameRate: 14,
        repeat: -1
      });
    }

    // ── ANIMACIONES MUSHROOM ────────────────────────────────────────────
    if (this.textures.exists('e_mushroom_idle') && !this.anims.exists('e_mushroom_idle')) {
      this.anims.create({
        key: 'e_mushroom_idle',
        frames: this.anims.generateFrameNumbers('e_mushroom_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_mushroom_run') && !this.anims.exists('e_mushroom_run')) {
      this.anims.create({
        key: 'e_mushroom_run',
        frames: this.anims.generateFrameNumbers('e_mushroom_run', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (this.textures.exists('e_mushroom_attack') && !this.anims.exists('e_mushroom_attack')) {
      this.anims.create({
        key: 'e_mushroom_attack',
        frames: this.anims.generateFrameNumbers('e_mushroom_attack', { start: 0, end: 10 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_hit') && !this.anims.exists('e_mushroom_hit')) {
      this.anims.create({
        key: 'e_mushroom_hit',
        frames: this.anims.generateFrameNumbers('e_mushroom_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_death') && !this.anims.exists('e_mushroom_death')) {
      this.anims.create({
        key: 'e_mushroom_death',
        frames: this.anims.generateFrameNumbers('e_mushroom_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_mushroom_proj') && !this.anims.exists('e_mushroom_proj')) {
      this.anims.create({
        key: 'e_mushroom_proj',
        frames: this.anims.generateFrameNumbers('e_mushroom_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }

    // ── ANIMACIONES SKELETON ────────────────────────────────────────────
    if (this.textures.exists('e_skeleton_idle') && !this.anims.exists('e_skeleton_idle')) {
      this.anims.create({
        key: 'e_skeleton_idle',
        frames: this.anims.generateFrameNumbers('e_skeleton_idle', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.textures.exists('e_skeleton_walk') && !this.anims.exists('e_skeleton_walk')) {
      this.anims.create({
        key: 'e_skeleton_walk',
        frames: this.anims.generateFrameNumbers('e_skeleton_walk', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (this.textures.exists('e_skeleton_attack') && !this.anims.exists('e_skeleton_attack')) {
      this.anims.create({
        key: 'e_skeleton_attack',
        frames: this.anims.generateFrameNumbers('e_skeleton_attack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_hit') && !this.anims.exists('e_skeleton_hit')) {
      this.anims.create({
        key: 'e_skeleton_hit',
        frames: this.anims.generateFrameNumbers('e_skeleton_hit', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_death') && !this.anims.exists('e_skeleton_death')) {
      this.anims.create({
        key: 'e_skeleton_death',
        frames: this.anims.generateFrameNumbers('e_skeleton_death', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_shield') && !this.anims.exists('e_skeleton_shield')) {
      this.anims.create({
        key: 'e_skeleton_shield',
        frames: this.anims.generateFrameNumbers('e_skeleton_shield', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (this.textures.exists('e_skeleton_proj') && !this.anims.exists('e_skeleton_proj')) {
      this.anims.create({
        key: 'e_skeleton_proj',
        frames: this.anims.generateFrameNumbers('e_skeleton_proj', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
      });
    }

    JA.audio.initPool();
    this.scene.start('MenuScene');
  }
};