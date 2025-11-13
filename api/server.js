// --- API/SERVER.JS (Versión CORREGIDA v2) ---

const express = require('express');
const serverless = require('serverless-http'); 
const fs = require('fs'); 
const path = require('path'); 

const app = express();
app.use(express.json()); 
const router = express.Router();

// --- "RECETA" 1: LOGIN (Funciona) ---
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

// --- "RECETA" 2: OBTENER EVENTOS (¡NUEVA RUTA!) ---
router.get('/eventos', (req, res) => {
    // CAMBIO: Usamos process.cwd() en lugar de __dirname
    const filePath = path.join(process.cwd(), 'data', 'eventos.json');
    
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
        
    } catch (error) {
        // CAMBIO: Mejoramos el log de error
        console.error(`Error en GET /eventos. Ruta intentada: ${filePath}`);
        console.error(error.message); // Imprime el error específico (ej. "ENOENT: no such file...")
        res.status(500).json({ success: false, message: 'Error al leer eventos.json' });
    }
});

// --- "RECETA" 3: OBTENER PRODUCTOS (¡NUEVA RUTA!) ---
router.get('/productos', async (req, res) => {
    // CAMBIO: Usamos process.cwd() en lugar de __dirname
    const filePathES = path.join(process.cwd(), 'data', 'carta_es.json');
    const filePathEN = path.join(process.cwd(), 'data', 'carta_en.json');

    try {
        const dataES = fs.readFileSync(filePathES, 'utf8');
        const dataEN = fs.readFileSync(filePathEN, 'utf8');

        res.json({
            es: JSON.parse(dataES),
            en: JSON.parse(dataEN)
        });

    } catch (error) {
        // CAMBIO: Mejoramos el log de error
        console.error(`Error en GET /productos. Rutas intentadas: ${filePathES} y ${filePathEN}`);
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Error al leer carta_es.json o carta_en.json' });
    }
});

// 4. Conectamos el libro de recetas a la app
app.use('/api', router);

// 5. Exportamos el "enchufe" final
module.exports.handler = serverless(app);