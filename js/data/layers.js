window.JA = window.JA || {};
JA.layers = [
  { nombre: 'ATMÓSFERA', desde: 0, hasta: 12000, bg: 0x04041a, platColor: 0x1133cc, glow: 0x3355ff, enemyColor: 0xff3333, enemySize: 22, move: 'horizontal', speed: 70, enemyType: 'flyingeye' },
  { nombre: 'ESTRATÓSFERA', desde: 12000, hasta: 50000, bg: 0x0d0420, platColor: 0x6611bb, glow: 0xaa33ff, enemyColor: 0xff9933, enemySize: 24, move: 'horizontal', speed: 75, enemyType: 'goblin' },
  { nombre: 'MESÓSFERA', desde: 50000, hasta: 85000, bg: 0x041408, platColor: 0x117733, glow: 0x22ff66, enemyColor: 0xffff33, enemySize: 26, move: 'horizontal', speed: 85, enemyType: 'mushroom' },
  { nombre: 'TERMÓSFERA', desde: 85000, hasta: 150000, bg: 0x180404, platColor: 0xaa3300, glow: 0xff5500, enemyColor: 0x66e3ff, enemySize: 28, move: 'horizontal', speed: 105, enemyType: 'skeleton' },
  { nombre: 'EXÓSFERA', desde: 150000, hasta: 220000, bg: 0x041414, platColor: 0x007788, glow: 0x00ffee, enemyColor: 0xff66ff, enemySize: 30, move: 'horizontal', speed: 115, enemyType: 'flyingeye' },
  { nombre: 'ESPACIO', desde: 220000, hasta: 999999, bg: 0x010108, platColor: 0x555555, glow: 0x999999, enemyColor: 0x888888, enemySize: 32, move: 'asteroid', speed: 130, enemyType: 'asteroid' }
];
JA.getLayerIndex = function (meters) {
  for (let i = JA.layers.length - 1; i >= 0; i--) {
    if (meters >= JA.layers[i].desde) return i;
  }
  return 0;
};
JA.getLayer = function (meters) {
  return JA.layers[JA.getLayerIndex(meters)];
};