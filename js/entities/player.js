window.JA = window.JA || {};

JA.playerEntity = {
  S: 0.065, // escala master

  // Variables de animación
  _walkCycle: 0,
  _lastVelX: 0,
  _facingLeft: false, // Guardar dirección real

  /* Posiciones base de cada parte relativas al centro del container (cadera) */
  _B: {
    jet: { x: -16, y: -10 },
    burner: { x: -16, y: 14 },
    legBkUp: { x: -4, y: 6, r: 0.25 },
    legBkLo: { x: -2, y: 17, r: 0.30 },
    footBk: { x: 3, y: 27, r: -0.15 },
    armBkUp: { x: -9, y: -12, r: 0.40 },
    armBkLo: { x: -8, y: -2, r: 0.30 },
    handBk: { x: -7, y: 7, r: 0.20 },
    body: { x: 0, y: -8 },
    legFrUp: { x: 4, y: 6, r: -0.18 },
    legFrLo: { x: 5, y: 17, r: -0.22 },
    footFr: { x: -1, y: 27, r: 0.10 },
    armFrUp: { x: 8, y: -12, r: -0.28 },
    armFrLo: { x: 10, y: -2, r: -0.18 },
    handFr: { x: 12, y: 7, r: -0.10 },
    gun: { x: 18, y: 1, r: 0 },
    gunFlash: { x: 38, y: -1, r: 0 },
    head: { x: -2, y: -25 },
    mouth: { x: 1, y: -19 }
  },

  /* ────────────────────────────────────────────────────────────────────── */
  createVisual(scene, x, y) {
    // Fallback a gráficos si los assets aún no están cargados
    if (!scene.textures.exists('bp_body')) {
      return JA.playerEntity._createGraphicsFallback(scene, x, y);
    }
    const S = JA.playerEntity.S;
    const B = JA.playerEntity._B;
    const c = scene.add.container(x, y);
    c.setDepth(10);

    const mk = (key, bx, by, rot) => {
      const img = scene.add.image(bx, by, key).setScale(S);
      if (rot) img.setRotation(rot);
      c.add(img);
      return img;
    };

    // Orden de dibujo: fondo → cuerpo → frente
    const parts = {
      jet: mk('bp_jet_pack', B.jet.x, B.jet.y),
      burner: mk('bp_burner_01', B.burner.x, B.burner.y),
      legBkUp: mk('bp_upper_leg', B.legBkUp.x, B.legBkUp.y, B.legBkUp.r),
      legBkLo: mk('bp_lower_leg', B.legBkLo.x, B.legBkLo.y, B.legBkLo.r),
      footBk: mk('bp_boot_running', B.footBk.x, B.footBk.y, 0),
      armBkUp: mk('bp_upper_arm', B.armBkUp.x, B.armBkUp.y, B.armBkUp.r),
      armBkLo: mk('bp_lower_arm', B.armBkLo.x, B.armBkLo.y, B.armBkLo.r),
      handBk: mk('bp_button_hand_back', B.handBk.x, B.handBk.y, B.handBk.r),
      body: mk('bp_body', B.body.x, B.body.y),
      legFrUp: mk('bp_upper_leg', B.legFrUp.x, B.legFrUp.y, B.legFrUp.r),
      legFrLo: mk('bp_lower_leg', B.legFrLo.x, B.legFrLo.y, B.legFrLo.r),
      footFr: mk('bp_boot_running', B.footFr.x, B.footFr.y, 0),
      armFrUp: mk('bp_upper_arm', B.armFrUp.x, B.armFrUp.y, B.armFrUp.r),
      armFrLo: mk('bp_lower_arm', B.armFrLo.x, B.armFrLo.y, B.armFrLo.r),
      handFr: mk('bp_gun_hand_top', B.handFr.x, B.handFr.y, B.handFr.r),
      gun: mk('bp_gun', B.gun.x, B.gun.y, B.gun.r),
      gunFlash: mk('bp_gun_flash', B.gunFlash.x, B.gunFlash.y, B.gunFlash.r),
      head: mk('bp_head_red_helmet', B.head.x, B.head.y),
      mouth: mk('bp_mouth_smile', B.mouth.x, B.mouth.y)
    };

    parts.gunFlash.setVisible(false);

    return {
      kind: 'bodyparts',
      node: c,
      parts,
      state: 'fly',
      burnerFrame: 0,
      burnerTimer: 0,
      flashTimer: 0,
      turboTimer: 0,
      walkCycle: 0,
      facingLeft: false
    };
  },

  /* ────────────────────────────────────────────────────────────────────── */
  _createGraphicsFallback(scene, x, y) {
    const g = scene.add.graphics();
    g.fillStyle(0x00ffcc, 1);
    g.fillRoundedRect(-10, -16, 20, 28, 3);
    g.fillStyle(0x001a14, 1);
    g.fillRect(-5, -12, 10, 7);
    g.fillStyle(0x007755, 1);
    g.fillRect(7, -10, 7, 14);
    g.fillStyle(0x004433, 1);
    g.fillRect(8, 2, 5, 5);
    g.fillStyle(0x005533, 1);
    g.fillRect(-10, 10, 8, 6);
    g.fillRect(2, 10, 8, 6);
    g.x = x;
    g.y = y;
    g.setDepth(10);
    return {
      kind: 'graphics',
      node: g,
      state: 'fly',
      burnerTimer: 0,
      flashTimer: 0,
      turboTimer: 0,
      walkCycle: 0,
      facingLeft: false
    };
  },

  /* ────────────────────────────────────────────────────────────────────── */
  syncVisual(visual, body, facingLeft) {
    if (!visual || !body) return;
    visual.node.x = body.x;
    visual.node.y = body.y;

    if (visual.kind === 'bodyparts') {
      visual.node.scaleX = facingLeft ? -1 : 1;
    } else if (visual.kind === 'graphics') {
      visual.node.scaleX = facingLeft ? -1 : 1;
    }
  },

  setAlpha(visual, value) {
    if (visual && visual.node) visual.node.alpha = value;
  },

  setState(visual, state) {
    if (visual) visual.state = state;
  },

  triggerShoot(visual) {
    if (!visual) return;
    if (visual.state !== 'hurt' && visual.state !== 'turbo') visual.state = 'shoot';
    visual.flashTimer = 7;
  },

  triggerTurbo(visual) {
    if (!visual) return;
    visual.state = 'turbo';
    visual.turboTimer = 70;
  },

  /* ────────────────────────────────────────────────────────────────────── */
  update(visual, time, fuel, isShooting, isThrusting, isGrounded, isMovingHoriz) {
    if (!visual || visual.kind !== 'bodyparts') return;

    const p = visual.parts;
    const t = time * 0.001;
    const movingOnGround = !!isGrounded && !!isMovingHoriz;

    const groundFeet = isGrounded && !isThrusting && visual.state !== 'hurt' && visual.state !== 'turbo';
    p.footFr.setTexture(groundFeet ? 'bp_boot_running' : 'bp_foot');
    p.footBk.setTexture(groundFeet ? 'bp_boot_running' : 'bp_foot');
    p.footFr.setRotation(0);
    p.footBk.setRotation(0);

    // Burner
    if (isThrusting || visual.state === 'turbo') {
      visual.burnerTimer++;
      if (visual.burnerTimer % 3 === 0) {
        visual.burnerFrame = (visual.burnerFrame + 1) % 4;
        p.burner.setTexture(`bp_burner_0${visual.burnerFrame + 1}`);
      }
      p.burner.setVisible(true);
    } else {
      p.burner.setVisible(false);
    }

    // Flash del arma
    visual.flashTimer = Math.max(0, visual.flashTimer - 1);
    p.gunFlash.setVisible(visual.flashTimer > 0);

    // Boca
    if (visual.state === 'hurt' || fuel <= 0) p.mouth.setTexture('bp_mouth_frown');
    else p.mouth.setTexture('bp_mouth_smile');

    // Turbo
    if (visual.state === 'turbo') {
      visual.turboTimer--;
      if (visual.turboTimer <= 0) {
        visual.state = (isGrounded && !isThrusting) ? 'ground' : 'fly';
      }
    }

    // Shoot termina solo
    if (visual.state === 'shoot' && visual.flashTimer <= 0) {
      visual.state = (isGrounded && !isThrusting) ? 'ground' : 'fly';
    }

    switch (visual.state) {
      case 'hurt':
        JA.playerEntity._poseHurt(p, t);
        break;

      case 'shoot':
        if (isGrounded && !isThrusting) JA.playerEntity._poseGround(p, t, movingOnGround);
        else JA.playerEntity._poseFly(p, t, isThrusting);
        JA.playerEntity._applyShootArm(p);
        break;

      case 'nofuel':
        JA.playerEntity._poseNoFuel(p, t);
        break;

      case 'turbo':
        JA.playerEntity._poseTurbo(p, t);
        break;

      default:
        if (isGrounded && !isThrusting) JA.playerEntity._poseGround(p, t, movingOnGround);
        else JA.playerEntity._poseFly(p, t, isThrusting);
        break;
    }
  },
  /* ── POSE VOLADOR (patas estiradas hacia atrás) ──────────────────────────────────── */
  _poseFly(p, t, thrusting) {
    const B = JA.playerEntity._B;
    const legSwing = Math.sin(t * 8) * 0.25;
    const bodyTilt = thrusting ? -0.18 : 0.02;
    const bodyBob = Math.sin(t * 4) * 1.2;
    const armSway = Math.sin(t * 5) * 0.1;

    p.body.setPosition(B.body.x, B.body.y + bodyBob * 0.5);
    p.body.setRotation(bodyTilt);
    p.head.setPosition(B.head.x, B.head.y + bodyBob * 0.3);
    p.head.setRotation(bodyTilt * 0.3);
    p.mouth.setPosition(B.mouth.x, B.mouth.y + bodyBob * 0.3);
    p.jet.setRotation(bodyTilt * 0.3);

    // PATAS DE VOLADOR: estiradas hacia atrás como si estuviera volando
    p.legFrUp.setRotation((B.legFrUp.r || 0) - 0.45 + legSwing * 0.3);
    p.legFrLo.setRotation((B.legFrLo.r || 0) - 0.55 + legSwing * 0.2);
    p.footFr.setRotation((B.footFr.r || 0) - 0.25);

    p.legBkUp.setRotation((B.legBkUp.r || 0) - 0.40 - legSwing * 0.3);
    p.legBkLo.setRotation((B.legBkLo.r || 0) - 0.50 - legSwing * 0.2);
    p.footBk.setRotation((B.footBk.r || 0) - 0.20);

    // Brazos estilo volador
    p.armFrUp.setRotation((B.armFrUp.r || 0) + armSway - 0.15);
    p.armFrLo.setRotation((B.armFrLo.r || 0) + armSway * 0.6);
    p.armBkUp.setRotation((B.armBkUp.r || 0) - armSway);
    p.gun.setRotation((B.gun.r || 0) + armSway * 0.3);
  },

  /* ── POSE SUELO (caminar) ──────────────────────────────────────────── */
  _poseGround(p, t, moving) {
    const B = JA.playerEntity._B;
    const walk = moving ? Math.sin(t * 12) * 0.28 : 0;
    const bob = moving ? Math.sin(t * 24) * 1.0 : 0;

    p.body.setPosition(B.body.x, B.body.y + 2 + bob);
    p.body.setRotation(0);

    p.head.setPosition(B.head.x, B.head.y + bob * 0.25);
    p.head.setRotation(0);

    p.mouth.setPosition(B.mouth.x, B.mouth.y + bob * 0.25);
    p.jet.setRotation(0);

    p.legFrUp.setRotation(0.05 + walk);
    p.legFrLo.setRotation(-0.08 - walk * 0.75);
    p.footFr.setRotation(0);

    p.legBkUp.setRotation(-0.05 - walk);
    p.legBkLo.setRotation(0.08 + walk * 0.75);
    p.footBk.setRotation(0);

    p.armFrUp.setRotation(-0.08 - walk * 0.60);
    p.armFrLo.setRotation(-0.03 - walk * 0.20);
    p.handFr.setRotation(0);

    p.armBkUp.setRotation(0.10 + walk * 0.60);
    p.armBkLo.setRotation(0.03 + walk * 0.20);
    p.handBk.setRotation(0);

    p.gun.setRotation(0);
  },

  _applyShootArm(p) {
    const B = JA.playerEntity._B;
    p.armFrUp.setRotation((B.armFrUp.r || 0) - 0.55);
    p.armFrLo.setRotation((B.armFrLo.r || 0) - 0.45);
    p.handFr.setRotation((B.handFr.r || 0) - 0.25);
    p.gun.setRotation((B.gun.r || 0) - 0.55);
  },

  _poseNoFuel(p, t) {
    const B = JA.playerEntity._B;
    const droop = Math.sin(t * 2) * 0.04;
    p.body.setPosition(B.body.x + 3, B.body.y + 4);
    p.body.setRotation(0.28 + droop);
    p.head.setPosition(B.head.x + 5, B.head.y + 5);
    p.head.setRotation(0.32);
    p.mouth.setPosition(B.mouth.x + 5, B.mouth.y + 5);
    p.legFrUp.setRotation(0.85);
    p.legFrLo.setRotation(0.55);
    p.footFr.setRotation(0.20);
    p.legBkUp.setRotation(0.50);
    p.legBkLo.setRotation(0.25);
    p.footBk.setRotation(0.10);
    p.armFrUp.setRotation(-0.10);
    p.armFrLo.setRotation(0.20);
    p.armBkUp.setRotation(0.65);
    p.armBkLo.setRotation(0.40);
    p.gun.setRotation(0.45);
  },

  _poseHurt(p, t) {
    const B = JA.playerEntity._B;
    const shk = Math.sin(t * 35) * 0.28;
    p.body.setPosition(B.body.x + shk * 3, B.body.y);
    p.body.setRotation(0.35 + shk);
    p.head.setPosition(B.head.x + shk * 2, B.head.y - 3);
    p.mouth.setPosition(B.mouth.x + shk * 2, B.mouth.y - 3);
    p.legFrUp.setRotation(0.90);
    p.legBkUp.setRotation(-0.20);
    p.armFrUp.setRotation(-0.85);
    p.armBkUp.setRotation(0.95);
    p.gun.setRotation(-0.70);
  },

  _poseTurbo(p, t) {
    const B = JA.playerEntity._B;
    const wave = Math.sin(t * 18) * 0.15;
    p.body.setPosition(B.body.x, B.body.y - 2);
    p.body.setRotation(-0.30 + wave);
    p.head.setPosition(B.head.x, B.head.y - 3);
    p.head.setRotation(-0.20);
    p.mouth.setPosition(B.mouth.x, B.mouth.y - 3);
    // PATAS DE VOLADOR pero más extremo para turbo
    p.legFrUp.setRotation(0.85);
    p.legFrLo.setRotation(0.95);
    p.footFr.setRotation(0.65);
    p.legBkUp.setRotation(0.90);
    p.legBkLo.setRotation(1.00);
    p.footBk.setRotation(0.70);
    p.armFrUp.setRotation(-0.70);
    p.armFrLo.setRotation(-0.65);
    p.handFr.setRotation(-0.45);
    p.armBkUp.setRotation(-0.65);
    p.gun.setRotation(-0.75);
  }
};