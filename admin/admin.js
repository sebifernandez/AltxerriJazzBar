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
// 2. PLANTILLAS HTML (CARTA)
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
    unicos_imagen_coctel: `<div class="form-section"><h4>Imagen de la Card (¡Obligatoria para Cocteles!)</h4><div class="form-group"><label for="producto-imagen-upload">Subir Imagen *</label><input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required></div></div>`,
    unicos_imagen_vino: `<div class="form-section"><h4>Imagen del Producto (¡Obligatoria para Vinos!)</h4><div class="form-group"><label for="producto-imagen-upload">Subir Imagen *</label><input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required></div></div>`,
    unicos_vino_destacado: `<div class="form-group-checkbox-inline"><input type="checkbox" id="producto-destacado"><label for="producto-destacado">Marcar como "Vino Destacado de la Semana"</label></div>`,

    trad_es_titulo: `<div class="form-group"><label for="producto-titulo-es">Título (ES) *</label><input type="text" id="producto-titulo-es" class="form-input" required></div>`,
    trad_es_descripcion: `<div class="form-group"><label for="producto-descripcion-es">Descripción (ES) *</label><textarea id="producto-descripcion-es" class="form-input" style="min-height: 100px;" required></textarea></div>`,
    trad_es_region_pais: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-es">Región (ES)</label><input type="text" id="producto-region-es" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-es">País (ES)</label><input type="text" id="producto-pais-es" class="form-input"></div></div></div>`,
    trad_es_varietal_vino: `<div class="form-group"><label for="producto-varietal-es">Varietal (ES)</label><input type="text" id="producto-varietal-es" class="form-input"></div>`,
    trad_es_crianza_vino: `<div class="form-group"><label for="producto-crianza-es">Crianza (ES)</label><input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: 14 meses en barricas"></div>`,
    trad_es_crianza_destilado: `<div class="form-group"><label for="producto-crianza-es">Crianza (ES)</label><input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: En barricas nuevas..."></div>`,
    
    trad_en_titulo: `<div class="form-group"><label for="producto-titulo-en">Título (EN) *</label><input type="text" id="producto-titulo-en" class="form-input" required></div>`,
    trad_en_descripcion: `<div class="form-group"><label for="producto-descripcion-en">Descripción (EN) *</label><textarea id="producto-descripcion-en" class="form-input" style="min-height: 100px;" required></textarea></div>`,
    trad_en_region_pais: `<div class="form-grid"><div class="form-col"><div class="form-group"><label for="producto-region-en">Región (EN)</label><input type="text" id="producto-region-en" class="form-input"></div></div><div class="form-col"><div class="form-group"><label for="producto-pais-en">País (EN)</label><input type="text" id="producto-pais-en" class="form-input"></div></div></div>`,
    trad_en_varietal_vino: `<div class="form-group"><label for="producto-varietal-en">Varietal (EN)</label><input type="text" id="producto-varietal-en" class="form-input"></div>`,
    trad_en_crianza_vino: `<div class="form-group"><label for="producto-crianza-en">Crianza (EN)</label><input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: 14 months in barrels"></div>`,
    trad_en_crianza_destilado: `<div class="form-group"><label for="producto-crianza-en">Crianza (EN)</label><input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: In new barrels..."></div>`,
    
    bilingue_wrapper: (html_es, html_en) => `
        <div class="form-section-bilingue">
            <div class="lang-tabs">
                <button type="button" class="lang-tab-btn active" data-lang="es">Español</button>
                <button type="button" class="lang-tab-btn" data-lang="en">Inglés</button>
            </div>
            <div class="form-bilingue-grid">
                <div class="lang-content lang-col-es active" data-lang-content="es">${html_es}</div>
                <div class="lang-content lang-col-en" data-lang-content="en">
                    <button type="button" class="btn-translate" data-lang-group="en"><i class='bx bxs-magic-wand'></i> Sugerir traducción</button>
                    ${html_en}
                </div>
            </div>
        </div>`
};

