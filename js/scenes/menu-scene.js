window.JA = window.JA || {};
JA.MenuScene = class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    JA.hud.hide();
    JA.input.hideTouchControls();
  }
};
