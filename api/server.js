// --- API/SERVER.JS (Versión 4.0 - CONECTADO A MONGODB) ---

const express = require('express');
const serverless = require('serverless-http'); 
const { MongoClient, ObjectId } = require('mongodb'); // ¡NUEVO!
const path = require('path'); 

const app = express();
app.use(express.json()); 
const router = express.Router();

// --- 1. CONFIGURACIÓN DE BASE DE DATOS ---

// Obtenemos la "llave" que guardaste en Netlify
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'altxerriDB'; // El nombre que pusimos en Mongo

let db; // Variable para guardar la conexión

// Función para conectar a la base de datos
async function connectToDb() {
    if (db) return db; // Si ya está conectado, la devuelve
    
    // Se conecta SÓLO UNA VEZ y reutiliza la conexión
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Conectado a MongoDB Atlas!");
    return db;
}

// --- 2. CONFIGURACIÓN DE SEGURIDAD ---
const API_SECRET_TOKEN = process.env.CMS_PASSWORD;

// Middleware "Guardia" (sin cambios)
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || token !== API_SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: 'Error: Token inválido' });
    }
    next();
};

// --- 3. RUTAS DE LA API (Reconstruidas para MongoDB) ---

// --- "RECETA" DE LOGIN (sin cambios) ---
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUser = process.env.CMS_USER;
        const adminPass = process.env.CMS_PASSWORD;

        if (username === adminUser && password === adminPass) {
            res.json({ 
                success: true, 
                message: 'Login correcto',
                token: API_SECRET_TOKEN 
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// --- RUTAS DE "LEER" (GET) ---

// LEER EVENTOS
router.get('/eventos', async (req, res) => {
    try {
        const db = await connectToDb();
        // .find() trae todo. .toArray() lo convierte en un array.
        const data = await db.collection('eventos').find({}).toArray(); 
        res.json(data);
    } catch (error) {
        console.error("Error en GET /eventos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer eventos' });
    }
});

// LEER PRODUCTOS
router.get('/productos', async (req, res) => {
    try {
        const db = await connectToDb();
        // Hacemos las dos búsquedas al mismo tiempo
        const [dataES, dataEN] = await Promise.all([
            db.collection('productos_es').find({}).toArray(),
            db.collection('productos_en').find({}).toArray()
        ]);
        
        // Re-creamos la estructura que tu frontend espera
        // (Tu frontend espera el objeto "textosUI" que está en los JSON
        // pero que no subimos a la DB. Lo "engañamos" dándole solo los productos)
        res.json({
            es: { productos: dataES },
            en: { productos: dataEN }
        });
    } catch (error) {
        console.error("Error en GET /productos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer productos' });
    }
});

// --- RUTAS DE "ESCRIBIR" (POST, PUT, DELETE) CON GUARDIA ---

// RUTA PARA CREAR (Alta de Evento)
router.post('/eventos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const nuevoEvento = req.body;
        
        // ¡NUEVO! MongoDB crea su propio _id.
        // Lo borramos si viene del frontend para evitar conflictos.
        delete nuevoEvento._id; 
        
        const result = await db.collection('eventos').insertOne(nuevoEvento);
        
        console.log("EVENTO CREADO:", result.insertedId);
        res.json({ success: true, message: 'Evento creado con éxito', evento: nuevoEvento });
        
    } catch (error) {
        console.error("Error en POST /eventos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento' });
    }
});

// RUTA PARA MODIFICAR (Modificación de Evento)
router.put('/eventos/modificar/:id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idEventoModificar = req.params.id; // Este es tu ID (ej: "evt_123456")
        const eventoModificado = req.body;
        
        // Mongo usa un id especial "_id". No lo necesitamos.
        delete eventoModificado._id; 

        // --- Lógica de Backup (Tu requisito) ---
        // 1. Buscamos el evento ORIGINAL por tu ID
        const eventoOriginal = await db.collection('eventos').findOne({ id: idEventoModificar });

        if (eventoOriginal) {
            // 2. Creamos la copia de seguridad
            const backupEvento = {
                ...eventoOriginal,
                fechaModificacion: new Date().toISOString()
            };
            delete backupEvento._id; // Le quitamos el _id de Mongo
            
            // 3. Guardamos el backup
            await db.collection('eventosModificados').insertOne(backupEvento);
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idEventoModificar);
        }

        // --- Lógica de Actualización ---
        // 4. Actualizamos el evento principal buscando por tu "id"
        await db.collection('eventos').updateOne(
            { id: idEventoModificar }, // El filtro (cómo buscarlo)
            { $set: eventoModificado }  // Los nuevos datos
        );
        
        console.log("EVENTO MODIFICADO:", idEventoModificar);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });

    } catch (error) {
        console.error("Error en PUT /eventos/modificar:", error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el evento' });
    }
});

// RUTA PARA ELIMINAR (Baja de Evento)
router.delete('/eventos/eliminar/:id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idEventoEliminar = req.params.id; // Tu ID

        // --- Lógica de Backup (Tu requisito) ---
        // 1. Buscamos el evento que vamos a borrar
        const eventoABorrar = await db.collection('eventos').findOne({ id: idEventoEliminar });
        
        if (!eventoABorrar) {
             return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        // 2. Creamos la copia de seguridad
        const backupEvento = {
            ...eventoABorrar,
            fechaEliminacion: new Date().toISOString()
        };
        delete backupEvento._id; // Le quitamos el _id de Mongo

        // 3. Guardamos el backup
        await db.collection('eventosEliminados').insertOne(backupEvento);
        console.log("BACKUP DE ELIMINACIÓN CREADO:", idEventoEliminar);

        // --- Lógica de Eliminación ---
        // 4. Borramos el evento de la colección principal
        await db.collection('eventos').deleteOne({ id: idEventoEliminar });
        
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