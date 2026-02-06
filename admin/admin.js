/* --- ADMIN.JS (Versión 5.3 - FINAL - PARTE 1/3) --- */

// ==========================================
// 1. VARIABLES GLOBALES Y UTILIDADES
// ==========================================
const { DateTime } = luxon; 
let adminEventos = []; 
let adminProductos = []; 
let adminProductos_EN = []; 

// Variables de Estado
let modoEdicion = false; 
let idEventoEdicion = null; 
let idProductoEdicion = null;
let tags = []; 
let picker; 

function getAuthToken() {
    return localStorage.getItem('altxerri_token') || '';
}

function formatarPrecio(precio) {
    if (!precio || precio === 0) return '–';
    return `${precio}€`;
}

// Convertir File a Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// 2. PLANTILLAS HTML (CARTA) - ACTUALIZADO (Campos Opcionales)
// ==========================================
const plantillasBloques = {
    unicos_titulo_marca: `<div class="form-group"><label for="producto-titulo">Título / Nombre (Marca) *</label><input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Jack Daniel's" required></div>`,
    unicos_precios_copa_botella: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-precio-copa">Precio (Copa)</label><input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 10"></div></div><div class="form-col"><div class="form-group"><label for="producto-precio-botella">Precio (Botella)</label><input type="number" step="0.01" id="producto-precio-botella" class="form-input" placeholder="Ej: 40"></div></div></div>`,
    unicos_precios_cana_pinta: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-precio-cana">Precio (Caña) *</label><input type="number" step="0.01" id="producto-precio-cana" class="form-input" placeholder="Ej: 4" required></div></div><div class="form-col"><div class="form-group"><label for="producto-precio-pinta">Precio (Pinta) *</label><input type="number" step="0.01" id="producto-precio-pinta" class="form-input" placeholder="Ej: 7" required></div></div></div>`,
    unicos_precios_botella_solo: `<div class="form-group"><label for="producto-precio-botella">Precio (Unidad) *</label><input type="number" step="0.01" id="producto-precio-botella" class="form-input" placeholder="Ej: 7" required></div>`,
    unicos_precios_copa_solo: `<div class="form-group"><label for="producto-precio-copa">Precio (Copa) *</label><input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 8" required></div>`,
    unicos_precios_copa_botella_destilado: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-precio-cana">Precio (Chupito) *</label><input type="number" step="0.01" id="producto-precio-cana" class="form-input" placeholder="Ej: 4" required></div></div><div class="form-col"><div class="form-group"><label for="producto-precio-copa">Precio (Vaso)</label><input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 8"></div></div></div>`,
    unicos_cerveza_datos: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-abv">ABV (%)</label><input type="number" step="0.1" id="producto-abv" class="form-input" placeholder="Ej: 5.0"></div></div><div class="form-col"><div class="form-group"><label for="producto-ibu">IBU</label><input type="number" id="producto-ibu" class="form-input" placeholder="Ej: 12"></div></div></div>`,
    unicos_vino_datos: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-productor">Bodega (Productor)</label><input type="text" id="producto-productor" class="form-input" placeholder="Ej: Luca Wines"></div></div><div class="form-col"><div class="form-group"><label for="producto-ano">Año</label><input type="text" id="producto-ano" class="form-input" placeholder="Ej: 2021"></div></div></div>`,
    unicos_destilado_datos: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-productor">Productor</label><input type="text" id="producto-productor" class="form-input" placeholder="Ej: Jack Daniel Distillery"></div></div></div>`,
    unicos_imagen_coctel: `<div class="form-section"><h4>Visualización</h4><div style="background: var(--color-bg); padding: 1rem; border-radius: 8px; border: 1px solid #444; display: flex; align-items: center; justify-content: space-between;"><label for="producto-mostrar-imagen" style="font-weight:bold; color:#FFC107; margin:0; cursor:pointer;">Mostrar con Imagen (Card)</label><label class="switch"><input type="checkbox" id="producto-mostrar-imagen"><span class="slider"></span></label></div><div id="contenedor-imagen-coctel" style="display:none; margin-top:1rem; border-left: 3px solid #FFC107; padding-left: 1rem;"><div class="form-group"><label for="producto-imagen-upload">Subir Imagen</label><input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp"></div><p id="msg-imagen-existente" style="font-size:0.85rem; color:#aaa; display:none;">Imagen guardada: <strong style="color:#fff;">(Ninguna)</strong></p></div></div>`,
    unicos_imagen_vino: `<div class="form-section"><h4>Imagen del Producto (¡Obligatoria para Vinos!)</h4><div class="form-group"><label for="producto-imagen-upload">Subir Imagen *</label><input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required></div></div>`,
    unicos_vino_destacado: `<div class="form-group-checkbox-inline"><input type="checkbox" id="producto-destacado"><label for="producto-destacado">Marcar como "Vino Destacado de la Semana"</label></div>`,
    unicos_vino_smart: `<div class="form-section"><h4>Visibilidad y Destacado</h4><div style="background: var(--color-bg); padding: 1rem; border-radius: 8px; border: 1px solid #444; display: flex; align-items: center; justify-content: space-between;"><label for="producto-destacado" style="font-weight:bold; color:#FFC107; margin:0; cursor:pointer;"><i class='bx bxs-star'></i> Marcar como Destacado (Con Foto)</label><label class="switch"><input type="checkbox" id="producto-destacado"><span class="slider"></span></label></div><div id="contenedor-imagen-vino" style="display:none; margin-top:1rem; border-left: 3px solid #FFC107; padding-left: 1rem;"><div class="form-group"><label for="producto-imagen-upload">Subir Imagen del Banner</label><input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp"></div><p id="msg-imagen-existente" style="font-size:0.85rem; color:#aaa; display:none;">Imagen guardada: <strong style="color:#fff;">(Ninguna)</strong></p></div></div>`,

    // --- CAMPOS TRADUCIBLES ESTÁNDAR (Obligatorios) ---
    trad_es_titulo: `<div class="form-group"><label for="producto-titulo-es">Título (ES) *</label><input type="text" id="producto-titulo-es" class="form-input" required></div>`,
    trad_es_descripcion: `<div class="form-group"><label for="producto-descripcion-es">Descripción (ES) *</label><textarea id="producto-descripcion-es" class="form-input" style="min-height: 100px;" required></textarea></div>`,
    
    trad_en_titulo: `<div class="form-group"><label for="producto-titulo-en">Título (EN) *</label><input type="text" id="producto-titulo-en" class="form-input" required></div>`,
    trad_en_descripcion: `<div class="form-group"><label for="producto-descripcion-en">Descripción (EN) *</label><textarea id="producto-descripcion-en" class="form-input" style="min-height: 100px;" required></textarea></div>`,

    // --- CAMPOS OPCIONALES (NUEVOS PARA FASE 1) ---
    
    // Descripción Opcional (Para Sin Alcohol)
    trad_es_descripcion_opcional: `<div class="form-group"><label for="producto-descripcion-es">Descripción (ES)</label><textarea id="producto-descripcion-es" class="form-input" style="min-height: 100px;"></textarea></div>`,
    trad_en_descripcion_opcional: `<div class="form-group"><label for="producto-descripcion-en">Descripción (EN)</label><textarea id="producto-descripcion-en" class="form-input" style="min-height: 100px;"></textarea></div>`,

    // Región/País Opcional (Para Destilados)
    trad_es_region_pais_opcional: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-es">Región (ES)</label><input type="text" id="producto-region-es" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-es">País (ES)</label><input type="text" id="producto-pais-es" class="form-input"></div></div></div>`,
    trad_en_region_pais_opcional: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-en">Región (EN)</label><input type="text" id="producto-region-en" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-en">País (EN)</label><input type="text" id="producto-pais-en" class="form-input"></div></div></div>`,
    
    // Crianza Opcional (Para Destilados)
    trad_es_crianza_destilado_opcional: `<div class="form-group"><label for="producto-crianza-es">Crianza (ES)</label><input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: 18 meses..."></div>`,
    trad_en_crianza_destilado_opcional: `<div class="form-group"><label for="producto-crianza-en">Crianza (EN)</label><input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: 18 months..."></div>`,

    // Campos Estándar (Vinos - Obligatorios o normales)
    trad_es_region_pais: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-es">Región (ES)</label><input type="text" id="producto-region-es" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-es">País (ES)</label><input type="text" id="producto-pais-es" class="form-input"></div></div></div>`,
    trad_en_region_pais: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-en">Región (EN)</label><input type="text" id="producto-region-en" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-en">País (EN)</label><input type="text" id="producto-pais-en" class="form-input"></div></div></div>`,
    
    trad_es_varietal_vino: `<div class="form-group"><label for="producto-varietal-es">Varietal (ES)</label><input type="text" id="producto-varietal-es" class="form-input"></div>`,
    trad_en_varietal_vino: `<div class="form-group"><label for="producto-varietal-en">Varietal (EN)</label><input type="text" id="producto-varietal-en" class="form-input"></div>`,
    
    trad_es_crianza_vino: `<div class="form-group"><label for="producto-crianza-es">Crianza (ES)</label><input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: 14 meses en barricas"></div>`,
    trad_en_crianza_vino: `<div class="form-group"><label for="producto-crianza-en">Crianza (EN)</label><input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: 14 months in barrels"></div>`,
    
    bilingue_wrapper: (html_es, html_en) => `
        <div class="form-section-bilingue">
            <div class="lang-tabs">
                <button type="button" class="lang-tab-btn active" data-lang="es">Español</button>
                <button type="button" class="lang-tab-btn" data-lang="en">Inglés</button>
            </div>
            <div class="form-bilingue-grid">
                <div class="lang-content lang-col-es active" data-lang-content="es">${html_es}</div>
                <div class="lang-content lang-col-en" data-lang-content="en">
                    ${html_en}
                </div>
            </div>
        </div>`
};