const plantillasFormCarta = {
    coctel: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_precios_copa_solo}${plantillasBloques.unicos_imagen_coctel}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion)}`,
    sinAlcohol: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_precios_botella_solo}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion)}`,
    cervezaBarril: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_cana_pinta}${plantillasBloques.unicos_cerveza_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion)}`,
    cervezaEnvasada: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_botella_solo}${plantillasBloques.unicos_cerveza_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion)}`,
    vino: `${plantillasBloques.unicos_vino_destacado}<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_vino_datos}${plantillasBloques.unicos_precios_copa_botella}${plantillasBloques.unicos_imagen_vino}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_varietal_vino + plantillasBloques.trad_es_crianza_vino + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_varietal_vino + plantillasBloques.trad_en_crianza_vino + plantillasBloques.trad_en_descripcion)}`,
    destilado: `<div class="form-section"><h4>Datos Únicos</h4>${plantillasBloques.unicos_titulo_marca}${plantillasBloques.unicos_precios_copa_botella_destilado}${plantillasBloques.unicos_destilado_datos}</div>${plantillasBloques.bilingue_wrapper(plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_crianza_destilado + plantillasBloques.trad_es_descripcion, plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_crianza_destilado + plantillasBloques.trad_en_descripcion)}`
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

    // 1. Inyectar Plantillas (Solo una vez)
    if (container.children.length === 0) {
        for (const t in plantillasFormCarta) {
            const div = document.createElement('div');
            div.id = `fields-${t.startsWith('vino')?'vino':t}`;
            div.className = 'form-fields-group';
            div.innerHTML = plantillasFormCarta[t.startsWith('vino')?'vino':t];
            container.appendChild(div);
        }
    }
    
    // 2. Listener Tipo
    sel.addEventListener('change', () => {
        document.querySelectorAll('.form-fields-group').forEach(g => g.classList.remove('visible'));
        const target = document.getElementById(`fields-${sel.value.startsWith('vino')?'vino':sel.value}`);
        if(target) {
            target.classList.add('visible');
            activarLogicaBilingue(target);
            btnActions.style.display = 'block';
        } else {
            btnActions.style.display = 'none';
        }
    });

    // 3. Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = sel.value;
        const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;
        const formGroup = document.getElementById(`fields-${tipoPlantilla}`);
        const btn = form.querySelector('.btn-primary');
        
        // Validación simple EN
        const inputsEN = formGroup.querySelectorAll('.lang-content[data-lang-content="en"] [required]');
        for (const i of inputsEN) {
            if (!i.value.trim()) {
                alert("Faltan campos en Inglés por completar.");
                formGroup.querySelector('.lang-tab-btn[data-lang="en"]').click();
                i.focus();
                return;
            }
        }

        btn.disabled = true;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Procesando...";

        try {
            const { producto_es, producto_en } = recolectarDatosProducto(formGroup, tipo);
            
            // Imagen Upload
            let imgUrl = producto_es.imagen; 
            if (producto_es.archivoImagen) {
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
                imgUrl = orig ? orig.imagen : 'bebidaSinFoto.jpg';
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
            alert(modoEdicion ? "Producto Modificado" : "Producto Creado");
            
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
    if(btnTrans) {
        const newTrans = btnTrans.cloneNode(true);
        btnTrans.parentNode.replaceChild(newTrans, btnTrans);
        newTrans.addEventListener('click', async (e) => {
            e.preventDefault();
            alert("Traducción automática pendiente de configurar.");
        });
    }
}

function recolectarDatosProducto(formGroup, tipo) {
    const fileInp = formGroup.querySelector('input[type="file"]');
    const unicos = {
        tipo: tipo,
        visualizacion: true,
        destacado: formGroup.querySelector('#producto-destacado')?.checked || false,
        precioCopa: parseFloat(formGroup.querySelector('#producto-precio-copa')?.value) || null,
        precioBotella: parseFloat(formGroup.querySelector('#producto-precio-botella')?.value) || null,
        precioCana: parseFloat(formGroup.querySelector('#producto-precio-cana')?.value) || null,
        precioPinta: parseFloat(formGroup.querySelector('#producto-precio-pinta')?.value) || null,
        abv: parseFloat(formGroup.querySelector('#producto-abv')?.value) || null,
        ibu: parseInt(formGroup.querySelector('#producto-ibu')?.value) || null,
        productor: formGroup.querySelector('#producto-productor')?.value || null,
        ano: formGroup.querySelector('#producto-ano')?.value || null,
        archivoImagen: fileInp?.files[0] || null,
        imagen: (tipo === 'coctel' || tipo.startsWith('vino')) ? 'bebidaSinFoto.jpg' : null
    };
    
    // Datos ES
    const es = { ...unicos,
        titulo: formGroup.querySelector('#producto-titulo-es')?.value || formGroup.querySelector('#producto-titulo')?.value || '',
        descripcion: formGroup.querySelector('#producto-descripcion-es')?.value || '',
        region: formGroup.querySelector('#producto-region-es')?.value || null,
        pais: formGroup.querySelector('#producto-pais-es')?.value || null,
        varietal: formGroup.querySelector('#producto-varietal-es')?.value || null,
        crianza: formGroup.querySelector('#producto-crianza-es')?.value || null
    };
    // Datos EN
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
    let img = `<div style="width:80px;height:80px;background:#555;border-radius:5px;"></div>`;
    if(p.imagen) {
        const src = p.imagen.startsWith('http') ? p.imagen : `../img/${p.imagen}`;
        img = `<img src="${src}" style="width:80px;height:80px;object-fit:cover;border-radius:5px;">`;
    }
    
    const checked = p.visualizacion !== false ? 'checked' : '';
    const disabledClass = p.visualizacion === false ? 'deshabilitado' : '';

    return `
    <div class="card-resultado ${disabledClass}" style="margin-bottom:1rem;">
        <div class="card-resultado-header" style="display:flex;gap:10px;padding:10px;">
            ${img}
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
    
    // Llenar datos en pestaña ES
    const formGroup = document.querySelector('.form-fields-group.visible');
    
    // Mapeo rápido de campos comunes
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

    if(formGroup.querySelector('#producto-destacado')) formGroup.querySelector('#producto-destacado').checked = p.destacado;

    // Llenar datos en pestaña EN
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

    // Imagen
    const infoImg = document.getElementById('info-img-actual-prod');
    if (infoImg) infoImg.remove();
    if (p.imagen && p.imagen !== 'bebidaSinFoto.jpg') {
        const urlImg = p.imagen.startsWith('http') ? p.imagen : `../img/${p.imagen}`;
        formGroup.querySelector('.form-section').insertAdjacentHTML('afterbegin', 
            `<div id="info-img-actual-prod" class="info-imagen-actual">
                <strong>Imagen Actual:</strong> <a href="${urlImg}" target="_blank">Ver</a>
                <br><small>Sube un archivo para reemplazar.</small>
            </div>`);
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