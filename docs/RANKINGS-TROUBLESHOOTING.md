# ⚡ Referencia Rápida: Debugging de Rankings

## 🚀 Testing Rápido en Consola

### Obtener ranking actual
```javascript
const ranking = await JA.backend.getRanking();
console.table(ranking);
```

### Guardar un score de prueba
```javascript
await JA.backend.saveScore('TestJuan', 999);
```

### Verificar si un nombre existe
```javascript
const existe = await JA.backend.existsName('TestJuan');
console.log(existe);  // true o false
```

### Obtener record personal
```javascript
const record = await JA.backend.getRecord('TestJuan');
console.log(`Record: ${record}m`);
```

### Ver logs detallados
```javascript
// Abrir la consola (F12) y ver los mensajes:
// ✓ Score guardado en JSONBin
// ❌ Error en _getBin: ...
// ⚠️ JSONBin falló, usando fallback local
```

---

## 📋 Checklist de Problemas

### ✓ El ranking tarda mucho en cargar
- [ ] Verificar conexión a internet
- [ ] Verificar que JSONBin.io no está caído
- [ ] Ver en consola si hay timeouts
- [ ] Aumentar `REQUEST_TIMEOUT` si es necesario

### ✓ El juego dice "Sin conexión"
- [ ] Verificar que `config.js` tiene las credenciales correctas
- [ ] Comprobar en la consola el error específico
- [ ] Probar con `JA.config.backend.mode = 'local'`
- [ ] Verificar CORS en https://console.jsonbin.io/

### ✓ El score no se guarda
- [ ] Verificar que el nuevo score es mayor que el anterior
- [ ] Comprobar el nombre del jugador en localStorage
- [ ] Ver en consola si hay errores de validación
- [ ] Usar `JA.backend.saveScoreLocal()` para guardar manualmente

### ✓ Rankings diferentes en el ranking después de jugar
- [ ] Esperar 1-2 segundos (peticiones asincrónicas)
- [ ] Recargar la página
- [ ] Verificar que no estés en modo 'local'

---

## 🔧 Modificaciones Comunes

### Cambiar a modo offline (localStorage solo)
```javascript
// En config.js, cambiar:
backend: {
  mode: 'local',  // En lugar de 'jsonbin'
  jsonbinId: '...',
  jsonbinKey: '...'
}
```

### Aumentar timeout
```javascript
// En backend-system.js, cambiar:
REQUEST_TIMEOUT: 12000;  // 12 segundos en lugar de 8
```

### Cambiar máximo de resultados
```javascript
// En backend-system.js, cambiar:
MAX_RANKING_SIZE: 100;  // En lugar de 50
```

### Reducir reintentos
```javascript
// En backend-system.js, cambiar:
RETRY_ATTEMPTS: 1;  // Sin reintentos
```

---

## 📊 Estructura de Datos

### Objeto de Ranking
```javascript
{
  nombre: "Juan",        // string
  metros: 250            // number
}
```

### Array de Rankings
```javascript
[
  { nombre: "Juan", metros: 500 },
  { nombre: "Ana", metros: 450 },
  { nombre: "Carlos", metros: 400 }
]
```

### Validación (antes de guardar)
- nombre: string, no vacío
- metros: número finito >= 0

---

## 🔗 URLs Útiles

| Recurso | URL |
|---------|-----|
| JSONBin Console | https://console.jsonbin.io/ |
| JSONBin API Docs | https://api.jsonbin.io/doc |
| Estado JSONBin | https://status.jsonbin.io/ |
| Mi Bin | https://jsonbin.io/app/bins/69c74632c3097a1dd56af6c4 |

---

## 📱 Variables Locales

```javascript
// Ver nombre guardado del jugador
localStorage.getItem('jetpack_nombre_v2')

// Ver ranking local (JSON)
localStorage.getItem('jetpack_ranking_local_v2')

// Ver ranking local (parseado)
JSON.parse(localStorage.getItem('jetpack_ranking_local_v2'))

// Limpiar todo (si es necesario)
localStorage.clear()
```

---

## ✨ Ejemplos de Mensajes Esperados

### Guardado exitoso
```
✓ Score guardado para Juan: 250m
✓ Ranking guardado en JSONBin
```

### Con fallback a local
```
⚠️ JSONBin falló, usando fallback local: HTTP 401
✓ Score guardado localmente para Juan: 250m
```

### Sin internet
```
❌ Error en _getBin: TIMEOUT: No hay respuesta de JSONBin
⚠️ Error obteniendo ranking remoto: TIMEOUT...
[Se muestra ranking local en lugar del remoto]
```

---

**Última actualización:** 1 de Abril de 2026