const plantillasFormCarta = {
    coctel: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_precios_copa_solo}${plantillasBloques.unicos_imagen_coctel}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion)}`,
    cervezaBarril: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_cana_pinta}${plantillasBloques.unicos_cerveza_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion)}`,
    cervezaEnvasada: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_botella_solo}${plantillasBloques.unicos_cerveza_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion)}`,
    vino: `${plantillasBloques.unicos_vino_smart} <div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_vino_datos}${plantillasBloques.unicos_precios_copa_botella}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_varietal_vino + plantillasBloques.trad_es_crianza_vino + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_varietal_vino + plantillasBloques.trad_en_crianza_vino + plantillasBloques.trad_en_descripcion)}`,
    
    // --- MODIFICADOS ---
    // Sin Alcohol: Usa descripción OPCIONAL
    sinAlcohol: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_precios_botella_solo}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion_opcional, plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion_opcional)}`,
    
    // Destilado: Usa región y crianza OPCIONALES
    destilado: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_copa_botella_destilado}${plantillasBloques.unicos_destilado_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais_opcional + plantillasBloques.trad_es_crianza_destilado_opcional + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais_opcional + plantillasBloques.trad_en_crianza_destilado_opcional + plantillasBloques.trad_en_descripcion)}`
};

// ==========================================
// 3. INICIALIZACIÓN Y EVENTOS DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // --- LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const errorMessage = document.getElementById('login-error');
            errorMessage.textContent = 'Verificando...';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }) 
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('altxerri_auth', 'true');
                    localStorage.setItem('altxerri_token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    errorMessage.textContent = data.message;
                }
            } catch (error) {
                errorMessage.textContent = 'Error de conexión.';
            }
        });
    } 
    // --- DASHBOARD ---
    else if (dashboardContainer) {
        if (localStorage.getItem('altxerri_auth') !== 'true') {
            window.location.href = 'index.html';
            return; 
        }
        
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('altxerri_auth');
            localStorage.removeItem('altxerri_token');
            window.location.href = 'index.html';
        });

        inicializarNavegacion();
        inicializarFormularioAlta();
        inicializarFormularioCarta();
        inicializarModalImagenes();
        inicializarGestorWeb();
        inicializarGestorTextos();
        inicializarGestorNewsletter();
        fetchEventosData(); 
        fetchProductosData(); 
        inicializarPanelesBusquedaEventos();
        inicializarPanelesBusquedaProductos();
    }
});

function inicializarNavegacion() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const tabLinks = document.querySelectorAll('.tab-link');
    const dashCards = document.querySelectorAll('.dash-card');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) section.classList.add('active');
            });
            if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    dashCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.getAttribute('data-target');
            document.querySelector(`.nav-link[data-target="${targetId}"]`).click();
        });
    });

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.getAttribute('data-tab');
            const parentSection = link.closest('.content-section');
            parentSection.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            parentSection.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'alta-evento' && !modoEdicion) crearCalendarioAlta();
            if (targetId === 'alta-producto' && !modoEdicion) resetearFormularioCarta();
        });
    });
}

// PARTE 2
/* --- ADMIN.JS (PARTE 2/3 - EVENTOS ALTA Y FORMULARIO) --- */

// ==========================================
// 4. GESTIÓN DE EVENTOS (ALTA, BAJA, MOD)
// ==========================================

function inicializarFormularioAlta() {
    const form = document.getElementById('form-alta-evento');
    const checkGenerica = document.getElementById('evento-img-generica');
    const fieldsetImagen = document.getElementById('fieldset-imagen');
    const inputTag = document.getElementById('evento-tags');
    const tagContainer = document.getElementById('tag-container');
    const tipoEventoSelect = document.getElementById('evento-tipo');
    const inputArchivo = document.getElementById('evento-imagen-upload');

    // Bilingüe Check
    const checkMismo = document.getElementById('evento-mismo-contenido');
    const tituloES = document.getElementById('evento-titulo');
    const tituloEN = document.getElementById('evento-titulo-en');
    const descES = document.getElementById('evento-descripcion');
    const descEN = document.getElementById('evento-descripcion-en');

    if(checkMismo) {
        checkMismo.addEventListener('change', () => {
            if(checkMismo.checked) {
                tituloEN.value = tituloES.value;
                descEN.value = descES.value;
                tituloEN.disabled = true;
                descEN.disabled = true;
            } else {
                tituloEN.disabled = false;
                descEN.disabled = false;
            }
        });
        tituloES.addEventListener('input', () => { if(checkMismo.checked) tituloEN.value = tituloES.value; });
        descES.addEventListener('input', () => { if(checkMismo.checked) descEN.value = descES.value; });
    }

    // Imagen Genérica
    checkGenerica.addEventListener('change', () => {
        habilitarEdicionTags();
        const infoImg = document.getElementById('info-img-actual');
        if (infoImg) infoImg.remove();
        fieldsetImagen.disabled = checkGenerica.checked;
        if (checkGenerica.checked) {
            tags = [];
            renderizarTags();
            if(inputArchivo) inputArchivo.value = '';
        }
    });

    // Archivo Nuevo
    if(inputArchivo) {
        inputArchivo.addEventListener('change', () => {
            if (inputArchivo.files.length > 0) {
                habilitarEdicionTags();
                document.getElementById('evento-imagen-url-seleccionada').value = '';
                const infoImg = document.getElementById('info-img-actual');
                if (infoImg) infoImg.remove();
            }
        });
    }

    // Tags
    inputTag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); 
            const val = inputTag.value.trim();
            if (val && !tags.includes(val)) {
                tags.push(val);
                renderizarTags();
            }
            inputTag.value = ''; 
        }
    });
    tagContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag-btn')) {
            tags = tags.filter(t => t !== e.target.dataset.tag);
            renderizarTags();
        }
    });

    // Tipo Evento (CORREGIDO: Deshabilita campos EN/ES si es privado)
    tipoEventoSelect.addEventListener('change', () => {
        const esEspecial = ['Privado', 'Cerrado'].includes(tipoEventoSelect.value);
        
        // Deshabilitar campos de texto
        tituloES.disabled = esEspecial;
        tituloEN.disabled = esEspecial;
        descES.disabled = esEspecial;
        descEN.disabled = esEspecial;
        
        // Deshabilitar links e imagen
        document.getElementById('evento-live').disabled = esEspecial;
        document.getElementById('evento-concierto').disabled = esEspecial;
        checkGenerica.disabled = esEspecial;
        fieldsetImagen.disabled = esEspecial;
        
        if(esEspecial) {
            tituloES.value = '';
            tituloEN.value = '';
            descES.value = '';
            descEN.value = '';
            
            checkGenerica.checked = false;
            if(inputArchivo) inputArchivo.value = '';
            tags = [];
            renderizarTags();
        }
    });

    crearCalendarioAlta();

    // SUBMIT EVENTO
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btn = form.querySelector('.btn-primary');
        btn.disabled = true;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";

        const data = {
            fecha: document.getElementById('evento-fecha').value,
            tipoEvento: tipoEventoSelect.value,
            titulo: tituloES.value.trim(),
            titulo_en: tituloEN.value.trim(),
            descripcion: descES.value.trim(),
            descripcion_en: descEN.value.trim(),
            live: document.getElementById('evento-live').value.trim(),
            concierto: document.getElementById('evento-concierto').value.trim(),
            usaGenerica: checkGenerica.checked,
            archivoImagen: inputArchivo.files[0],
            imgReferencia: tags
        };

        if (checkMismo.checked) {
            data.titulo_en = data.titulo;
            data.descripcion_en = data.descripcion;
        }

        // Validaciones
        if (data.tipoEvento === 'Regular' && !data.titulo) {
            alert("Título es obligatorio."); btn.disabled = false; btn.innerHTML = "Guardar Evento"; return;
        }
        if (!data.fecha) {
            alert("Fecha es obligatoria."); btn.disabled = false; btn.innerHTML = "Guardar Evento"; return;
        }
        if (!data.usaGenerica && data.archivoImagen && data.imgReferencia.length === 0) {
            alert("Tags obligatorios si subes imagen."); btn.disabled = false; btn.innerHTML = "Guardar Evento"; return;
        }

        try {
            let imagenUrl;
            const urlOculta = document.getElementById('evento-imagen-url-seleccionada').value;

            if (['Cerrado', 'Privado'].includes(data.tipoEvento)) {
                imagenUrl = data.tipoEvento === 'Cerrado' ? "cerrado.jpg" : "eventoPrivado.jpg";
            } else if (data.usaGenerica) {
                imagenUrl = "imgBandaGenerica.jpg";
            } else if (urlOculta) {
                imagenUrl = urlOculta;
            } else if (data.archivoImagen) {
                const base64 = await toBase64(data.archivoImagen);
                const res = await fetch('/api/imagenes/subir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                    body: JSON.stringify({ data: base64 })
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.message);
                imagenUrl = json.url;

                if (data.imgReferencia.length > 0) {
                    await fetch('/api/imagenes/guardar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                        body: JSON.stringify({ url: imagenUrl, tags: data.imgReferencia })
                    });
                }
            } else if (modoEdicion) {
                const original = adminEventos.find(ev => ev._id === idEventoEdicion);
                imagenUrl = original.imagen || "imgBandaGenerica.jpg";
            } else {
                imagenUrl = "imgBandaGenerica.jpg";
            }

            const payload = { ...data, imagen: imagenUrl };
            delete payload.archivoImagen; delete payload.usaGenerica;

            let urlAPI = modoEdicion ? `/api/eventos/modificar/${idEventoEdicion}` : '/api/eventos/crear';
            let methodAPI = modoEdicion ? 'PUT' : 'POST';

            if (!modoEdicion && adminEventos.some(ev => ev.fecha === payload.fecha)) {
                if (!confirm("Ya existe evento en esta fecha. ¿Crear igual?")) {
                    btn.disabled = false; btn.innerHTML = "Guardar Evento"; return;
                }
            }

            const response = await fetch(urlAPI, {
                method: methodAPI,
                headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error servidor");
            alert(modoEdicion ? "Modificado con éxito" : "Creado con éxito");
            
            fetchEventosData();
            resetearFormularioAlta();

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = modoEdicion ? "Guardar Modificaciones" : "Guardar Evento";
        }
    });
}

function renderizarTags() {
    const container = document.getElementById('tag-container');
    if (!container) return;
    container.querySelectorAll('.tag-item').forEach(e => e.remove());
    tags.slice().reverse().forEach(tag => {
        const el = document.createElement('span');
        el.className = 'tag-item';
        el.innerHTML = `${tag} <span class="remove-tag-btn" data-tag="${tag}">&times;</span>`;
        container.prepend(el);
    });
}

function crearCalendarioAlta() {
    const input = document.getElementById('evento-fecha');
    if (!input) return;
    if (picker) { picker.destroy(); picker = null; }
    picker = new Litepicker({
        element: input, format: 'YYYY-MM-DD', lang: 'es-ES',
        buttonText: { previousMonth: '<', nextMonth: '>', reset: 'x', apply: 'Ok' },
        onselected: (date) => {
            if (date.toMillis() < DateTime.now().startOf('day').toMillis()) {
                if (!confirm("Fecha pasada. ¿Seguro?")) picker.clearSelection();
            }
        }
    });
}

function habilitarEdicionTags() {
    const cont = document.getElementById('tag-container');
    const inp = document.getElementById('evento-tags');
    if (cont) cont.classList.remove('disabled');
    if (inp) { inp.disabled = false; inp.placeholder = "Escribe tags..."; }
}
function deshabilitarEdicionTags() {
    const cont = document.getElementById('tag-container');
    const inp = document.getElementById('evento-tags');
    if (cont) cont.classList.add('disabled');
    if (inp) { inp.disabled = true; inp.placeholder = "Tags fijos (Imagen preexistente)"; }
}

function resetearFormularioAlta() {
    const form = document.getElementById('form-alta-evento');
    if (!form) return;
    form.reset();
    tags = [];
    renderizarTags();
    habilitarEdicionTags();
    document.getElementById('fieldset-imagen').disabled = false;
    document.getElementById('evento-titulo').disabled = false;
    document.getElementById('evento-titulo-en').disabled = false; // Reactivar EN
    document.getElementById('evento-descripcion').disabled = false; // Reactivar desc
    document.getElementById('evento-descripcion-en').disabled = false; // Reactivar desc EN
    document.getElementById('evento-imagen-url-seleccionada').value = '';
    
    modoEdicion = false;
    idEventoEdicion = null;
    form.classList.remove('modo-edicion');
    document.getElementById('alta-evento').querySelector('h3').textContent = "Crear Nuevo Evento";
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
    
    const infoImg = document.getElementById('info-img-actual');
    if(infoImg) infoImg.remove();
    
    crearCalendarioAlta();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// PARTE 3
/* --- ADMIN.JS (PARTE 3/3 - FINAL) --- */

function renderizarTags() {
    const container = document.getElementById('tag-container');
    if (!container) return;
    container.querySelectorAll('.tag-item').forEach(e => e.remove());
    tags.slice().reverse().forEach(tag => {
        const el = document.createElement('span');
        el.className = 'tag-item';
        el.innerHTML = `${tag} <span class="remove-tag-btn" data-tag="${tag}">&times;</span>`;
        container.prepend(el);
    });
}

function crearCalendarioAlta() {
    const input = document.getElementById('evento-fecha');
    if (!input) return;
    if (picker) { picker.destroy(); picker = null; }
    picker = new Litepicker({
        element: input, format: 'YYYY-MM-DD', lang: 'es-ES',
        buttonText: { previousMonth: '<', nextMonth: '>', reset: 'x', apply: 'Ok' },
        onselected: (date) => {
            if (date.toMillis() < DateTime.now().startOf('day').toMillis()) {
                if (!confirm("Fecha pasada. ¿Seguro?")) picker.clearSelection();
            }
        }
    });
}

function habilitarEdicionTags() {
    const cont = document.getElementById('tag-container');
    const inp = document.getElementById('evento-tags');
    if (cont) cont.classList.remove('disabled');
    if (inp) { inp.disabled = false; inp.placeholder = "Escribe tags..."; }
}
function deshabilitarEdicionTags() {
    const cont = document.getElementById('tag-container');
    const inp = document.getElementById('evento-tags');
    if (cont) cont.classList.add('disabled');
    if (inp) { inp.disabled = true; inp.placeholder = "Tags fijos (Imagen preexistente)"; }
}

function resetearFormularioAlta() {
    const form = document.getElementById('form-alta-evento');
    if (!form) return;
    form.reset();
    tags = [];
    renderizarTags();
    habilitarEdicionTags();
    document.getElementById('fieldset-imagen').disabled = false;
    document.getElementById('evento-titulo').disabled = false;
    document.getElementById('evento-titulo-en').disabled = false; // Reactivar EN
    document.getElementById('evento-descripcion').disabled = false; // Reactivar desc
    document.getElementById('evento-descripcion-en').disabled = false; // Reactivar desc EN
    document.getElementById('evento-imagen-url-seleccionada').value = '';
    
    modoEdicion = false;
    idEventoEdicion = null;
    form.classList.remove('modo-edicion');
    document.getElementById('alta-evento').querySelector('h3').textContent = "Crear Nuevo Evento";
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
    
    const infoImg = document.getElementById('info-img-actual');
    if(infoImg) infoImg.remove();
    
    crearCalendarioAlta();
}

// ==========================================
// 5. RENDERIZADO Y BÚSQUEDA (EVENTOS)
// ==========================================

async function fetchEventosData() {
    try {
        const res = await fetch('/api/eventos', { headers: { 'Authorization': getAuthToken() }});
        if (!res.ok) throw new Error("Error API Eventos");
        adminEventos = await res.json();
        renderizarResultadosEventos();
    } catch (e) { console.error(e); }
}

function inicializarPanelesBusquedaEventos() {
    const inputs = document.querySelectorAll('.form-busqueda .form-input');
    inputs.forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', renderizarResultadosEventos));
    
    // Delegación de eventos para botones (Modificar / Eliminar)
    const containers = [document.getElementById('mod-resultados-container'), document.getElementById('baja-resultados-container')];
    containers.forEach(c => {
        if(c) c.addEventListener('click', (e) => {
            const btnMod = e.target.closest('.btn-card-modificar');
            const btnDel = e.target.closest('.btn-card-eliminar');
            if (btnMod) prellenarFormularioModEvento(adminEventos.find(ev => ev._id === btnMod.dataset.id));
            if (btnDel) eliminarEvento(adminEventos.find(ev => ev._id === btnDel.dataset.id), btnDel);
        });
    });
}

function renderizarResultadosEventos() {
    const contMod = document.getElementById('mod-resultados-container');
    const contBaja = document.getElementById('baja-resultados-container');
    if (!contMod || !contBaja) return;

    const getVal = (id) => document.getElementById(id)?.value.toLowerCase() || '';
    
    const fMod = { t: getVal('mod-search-titulo'), d: getVal('mod-search-fecha'), k: getVal('mod-search-tipo') };
    const fBaja = { t: getVal('baja-search-titulo'), d: getVal('baja-search-fecha'), k: getVal('baja-search-tipo') };

    // Filtro Seguro
    const filter = (list, f) => list.filter(ev => {
        const tit = (ev.titulo || '').toLowerCase();
        const tipo = (ev.tipoEvento || '').toLowerCase();
        const fecha = ev.fecha || '';
        return (!f.t || tit.includes(f.t)) && (!f.d || fecha === f.d) && (!f.k || tipo === f.k);
    }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    // Generador HTML Seguro
    const htmlSafe = (ev, action) => {
        let img = `<div style="width:80px;height:80px;background:#555;display:flex;align-items:center;justify-content:center;">Sin</div>`;
        if(ev.imagen && ev.imagen.length > 3) {
            const src = ev.imagen.startsWith('http') ? ev.imagen : `../img/${ev.imagen}`;
            img = `<img src="${src}" style="width:80px;height:80px;object-fit:cover;border-radius:5px;">`;
        }
        
        const btnLabel = action === 'modificar' ? 'Modificar' : 'Eliminar';
        const btnClass = action === 'modificar' ? 'modificar' : 'eliminar';
        const btnColor = action === 'modificar' ? 'color:#448AFF;' : 'color:#F44336;';

        return `
        <div class="card-resultado" style="display:flex; gap:1rem; background:#333; color:#fff; padding:1rem; margin-bottom:1rem; border:1px solid #555; border-radius:10px; align-items:center;">
            ${img}
            <div style="flex:1;">
                <h4 style="margin:0; font-size:1.1rem;">${ev.titulo || 'Sin Título'}</h4>
                <p style="margin:5px 0 0; color:#ccc; font-size:0.9rem;">${ev.fecha || 'S/F'} | ${ev.tipoEvento}</p>
            </div>
            <button class="btn btn-card btn-card-${btnClass}" data-id="${ev._id}" style="padding:0.5rem 1rem; cursor:pointer; background:transparent; border:1px solid; border-radius:5px; ${btnColor}">
                ${btnLabel}
            </button>
        </div>`;
    };

    // Renderizar Modificación
    const listMod = filter(adminEventos, fMod);
    contMod.innerHTML = listMod.length ? listMod.map(ev => htmlSafe(ev, 'modificar')).join('') : '<p style="color:#ccc;text-align:center;">Sin resultados</p>';
    // Forzamos estilos para evitar invisibilidad
    contMod.style.display = 'grid'; 
    contMod.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))'; 
    contMod.style.gap = '1rem';

    // Renderizar Baja
    const listBaja = filter(adminEventos, fBaja);
    contBaja.innerHTML = listBaja.length ? listBaja.map(ev => htmlSafe(ev, 'eliminar')).join('') : '<p style="color:#ccc;text-align:center;">Sin resultados</p>';
    contBaja.style.display = 'grid'; 
    contBaja.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))'; 
    contBaja.style.gap = '1rem';
}

function prellenarFormularioModEvento(ev) {
    modoEdicion = true;
    idEventoEdicion = ev._id;
    const form = document.getElementById('form-alta-evento');
    form.classList.add('modo-edicion');
    document.getElementById('alta-evento').querySelector('h3').textContent = "Modificando Evento";
    form.querySelector('.btn-primary').innerHTML = "Guardar Cambios";

    // Datos Básicos
    document.getElementById('evento-fecha').value = ev.fecha;
    document.getElementById('evento-tipo').value = ev.tipoEvento;
    document.getElementById('evento-titulo').value = ev.titulo || '';
    document.getElementById('evento-descripcion').value = ev.descripcion || '';
    
    // Datos Inglés
    document.getElementById('evento-titulo-en').value = ev.titulo_en || ev.titulo || '';
    document.getElementById('evento-descripcion-en').value = ev.descripcion_en || ev.descripcion || '';
    
    // Links
    document.getElementById('evento-live').value = ev.live || '';
    document.getElementById('evento-concierto').value = ev.concierto || '';

    // Checkbox Mismo Contenido
    const checkMismo = document.getElementById('evento-mismo-contenido');
    if(checkMismo) {
        // Si son iguales o si el inglés estaba vacío (migración), marcamos check
        const esIgual = (ev.titulo === (ev.titulo_en || ev.titulo)) && (ev.descripcion === (ev.descripcion_en || ev.descripcion));
        checkMismo.checked = esIgual;
        checkMismo.dispatchEvent(new Event('change'));
    }

    // Calendario
    if (picker) picker.destroy();
    crearCalendarioAlta();
    setTimeout(() => { if(picker) picker.setDate(ev.fecha); }, 100);

    // Tags e Imagen
    tags = ev.imgReferencia || [];
    renderizarTags();
    
    const checkGen = document.getElementById('evento-img-generica');
    const fieldset = document.getElementById('fieldset-imagen');
    const infoOld = document.getElementById('info-img-actual');
    if(infoOld) infoOld.remove();

    document.getElementById('evento-tipo').dispatchEvent(new Event('change')); // Refresca estado de inputs según tipo

    // Solo gestionamos imagen si no es Cerrado/Privado (que ya lo maneja el dispatchEvent)
    if (!['Cerrado', 'Privado'].includes(ev.tipoEvento)) {
        if(ev.imagen === 'imgBandaGenerica.jpg') {
            checkGen.checked = true;
            fieldset.disabled = true;
        } else {
            checkGen.checked = false;
            fieldset.disabled = false;
            deshabilitarEdicionTags();
            const urlImg = ev.imagen.startsWith('http') ? ev.imagen : `../img/${ev.imagen}`;
            fieldset.insertAdjacentHTML('afterbegin', `
                <div id="info-img-actual" class="info-imagen-actual">
                    <strong>Imagen Actual:</strong> <a href="${urlImg}" target="_blank" style="color:#FFC107;">Ver Imagen</a>
                    <br><small>Sube un archivo nuevo para reemplazarla.</small>
                </div>`);
        }
    }

    document.querySelector('.tab-link[data-tab="alta-evento"]').click();
    form.scrollIntoView({behavior: "smooth"});
}

async function eliminarEvento(ev, btn) {
    if(!confirm(`¿Eliminar "${ev.titulo || ev.tipoEvento}" del ${ev.fecha}?`)) return;
    btn.disabled = true;
    btn.innerHTML = "...";
    try {
        await fetch(`/api/eventos/eliminar/${ev._id}`, { method: 'DELETE', headers: {'Authorization': getAuthToken()} });
        alert("Evento eliminado correctamente.");
        fetchEventosData();
    } catch(e) { 
        console.error(e); 
        alert("Error al eliminar.");
        btn.disabled = false;
        btn.innerHTML = "Eliminar";
    }
}

// ==========================================
// 6. GESTIÓN DE CARTA (COMPLETO)
// ==========================================

function inicializarFormularioCarta() {
    const container = document.getElementById('smart-form-container');
    const form = document.getElementById('form-alta-producto');
    const sel = document.getElementById('producto-tipo');
    const btnActions = document.getElementById('form-actions-producto');
    const btnPreview = document.getElementById('btn-preview-producto'); // Referencia al botón

    // 1. Inyectar Plantillas
    if (container.children.length === 0) {
        for (const t in plantillasFormCarta) {
            const div = document.createElement('div');
            div.id = `fields-${t.startsWith('vino')?'vino':t}`;
            div.className = 'form-fields-group';
            div.innerHTML = plantillasFormCarta[t.startsWith('vino')?'vino':t];
            container.appendChild(div);
        }
    }
    
    // --- FUNCIÓN HELPER PARA VISIBILIDAD DEL BOTÓN PREVIEW ---
    const actualizarBotonPreview = () => {
        const tipo = sel.value;
        const tipoKey = tipo.startsWith('vino') ? 'vino' : tipo;
        const target = document.getElementById(`fields-${tipoKey}`);
        let mostrarBoton = false;

        if (tipoKey === 'coctel') {
            // Solo si el toggle "Mostrar Imagen" está activo
            const toggle = target.querySelector('#producto-mostrar-imagen');
            if (toggle && toggle.checked) mostrarBoton = true;
        } else if (tipoKey === 'vino') {
            // Solo si el toggle "Destacado" está activo
            const toggle = target.querySelector('#producto-destacado');
            if (toggle && toggle.checked) mostrarBoton = true;
        }
        // Cervezas, Destilados, Sin Alcohol -> Siempre false

        if (btnPreview) btnPreview.style.display = mostrarBoton ? 'inline-flex' : 'none';
    };

    // 2. Listener Tipo
    sel.addEventListener('change', () => {
        document.querySelectorAll('.form-fields-group').forEach(g => g.classList.remove('visible'));
        const tipoKey = sel.value.startsWith('vino') ? 'vino' : sel.value;
        const target = document.getElementById(`fields-${tipoKey}`);
        
        if(target) {
            target.classList.add('visible');
            activarLogicaBilingue(target);
            btnActions.style.display = 'block';

            // A. Lógica Cóctel
            if (tipoKey === 'coctel') {
                const toggle = target.querySelector('#producto-mostrar-imagen');
                const area = target.querySelector('#contenedor-imagen-coctel');
                if(toggle && area) {
                    const newT = toggle.cloneNode(true);
                    toggle.parentNode.replaceChild(newT, toggle);
                    
                    newT.addEventListener('change', () => {
                        area.style.display = newT.checked ? 'block' : 'none';
                        actualizarBotonPreview(); // Chequear botón al cambiar
                    });
                    newT.dispatchEvent(new Event('change'));
                }
            }

            // B. Lógica Vino
            if (tipoKey === 'vino') {
                const toggleVino = target.querySelector('#producto-destacado');
                const areaVino = target.querySelector('#contenedor-imagen-vino');
                if(toggleVino && areaVino) {
                    const newTV = toggleVino.cloneNode(true);
                    toggleVino.parentNode.replaceChild(newTV, toggleVino);
                    
                    newTV.addEventListener('change', () => {
                        areaVino.style.display = newTV.checked ? 'block' : 'none';
                        actualizarBotonPreview(); // Chequear botón al cambiar
                    });
                    newTV.dispatchEvent(new Event('change'));
                }
            }
            
            actualizarBotonPreview(); // Chequear al cambiar de tipo

        } else {
            btnActions.style.display = 'none';
        }
    });

    // 3. Submit (Sin Cambios)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = sel.value;
        const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;
        const formGroup = document.getElementById(`fields-${tipoPlantilla}`);
        const btn = form.querySelector('.btn-primary');
        
        const inputsEN = formGroup.querySelectorAll('.lang-content[data-lang-content="en"] [required]');
        for (const i of inputsEN) {
            if (!i.value.trim()) {
                alert("Faltan campos en Inglés");
                formGroup.querySelector('.lang-tab-btn[data-lang="en"]').click();
                i.focus();
                return;
            }
        }

        btn.disabled = true;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Procesando...";

        try {
            const { producto_es, producto_en } = recolectarDatosProducto(formGroup, tipo);
            
            let imgUrl = producto_es.imagen; 
            // Subir solo si hay archivo Y (es destacado O quiere mostrar imagen)
            const debeSubir = (producto_es.destacado || producto_es.mostrarImagen) && producto_es.archivoImagen;

            if (debeSubir) {
                const b64 = await toBase64(producto_es.archivoImagen);
                const res = await fetch('/api/imagenes/subir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                    body: JSON.stringify({ data: b64 })
                });
                const json = await res.json();
                if(!json.success) throw new Error(json.message);
                imgUrl = json.url;
            } else if (modoEdicion) {
                const orig = adminProductos.find(p => p._id === idProductoEdicion);
                imgUrl = orig ? orig.imagen : null;
            }

            producto_es.imagen = imgUrl;
            producto_en.imagen = imgUrl;
            delete producto_es.archivoImagen; delete producto_en.archivoImagen;

            const url = modoEdicion ? `/api/productos/modificar/${idProductoEdicion}` : '/api/productos/crear';
            const method = modoEdicion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                body: JSON.stringify({ producto_es, producto_en })
            });

            if (!res.ok) throw new Error("Error servidor");
            alert(modoEdicion ? "Guardado con éxito" : "Creado con éxito");
            
            fetchProductosData();
            resetearFormularioCarta();

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = "Guardar Producto";
        }
    });
}

function activarLogicaBilingue(group) {
    // Tabs
    group.querySelectorAll('.lang-tab-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            group.querySelectorAll('.lang-tab-btn').forEach(b => b.classList.remove('active'));
            group.querySelectorAll('.lang-content').forEach(c => c.classList.remove('active'));
            newBtn.classList.add('active');
            group.querySelector(`.lang-content[data-lang-content="${newBtn.dataset.lang}"]`).classList.add('active');
        });
    });
    // Translate Button (Placeholder por ahora)
    const btnTrans = group.querySelector('.btn-translate');
}

function recolectarDatosProducto(formGroup, tipo) {
    const fileInp = formGroup.querySelector('input[type="file"]');
    // Capturamos el toggle
    const toggle = formGroup.querySelector('#producto-mostrar-imagen');
    
    const unicos = {
        tipo: tipo,
        visualizacion: true,
        destacado: formGroup.querySelector('#producto-destacado')?.checked || false,
        // Si existe el toggle, usamos su valor. Si no (vinos), true por defecto.
        mostrarImagen: toggle ? toggle.checked : true, 
        
        precioCopa: parseFloat(formGroup.querySelector('#producto-precio-copa')?.value) || null,
        precioBotella: parseFloat(formGroup.querySelector('#producto-precio-botella')?.value) || null,
        precioCana: parseFloat(formGroup.querySelector('#producto-precio-cana')?.value) || null,
        precioPinta: parseFloat(formGroup.querySelector('#producto-precio-pinta')?.value) || null,
        abv: parseFloat(formGroup.querySelector('#producto-abv')?.value) || null,
        ibu: parseInt(formGroup.querySelector('#producto-ibu')?.value) || null,
        productor: formGroup.querySelector('#producto-productor')?.value || null,
        ano: formGroup.querySelector('#producto-ano')?.value || null,
        archivoImagen: fileInp?.files[0] || null,
        imagen: null
    };
    
    const es = { ...unicos,
        titulo: formGroup.querySelector('#producto-titulo-es')?.value || formGroup.querySelector('#producto-titulo')?.value || '',
        descripcion: formGroup.querySelector('#producto-descripcion-es')?.value || '',
        region: formGroup.querySelector('#producto-region-es')?.value || null,
        pais: formGroup.querySelector('#producto-pais-es')?.value || null,
        varietal: formGroup.querySelector('#producto-varietal-es')?.value || null,
        crianza: formGroup.querySelector('#producto-crianza-es')?.value || null
    };
    const en = { ...unicos,
        titulo: formGroup.querySelector('#producto-titulo-en')?.value || formGroup.querySelector('#producto-titulo')?.value || '',
        descripcion: formGroup.querySelector('#producto-descripcion-en')?.value || '',
        region: formGroup.querySelector('#producto-region-en')?.value || null,
        pais: formGroup.querySelector('#producto-pais-en')?.value || null,
        varietal: formGroup.querySelector('#producto-varietal-en')?.value || null,
        crianza: formGroup.querySelector('#producto-crianza-en')?.value || null
    };

    return { producto_es: es, producto_en: en };
}

function resetearFormularioCarta() {
    const form = document.getElementById('form-alta-producto');
    if(form) form.reset();
    modoEdicion = false;
    idProductoEdicion = null;
    document.getElementById('form-actions-producto').style.display = 'none';
    document.querySelectorAll('.form-fields-group').forEach(g => g.classList.remove('visible'));
    if(document.getElementById('info-img-actual-prod')) document.getElementById('info-img-actual-prod').remove();
    
    const btnSubmit = form.querySelector('.btn-primary');
    if(btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = "<i class='bx bxs-save'></i> Guardar Producto"; }

    document.querySelectorAll('.lang-tab-btn[data-lang="es"]').forEach(b => b.click());
    
    const tab = document.querySelector('.tab-link[data-tab="alta-producto"]');
    if(tab) {
        tab.click();
        document.getElementById('alta-producto-titulo').textContent = "Crear Nuevo Producto";
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchProductosData() {
    try {
        const res = await fetch('/api/productos', { headers: { 'Authorization': getAuthToken() }});
        if(!res.ok) throw new Error("Error API Productos");
        const data = await res.json();
        adminProductos = data.es.productos || [];
        adminProductos_EN = data.en.productos || [];
        renderizarResultadosProductos();
    } catch(e) { console.error(e); }
}

function inicializarPanelesBusquedaProductos() {
    const container = document.getElementById('prod-resultados-container');
    const inputs = document.querySelectorAll('#form-busqueda-producto .form-input');
    if(!container) return;
    
    inputs.forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', renderizarResultadosProductos));
    
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-card-modificar');
        if(btn) prellenarFormularioCarta(adminProductos.find(p => p._id === btn.dataset.id));
    });
    
    // Smart Switch Visibilidad
    container.addEventListener('change', async (e) => {
        if (e.target.matches('.visibility-switch input')) {
            const id = e.target.dataset.id;
            const checked = e.target.checked;
            const card = e.target.closest('.card-resultado');
            e.target.disabled = true;
            card.style.opacity = '0.5';

            try {
                await fetch(`/api/productos/visibilidad/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
                    body: JSON.stringify({ visualizacion: checked })
                });
                adminProductos.find(p => p._id === id).visualizacion = checked;
                card.classList.toggle('deshabilitado', !checked);
            } catch(err) {
                e.target.checked = !checked;
                alert("Error al cambiar visibilidad");
            } finally {
                e.target.disabled = false;
                card.style.opacity = '1';
            }
        }
    });
}

