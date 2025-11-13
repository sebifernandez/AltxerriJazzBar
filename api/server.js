// --- API/SERVER.JS (Versión 4.3 - Arreglo Bug Carta Pública) ---

const express = require('express');
const serverless = require('serverless-http'); 
const { MongoClient, ObjectId } = require('mongodb'); 
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

// --- RUTAS DE "LEER" (GET) ---

// LEER EVENTOS
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

// ¡CAMBIO! LEER PRODUCTOS (Ahora incluye textosUI COMPLETOS)
router.get('/productos', async (req, res) => {
    try {
        const db = await connectToDb();
        
        const [productosES, productosEN] = await Promise.all([
            db.collection('productos_es').find({}).toArray(),
            db.collection('productos_en').find({}).toArray()
        ]);
        
        // --- ARREGLO PARA LA CARTA PÚBLICA (app.js) ---
        // Hardcodeamos los textosUI que tu app.js necesita
        const textosUI_es = {
            "lang": "es", "langButton": "ENG",
            "navbar": [
              { "id": "cocteles", "texto": "Cocteles" }, { "id": "cervezas", "texto": "Cervezas" },
              { "id": "vinos", "texto": "Vinos" }, { "id": "destilados", "texto": "Destilados" },
              { "id": "sinAlcohol", "texto": "Sin Alcohol" }
            ],
            "titulosSeccion": {
              "cocteles": "Cocteles", "cervezas": "Cervezas", "vinos": "Nuestros Vinos",
              "destilados": "Destilados", "sinAlcohol": "Sin Alcohol"
            },
            "subtitulos": {
              "cervezaBarril": "Cervezas de Barril", "cervezaEnvasada": "Cervezas Envasadas",
              "vinosDestacados": "Los Destacados de la Semana", "vinosTintos": "Tintos",
              "vinosBlancos": "Blancos", "vinosOtros": "Rosados y Espumantes"
            },
            "etiquetasPrecio": {
              "cana": "Caña", "pinta": "Pinta", "copa": "Copa", "botella": "Botella", "vaso": "Vaso"
            },
            "etiquetasVino": {
              "bodega": "Bodega", "varietal": "Varietal", "ano": "Año", "crianza": "Crianza"
            }
        };
         const textosUI_en = {
            "lang": "en", "langButton": "ESP",
            "navbar": [
              { "id": "cocteles", "texto": "Cocktails" }, { "id": "cervezas", "texto": "Beers" },
              { "id": "vinos", "texto": "Wines" }, { "id": "destilados", "texto": "Spirits" },
              { "id": "sinAlcohol", "texto": "Non-Alcoholic" }
            ],
            "titulosSeccion": {
              "cocteles": "Cocktails", "cervezas": "Beers", "vinos": "Our Wines",
              "destilados": "Spirits", "sinAlcohol": "Non-Alcoholic"
            },
            "subtitulos": {
              "cervezaBarril": "Draft Beers", "cervezaEnvasada": "Bottled & Canned Beers",
              "vinosDestacados": "Featured Wines of the Week", "vinosTintos": "Red Wines",
              "vinosBlancos": "White Wines", "vinosOtros": "Rosé & Sparkling"
            },
            "etiquetasPrecio": {
              "cana": "Small", "pinta": "Pint", "copa": "Glass", "botella": "Bottle", "vaso": "Glass"
            },
            "etiquetasVino": {
              "bodega": "Winery", "varietal": "Varietal", "ano": "Year", "crianza": "Aging"
            }
        };
        // --- FIN DEL ARREGLO ---

        res.json({
            es: { productos: productosES, textosUI: textosUI_es },
            en: { productos: productosEN, textosUI: textosUI_en }
        });

    } catch (error) {
        console.error("Error en GET /productos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer productos' });
    }
});

// --- RUTAS DE "ESCRIBIR" (POST, PUT, DELETE) CON GUARDIA ---
// (Rutas de Eventos no cambian)
router.post('/eventos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const nuevoEvento = req.body;
        delete nuevoEvento.id; 
        const result = await db.collection('eventos').insertOne(nuevoEvento);
        console.log("EVENTO CREADO:", result.insertedId);
        res.json({ success: true, message: 'Evento creado con éxito', evento: nuevoEvento });
    } catch (error) {
        console.error("Error en POST /eventos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento' });
    }
});
router.put('/eventos/modificar/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idMongo = new ObjectId(req.params._id); 
        const eventoModificado = req.body;
        delete eventoModificado._id; 
        delete eventoModificado.id; 
        const eventoOriginal = await db.collection('eventos').findOne({ _id: idMongo });
        if (eventoOriginal) {
            const backupEvento = { ...eventoOriginal, fechaModificacion: new Date().toISOString() };
            await db.collection('eventosModificados').insertOne(backupEvento);
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idMongo);
        } else {
            console.log("No se encontró evento original para backup:", idMongo);
        }
        await db.collection('eventos').updateOne({ _id: idMongo }, { $set: eventoModificado });
        console.log("EVENTO MODIFICADO:", idMongo);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });
    } catch (error) {
        console.error("Error en PUT /eventos/modificar:", error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el evento' });
    }
});
router.delete('/eventos/eliminar/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idMongo = new ObjectId(req.params._id);
        const eventoABorrar = await db.collection('eventos').findOne({ _id: idMongo });
        if (!eventoABorrar) {
             return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }
        const backupEvento = { ...eventoABorrar, fechaEliminacion: new Date().toISOString() };
        await db.collection('eventosEliminados').insertOne(backupEvento);
        console.log("BACKUP DE ELIMINACIÓN CREADO:", idMongo);
        await db.collection('eventos').deleteOne({ _id: idMongo });
        console.log("EVENTO ELIMINADO:", idMongo);
        res.json({ success: true, message: 'Evento eliminado con éxito' });
    } catch (error) {
        console.error("Error en DELETE /eventos/eliminar:", error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el evento' });
    }
});

// (Ruta de Crear Producto no cambia)
router.post('/productos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { producto_es, producto_en } = req.body;
        const resES = await db.collection('productos_es').insertOne(producto_es);
        const resEN = await db.collection('productos_en').insertOne(producto_en);
        console.log("PRODUCTO CREADO (ES):", resES.insertedId);
        console.log("PRODUCTO CREADO (EN):", resEN.insertedId);
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