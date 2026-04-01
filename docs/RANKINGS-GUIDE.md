# 🏆 Guía Completa: Sistema de Rankings con JSONBin.io

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Cómo Funciona](#cómo-funciona)
3. [Mejoras Implementadas](#mejoras-implementadas)
4. [Solución de Problemas](#solución-de-problemas)
5. [Seguridad](#seguridad)
6. [Testing](#testing)

---

## 🎯 Visión General

El sistema de rankings de **Jetpack Ascender V2** permite que los jugadores:
- Creen un nombre único de jugador
- Guarden sus puntuaciones (metros alcanzados)
- Vean el ranking global
- Recuperen su récord personal

**Arquitetura:**
```
┌─────────────────────────────────────┐
│    Juego (Frontend - JavaScript)    │
├─────────────────────────────────────┤
│      JA.backend (Sistema de API)    │
├─────────────────────────────────────┤
│    ┌──────────────┬─────────────┐   │
│    │  localStorage │ JSONBin.io  │   │
│    │   (fallback)  │ (remoto)    │   │
│    └──────────────┴─────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔄 Cómo Funciona

### 1. **Flujo de Guardado de Score**

```javascript
// 1. Usuario termina el juego
JA.ui.showGameOver(meters)

// 2. Se verifica si es un nuevo récord
if (meters > JA.state.playerBest) {
  // 3. Se guarda en JSONBin (o localStorage si falla)
  await JA.backend.saveScore(playerName, meters)
}

// 4. Se obtiene el ranking actualizado
const ranking = await JA.backend.getRanking()
JA.renderRanking(ranking, 'go-ranking')
```

### 2. **Validación de Datos**

Antes de guardar, se valida:
- ✓ Nombre es string y no está vacío
- ✓ Metros es un número finito >= 0
- ✓ Estructura de ranking es válida

```javascript
// Ejemplo de validación
JA.backend._validateScore('Juan', 250)  // ✓ true
JA.backend._validateScore('', 250)      // ✗ false
JA.backend._validateScore('Juan', NaN)  // ✗ false
```

### 3. **Manejo de Duplicados**

Cuando un jugador juega varias veces:
- Se busca por nombre (case-insensitive)
- Se actualiza solo si es mejor puntuación
- Se ordena el ranking

```javascript
// Caso: Juan juega dos veces
await JA.backend.saveScore('Juan', 150)  // Nuevo jugador
await JA.backend.saveScore('juan', 200)  // Se actualiza (200 > 150)
await JA.backend.saveScore('JUAN', 180)  // No se actualiza (180 < 200)
```

---

## 🚀 Mejoras Implementadas

### 1. **Timeouts en Requests**

**Problema:** Requests sin timeout podían quedar colgadas indefinidamente.

**Solución:**
```javascript
REQUEST_TIMEOUT: 8000  // 8 segundos máximo

async _fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT: JSONBin no responde');
    }
    throw error;
  }
}
```

### 2. **Reintentos Automáticos**

**Problema:** Fallos ocasionales de red no se reintentaban.

**Solución:**
```javascript
RETRY_ATTEMPTS: 2  // 2 reintentos (3 intentos totales)

async _fetchWithRetry(url, options = {}, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await JA.backend._fetchWithTimeout(url, options);
    } catch (error) {
      if (i === attempts - 1) throw error;
      // Exponential backoff: espera 200ms, 400ms...
      await new Promise(r => setTimeout(r, 200 * (i + 1)));
    }
  }
}
```

### 3. **Validación de Estructura**

**Problema:** Si JSONBin devolvía datos malformados, todo fallaba.

**Solución:**
```javascript
_validateRankingArray(data) {
  return Array.isArray(data) && data.every(row => 
    row.nombre && typeof row.metros === 'number' && isFinite(row.metros)
  );
}