function renderizarResultadosProductos() {
    const cont = document.getElementById('prod-resultados-container');
    if(!cont) return;
    
    const titulo = document.getElementById('prod-search-titulo').value.toLowerCase();
    const tipo = document.getElementById('prod-search-tipo').value;
    
    const list = adminProductos.filter(p => 
        (!titulo || p.titulo.toLowerCase().includes(titulo)) &&
        (!tipo || p.tipo === tipo)
    );
    
    cont.innerHTML = list.length ? list.map(p => crearTarjetaResultadoProducto(p)).join('') : '<p style="text-align:center;color:#ccc;">Sin resultados</p>';
}

function crearTarjetaResultadoProducto(p) {
    // LÓGICA VISUAL: Si tiene imagen, úsala. Si no, usa la genérica.
    // (Esto no guarda nada en la BD, solo afecta cómo se ve aquí)
    let srcImagen = '../img/bebidaSinFoto.jpg'; // Default
    
    if (p.imagen && p.imagen !== 'bebidaSinFoto.jpg' && p.imagen.trim() !== '') {
        srcImagen = p.imagen.startsWith('http') ? p.imagen : `../img/${p.imagen}`;
    }
    
    const checked = p.visualizacion !== false ? 'checked' : '';
    const disabledClass = p.visualizacion === false ? 'deshabilitado' : '';

    return `
    <div class="card-resultado ${disabledClass}" style="margin-bottom:1rem;">
        <div class="card-resultado-header" style="display:flex;gap:10px;padding:10px;">
            <img src="${srcImagen}" style="width:80px;height:80px;object-fit:cover;border-radius:5px;">
            <div style="overflow:hidden;">
                <h4 style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.titulo}</h4>
                <p style="margin:5px 0 0;color:#ccc;font-size:0.9rem;">${p.tipo} | ${formatarPrecio(p.precioCopa || p.precioBotella)}</p>
            </div>
        </div>
        <div class="card-resultado-footer" style="padding:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #444;">
            <button class="btn btn-card btn-card-modificar" data-id="${p._id}" style="padding:5px 10px;">Modificar</button>
            <div class="visibility-switch">
                <label class="switch">
                    <input type="checkbox" data-id="${p._id}" ${checked}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    </div>`;
}

