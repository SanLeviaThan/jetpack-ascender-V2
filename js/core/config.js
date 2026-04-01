window.JA = window.JA || {};
JA.config = {
  game: {
    width: 480,
    height: 640,
    wall: 14,
    metersScale: 6,
    gravityY: 480,
    backgroundColor: '#04041a'
  },
  storage: {
    playerNameKey: 'jetpack_nombre_v2',
    localRankingKey: 'jetpack_ranking_local_v2'
  },
  // ⚠️  IMPORTANTE: agregar config.js a .gitignore si el repo es público
  backend: {
    mode: 'jsonbin', // 'local' | 'jsonbin'
    jsonbinId: '69c74632c3097a1dd56af6c4',
    jsonbinKey: '$2a$10$iR5k4k22wwIpVmjcgtO7OuRJ0Rpik0le6GbKdNEKjb9RxQJEv6QkC'
  },
  player: {
    scale: 0.065   // escala master de body-parts
  }
};