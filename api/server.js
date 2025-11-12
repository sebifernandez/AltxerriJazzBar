// --- API/SERVER.JS (El "Cerebro" del Backend) ---

// 1. Importar las "piezas"
const express = require('express');
const serverless = require('serverless-http'); // El "traductor" para Netlify
const fs = require('fs'); // ¡NUEVO! Es el "brazo" del robot, le permite LEER archivos.
const path = require('path'); // ¡NUEVO! Es el "GPS" del robot, para encontrar archivos.

// 2. Inicializar el motor
const app = express();
app.use(express.json()); // El "Decodificador"

// 3. El "Libro de Recetas" (Router)
const router = express.Router();

// --- "RECETA" 1: LOGIN (La que ya teníamos) ---
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUser = process.env.CMS_USER;
        const adminPass = process.env.CMS_PASSWORD;

        if (username === adminUser && password === adminPass) {
            console.log("Login exitoso para:", username);
            res.json({ success: true, message: 'Login correcto' });
        } else {
            console.log("Login fallido para:", username);
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// --- "RECETA" 2: OBTENER EVENTOS (¡NUEVO!) ---
router.get('/eventos', (req, res) => {
    try {
        // 1. El "GPS" (path) busca la ruta correcta al "almacén" (data)
        const filePath = path.join(process.cwd(), 'data', 'eventos.json');
        
        // 2. El "brazo" (fs) lee el archivo
        const data = fs.readFileSync(filePath, 'utf8');
        
        // 3. Devolvemos los datos (en formato JSON) al "mozo" (admin.js)
        res.json(JSON.parse(data));
        
    } catch (error) {
        console.error("Error en GET /eventos:", error);
        res.status(500).json({ success: false, message: 'Error al leer eventos.json' });
    }
});

// --- "RECETA" 3: OBTENER PRODUCTOS DE LA CARTA (¡NUEVO!) ---
router.get('/productos', async (req, res) => {
    try {
        // Hacemos lo mismo, pero para AMBOS archivos de carta
        const filePathES = path.join(process.cwd(), 'data', 'carta_es.json');
        const filePathEN = path.join(process.cwd(), 'data', 'carta_en.json');

        const dataES = fs.readFileSync(filePathES, 'utf8');
        const dataEN = fs.readFileSync(filePathEN, 'utf8');

        // Devolvemos un objeto que contiene AMBOS
        res.json({
            es: JSON.parse(dataES),
            en: JSON.parse(dataEN)
        });

    } catch (error) {
        console.error("Error en GET /productos:", error);
        res.status(500).json({ success: false, message: 'Error al leer carta_es.json o carta_en.json' });
    }
});

// (Aquí pondremos las recetas de "Guardar", "Eliminar", etc.)


// 4. Conectamos el libro de recetas a la app
// (Esta es la línea clave que arreglamos antes)
app.use('/api', router);

// 5. Exportamos el "enchufe" final
module.exports.handler = serverless(app);