function prellenarFormularioCarta(p) {
    modoEdicion = true;
    idProductoEdicion = p._id;
    const sel = document.getElementById('producto-tipo');
    sel.value = p.tipo;
    sel.dispatchEvent(new Event('change'));
    
    const formGroup = document.querySelector('.form-fields-group.visible');
    
    // Mapeo de campos
    const mapFields = {
        '#producto-titulo': p.titulo,
        '#producto-titulo-es': p.titulo,
        '#producto-precio-copa': p.precioCopa,
        '#producto-precio-botella': p.precioBotella,
        '#producto-precio-cana': p.precioCana,
        '#producto-precio-pinta': p.precioPinta,
        '#producto-productor': p.productor,
        '#producto-ano': p.ano,
        '#producto-abv': p.abv,
        '#producto-ibu': p.ibu,
        '#producto-descripcion-es': p.descripcion,
        '#producto-region-es': p.region,
        '#producto-pais-es': p.pais,
        '#producto-varietal-es': p.varietal,
        '#producto-crianza-es': p.crianza
    };

    for (const [sel, val] of Object.entries(mapFields)) {
        const el = formGroup.querySelector(sel);
        if(el && val !== null) el.value = val;
    }

    // --- LÓGICA DE IMAGENES (Vinos y Cócteles) ---
    const msgImg = formGroup.querySelector('#msg-imagen-existente');
    const tieneFoto = (p.imagen && p.imagen !== 'bebidaSinFoto.jpg');
    const urlVer = tieneFoto ? (p.imagen.startsWith('http') ? p.imagen : `../img/${p.imagen}`) : null;

    // A. Caso Cóctel (Toggle mostrarImagen)
    const toggleCoctel = formGroup.querySelector('#producto-mostrar-imagen');
    if (toggleCoctel) {
        toggleCoctel.checked = (p.mostrarImagen !== undefined) ? p.mostrarImagen : tieneFoto;
        toggleCoctel.dispatchEvent(new Event('change'));
    }

    // B. Caso Vino (Toggle Destacado)
    const toggleVino = formGroup.querySelector('#producto-destacado');
    if (toggleVino) {
        toggleVino.checked = p.destacado || false;
        toggleVino.dispatchEvent(new Event('change'));
    }

    // Mostrar mensaje de imagen existente (común para ambos)
    if (msgImg && tieneFoto) {
        msgImg.style.display = 'block';
        msgImg.innerHTML = `Imagen actual guardada: <a href="${urlVer}" target="_blank" style="color:#FFC107;">Ver Imagen</a>`;
    } else if (msgImg) {
        msgImg.style.display = 'none';
    }

    // Datos EN
    const p_en = adminProductos_EN.find(en => en._id === p._id);
    if(p_en) {
        const mapFieldsEN = {
            '#producto-titulo-en': p_en.titulo,
            '#producto-descripcion-en': p_en.descripcion,
            '#producto-region-en': p_en.region,
            '#producto-pais-en': p_en.pais,
            '#producto-varietal-en': p_en.varietal,
            '#producto-crianza-en': p_en.crianza
        };
        for (const [sel, val] of Object.entries(mapFieldsEN)) {
            const el = formGroup.querySelector(sel);
            if(el && val !== null) el.value = val;
        }
    }

    document.querySelector('.tab-link[data-tab="alta-producto"]').click();
    document.getElementById('form-alta-producto').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('alta-producto-titulo').textContent = `Modificando: ${p.titulo}`;
    document.getElementById('form-alta-producto').querySelector('.btn-primary').innerHTML = "Guardar Cambios";
}

