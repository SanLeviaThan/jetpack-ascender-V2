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
  // ⚠️  Firebase configuration (public, safe to expose)
  backend: {
    mode: 'firebase',
    firebase: {
      apiKey: "AIzaSyCrUTqv9K8AKIIFXuSEIbT2XeQislf8cMQ",
      authDomain: "jetpack-ascender.firebaseapp.com",
      projectId: "jetpack-ascender",
      storageBucket: "jetpack-ascender.firebasestorage.app",
      messagingSenderId: "309876562899",
      appId: "1:309876562899:web:427ac64d8bf67155d7ed26",
      databaseURL: "https://jetpack-ascender-default-rtdb.firebaseio.com"
    }
  },
  player: {
    scale: 0.065   // escala master de body-parts
  }
};