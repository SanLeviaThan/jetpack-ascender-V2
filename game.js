window.JA = window.JA || {};
JA.bootstrap = function () {
  JA.input.initTouchControls();
  JA.ui.init();
  JA.state.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: JA.config.game.width,
    height: JA.config.game.height,
    backgroundColor: JA.config.game.backgroundColor,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: JA.config.game.width,
      height: JA.config.game.height
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: JA.config.game.gravityY },
        debug: false
      }
    },
    scene: [JA.BootScene, JA.MenuScene, JA.GameScene]
  });
};
JA.bootstrap();