// ==========================================
// 7. MODAL IMÁGENES
// ==========================================
function inicializarModalImagenes() {
    const modal = document.getElementById('modal-imagenes');
    const btn = document.getElementById('btn-elegir-img');
    const close = document.getElementById('cerrar-modal-imagenes');
    const container = document.getElementById('resultados-imagenes');
    
    if(btn) btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        buscarImagenes('');
    });
    if(close) close.addEventListener('click', () => modal.style.display = 'none');
    
    if(container) container.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if(img) {
            document.getElementById('evento-imagen-url-seleccionada').value = img.dataset.url;
            document.getElementById('evento-imagen-upload').value = '';
            tags = img.dataset.tags.split(',');
            renderizarTags();
            deshabilitarEdicionTags();
            modal.style.display = 'none';
            
            const fs = document.getElementById('fieldset-imagen');
            const old = document.getElementById('info-img-actual');
            if(old) old.remove();
            fs.insertAdjacentHTML('afterbegin', `<div id="info-img-actual" class="info-imagen-actual" style="border-color:#4CAF50;"><strong style="color:#4CAF50;">Imagen Vinculada</strong></div>`);
        }
    });
    
    const search = document.getElementById('search-tags-modal');
    if(search) search.addEventListener('input', (e) => {
        setTimeout(() => buscarImagenes(e.target.value), 500);
    });
}

async function buscarImagenes(q) {
    const res = await fetch(`/api/imagenes?q=${q}`, { headers: {'Authorization': getAuthToken()}});
    const data = await res.json();
    const html = data.imagenes.map(i => `
        <div style="margin:5px;cursor:pointer;display:inline-block;text-align:center;">
            <img src="${i.url}" data-url="${i.url}" data-tags="${i.tags.join(',')}" style="width:100px;height:100px;object-fit:cover;border-radius:5px;border:2px solid #444;">
            <div style="font-size:0.7rem;color:#aaa;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.tags[0]}</div>
        </div>`).join('');
    document.getElementById('resultados-imagenes').innerHTML = html || '<p style="text-align:center;color:#888;">Sin resultados</p>';
}

// =========================================================
// 8. GESTIÓN DE CONTENIDO WEB (GALERÍA) - NUEVO MÓDULO
// =========================================================

let imagenesGaleria = []; // Estado local de las fotos

// Inicializador (Llamar en el DOMContentLoaded)
function inicializarGestorWeb() {
    const btnSubir = document.getElementById('btn-nueva-foto-galeria');
    const inputSubir = document.getElementById('input-foto-galeria');

    // Listener para botón de subir
    if (btnSubir && inputSubir) {
        btnSubir.addEventListener('click', () => inputSubir.click());
        
        inputSubir.addEventListener('change', async () => {
            if (inputSubir.files.length > 0) {
                await subirYAgregarFoto(inputSubir.files[0]);
                inputSubir.value = ''; // Reset
            }
        });
    }

    // Cargar las fotos al iniciar
    fetchContenidoGaleria();
}

// 1. Traer datos de MongoDB (CORREGIDA)
async function fetchContenidoGaleria() {
    try {
        const res = await fetch('/api/contenido/home'); 
        const data = await res.json();
        
        // CORRECCIÓN: Quitamos el .datos intermedio
        if (data.es && data.es.galeria) {
            imagenesGaleria = data.es.galeria.imagenes || [];
            renderizarGaleriaAdmin();
        } else {
            // Si no hay galería, inicializamos vacío
            imagenesGaleria = [];
            renderizarGaleriaAdmin();
        }
    } catch (error) {
        console.error("Error cargando galería:", error);
        document.getElementById('galeria-grid').innerHTML = '<p>Error al cargar.</p>';
    }
}

// 2. Renderizar (Pintar) las fotos en el Admin
function renderizarGaleriaAdmin() {
    const grid = document.getElementById('galeria-grid');
    if (!grid) return;

    if (imagenesGaleria.length === 0) {
        grid.innerHTML = '<p style="color:#ccc;">No hay imágenes en el carrusel.</p>';
        return;
    }

    grid.innerHTML = imagenesGaleria.map((url, index) => {
        // Detectar si es URL completa o local
        const src = url.startsWith('http') ? url : `../img/${url}`;
        
        return `
        <div class="galeria-item" style="position: relative; border: 1px solid #444; border-radius: 8px; overflow: hidden; aspect-ratio: 16/9;">
            <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
            
            <button onclick="eliminarFotoGaleria(${index})" 
                    style="position: absolute; top: 5px; right: 5px; background: rgba(200,0,0,0.8); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 5px;">
                <i class='bx bxs-trash'></i>
            </button>
        </div>`;
    }).join('');
}

// 3. Subir a Cloudinary y Guardar en Mongo
async function subirYAgregarFoto(file) {
    const btn = document.getElementById('btn-nueva-foto-galeria');
    const txtOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Subiendo...";

    try {
        // A. Subir a Cloudinary
        const base64 = await toBase64(file);
        const resCloud = await fetch('/api/imagenes/subir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
            body: JSON.stringify({ data: base64 })
        });
        const dataCloud = await resCloud.json();
        if (!dataCloud.success) throw new Error("Falló subida a Cloudinary");

        // B. Agregar al array local
        imagenesGaleria.push(dataCloud.url);

        // C. Guardar cambios en MongoDB
        await guardarCambiosGaleria();
        
        renderizarGaleriaAdmin();
        alert("Imagen subida y guardada correctamente.");

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = txtOriginal;
    }
}

// 4. Eliminar foto
window.eliminarFotoGaleria = async function(index) {
    if (!confirm("¿Seguro que quieres eliminar esta foto del carrusel?")) return;

    imagenesGaleria.splice(index, 1); // Quitar del array
    renderizarGaleriaAdmin(); // Actualizar vista rapido
    
    try {
        await guardarCambiosGaleria(); // Guardar en BD
    } catch (error) {
        alert("Error al guardar el cambio en la base de datos.");
        fetchContenidoGaleria(); // Revertir si falló
    }
};

// 5. Guardar en MongoDB (Actualiza ES y EN) (CORREGIDA)
async function guardarCambiosGaleria() {
    // Paso 1: Traer el objeto HOME actual de la BD
    const res = await fetch('/api/contenido/home');
    const data = await res.json();
    
    if (!data.es || !data.en) throw new Error("No se pudo leer la configuración actual.");

    // Paso 2: Actualizar SOLO el array de imágenes
    // CORRECCIÓN: Quitamos el .datos intermedio aquí también
    const homeES = data.es;
    const homeEN = data.en;

    // Aseguramos que exista la estructura
    if (!homeES.galeria) homeES.galeria = {};
    if (!homeEN.galeria) homeEN.galeria = {};

    homeES.galeria.imagenes = imagenesGaleria;
    homeEN.galeria.imagenes = imagenesGaleria; 

    // Paso 3: Enviar actualizaciones
    const p1 = fetch('/api/contenido/modificar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
        body: JSON.stringify({ uid: 'home_es', datos: homeES })
    });

    const p2 = fetch('/api/contenido/modificar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
        body: JSON.stringify({ uid: 'home_en', datos: homeEN })
    });

    await Promise.all([p1, p2]);
}

