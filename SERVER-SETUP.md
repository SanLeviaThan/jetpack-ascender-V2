# 🚀 Servidor Proxy para Jetpack V2 - Guía de Instalación

## What's This?

Esto es un **servidor Node.js** que actúa como intermediario entre tu juego y JSONBin.io. 

**Beneficios:**
- ✅ Las credenciales de JSONBin **NO se exponen** en el navegador
- ✅ Ya no hay error 401 (API Key no expuesta en front-end)
- ✅ Funciona para múltiples usuarios desde cualquier lugar
- ✅ Tu amigo en el Congo puede jugar y registrar puntajes

---

## 📋 Requisitos

- **Node.js** (versión 14 o superior)
  - [Descargar desde nodejs.org](https://nodejs.org/)
  - Verificar: `node --version` en terminal

---

## ⚙️ Instalación

### Paso 1: Abrir Terminal en la carpeta del juego

```bash
cd c:\HTMLGAME\JetpackV2
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Esto descarga Express, CORS y dotenv.

### Paso 3: Verificar que `.env` existe

El archivo `.env` debe estar en la raíz del proyecto con:

```
PORT=3000
JSONBIN_ID=69c74632c3097a1dd56af6c4
JSONBIN_KEY=$2a$10$QkyIOrpMcYH7iLX24ChMqePaN7Eu0GEsEUM7H8T.cWzjLS4/vKU06
```

---

## 🎮 Uso

### Para Desarrollo Local

**Terminal 1 - Iniciar el servidor:**
```bash
npm start
```

Deberías ver:
```
╔═══════════════════════════════════════╗
║  🚀 Servidor Jetpack V2 Iniciado     ║
║  Puerto: 3000                        ║
║  Endpoints:                          ║
║  - GET  /api/ranking                 ║
║  - POST /api/ranking/save            ║
║  - POST /api/ranking/search          ║
║  - GET  /api/health                  ║
╚═══════════════════════════════════════╝
```

**Terminal 2 - Abrir el juego:**
```bash
# En Windows, abre en navegador:
http://localhost:3000/../index.html

# O simplemente:
# Abre c:\HTMLGAME\JetpackV2\index.html en el navegador
```

---

## 🌐 Para Usuarios Remotos (Tu amigo en el Congo)

Escenario: Tu amigo quiere jugar y registrar puntajes.

### Opción A: Usar ngrok (Fácil - Temporal)

1. Descargar ngrok: https://ngrok.com/download
2. Ejecutar en terminal:
```bash
ngrok http 3000
```
3. Copiar la URL que aparece (ej: `https://abc123.ngrok.io`)
4. Tu amigo usa esa URL en `config.js`:

```javascript
backend: {
  mode: 'proxy',
  proxyUrl: 'https://abc123.ngrok.io/api'
}
```

### Opción B: Desplegar en Heroku (Permanente)

1. Crear cuenta en https://heroku.com
2. Instalar Heroku CLI
3. En la carpeta del proyecto:

```bash
heroku login
heroku create mi-jetpack-v2
git init
git add .
git commit -m "Initial commit"
git push heroku master
```

Tu URL sería: `https://mi-jetpack-v2.herokuapp.com/api`

---

## 📡 Endpoints del Servidor

### `GET /api/ranking`

Obtiene los top 10 jugadores.

**Respuesta:**
```json
{
  "success": true,
  "ranking": [
    { "nombre": "JARAMITO", "metros": 34234 },
    { "nombre": "JUAN", "metros": 25000 }
  ]
}
```

---

### `POST /api/ranking/save`

Guarda un nuevo score.

**Request:**
```json
{
  "nombre": "JARAMITO",
  "metros": 34234
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Score guardado",
  "ranking": [ ... ]
}
```

---

### `POST /api/ranking/search`

Busca un jugador específico.

**Request:**
```json
{
  "nombre": "JARAMITO"
}
```

**Respuesta:**
```json
{
  "success": true,
  "jugador": { "nombre": "JARAMITO", "metros": 34234 },
  "posicion": 1,
  "total": 10
}
```

---

### `GET /api/health`

Verifica que el servidor funciona.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

---

## 🛠️ Troubleshooting

### ❌ "PORT 3000 already in use"

Otro proceso usa el puerto. Cambiar en `.env`:

```env
PORT=3001
```

O matar el proceso:
```bash
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

---

### ❌ "Cannot find module 'express'"

Ejecutar:
```bash
npm install
```

---

### ❌ "JSONBIN_KEY is invalid"

Verificar que `.env` tiene credenciales correctas:
```bash
cat .env
```

---

### ❌ El navegador no se conecta

Verificar que el servidor está en `http://localhost:3000` y `config.js` dice:

```javascript
backend: {
  mode: 'proxy',
  proxyUrl: 'http://localhost:3000'
}
```

---

## 📊 Logs del Servidor

El servidor imprime logs de cada operación:

```
[2026-04-01T12:00:00.000Z] POST /api/ranking/save
📤 Guardando score: JARAMITO - 34234m
  ➕ Nuevo jugador agregado
✅ Score guardado exitosamente
```

---

## 🔐 Seguridad

✅ **La API Key está protegida en el servidor**
- No se ve en el navegador
- No se expone en request s del cliente
- Solo el servidor comunica con JSONBin

---

## 🚀 Próximos Pasos

1. **Instalar Node.js** si no lo tiene
2. **Ejecutar `npm install`**
3. **Ejecutar `npm start`**
4. **Abrir el juego y ver si funcionan los rankings**
5. **Para usuarios remotos**, usar ngrok o Heroku

---

## 📝 Arquitectura

```
┌─────────────────────────────────┐
│  Navegador (Tu amigo - Congo)   │
├─────────────────────────────────┤
│ GET/POST http://servidor:3000   │
├─────────────────────────────────┤
│     Servidor Node.js Proxy      │
│     (credenciales seguras)      │
├─────────────────────────────────┤
│      JSONBin.io (en la nube)    │
│     (base de datos central)     │
└─────────────────────────────────┘
```

---

## 📞 Problemas?

1. Verificar que Node.js está instalado: `node --version`
2. Verificar que npm funciona: `npm --version`
3. Leer los logs del servidor
4. Abrir F12 (Console) en el navegador para ver errores

---

**Versión:** 1.0.0  
**Última actualización:** 1 de Abril de 2026