_normalizeRankingRow(row) {
  return {
    nombre: String(row.nombre || '').trim(),
    metros: Math.floor(Math.max(0, Number(row.metros || 0)))
  };
}
```

### 4. **Logging Mejorado**

**Antes:** `catch (_) { ... }`

**Ahora:**
```javascript
console.log('✓ Ranking guardado en JSONBin');
console.error('❌ Error en _getBin:', error.message);
console.warn('⚠️ Estructura de ranking inválida');
```

### 5. **Fallback Automático**

Si JSONBin no responde:
1. Se intenta 3 veces (con timeout y reintentos)
2. Si sigue fallando, se guarda en localStorage
3. El usuario continúa jugando sin problemas

```javascript
async saveScore(name, meters) {
  if (JA.config.backend.mode === 'jsonbin') {
    try {
      return await JA.backend._putBin(rows);
    } catch (error) {
      console.warn('JSONBin falló, usando fallback local');
      return JA.backend.saveScoreLocal(name, meters);
    }
  }
}
```

---

## 🐛 Solución de Problemas

### ❌ "Cargando..." en el ranking se queda colgado

**Causa:** Timeout en las requests.

**Soluciones:**
1. **Verificar conexión a internet**
2. **Verificar que JSONBin responda:**
   ```bash
   # En la consola del navegador
   fetch('https://api.jsonbin.io/v3/b/69c74632c3097a1dd56af6c4/latest', {
     headers: { 'X-Master-Key': '...' }
   }).then(r => r.json())
   ```
3. **Aumentar timeout si es necesario:**
   ```javascript
   REQUEST_TIMEOUT: 12000  // 12 segundos
   ```

### ❌ "Sin conexión" aparece inmediatamente

**Causa 1:** Credenciales incorrectas en `config.js`
```javascript
// Verificar:
// - jsonbinId está correcto
// - jsonbinKey está completa y válida
```

**Causa 2:** JSONBin.io está caído
```javascript
// Comprobar en: https://status.jsonbin.io/
```

**Causa 3:** CORS bloqueado
```javascript
// JSONBin tiene CORS habilitado por defecto
// Si no funciona, verificar en:
// https://console.jsonbin.io/bins/{ID}
// > API Key Settings > Origin
```

### ❌ Ranking no se actualiza después de jugar

**Causa 1:** El score no es mayor que el anterior
```javascript
// Verificar en DevTools:
// Si metros: 100 y playerBest: 100 o más, no se actualiza
```

**Causa 2:** Nombre guardado es diferente
```javascript
// localStorage diferencia entre 'Juan' y 'juan' si:
// JA.config.storage.playerNameKey es distinto
```

**Solución:**
```javascript
// En la consola:
localStorage.getItem('jetpack_nombre_v2')          // Nombre guardado
JSON.parse(localStorage.getItem('jetpack_ranking_local_v2'))  // Rankings locales
```

### ❌ Mensajes de error confusos en consola

**Nuevo formato:**
```
✓ Score guardado para Juan: 250m           // Éxito
❌ Error en _getBin: HTTP 401               // Error crítico
⚠️ JSONBin falló, usando fallback local    // Warning
⚠️ Estructura de ranking inválida          // Alerta
```

---

## 🔐 Seguridad

### ⚠️ CRÍTICO: Las API Keys están en plain text

**Situación actual:**
```javascript
// ❌ NO HACER ESTO EN PRODUCCIÓN
JA.config.backend = {
  jsonbinId: 'ID_PÚBLICO',
  jsonbinKey: 'API_KEY_SECRETA'  // ¡Expuesta en el navegador!
}
```

### ✅ Soluciones Recomendadas

#### Opción 1: Servidor Proxy (RECOMENDADO)

```
Navegador → Tu Servidor → JSONBin.io
             (sin API key)
```

**Pasos:**
1. Crear endpoint en tu servidor (Node.js, PHP, etc.)
2. El servidor maneja la autenticación
3. El navegador solo comunica con tu servidor

**Ejemplo Node.js:**
```javascript
app.post('/api/ranking/save', async (req, res) => {
  const { nombre, metros } = req.body;
  // API Key está en variable de entorno del servidor
  const key = process.env.JSONBIN_KEY;
  
  const r = await fetch('https://api.jsonbin.io/v3/b/...', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': key
    },
    body: JSON.stringify({ nombre, metros })
  });
  res.json(await r.json());
});
```

#### Opción 2: Variables de Entorno (Build Time)

```javascript
// .env
VITE_JSONBIN_ID=69c74632c3097a1dd56af6c4
VITE_JSONBIN_KEY=***

// config.js
JA.config.backend = {
  jsonbinId: import.meta.env.VITE_JSONBIN_ID,
  jsonbinKey: import.meta.env.VITE_JSONBIN_KEY
}
```

**Limitación:** La key sigue siendo visible en el HTML compilado.

#### Opción 3: JSONBin Collections (Más Seguro)

1. Ir a https://jsonbin.io/
2. Crear una "Collection" pública (sin API key)
3. Usar solo para lectura
4. Para escribir, usar servidor proxy

---

## ✅ Testing

### Test 1: Flujo Completo Online

```javascript
// Abrir consola (F12) y ejecutar:

// 1. Limpiar datos locales
localStorage.clear();

// 2. Simular guardado
await JA.backend.saveScore('TestPlayer', 500);

// 3. Verificar guardado
const ranking = await JA.backend.getRanking();
console.log('Ranking:', ranking);

// 4. Obtener record
const record = await JA.backend.getRecord('TestPlayer');
console.log('Record:', record);  // Debería ser 500
```

### Test 2: Fallback a Local (Simular Offline)

```javascript
// 1. Desconectar internet (o modificar config)
JA.config.backend.mode = 'local';

// 2. Guardar score
await JA.backend.saveScore('OfflinePlayer', 300);

// 3. Verificar en localStorage
console.log(
  JSON.parse(localStorage.getItem('jetpack_ranking_local_v2'))
);
```

### Test 3: Validación de Datos

```javascript
// Nombres inválidos
JA.backend._validateScore('', 100);           // false
JA.backend._validateScore('Juan', -50);       // false
JA.backend._validateScore('Juan', Infinity);  // false

// Nombres válidos
JA.backend._validateScore('Juan', 250);       // true
JA.backend._validateScore('J_2', 0);          // true
```

---

## 📊 Cambios de Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Timeout sin límite | ✗ | 8s | ✓ No cuelga |
| Reintentos | ✗ | 3 intentos | ✓ Más confiable |
| Error handling | Genérico | Específico | ✓ Debuggear fácil |
| Validación | Mínima | Completa | ✓ Safe data |
| Logging | Silent | Detallado | ✓ Visible |

---

## 🔗 Recursos

- [Documentación JSONBin.io](https://jsonbin.io)
- [API Reference](https://api.jsonbin.io/doc)
- [Fetch API Timeouts](https://developer.mozilla.org/es/docs/Web/API/AbortController)
- [localStorage API](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage)

---

**Actualizado:** 1 de Abril de 2026  
**Versión:** JetpackV2 - Backend System v2.0