// =========================================================
// 9. GESTIÓN DE TEXTOS Y BACKUPS (NUEVO MÓDULO)
// =========================================================

let textosCache = { es: null, en: null };

// Inicializar al cargar la página
function inicializarGestorTextos() {
    const selectorIdioma = document.getElementById('texto-idioma-select');
    const formTextos = document.getElementById('form-textos-web');
    const btnHistorial = document.getElementById('btn-ver-historial');
    
    // Cargar textos iniciales
    cargarTextosParaEdicion('home_es'); // Por defecto ES

    // Cambio de idioma en el selector
    if(selectorIdioma) {
        selectorIdioma.addEventListener('change', (e) => {
            cargarTextosParaEdicion(e.target.value);
        });
    }

    // Guardar Cambios
    if(formTextos) {
        formTextos.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarTextosEditados();
        });
    }

    // Botón Historial
    if(btnHistorial) {
        btnHistorial.addEventListener('click', (e) => {
            e.preventDefault();
            const uid = selectorIdioma.value;
            abrirModalHistorial(uid);
        });
    }

    // Botón Cerrar Modal Historial
    document.getElementById('cerrar-modal-backups')?.addEventListener('click', () => {
        document.getElementById('modal-backups').style.display = 'none';
    });
}

// Cargar textos desde la API y llenar el formulario (CORREGIDA)
async function cargarTextosParaEdicion(uid) {
    const form = document.getElementById('form-textos-web');
    if(!form) return;

    form.style.opacity = '0.5';
    
    try {
        const res = await fetch('/api/contenido/home');
        const data = await res.json();
        
        // CORRECCIÓN: Quitamos .datos porque la API ya devuelve el objeto plano
        textosCache.es = data.es || {};
        textosCache.en = data.en || {};

        const datos = (uid === 'home_es') ? textosCache.es : textosCache.en;
        
        // Si el objeto está vacío, es que no cargó bien o no existe
        if (Object.keys(datos).length === 0) {
            console.warn("Datos vacíos para", uid);
        }

        // Mapear campos
        document.getElementById('txt-hero-titulo').value = datos.hero?.titulo || '';
        document.getElementById('txt-hero-subtitulo').value = datos.hero?.subtitulo || '';
        
        document.getElementById('txt-historia-titulo').value = datos.historia?.titulo || '';
        document.getElementById('txt-historia-texto').value = datos.historia?.texto || '';
        
        document.getElementById('txt-parallax-titulo').value = datos.parallax?.titulo || '';
        document.getElementById('txt-news-titulo').value = datos.newsletter?.titulo || '';
        document.getElementById('txt-news-subtitulo').value = datos.newsletter?.subtitulo || '';
        
        document.getElementById('txt-ubicacion-titulo').value = datos.ubicacion?.titulo || '';
        document.getElementById('txt-ubicacion-subtitulo').value = datos.ubicacion?.subtitulo || '';
        document.getElementById('txt-ubicacion-texto').value = datos.ubicacion?.texto || '';

    } catch (error) {
        console.error("Error cargando textos:", error);
    } finally {
        form.style.opacity = '1';
    }
}

// Guardar (CORREGIDA)
async function guardarTextosEditados() {
    const uid = document.getElementById('texto-idioma-select').value;
    const btn = document.querySelector('#form-textos-web .btn-primary');
    
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";

    try {
        // Recuperamos la base
        const datosBase = (uid === 'home_es') ? textosCache.es : textosCache.en;
        
        // Aseguramos que existan los sub-objetos para no dar error de null
        if(!datosBase.hero) datosBase.hero = {};
        if(!datosBase.historia) datosBase.historia = {};
        if(!datosBase.parallax) datosBase.parallax = {};
        if(!datosBase.newsletter) datosBase.newsletter = {};
        if(!datosBase.ubicacion) datosBase.ubicacion = {};

        // Actualizamos valores
        datosBase.hero.titulo = document.getElementById('txt-hero-titulo').value;
        datosBase.hero.subtitulo = document.getElementById('txt-hero-subtitulo').value;
        
        datosBase.historia.titulo = document.getElementById('txt-historia-titulo').value;
        datosBase.historia.texto = document.getElementById('txt-historia-texto').value;
        
        datosBase.parallax.titulo = document.getElementById('txt-parallax-titulo').value;
        datosBase.newsletter.titulo = document.getElementById('txt-news-titulo').value;
        datosBase.newsletter.subtitulo = document.getElementById('txt-news-subtitulo').value;
        
        datosBase.ubicacion.titulo = document.getElementById('txt-ubicacion-titulo').value;
        datosBase.ubicacion.subtitulo = document.getElementById('txt-ubicacion-subtitulo').value;
        datosBase.ubicacion.texto = document.getElementById('txt-ubicacion-texto').value;

        // Enviar al servidor
        const res = await fetch('/api/contenido/modificar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
            body: JSON.stringify({ uid: uid, datos: datosBase })
        });

        if (!res.ok) throw new Error("Error al guardar");
        
        alert("¡Textos actualizados correctamente! (Backup creado)");
        
        // Recargamos para verificar
        cargarTextosParaEdicion(uid);

    } catch (error) {
        console.error(error);
        alert("Error al guardar cambios.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bxs-save'></i> Guardar Cambios de Texto";
    }
}

