// --- API/SERVER.JS (El "Cerebro" del Backend) ---

// 1. Importar las "piezas"
const express = require('express');
const serverless = require('serverless-http'); // El "traductor" para Netlify

// 2. Inicializar el motor
const app = express();

// 3. ¡MUY IMPORTANTE! El "Decodificador"
// Esto le dice a Express que entienda los "pedidos" (requests) 
// que le enviamos en formato JSON desde el admin.
app.use(express.json());

// 4. El "Libro de Recetas" (Router)
// Es una buena práctica poner todas nuestras rutas de API aquí.
const router = express.Router();

// 5. NUESTRA PRIMERA RUTA: El Login
// Cuando el "mozo" (admin.js) llame a "/api/login" con un POST...
router.post('/login', (req, res) => {
    try {
        // A. Recibimos el "pedido" (el usuario y pass que mandó el admin)
        const { username, password } = req.body;

        // B. Buscamos en la "Caja Fuerte" (Variables de Entorno)
        // process.env es la "caja fuerte" secreta de Netlify.
        const adminUser = process.env.CMS_USER;
        const adminPass = process.env.CMS_PASSWORD;

        // C. Comparamos
        if (username === adminUser && password === adminPass) {
            // ¡Éxito! Coinciden.
            console.log("Login exitoso para:", username);
            // Le respondemos al "mozo" (admin.js) con un OK.
            res.json({ success: true, message: 'Login correcto' });
        } else {
            // ¡Fallo! No coinciden.
            console.log("Login fallido para:", username);
            // Le respondemos al "mozo" con un error.
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        // Si algo explota (ej. no están definidas las variables)
        console.error("Error en /login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// (Aquí, en el futuro, agregaremos más "recetas": /crear-evento, /eliminar-producto, etc.)

// 6. Conectamos el libro de recetas a la app
// Le decimos a Express que todas nuestras rutas empiezan con "/api"
// (Esto es por el redirect de netlify.toml)
app.use('/api', router);

// 7. Exportamos el "enchufe" final
// "Traducimos" nuestra app Express para que Netlify la entienda.
module.exports.handler = serverless(app);