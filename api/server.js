// --- API/SERVER.JS (Versión 4.3 - Arreglo Bug Carta Pública) ---

const express = require('express');
const serverless = require('serverless-http'); 
const { MongoClient, ObjectId } = require('mongodb'); 
const path = require('path'); 
const cloudinary = require('cloudinary').v2;    

const app = express();
// Aumentamos el límite a 10MB para poder recibir imágenes en Base64
app.use(express.json({ limit: '10mb' }));
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

        const filtroProductos = { "tipo": { "$exists": true } };

        const [productosES, productosEN] = await Promise.all([
            db.collection('productos_es').find(filtroProductos).toArray(),
            db.collection('productos_en').find(filtroProductos).toArray()
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
              "cana": "Caña", "pinta": "Pinta", "copa": "Copa", "botella": "Botella", "vaso": "Vaso", "chupito": "Chupito", "vasoDestilado": "Vaso"
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
              "cana": "Small", "pinta": "Pint", "copa": "Glass", "botella": "Bottle", "vaso": "Glass", "chupito": "Shot", "vasoDestilado": "Glass"
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
    let idMongo;
    try {
        const db = await connectToDb();
        
        // 1. BLINDAJE: Verificamos la validez del ObjectId
        try {
            idMongo = new ObjectId(req.params._id);
        } catch (idError) {
            console.error("Error: El ID proporcionado no es un ObjectId válido.", req.params._id);
            return res.status(400).json({ success: false, message: `El ID '${req.params._id}' no es válido.` });
        }

        const eventoModificado = req.body;
        delete eventoModificado._id; 
        delete eventoModificado.id; 

        // 2. Lógica de Backup (sin cambios, pero ahora sabemos que idMongo es válido)
        const eventoOriginal = await db.collection('eventos').findOne({ _id: idMongo });
        if (eventoOriginal) {
            const backupEvento = { ...eventoOriginal, fechaModificacion: new Date().toISOString() };
            await db.collection('eventosModificados').insertOne(backupEvento);
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idMongo);
        } else {
            console.log("No se encontró evento original para backup:", idMongo);
        }

        // 3. Actualización
        const updateResult = await db.collection('eventos').updateOne(
            { _id: idMongo }, 
            { $set: eventoModificado }
        );

        // 4. Verificación de la actualización
        if (updateResult.matchedCount === 0) {
            console.warn("Se intentó modificar un evento que no se encontró en la DB:", idMongo);
            // Nota: No devolvemos error, ya que el backup pudo haberse creado
            // y la operación "técnicamente" no falló, solo no encontró coincidencias.
        }

        console.log("EVENTO MODIFICADO:", idMongo);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });

    } catch (error) {
        // 5. Catch General
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

// (Ruta de Crear Producto CORREGIDA)
router.post('/productos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { producto_es, producto_en } = req.body;

        // --- ¡ARREGLO CRÍTICO! ---
        // 1. Generamos UN solo _id nuevo
        const nuevoId = new ObjectId(); 
        
        // 2. Asignamos ese mismo _id a ambos productos
        producto_es._id = nuevoId;
        producto_en._id = nuevoId;
        // --- FIN DEL ARREGLO ---

        // 3. Insertamos ambos (ahora sí comparten _id)
        const resES = await db.collection('productos_es').insertOne(producto_es);
        const resEN = await db.collection('productos_en').insertOne(producto_en);
        
        console.log("PRODUCTO CREADO (ES/EN):", resES.insertedId); // El ID será el mismo
        
        res.json({ 
            success: true, 
            message: 'Producto creado con éxito',
            id_es: resES.insertedId, // Devolverá el ID compartido
            id_en: resEN.insertedId  // Devolverá el ID compartido
        });

    } catch (error) {
        console.error("Error en POST /productos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el producto' });
    }
});