// Lógica del Modal Historial
async function abrirModalHistorial(uid) {
    const modal = document.getElementById('modal-backups');
    const lista = document.getElementById('lista-backups');
    
    modal.style.display = 'flex';
    lista.innerHTML = '<p style="text-align:center;">Buscando copias de seguridad...</p>';

    try {
        const res = await fetch(`/api/contenido/backups/${uid}`, { 
            headers: { 'Authorization': getAuthToken() }
        });
        const data = await res.json();

        if (!data.backups || data.backups.length === 0) {
            lista.innerHTML = '<p style="text-align:center;">No hay historial para este idioma.</p>';
            return;
        }

        lista.innerHTML = data.backups.map(backup => {
            const fecha = DateTime.fromISO(backup.fecha_modificacion).toFormat('dd/MM/yyyy HH:mm');
            // Creamos un blob para descargar el JSON
            const jsonString = JSON.stringify(backup.datos_anteriores, null, 2);
            const blob = new Blob([jsonString], { type: "text/plain" });
            const urlDescarga = URL.createObjectURL(blob);
            const nombreArchivo = `backup_${uid}_${fecha.replace(/[\/:\s]/g, '-')}.txt`;

            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #444;">
                <div>
                    <strong>${fecha} hs</strong>
                    <br><small style="color:#aaa;">Versión anterior</small>
                </div>
                <a href="${urlDescarga}" download="${nombreArchivo}" class="btn btn-secondary" style="font-size:0.8rem; padding:5px 10px;">
                    <i class='bx bxs-download'></i> Descargar .txt
                </a>
            </div>`;
        }).join('');

    } catch (error) {
        lista.innerHTML = '<p style="color:red; text-align:center;">Error al cargar historial.</p>';
    }
}

// Función UI para colapsar secciones del formulario
window.toggleSection = function(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');
    if (content.style.display === "none") {
        content.style.display = "block";
        icon.classList.replace('bx-chevron-right', 'bx-chevron-down');
    } else {
        content.style.display = "none";
        icon.classList.replace('bx-chevron-down', 'bx-chevron-right');
    }
};

// ==========================================
// 10. VISTA PREVIA (PREVIEW)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Listeners para botones de preview
    const btnPrevEvento = document.getElementById('btn-preview-evento');
    const btnPrevProd = document.getElementById('btn-preview-producto');
    const modalPrev = document.getElementById('modal-preview');
    const cerrarPrev = document.getElementById('cerrar-modal-preview');

    if(btnPrevEvento) btnPrevEvento.addEventListener('click', () => generarPreview('evento'));
    if(btnPrevProd) btnPrevProd.addEventListener('click', () => generarPreview('producto'));
    
    if(cerrarPrev) cerrarPrev.addEventListener('click', () => {
        modalPrev.style.display = 'none';
    });
});

async function generarPreview(tipo) {
    const container = document.getElementById('preview-container');
    const modal = document.getElementById('modal-preview');
    container.innerHTML = '<p style="text-align:center">Generando...</p>';
    modal.style.display = 'flex';

    if (tipo === 'evento') {
        // ... (Lógica de eventos existente, mantenla igual o copia del bloque anterior) ...
        const titulo = document.getElementById('evento-titulo').value || 'Título del Evento';
        const fecha = document.getElementById('evento-fecha').value || '2025-01-01';
        const desc = document.getElementById('evento-descripcion').value || 'Descripción del evento...';
        const imgUrlHidden = document.getElementById('evento-imagen-url-seleccionada').value;
        const imgInput = document.getElementById('evento-imagen-upload');
        
        let imgSrc = '../img/imgBandaGenerica.jpg';
        if (imgInput.files && imgInput.files[0]) imgSrc = await toBase64(imgInput.files[0]);
        else if (imgUrlHidden) imgSrc = imgUrlHidden;

        container.innerHTML = `
            <div style="background: #222; border-radius: 10px; overflow: hidden; max-width: 400px; margin: 0 auto; border: 1px solid #444; position: relative; min-height: 450px; display: flex; flex-direction: column;">
                <div style="height: 250px; overflow: hidden;">
                    <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 1rem; text-align: center; flex-grow: 1; display: flex; flex-direction: column; align-items: center;">
                    <h3 style="color: #fff; margin-bottom: 0.5rem;">${titulo}</h3>
                    <p style="color: #ccc; font-size: 0.9rem;">${desc}</p>
                    <div style="margin-top: auto; width: 100%;">
                        <button style="background: #B71C1C; color: white; border: none; padding: 10px 20px; width: 100%; border-radius: 4px; text-transform: uppercase; font-weight: bold;">Reservar</button>
                    </div>
                </div>
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem;">
                    ${DateTime.fromISO(fecha).toFormat('dd LLLL')}
                </div>
            </div>`;

    } else if (tipo === 'producto') {
        const formGroup = document.querySelector('.form-fields-group.visible');
        if(!formGroup) return;

        const titulo = formGroup.querySelector('#producto-titulo')?.value || 'Nombre Producto';
        const desc = formGroup.querySelector('#producto-descripcion-es')?.value || 'Descripción...';
        const precio = formGroup.querySelector('#producto-precio-copa')?.value || formGroup.querySelector('#producto-precio-botella')?.value || '10';
        const imgInput = formGroup.querySelector('#producto-imagen-upload');
        
        let imgSrc = 'img/bebidaSinFoto.jpg';
        if (imgInput && imgInput.files && imgInput.files[0]) {
            imgSrc = await toBase64(imgInput.files[0]);
        } else if (modoEdicion && idProductoEdicion) {
             const orig = adminProductos.find(p => p._id === idProductoEdicion);
             if (orig && orig.imagen) imgSrc = orig.imagen.startsWith('http') ? orig.imagen : `../img/${orig.imagen}`;
        }

        // ESTILO CARD / BANNER (Coctel o Vino)
        container.innerHTML = `
            <div style="display: flex; flex-direction: row; width: 100%; max-width: 500px; margin: 0 auto; background: #1a1a1a; border-bottom: 1px solid #333; min-height: 200px; border: 1px solid #444; overflow: hidden; border-radius: 8px;">
                
                <div style="width: 50%; position: relative; overflow: hidden;">
                    <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 40%; background: linear-gradient(to right, transparent, #1a1a1a);"></div>
                </div>
                
                <div style="width: 50%; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; background: #1a1a1a;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #B71C1C; padding-bottom: 5px; margin-bottom: 10px;">
                        <h3 style="color: #fff; font-family: serif; margin: 0; font-size: 1.2rem; text-transform: uppercase;">${titulo}</h3>
                        <span style="color: #fff; font-weight: bold; font-size: 1.1rem;">${precio}€</span>
                    </div>
                    <p style="color: #ccc; font-style: italic; font-size: 0.85rem; margin: 0; line-height: 1.4;">${desc}</p>
                </div>
            </div>
            <p style="text-align:center; color:#777; margin-top:1rem; font-size:0.8rem;">(Vista previa aproximada estilo Desktop)</p>
        `;
    }
}

// ==========================================
// 11. GESTOR DE NEWSLETTER (V3 - CORREGIDO)
// ==========================================

// URLs base para imágenes en Newsletter (Cloudinary)
const CLOUD_BASE = "https://res.cloudinary.com/dpcrozjx0/image/upload/v1/altxerri_jazz_club/";
const IMG_DEFAULT = CLOUD_BASE + "diaSinBanda.jpg";
const IMG_CERRADO = CLOUD_BASE + "cerrado.jpg";
const IMG_PRIVADO = CLOUD_BASE + "eventoPrivado.jpg";

// ESTADO GLOBAL DEL NEWSLETTER
let newsState = {
    fechaCursor: DateTime.now(), 
    mode: 'calendar', 
    seleccionados: new Set(), 
    destacados: new Set(), 
    modificaciones: new Map(), 
    customData: { archivo: null, header: true } 
};

// Inicialización
function inicializarGestorNewsletter() {
    // 1. Botones de Navegación
    const btnPrev = document.getElementById('news-cal-prev');
    const btnNext = document.getElementById('news-cal-next');
    
    if(btnPrev) {
        btnPrev.addEventListener('click', () => {
            newsState.fechaCursor = newsState.fechaCursor.minus({ months: 1 });
            renderizarCalendarioNewsletter();
        });
        btnNext.addEventListener('click', () => {
            newsState.fechaCursor = newsState.fechaCursor.plus({ months: 1 });
            renderizarCalendarioNewsletter();
        });
    }

    // 2. Toggle de Modo
    const btnModeCal = document.getElementById('btn-mode-calendar');
    const btnModeCust = document.getElementById('btn-mode-custom');
    
    if(btnModeCal) {
        btnModeCal.addEventListener('click', () => setMode('calendar'));
        btnModeCust.addEventListener('click', () => setMode('custom'));
    }

    // 3. Acciones Principales
    document.getElementById('btn-preview-newsletter')?.addEventListener('click', mostrarPreviewNewsletter);
    document.getElementById('btn-send-newsletter')?.addEventListener('click', enviarNewsletterReal);

    // 4. Modal de Edición Efímera
    const modalEdit = document.getElementById('modal-edit-newsletter');
    const btnSaveEdit = document.getElementById('btn-save-edit-news');
    const btnCloseEdit = document.getElementById('close-edit-news');
    const btnRemoveImg = document.getElementById('btn-remove-custom-img');

    if(btnCloseEdit) btnCloseEdit.addEventListener('click', () => modalEdit.style.display = 'none');
    if(btnSaveEdit) btnSaveEdit.addEventListener('click', guardarEdicionEfimera);
    if(btnRemoveImg) btnRemoveImg.addEventListener('click', () => {
        document.getElementById('edit-news-img').value = '';
        document.getElementById('edit-news-img-preview').style.display = 'none';
        const id = document.getElementById('edit-news-date').value;
        const currentMod = newsState.modificaciones.get(id) || {};
        currentMod.archivoImg = null;
        currentMod.borrarImagen = true; 
    });

    renderizarCalendarioNewsletter();
}

function setMode(mode) {
    newsState.mode = mode;
    const containerCal = document.getElementById('container-calendar-mode');
    const fieldsCustom = document.getElementById('custom-newsletter-fields');
    const btnCal = document.getElementById('btn-mode-calendar');
    const btnCust = document.getElementById('btn-mode-custom');

    if (mode === 'calendar') {
        containerCal.style.display = 'block';
        fieldsCustom.style.display = 'none';
        btnCal.classList.add('active');
        btnCust.classList.remove('active');
    } else {
        containerCal.style.display = 'none';
        fieldsCustom.style.display = 'block';
        btnCal.classList.remove('active');
        btnCust.classList.add('active');
    }
}

// RENDERIZADO DEL CALENDARIO
function renderizarCalendarioNewsletter() {
    const grid = document.getElementById('news-calendar-grid');
    const labelMes = document.getElementById('news-cal-month');
    if(!grid) return;

    labelMes.textContent = newsState.fechaCursor.setLocale('es').toFormat('MMMM yyyy').toUpperCase();
    grid.innerHTML = '';

    // Headers
    const diasSemana = ['Sem', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(d => grid.innerHTML += `<div class="news-cal-header">${d}</div>`);

    const primerDiaMes = newsState.fechaCursor.startOf('month');
    const diasEnMes = newsState.fechaCursor.daysInMonth;
    
    // Luxon: 1=Lunes...7=Domingo. Ajustamos para que Domingo sea 0 visualmente en el offset
    const diaSemanaInicio = primerDiaMes.weekday; 
    let offset = (diaSemanaInicio === 7) ? 0 : diaSemanaInicio;

    // --- CORRECCIÓN 1: Checkbox Semana Lógico ---
    // Pasamos el día de inicio (1) para el primer checkbox
    grid.appendChild(crearCeldaSemana(1, diasEnMes));

    for(let i=0; i<offset; i++) grid.appendChild(document.createElement('div'));

    for(let i=1; i<=diasEnMes; i++) {
        const fechaDia = newsState.fechaCursor.set({ day: i });
        const fechaIso = fechaDia.toISODate();
        
        const eventoDB = adminEventos.find(e => e.fecha === fechaIso);
        const modificacion = newsState.modificaciones.get(fechaIso);
        
        let titulo = modificacion?.titulo || (eventoDB ? eventoDB.titulo : 'Bar Abierto');
        
        // --- CORRECCIÓN 3A: Rutas visuales en el Admin ---
        let imgUrl = '../img/diaSinBanda.jpg'; // Default local

        if (modificacion?.urlImgPreview) {
            imgUrl = modificacion.urlImgPreview;
        } else if (eventoDB) {
            if (eventoDB.tipoEvento === 'Cerrado') {
                titulo = eventoDB.titulo || 'Cerrado';
                imgUrl = '../img/cerrado.jpg';
            }
            else if (eventoDB.tipoEvento === 'Privado') {
                titulo = eventoDB.titulo || 'Evento Privado';
                imgUrl = '../img/eventoPrivado.jpg';
            }
            else if (eventoDB.imagen) {
                imgUrl = eventoDB.imagen.startsWith('http') ? eventoDB.imagen : `../img/${eventoDB.imagen}`;
            }
        }

        const celda = document.createElement('div');
        celda.className = 'news-cal-day';
        if (newsState.seleccionados.has(fechaIso)) celda.classList.add('selected');
        if (newsState.destacados.has(fechaIso)) celda.classList.add('featured');
        if (modificacion) celda.classList.add('has-edits'); 

        celda.innerHTML = `
            <img src="${imgUrl}" class="news-day-bg">
            <span class="news-day-number">${i}</span>
            <span class="news-day-status">${titulo}</span>
            
            <div class="news-action-btn btn-star"><i class='bx bxs-star'></i></div>
            <div class="news-action-btn btn-edit"><i class='bx bxs-pencil'></i></div>
        `;

        celda.querySelector('.btn-star').addEventListener('click', (e) => {
            e.stopPropagation();
            if(newsState.destacados.has(fechaIso)) newsState.destacados.delete(fechaIso);
            else newsState.destacados.add(fechaIso);
            renderizarCalendarioNewsletter();
        });

        celda.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirEditorEfimero(fechaIso, eventoDB);
        });

        celda.addEventListener('click', () => {
            if(newsState.seleccionados.has(fechaIso)) {
                newsState.seleccionados.delete(fechaIso);
                newsState.destacados.delete(fechaIso); 
            } else {
                newsState.seleccionados.add(fechaIso);
            }
            actualizarContadorNews();
            renderizarCalendarioNewsletter();
        });

        grid.appendChild(celda);

        // Si es Sábado (6), cerramos fila. Si quedan días, metemos otro Check Semana
        if (fechaDia.weekday === 6 && i < diasEnMes) {
            grid.appendChild(crearCeldaSemana(i + 1, diasEnMes));
        }
    }
    actualizarContadorNews();
}

// --- CORRECCIÓN 1: Nueva lógica de selección de semana ---
function crearCeldaSemana(diaInicio, totalDiasMes) {
    const div = document.createElement('div');
    div.className = 'news-week-chk';
    div.innerHTML = `<input type="checkbox" title="Seleccionar Semana">`;
    
    // Verificamos si toda esta "semana" (o lo que queda) ya está seleccionada para marcar el check
    let todosSeleccionados = true;
    const fechaBase = newsState.fechaCursor.set({ day: diaInicio });
    
    // Calcular cuántos días quedan en esta semana (hasta el próximo sábado o fin de mes)
    // El bucle avanza hasta que weekday sea 6 (Sábado) o se acabe el mes
    let dia = diaInicio;
    while(dia <= totalDiasMes) {
        const f = newsState.fechaCursor.set({ day: dia });
        if(!newsState.seleccionados.has(f.toISODate())) {
            todosSeleccionados = false;
            break;
        }
        if(f.weekday === 6) break; // Llegamos al sábado
        dia++;
    }
    div.querySelector('input').checked = todosSeleccionados;

    // Evento Click
    div.querySelector('input').addEventListener('change', (e) => {
        const checked = e.target.checked;
        let d = diaInicio;
        
        while(d <= totalDiasMes) {
            const f = newsState.fechaCursor.set({ day: d });
            const iso = f.toISODate();
            
            if(checked) newsState.seleccionados.add(iso);
            else {
                newsState.seleccionados.delete(iso);
                newsState.destacados.delete(iso);
            }
            
            if(f.weekday === 6) break; // Parar al llegar al sábado
            d++;
        }
        renderizarCalendarioNewsletter(); // Re-renderizar UNA sola vez al final
        actualizarContadorNews();
    });
    return div;
}

function actualizarContadorNews() {
    const counter = document.getElementById('news-selection-counter');
    if(counter) counter.innerText = `${newsState.seleccionados.size} eventos seleccionados`;
}

// LOGICA DE EDICIÓN EFÍMERA
function abrirEditorEfimero(fechaIso, eventoDB) {
    const modal = document.getElementById('modal-edit-newsletter');
    const tituloInp = document.getElementById('edit-news-title');
    const descInp = document.getElementById('edit-news-desc');
    const idInp = document.getElementById('edit-news-date');
    const imgPreview = document.getElementById('edit-news-img-preview');
    const imgFile = document.getElementById('edit-news-img');

    imgFile.value = '';
    imgPreview.style.display = 'none';

    const modificacion = newsState.modificaciones.get(fechaIso);
    idInp.value = fechaIso;
    
    if (modificacion) {
        tituloInp.value = modificacion.titulo;
        descInp.value = modificacion.descripcion;
        if (modificacion.urlImgPreview) {
            imgPreview.style.display = 'block';
            imgPreview.querySelector('img').src = modificacion.urlImgPreview;
        }
    } else {
        if (eventoDB) {
            tituloInp.value = eventoDB.titulo;
            descInp.value = eventoDB.descripcion || '';
        } else {
            tituloInp.value = "Bar Abierto";
            descInp.value = "Disfruta de buena música y tragos en el mejor ambiente.";
        }
    }
    modal.style.display = 'flex';
}

function guardarEdicionEfimera() {
    const fechaIso = document.getElementById('edit-news-date').value;
    const titulo = document.getElementById('edit-news-title').value;
    const desc = document.getElementById('edit-news-desc').value;
    const fileInput = document.getElementById('edit-news-img');

    const nuevaMod = newsState.modificaciones.get(fechaIso) || {};
    nuevaMod.titulo = titulo;
    nuevaMod.descripcion = desc;

    if (fileInput.files && fileInput.files[0]) {
        nuevaMod.archivoImg = fileInput.files[0];
        nuevaMod.urlImgPreview = URL.createObjectURL(fileInput.files[0]);
    }

    newsState.modificaciones.set(fechaIso, nuevaMod);
    document.getElementById('modal-edit-newsletter').style.display = 'none';
    renderizarCalendarioNewsletter();
}

// ==========================================
// GENERACIÓN DE NEWSLETTER (HTML + UPLOAD)
// ==========================================

async function prepararDatosParaEnvio() {
    const subject = document.getElementById('news-subject').value;
    const title = document.getElementById('news-title').value;
    // --- CORRECCIÓN 2: Leer estado del checkbox ---
    const includeHeader = document.getElementById('news-custom-header') 
        ? document.getElementById('news-custom-header').checked 
        : true; 

    if(!subject || !title) throw new Error("Asunto y Título son obligatorios.");

    if (newsState.mode === 'calendar' && newsState.seleccionados.size === 0) {
        throw new Error("Selecciona al menos una fecha.");
    }
    if (newsState.mode === 'custom') {
        const file = document.getElementById('news-custom-img').files[0];
        if(!file) throw new Error("En modo personalizado debes subir una imagen flyer.");
    }

    // Subida de imágenes editadas
    for (const [fecha, mod] of newsState.modificaciones) {
        if (newsState.seleccionados.has(fecha) && mod.archivoImg) {
            const urlNube = await subirImagenAlVuelo(mod.archivoImg);
            mod.urlFinal = urlNube; 
        }
    }

    let urlFlyerCustom = null;
    if (newsState.mode === 'custom') {
        const file = document.getElementById('news-custom-img').files[0];
        urlFlyerCustom = await subirImagenAlVuelo(file);
    }

    return { subject, title, urlFlyerCustom, includeHeader };
}

async function subirImagenAlVuelo(file) {
    const base64 = await toBase64(file);
    const res = await fetch('/api/imagenes/subir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
        body: JSON.stringify({ data: base64 })
    });
    const data = await res.json();
    if(!data.success) throw new Error("Error subiendo imagen temporal.");
    return data.url;
}

// ==========================================
// FUNCIÓN CORREGIDA: GENERAR HTML FINAL
// ==========================================

function generarHTMLFinal(config) {
    const { title, urlFlyerCustom, includeHeader } = config;
    const subtitle = document.getElementById('news-subtitle').value;
    const intro = document.getElementById('news-intro').value;
    const footer = document.getElementById('news-footer-text').value;

    const colors = { bg: "#121212", cardBg: "#1e1e1e", text: "#e0e0e0", accent: "#B71C1C", gold: "#FFD700" };
    
    // URLs PÚBLICAS (Cloudinary) - Asegúrate de que estas imágenes existan en tu nube
    // Si no las tienes, reemplaza estas URLs con links de imágenes que sí tengas online.
    const IMG_CLOUD_BASE = "https://res.cloudinary.com/dpcrozjx0/image/upload/v1/altxerri_jazz_club/";
    const URL_BAR_ABIERTO = IMG_CLOUD_BASE + "diaSinBanda.jpg"; 
    const URL_CERRADO = IMG_CLOUD_BASE + "cerrado.jpg";
    const URL_PRIVADO = IMG_CLOUD_BASE + "eventoPrivado.jpg";
    const URL_GENERICA = "https://res.cloudinary.com/dpcrozjx0/image/upload/v1/altxerri_jazz_club/imgBandaGenerica.jpg"; // Fallback final

    let html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:${colors.bg}; font-family: Arial, sans-serif; color:${colors.text};">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${colors.bg};">
    `;

    if (includeHeader) {
        html += `
            <tr><td align="center" style="padding: 20px;">
                <img src="${IMG_CLOUD_BASE + 'h26gwioqlrd2ygwjbwvu.png'}" width="150" alt="Altxerri">
            </td></tr>
        `;
    }

    html += `
            <tr><td style="padding: 0 20px 20px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin-bottom: 5px; font-size: 24px;">${title}</h1>
                ${subtitle ? `<h3 style="color: ${colors.accent}; margin: 0 0 15px 0; font-weight: normal;">${subtitle}</h3>` : ''}
                ${intro ? `<p style="font-size: 16px; line-height: 1.5; color: #ccc;">${intro}</p>` : ''}
            </td></tr>
    `;

    if (newsState.mode === 'custom') {
        html += `
            <tr><td align="center" style="padding: 0 0 20px 0;">
                <img src="${urlFlyerCustom}" style="width: 100%; max-width: 600px; display: block; border-radius: 8px;">
            </td></tr>
        `;
    } else {
        const fechasOrdenadas = Array.from(newsState.seleccionados).sort();
        
        fechasOrdenadas.forEach(fecha => {
            const eventoDB = adminEventos.find(e => e.fecha === fecha);
            const mod = newsState.modificaciones.get(fecha) || {};
            
            // 1. LÓGICA DE TEXTOS (Ahora maneja Cerrado y Privado explícitamente)
            let titulo = mod.titulo;
            let desc = mod.descripcion;

            if (!titulo) {
                if (eventoDB) {
                    if (eventoDB.tipoEvento === 'Cerrado') titulo = 'CERRADO';
                    else if (eventoDB.tipoEvento === 'Privado') titulo = 'EVENTO PRIVADO';
                    else titulo = eventoDB.titulo;
                } else {
                    titulo = 'BAR ABIERTO'; // Caso día vacío sin editar
                }
            }

            if (!desc) {
                if (eventoDB) desc = eventoDB.descripcion || '';
                // Texto por defecto si está vacío
                if (!desc && !eventoDB) desc = 'Ven a disfrutar de nuestros tragos y el mejor ambiente de Jazz.';
                if (eventoDB && eventoDB.tipoEvento === 'Cerrado') desc = 'Disculpen las molestias.';
            }

            // 2. LÓGICA DE IMÁGENES (Prioridad: Editada > DB > Tipo Evento > Default)
            let imgUrl = URL_BAR_ABIERTO; // Por defecto (Bar Abierto)

            if (mod.urlFinal) {
                imgUrl = mod.urlFinal; // Imagen subida manualmente para el mail
            } else if (eventoDB) {
                if (eventoDB.tipoEvento === 'Cerrado') imgUrl = URL_CERRADO;
                else if (eventoDB.tipoEvento === 'Privado') imgUrl = URL_PRIVADO;
                else if (eventoDB.imagen) {
                    // Solo usamos la imagen de DB si ya es un link de internet (Cloudinary)
                    if (eventoDB.imagen.startsWith('http')) imgUrl = eventoDB.imagen;
                    else imgUrl = URL_GENERICA; // Si es local, usamos genérica para que no salga rota
                }
            }

            // Estilos
            const isFeatured = newsState.destacados.has(fecha);
            const fechaTxt = DateTime.fromISO(fecha).setLocale('es').toFormat('EEEE d').toUpperCase();
            
            const heightImg = isFeatured ? "250px" : "180px";
            const borderStyle = isFeatured ? `border: 2px solid ${colors.gold};` : `border: 1px solid #333;`;
            const titleColor = isFeatured ? colors.gold : "#ffffff";
            const titleSize = isFeatured ? "22px" : "18px";
            
            html += `
            <tr><td style="padding: 0 20px 20px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.cardBg}; border-radius: 8px; overflow: hidden; ${borderStyle}">
                    <tr>
                        <td height="${heightImg}" style="background-image: url('${imgUrl}'); background-size: cover; background-position: center; background-color: #333;">
                            <div></div>
                            </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px;">
                            <p style="margin: 0 0 5px 0; color: ${colors.accent}; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                                ${fechaTxt}
                            </p>
                            <h2 style="margin: 0 0 10px 0; color: ${titleColor}; font-size: ${titleSize};">
                                ${titulo}
                            </h2>
                            <p style="margin: 0; font-size: 14px; line-height: 1.4; color: #ccc;">
                                ${desc}
                            </p>
                        </td>
                    </tr>
                </table>
            </td></tr>
            `;
        });
    }

    html += `
            ${footer ? `<tr><td align="center" style="padding: 20px; color:#aaa; font-style:italic;">${footer}</td></tr>` : ''}
            
            <tr><td align="center" style="padding-bottom: 30px;">
                <a href="https://instagram.com/altxerribar" style="text-decoration: none; margin: 0 10px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="32" alt="Instagram">
                </a>
                <a href="https://www.youtube.com/@AltxerriJazzClub" style="text-decoration: none; margin: 0 10px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="32" alt="YouTube">
                </a>
            </td></tr>
            
            <tr><td align="center" style="font-size: 12px; color: #666; padding-bottom: 20px;">
                Altxerri Jazz Bar<br>Donostia - San Sebastián
            </td></tr>
        </table>
    </body>
    </html>
    `;
    
    return html;
}

async function mostrarPreviewNewsletter(e) {
    e.preventDefault();
    const btn = e.target;
    btn.innerHTML = "Generando...";
    
    try {
        const configPreview = { 
            title: document.getElementById('news-title').value,
            urlFlyerCustom: newsState.mode === 'custom' && document.getElementById('news-custom-img').files[0] 
                ? URL.createObjectURL(document.getElementById('news-custom-img').files[0]) 
                : null,
            includeHeader: document.getElementById('news-custom-header')?.checked ?? true
        };
        
        for (const [key, val] of newsState.modificaciones) {
            if(val.urlImgPreview) val.urlFinal = val.urlImgPreview; 
        }

        const html = generarHTMLFinal(configPreview);

        for (const [key, val] of newsState.modificaciones) {
            if(val.urlImgPreview) val.urlFinal = null; 
        }

        const modal = document.getElementById('modal-preview');
        const container = document.getElementById('preview-container');
        container.innerHTML = `<iframe id="email-frame" style="width:100%; height:600px; border:none; background:#fff;"></iframe>`;
        const doc = document.getElementById('email-frame').contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        modal.style.display = 'flex';

    } catch(err) {
        alert(err.message);
    } finally {
        btn.innerHTML = "<i class='bx bx-show'></i> Vista Previa";
    }
}

async function enviarNewsletterReal(e) {
    e.preventDefault();
    if(!confirm("¿Enviar Newsletter a todos los suscriptores?")) return;
    
    const btn = e.target;
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Subiendo imágenes...";

    try {
        const config = await prepararDatosParaEnvio();
        const html = generarHTMLFinal(config);

        const res = await fetch('/api/newsletter/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
            body: JSON.stringify({ subject: config.subject, htmlContent: html })
        });
        
        const data = await res.json();
        if(!data.success) throw new Error(data.message);
        
        alert("¡Enviado con éxito!");

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bxs-paper-plane'></i> Enviar Ahora";
    }
}