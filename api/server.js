// --- API/SERVER.JS (Versión 3.0 - CON SEGURIDAD y LÓGICA DE ESCRITURA) ---

const express = require('express');
const serverless = require('serverless-http'); 
const fs = require('fs'); 
const path = require('path'); 

const app = express();
app.use(express.json()); 
const router = express.Router();

// --- 1. CONFIGURACIÓN DE SEGURIDAD ---

// Esta es la "llave secreta" de nuestra API.
// Usaremos la misma contraseña del CMS para mantenerlo simple.
const API_SECRET_TOKEN = process.env.CMS_PASSWORD;

// Este es el "Guardia" (Middleware).
// Se ejecutará antes de cualquier ruta que queramos proteger.
const checkAuth = (req, res, next) => {
    // Busca la "llave" en los headers de la petición
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Error: No se proporcionó token' });
    }

    // Compara la "llave" del usuario con la "llave" secreta del servidor
    if (token !== API_SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: 'Error: Token inválido' });
    }

    // Si la "llave" es correcta, le permite continuar.
    next();
};

// --- 2. FUNCIONES "MOTOR" PARA LEER/ESCRIBIR JSON (Helpers) ---
// (Usan la ruta process.cwd() que ya funciona)

const dataDir = path.join(process.cwd(), 'data');

// Función para LEER un archivo JSON
function readData(fileName) {
    try {
        const filePath = path.join(dataDir, fileName);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error al LEER ${fileName}:`, error.message);
        throw new Error(`Error del servidor al leer ${fileName}`);
    }
}

// Función para ESCRIBIR un archivo JSON
function writeData(fileName, data) {
    try {
        const filePath = path.join(dataDir, fileName);
        // Usamos null, 2 para que el JSON se guarde formateado y legible
        const jsonData = JSON.stringify(data, null, 2); 
        fs.writeFileSync(filePath, jsonData, 'utf8');
    } catch (error) {
        console.error(`Error al ESCRIBIR ${fileName}:`, error.message);
        throw new Error(`Error del servidor al escribir ${fileName}`);
    }
}

// --- 3. RUTAS DE LA API ---

// --- "RECETA" DE LOGIN (Modificada) ---
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUser = process.env.CMS_USER;
        const adminPass = process.env.CMS_PASSWORD;

        if (username === adminUser && password === adminPass) {
            console.log("Login exitoso para:", username);
            // ¡CAMBIO! Le devolvemos la "llave" secreta al frontend
            res.json({ 
                success: true, 
                message: 'Login correcto',
                token: API_SECRET_TOKEN // Le enviamos la "llave"
            });
        } else {
            console.log("Login fallido para:", username);
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// --- RUTAS DE "LEER" (GET) ---
// No necesitan el "guardia" (checkAuth) porque son públicas.

router.get('/eventos', (req, res) => {
    try {
        const data = readData('eventos.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/productos', (req, res) => {
    try {
        const dataES = readData('carta_es.json');
        const dataEN = readData('carta_en.json');
        res.json({ es: dataES, en: dataEN });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- RUTAS DE "ESCRIBIR" (POST, PUT, DELETE) ---
// ¡OBSERVA! Usamos 'checkAuth' antes de la lógica.
// Nadie puede usarlas sin la "llave".

// ---
// ¡NUEVO! "Fase Final - Paso B" (Lógica de Eventos)
// ---

// RUTA PARA CREAR (Alta)
router.post('/eventos/crear', checkAuth, (req, res) => {
    try {
        const nuevoEvento = req.body;
        
        // 1. Leemos los eventos actuales
        const eventos = readData('eventos.json');
        
        // 2. Añadimos el nuevo
        eventos.push(nuevoEvento);
        
        // 3. Sobrescribimos el archivo
        writeData('eventos.json', eventos);
        
        console.log("EVENTO CREADO:", nuevoEvento.id);
        res.json({ success: true, message: 'Evento creado con éxito', evento: nuevoEvento });
        
    } catch (error) {
        console.error("Error en POST /eventos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento' });
    }
});

// RUTA PARA MODIFICAR (Modificación)
router.put('/eventos/modificar/:id', checkAuth, (req, res) => {
    try {
        const idEventoModificar = req.params.id;
        const eventoModificado = req.body;
        
        // --- Lógica de Backup (Tu requisito) ---
        // 1. Leemos los eventos actuales y el backup
        const eventos = readData('eventos.json');
        const eventosModificados = readData('eventosModificados.json');

        // 2. Buscamos el evento ORIGINAL (antes de modificarlo)
        const eventoOriginal = eventos.find(e => e.id === idEventoModificar);

        if (eventoOriginal) {
            // 3. Creamos la copia de seguridad con timestamp
            const backupEvento = {
                ...eventoOriginal,
                fechaModificacion: new Date().toISOString()
            };
            eventosModificados.push(backupEvento);
            
            // 4. Guardamos el backup
            writeData('eventosModificados.json', eventosModificados);
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idEventoModificar);
        }

        // --- Lógica de Actualización ---
        // 5. Creamos la nueva lista de eventos actualizados
        const eventosActualizados = eventos.map(evento => {
            return evento.id === idEventoModificar ? eventoModificado : evento;
        });

        // 6. Sobrescribimos el archivo principal
        writeData('eventos.json', eventosActualizados);
        
        console.log("EVENTO MODIFICADO:", idEventoModificar);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });

    } catch (error) {
        console.error("Error en PUT /eventos/modificar:", error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el evento' });
    }
});

// RUTA PARA ELIMINAR (Baja)
router.delete('/eventos/eliminar/:id', checkAuth, (req, res) => {
    try {
        const idEventoEliminar = req.params.id;

        // --- Lógica de Backup (Tu requisito) ---
        // 1. Leemos los eventos actuales y el backup de eliminados
        const eventos = readData('eventos.json');
        const eventosEliminados = readData('eventosEliminados.json');

        // 2. Buscamos el evento que vamos a borrar
        const eventoABorrar = eventos.find(e => e.id === idEventoEliminar);
        
        if (!eventoABorrar) {
             return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        // 3. Creamos la copia de seguridad con timestamp
        const backupEvento = {
            ...eventoABorrar,
            fechaEliminacion: new Date().toISOString()
        };
        eventosEliminados.push(backupEvento);

        // 4. Guardamos el backup
        writeData('eventosEliminados.json', eventosEliminados);
        console.log("BACKUP DE ELIMINACIÓN CREADO:", idEventoEliminar);

        // --- Lógica de Eliminación ---
        // 5. Creamos la nueva lista (filtrando el evento eliminado)
        const eventosActualizados = eventos.filter(evento => evento.id !== idEventoEliminar);

        // 6. Sobrescribimos el archivo principal
        writeData('eventos.json', eventosActualizados);
        
        console.log("EVENTO ELIMINADO:", idEventoEliminar);
        res.json({ success: true, message: 'Evento eliminado con éxito' });

    } catch (error) {
        console.error("Error en DELETE /eventos/eliminar:", error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el evento' });
    }
});

// --- FIN LÓGICA DE EVENTOS ---

// Conectamos el libro de recetas a la app
app.use('/api', router);

// Exportamos el "enchufe" final
module.exports.handler = serverless(app);