// --- INICIO DEL BLOQUE REEMPLAZADO ---
router.put('/productos/modificar/:_id', checkAuth, async (req, res) => {
    let idMongo; // La definimos aquí para que esté en el scope
    try {
        const db = await connectToDb();

        // 1. BLINDAJE: Verificamos la validez del ObjectId
        try {
            idMongo = new ObjectId(req.params._id);
        } catch (idError) {
            // Si el ID es inválido (ej: "null"), devolvemos un error 400 (Bad Request)
            console.error("Error: El ID de producto proporcionado no es un ObjectId válido.", req.params._id);
            return res.status(400).json({ success: false, message: `El ID '${req.params._id}' no es válido.` });
        }

        const { producto_es, producto_en } = req.body;

// --- INICIO DE LÍNEAS DE DEBUG ---
        console.log("--- DEBUG: Objeto producto_es RECIBIDO POR EL SERVER ---");
        console.log(JSON.stringify(producto_es, null, 2));
        // --- FIN DE LÍNEAS DE DEBUG ---

        // 2. BACKUP:
        const original_es = await db.collection('productos_es').findOne({ _id: idMongo });
        const original_en = await db.collection('productos_en').findOne({ _id: idMongo });

        if (original_es) {
            const backupDoc = {
                ...original_es,
                traduccion_en: original_en,
                fechaModificacion: new Date().toISOString()
            };
            await db.collection('productosModificados').insertOne(backupDoc);
            console.log("BACKUP DE PRODUCTO CREADO:", idMongo);
        } else {
            console.log("No se encontró producto original para backup:", idMongo);
        }

        // 3. ACTUALIZACIÓN:
        delete producto_es._id;
        delete producto_en._id;
        
delete producto_es._id;
        delete producto_en._id;
        
        const resES = await db.collection('productos_es').updateOne(
            { _id: idMongo },
            { $set: producto_es } // 'producto_es' ya no tiene _id
        );
        const resEN = await db.collection('productos_en').updateOne(
            { _id: idMongo },
            { $set: producto_en } // 'producto_en' ya no tiene _id
        );

        if (resES.matchedCount === 0 || resEN.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        console.log("PRODUCTO MODIFICADO (ES/EN):", idMongo);
        res.json({ success: true, message: 'Producto modificado con éxito' });

    } catch (error) {
        console.error("Error en PUT /productos/modificar:", error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el producto' });
    }
});
// --- FIN DEL BLOQUE REEMPLAZADO ---

// --- RUTA PARA ACTUALIZAR VISIBILIDAD (Smart Switch) ---
router.put('/productos/visibilidad/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idMongo = new ObjectId(req.params._id);
        const { visualizacion } = req.body; // Esperamos { visualizacion: true/false }

        // Actualizamos ambas colecciones
        const resES = await db.collection('productos_es').updateOne(
            { _id: idMongo },
            { $set: { visualizacion: visualizacion } }
        );
        await db.collection('productos_en').updateOne(
            { _id: idMongo },
            { $set: { visualizacion: visualizacion } }
        );

        if (resES.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        res.json({ success: true, message: 'Visibilidad actualizada' });

    } catch (error) {
        console.error("Error en PUT /productos/visibilidad:", error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

// --- FIN LÓGICA DE CARTA ---

// Conectamos el libro de recetas a la app
// --- RUTA PARA SUBIR IMÁGENES ---
router.post('/imagenes/subir', checkAuth, async (req, res) => {
    try {
        // El frontend nos enviará la imagen como un string Base64
        const fileStr = req.body.data;
        
        // La enviamos a Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            // Opciones de subida:
            upload_preset: 'ml_default', // 'ml_default' es un preset que suele venir por defecto
            folder: 'altxerri_jazz_club' // Opcional: para organizar en una carpeta
        });

        // Devolvemos la URL segura de la imagen subida
        res.json({ 
            success: true, 
            message: 'Imagen subida con éxito', 
            url: uploadResponse.secure_url 
        });

    } catch (error) {
        console.error("Error en POST /imagenes/subir:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al subir la imagen' 
        });
    }
});
app.use('/api', router);

// Exportamos el "enchufe" final
module.exports.handler = serverless(app);