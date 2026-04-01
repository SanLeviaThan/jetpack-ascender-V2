/**
 * SERVIDOR PROXY PARA JETPACK V2
 * Maneja rankings en JSONBin sin exponer API Key en el navegador
 * 
 * Instalación:
 * npm install express cors
 * 
 * Uso:
 * node server.js
 * 
 * El navegador conecta a: http://localhost:3000/api/ranking
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración (GUARDADA EN SERVIDOR, NO EN EL NAVEGADOR)
const JSONBIN_ID = process.env.JSONBIN_ID || '69c74632c3097a1dd56af6c4';
const JSONBIN_KEY = process.env.JSONBIN_KEY || '$2a$10$QkyIOrpMcYH7iLX24ChMqePaN7Eu0GEsEUM7H8T.cWzjLS4/vKU06';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// Middleware
app.use(cors({
    origin: '*', // O especificar dominios: ['http://localhost:3000', 'tu-dominio.com']
    methods: ['GET', 'POST', 'PUT']
}));
app.use(express.json());

// Log de requests (para debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * GET /api/ranking
 * Obtiene el ranking desde JSONBin
 */
app.get('/api/ranking', async (req, res) => {
    try {
        console.log('📥 Obteniendo ranking desde JSONBin...');

        const response = await fetch(`${JSONBIN_URL}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });

        if (!response.ok) {
            console.error(`❌ JSONBin error: ${response.status}`);
            return res.status(response.status).json({
                error: `JSONBin error: ${response.status}`,
                ranking: []
            });
        }

        const data = await response.json();
        const ranking = data.record?.ranking || [];

        // Validar y normalizar
        const validRanking = Array.isArray(ranking) ? ranking : [];

        console.log(`✅ Ranking obtenido: ${validRanking.length} jugadores`);
        res.json({
            success: true,
            ranking: validRanking.sort((a, b) => Number(b.metros) - Number(a.metros))
        });

    } catch (error) {
        console.error('❌ Error en GET /api/ranking:', error.message);
        res.status(500).json({
            error: error.message,
            ranking: []
        });
    }
});

/**
 * POST /api/ranking/save
 * Guarda un score en JSONBin
 * 
 * Body:
 * {
 *   "nombre": "JARAMITO",
 *   "metros": 34234
 * }
 */
app.post('/api/ranking/save', async (req, res) => {
    try {
        const { nombre, metros } = req.body;

        // Validar input
        if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
            return res.status(400).json({ error: 'Nombre inválido' });
        }

        if (typeof metros !== 'number' || metros < 0 || !isFinite(metros)) {
            return res.status(400).json({ error: 'Metros inválido' });
        }

        console.log(`📤 Guardando score: ${nombre} - ${metros}m`);

        // Obtener ranking actual
        const getResponse = await fetch(`${JSONBIN_URL}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });

        if (!getResponse.ok) {
            throw new Error(`No se pudo obtener ranking: ${getResponse.status}`);
        }

        const data = await getResponse.json();
        let ranking = data.record?.ranking || [];

        // Buscar si el jugador ya existe
        const indexOf = ranking.findIndex(r =>
            String(r.nombre || '').toLowerCase() === String(nombre).toLowerCase()
        );

        if (indexOf >= 0) {
            // Actualizar solo si el nuevo score es mejor
            if (metros > Number(ranking[indexOf].metros || 0)) {
                console.log(`  ✏️ Actualizando: ${ranking[indexOf].metros} → ${metros}`);
                ranking[indexOf].metros = metros;
            } else {
                console.log(`  ⚠️ Score no es mejor que el anterior`);
                return res.json({
                    success: false,
                    message: 'El nuevo score no es mejor',
                    ranking: ranking.sort((a, b) => Number(b.metros) - Number(a.metros))
                });
            }
        } else {
            // Nuevo jugador
            console.log(`  ➕ Nuevo jugador agregado`);
            ranking.push({ nombre: nombre.trim(), metros: Math.floor(metros) });
        }

        // Ordenar y limitar
        ranking.sort((a, b) => Number(b.metros) - Number(a.metros));
        ranking = ranking.slice(0, 100); // Máximo 100 registros

        // Enviar a JSONBin
        const putResponse = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify({ ranking })
        });

        if (!putResponse.ok) {
            throw new Error(`No se pudo guardar: ${putResponse.status}`);
        }

        console.log(`✅ Score guardado exitosamente`);
        res.json({
            success: true,
            message: 'Score guardado',
            ranking: ranking.slice(0, 10)
        });

    } catch (error) {
        console.error('❌ Error en POST /api/ranking/save:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ranking/search
 * Busca un jugador específico
 */
app.post('/api/ranking/search', async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: 'Nombre inválido' });
        }

        console.log(`🔍 Buscando: ${nombre}`);

        const response = await fetch(`${JSONBIN_URL}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });

        if (!response.ok) {
            throw new Error(`Error de JSONBin: ${response.status}`);
        }

        const data = await response.json();
        const ranking = data.record?.ranking || [];

        const found = ranking.find(r =>
            String(r.nombre || '').toLowerCase() === String(nombre).toLowerCase()
        );

        if (found) {
            const position = ranking
                .sort((a, b) => Number(b.metros) - Number(a.metros))
                .findIndex(r => r.nombre?.toLowerCase() === nombre.toLowerCase()) + 1;

            console.log(`✅ Encontrado: ${found.nombre} (${found.metros}m) - Posición #${position}`);
            res.json({
                success: true,
                jugador: found,
                posicion: position,
                total: ranking.length
            });
        } else {
            console.log(`⚠️ No encontrado: ${nombre}`);
            res.json({
                success: false,
                message: 'Jugador no encontrado'
            });
        }

    } catch (error) {
        console.error('❌ Error en POST /api/ranking/search:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/health
 * Verifica que el servidor esté funcionando
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║  🚀 Servidor Jetpack V2 Iniciado     ║');
    console.log(`║  Puerto: ${PORT}                            ║`);
    console.log('║  Endpoints:                           ║');
    console.log('║  - GET  /api/ranking                  ║');
    console.log('║  - POST /api/ranking/save             ║');
    console.log('║  - POST /api/ranking/search           ║');
    console.log('║  - GET  /api/health                   ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
    console.log(`JSONBin ID: ${JSONBIN_ID}`);
    console.log(`JSONBin Key: ${JSONBIN_KEY.substring(0, 20)}...`);
    console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada:', reason);
});
