// --- API/SERVER.JS (Versión 4.2 - Corregido con _id de MongoDB) ---

const express = require('express');
const serverless = require('serverless-http'); 
const { MongoClient, ObjectId } = require('mongodb'); // ¡ObjectId es clave!
const path = require('path'); 

const app = express();
app.use(express.json()); 
const router = express.Router();

// --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'altxerriDB';
let db;

async function connectToDb() {
    if (db) return db;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Conectado a MongoDB Atlas!");
    return db;
}

// --- 2. CONFIGURACIÓN DE SEGURIDAD ---
const API_SECRET_TOKEN = process.env.CMS_PASSWORD;
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || token !== API_SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: 'Error: Token inválido' });
    }
    next();
};

// --- 3. RUTAS DE LA API (Corregidas) ---

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

// --- RUTAS DE "LEER" (GET) (sin cambios) ---
router.get('/eventos', async (req, res) => {
    try {
        const db = await connectToDb();
        const data = await db.collection('eventos').find({}).toArray(); 
        res.json(data);
    } catch (error) {
        console.error("Error en GET /eventos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer eventos' });
    }
});

router.get('/productos', async (req, res) => {
    try {
        const db = await connectToDb();
        const [dataES, dataEN] = await Promise.all([
            db.collection('productos_es').find({}).toArray(),
            db.collection('productos_en').find({}).toArray()
        ]);
        res.json({
            es: { productos: dataES },
            en: { productos: dataEN }
        });
    } catch (error) {
        console.error("Error en GET /productos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer productos' });
    }
});

// --- RUTAS DE "ESCRIBIR" (Corregidas con _id) ---

// RUTA PARA CREAR (Alta de Evento)
router.post('/eventos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const nuevoEvento = req.body;
        
        // ¡CAMBIO! Borramos el "id" personalizado que nos manda el frontend
        // para que no entre en conflicto. Dejamos que Mongo cree el _id.
        delete nuevoEvento.id; 
        
        const result = await db.collection('eventos').insertOne(nuevoEvento);
        
        console.log("EVENTO CREADO:", result.insertedId);
        // Devolvemos el evento insertado, que ahora SÍ tiene un _id
        res.json({ success: true, message: 'Evento creado con éxito', evento: nuevoEvento });
        
    } catch (error) {
        console.error("Error en POST /eventos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento' });
    }
});

// RUTA PARA MODIFICAR (Modificación de Evento)
// ¡CAMBIO! La ruta ahora usa "_id"
router.put('/eventos/modificar/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        // ¡CAMBIO! Usamos _id y lo convertimos a un ObjectId
        const idMongo = new ObjectId(req.params._id); 
        const eventoModificado = req.body;
        
        delete eventoModificado._id; // Le quitamos el _id al *cuerpo* del JSON
        delete eventoModificado.id;  // Le quitamos el "id" viejo por las dudas

        // --- Lógica de Backup (Corregida) ---
        // ¡CAMBIO! Buscamos por el _id de Mongo
        const eventoOriginal = await db.collection('eventos').findOne({ _id: idMongo });

        if (eventoOriginal) {
            const backupEvento = {
                ...eventoOriginal, // Esto incluye el _id original
                fechaModificacion: new Date().toISOString()
            };
            // Guardamos el backup
            await db.collection('eventosModificados').insertOne(backupEvento);
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idMongo);
        } else {
            console.log("No se encontró evento original para backup:", idMongo);
            // Igual seguimos, puede que solo queramos modificar
        }

        // --- Lógica de Actualización (Corregida) ---
        // ¡CAMBIO! Actualizamos usando el _id de Mongo
        await db.collection('eventos').updateOne(
            { _id: idMongo },          // Filtro por _id
            { $set: eventoModificado } // Los nuevos datos
        );
        
        console.log("EVENTO MODIFICADO:", idMongo);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });

    } catch (error) {
        console.error("Error en PUT /eventos/modificar:", error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el evento' });
    }
});

// RUTA PARA ELIMINAR (Baja de Evento)
// ¡CAMBIO! La ruta ahora usa "_id"
router.delete('/eventos/eliminar/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        // ¡CAMBIO! Usamos _id y lo convertimos a un ObjectId
        const idMongo = new ObjectId(req.params._id);

        // --- Lógica de Backup (Corregida) ---
        // ¡CAMBIO! Buscamos por el _id de Mongo
        const eventoABorrar = await db.collection('eventos').findOne({ _id: idMongo });
        
        if (!eventoABorrar) {
             return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }

        const backupEvento = {
            ...eventoABorrar,
            fechaEliminacion: new Date().toISOString()
        };
        // Guardamos el backup
        await db.collection('eventosEliminados').insertOne(backupEvento);
        console.log("BACKUP DE ELIMINACIÓN CREADO:", idMongo);

        // --- Lógica de Eliminación (Corregida) ---
        // ¡CAMBIO! Borramos usando el _id de Mongo
        await db.collection('eventos').deleteOne({ _id: idMongo });
        
        console.log("EVENTO ELIMINADO:", idMongo);
        res.json({ success: true, message: 'Evento eliminado con éxito' });

    } catch (error) {
        console.error("Error en DELETE /eventos/eliminar:", error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el evento' });
    }
});

// --- FIN LÓGICA DE EVENTOS ---
router.post('/productos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        // Recibimos el objeto "maestro" bilingüe desde admin.js
        const { producto_es, producto_en } = req.body;

        // 1. Insertamos el producto en español
        const resES = await db.collection('productos_es').insertOne(producto_es);

        // 2. Insertamos el producto en inglés
        const resEN = await db.collection('productos_en').insertOne(producto_en);

        console.log("PRODUCTO CREADO (ES):", resES.insertedId);
        console.log("PRODUCTO CREADO (EN):", resEN.insertedId);

        // Devolvemos los IDs creados (por si los necesitamos)
        res.json({ 
            success: true, 
            message: 'Producto creado con éxito',
            id_es: resES.insertedId,
            id_en: resEN.insertedId
        });

    } catch (error) {
        console.error("Error en POST /productos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el producto' });
    }
});

// --- FIN LÓGICA DE CARTA ---

// Conectamos el libro de recetas a la app
app.use('/api', router);

// Exportamos el "enchufe" final
module.exports.handler = serverless(app);