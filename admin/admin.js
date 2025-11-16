/* --- ADMIN.JS (Versión 4.7 - Arreglo Global de Bugs) --- */

// --- Variables Globales ---
const { DateTime } = luxon; 
let adminEventos = []; 
let modoEdicion = false; 
let idEventoEdicion = null; // Guardará el _id de Mongo

let adminProductos = []; 
let adminProductos_EN = []; 
let modoVisibilidad = false; 

// --- ¡ARREGLO! Movido al ámbito global

let tags = []; 
let picker; 

// --- ¡ARREGLO! Movido al ámbito global ---
const plantillasBloques = {
    unicos_titulo_marca: `
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre (Marca) *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Jack Daniel's" required>
        </div>`,
    unicos_precios_copa_botella: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-copa">Precio (Copa)</label>
                    <input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 10">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Botella)</label>
                    <input type="number" step="0.01" id="producto-precio-botella" class="form-input" placeholder="Ej: 40">
                </div>
            </div>
        </div>`,
    unicos_precios_cana_pinta: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-cana">Precio (Caña) *</label>
                    <input type="number" step="0.01" id="producto-precio-cana" class="form-input" placeholder="Ej: 4" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-pinta">Precio (Pinta) *</label>
                    <input type="number" step="0.01" id="producto-precio-pinta" class="form-input" placeholder="Ej: 7" required>
                </div>
            </div>
        </div>`,
    unicos_precios_botella_solo: `
        <div class="form-group">
            <label for="producto-precio-botella">Precio (Unidad) *</label>
            <input type="number" step="0.01" id="producto-precio-botella" class="form-input" placeholder="Ej: 7" required>
        </div>`,
    unicos_precios_copa_solo: `
        <div class="form-group">
            <label for="producto-precio-copa">Precio (Copa) *</label>
            <input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 8" required>
        </div>`,
    unicos_precios_copa_botella_destilado: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-cana">Precio (Chupito) *</label>
                    <input type="number" step="0.01" id="producto-precio-cana" class="form-input" placeholder="Ej: 4" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-copa">Precio (Vaso)</label>
                    <input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 8">
                </div>
            </div>
        </div>`,
    unicos_cerveza_datos: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-abv">ABV (%)</label>
                    <input type="number" step="0.1" id="producto-abv" class="form-input" placeholder="Ej: 5.0">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-ibu">IBU</label>
                    <input type="number" id="producto-ibu" class="form-input" placeholder="Ej: 12">
                </div>
            </div>
        </div>`,
    unicos_vino_datos: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-productor">Bodega (Productor)</label>
                    <input type="text" id="producto-productor" class="form-input" placeholder="Ej: Luca Wines">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-ano">Año</label>
                    <input type="text" id="producto-ano" class="form-input" placeholder="Ej: 2021">
                </div>
            </div>
        </div>`,
    unicos_destilado_datos: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-productor">Productor</label>
                    <input type="text" id="producto-productor" class="form-input" placeholder="Ej: Jack Daniel Distillery">
                </div>
            </div>
        </div>`,
    unicos_imagen_coctel: `
        <div class="form-section">
            <h4>Imagen de la Card (¡Obligatoria para Cocteles!)</h4>
            <div class="form-group">
                <label for="producto-imagen-upload">Subir Imagen *</label>
                <input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required>
            </div>
        </div>`,
    unicos_imagen_vino: `
        <div class="form-section">
            <h4>Imagen del Producto (¡Obligatoria para Vinos!)</h4>
            <div class="form-group">
                <label for="producto-imagen-upload">Subir Imagen *</label>
                <input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required>
            </div>
        </div>`,
    unicos_vino_destacado: `
        <div class="form-group-checkbox-inline">
            <input type="checkbox" id="producto-destacado">
            <label for="producto-destacado">Marcar como "Vino Destacado de la Semana"</label>
        </div>`,

    trad_es_titulo: `
        <div class="form-group">
            <label for="producto-titulo-es">Título (ES) *</label>
            <input type="text" id="producto-titulo-es" class="form-input" required>
        </div>`,
    trad_es_descripcion: `
        <div class="form-group">
            <label for="producto-descripcion-es">Descripción (ES) *</label>
            <textarea id="producto-descripcion-es" class="form-input" style="min-height: 100px;" required></textarea>
        </div>`,
    trad_es_region_pais: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region-es">Región (ES)</label>
                    <input type="text" id="producto-region-es" class="form-input">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-pais-es">País (ES)</label>
                    <input type="text" id="producto-pais-es" class="form-input">
                </div>
            </div>
        </div>`,
    trad_es_varietal_vino: `
        <div class="form-group">
            <label for="producto-varietal-es">Varietal (ES)</label>
            <input type="text" id="producto-varietal-es" class="form-input">
        </div>`,
    trad_es_crianza_vino: `
        <div class="form-group">
            <label for="producto-crianza-es">Crianza (ES)</label>
            <input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: 14 meses en barricas">
        </div>`,
    trad_es_crianza_destilado: `
        <div class="form-group">
            <label for="producto-crianza-es">Crianza (ES)</label>
            <input type="text" id="producto-crianza-es" class="form-input" placeholder="Ej: En barricas nuevas...">
        </div>`,

    
    trad_en_titulo: `
        <div class="form-group">
            <label for="producto-titulo-en">Título (EN) *</label>
            <input type="text" id="producto-titulo-en" class="form-input" required>
        </div>`,
    trad_en_descripcion: `
        <div class="form-group">
            <label for="producto-descripcion-en">Descripción (EN) *</label>
            <textarea id="producto-descripcion-en" class="form-input" style="min-height: 100px;" required></textarea>
        </div>`,
    trad_en_region_pais: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region-en">Región (EN)</label>
                    <input type="text" id="producto-region-en" class="form-input">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-pais-en">País (EN)</label>
                    <input type="text" id="producto-pais-en" class="form-input">
                </div>
            </div>
        </div>`,
    trad_en_varietal_vino: `
        <div class="form-group">
            <label for="producto-varietal-en">Varietal (EN)</label>
            <input type="text" id="producto-varietal-en" class="form-input">
        </div>`,
    trad_en_crianza_vino: `
        <div class="form-group">
            <label for="producto-crianza-en">Crianza (EN)</label>
            <input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: 14 months in barrels">
        </div>`,
    trad_en_crianza_destilado: `
        <div class="form-group">
            <label for="producto-crianza-en">Crianza (EN)</label>
            <input type="text" id="producto-crianza-en" class="form-input" placeholder="Ej: In new barrels...">
        </div>`,
    
    bilingue_wrapper: (html_es, html_en) => `
        <div class="form-section-bilingue">
            <div class="lang-tabs">
                <button type="button" class="lang-tab-btn active" data-lang="es">Español</button>
                <button type="button" class="lang-tab-btn" data-lang="en">Inglés</button>
            </div>
            <div class="form-bilingue-grid">
                <div class="lang-content lang-col-es active" data-lang-content="es">
                    ${html_es}
                </div>
                <div class="lang-content lang-col-en" data-lang-content="en">
                    <button type="button" class="btn-translate" data-lang-group="en">
                        <i class='bx bxs-magic-wand'></i> Sugerir traducción para todos los campos
                    </button>
                    ${html_en}
                </div>
            </div>
        </div>`
};

const plantillasFormCarta = {
    coctel: `
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_precios_copa_solo}
            ${plantillasBloques.unicos_imagen_coctel}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion
        )}
    `,
    sinAlcohol: `
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_precios_botella_solo}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_titulo + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_titulo + plantillasBloques.trad_en_descripcion
        )}
    `,
    
    cervezaBarril: `
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_titulo_marca}
            ${plantillasBloques.unicos_precios_cana_pinta}
            ${plantillasBloques.unicos_cerveza_datos}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion
        )}
    `,
    cervezaEnvasada: `
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_titulo_marca}
            ${plantillasBloques.unicos_precios_botella_solo}
            ${plantillasBloques.unicos_cerveza_datos}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_descripcion
        )}
    `,
    vino: `
        ${plantillasBloques.unicos_vino_destacado}
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_titulo_marca}
            ${plantillasBloques.unicos_vino_datos}
            ${plantillasBloques.unicos_precios_copa_botella}
            ${plantillasBloques.unicos_imagen_vino}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_varietal_vino + plantillasBloques.trad_es_crianza_vino + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_varietal_vino + plantillasBloques.trad_en_crianza_vino + plantillasBloques.trad_en_descripcion
        )}
    `,
    destilado: `
        <div class="form-section">
            <h4>Datos Únicos (No se traducen)</h4>
            ${plantillasBloques.unicos_titulo_marca}
            ${plantillasBloques.unicos_precios_copa_botella_destilado}
            ${plantillasBloques.unicos_destilado_datos}
        </div>
        ${plantillasBloques.bilingue_wrapper(
            plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_crianza_destilado + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_crianza_destilado + plantillasBloques.trad_en_descripcion
        )}
    `
};

// (formatarPrecio y sugerirTraduccion no cambian)
function formatarPrecio(precio) {
    if (!precio || precio === 0) {
        return '–'; 
    }
    return `${precio}€`;
}
function sugerirTraduccion(texto) {
    if (!texto) return "";
    console.log("Simulando traducción...");
    return texto; 
}
function getAuthToken() {
    return localStorage.getItem('altxerri_token') || '';
}


// --- FIN DE LAS VARIABLES GLOBALES ---


// --- INICIO DEL DOMCONTENTLOADED ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (loginForm) {
        // (Lógica de Login no cambia)
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
                console.error('Error de red al intentar login:', error);
                errorMessage.textContent = 'Error de conexión. Intenta de nuevo.';
            }
        });
    } 
    else if (dashboardContainer) {
        // (Lógica de Bouncer y Logout no cambia)
        if (localStorage.getItem('altxerri_auth') !== 'true') {
            alert("Acceso denegado. Por favor, inicia sesión.");
            window.location.href = 'index.html';
            return; 
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('altxerri_auth');
                localStorage.removeItem('altxerri_token');
                window.location.href = 'index.html';
            });
        }
        
        // (Navegación base no cambia)
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navLinks = document.querySelectorAll('.nav-link');
        const contentSections = document.querySelectorAll('.content-section');
        const tabLinks = document.querySelectorAll('.tab-link');
        const dashCards = document.querySelectorAll('.dash-card');
        if (mobileMenuBtn) { mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open')); }
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                if (!targetId) return;
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetId) {
                        section.classList.add('active');
                    }
                });
                if (sidebar.classList.contains('open')) { sidebar.classList.remove('open'); }
            });
        });
        dashCards.forEach(card => {
            card.addEventListener('click', () => {
                const targetId = card.getAttribute('data-target');
                document.querySelector(`.nav-link[data-target="${targetId}"]`).click();
            });
        });
        
        // (Listener de TABS no cambia)
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetId = link.getAttribute('data-tab');
                const parentSection = link.closest('.content-section');

                parentSection.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                parentSection.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
                
                if (targetId === 'alta-evento') {
                    if (!modoEdicion) {
                        inicializarFormularioAlta(); 
                    }
                }
                
                if (targetId === 'alta-producto') {
                    if (!modoEdicion) {
                        resetearFormularioCarta(); 
                    }
                }
            });
        });
        
        // (El resto de inicializadores no cambia)
        const formAlta = document.getElementById('form-alta-evento');
        //if (formAlta) { inicializarFormularioAlta(); } // Se llama una vez al cargar
        fetchEventosData(); 
        inicializarPanelesBusquedaEventos();
        
        const formAltaProducto = document.getElementById('form-alta-producto');
        if (formAltaProducto) { inicializarFormularioCarta(); } // Se llama una vez al cargar
        
        const selectorTipoCarta = document.getElementById('producto-tipo');
    const formCarta = document.getElementById('form-alta-producto');
    const containerCarta = document.getElementById('smart-form-container');
    const actionsCarta = document.getElementById('form-actions-producto');

    if (selectorTipoCarta && formCarta && containerCarta) {

        // Listener del Selector de Tipo
        selectorTipoCarta.addEventListener('change', () => {
            let tipoSeleccionado = selectorTipoCarta.value;
            containerCarta.querySelectorAll('.form-fields-group').forEach(group => {
                group.classList.remove('visible');
            });

            const tipoPlantilla = tipoSeleccionado.startsWith('vino') ? 'vino' : tipoSeleccionado;
            
            if (tipoSeleccionado) {
                const grupoAMostrar = document.getElementById(`fields-${tipoPlantilla}`);
                if (grupoAMostrar) {
                    grupoAMostrar.classList.add('visible');
                    activarLogicaBilingue(grupoAMostrar); // Activamos pestañas ES/EN
                }
                actionsCarta.style.display = 'block'; 
            } else {
                actionsCarta.style.display = 'none'; 
            }
        });

        // Listener del Botón de Guardar (Submit)
        formCarta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tipo = selectorTipoCarta.value;
            const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;
            const formGroup = document.getElementById(`fields-${tipoPlantilla}`);
            const btnSubmit = formCarta.querySelector('.btn-primary');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
            
            const langGroupEN = formGroup.querySelector('.lang-content[data-lang-content="en"]');
            const requiredInputsEN = langGroupEN.querySelectorAll('input[required], textarea[required]');
            let firstInvalid = null;

            for (const input of requiredInputsEN) {
                if (!input.value.trim()) {
                    firstInvalid = input; // Encontramos el primer campo vacío
                    break;
                }
            }

            if (firstInvalid) {
                // ¡Hay un error!
                alert("¡Faltan campos obligatorios en la pestaña 'Inglés'!");
                
                // Cambiamos a la pestaña de Inglés
                const tabButtonEN = formGroup.querySelector('.lang-tab-btn[data-lang="en"]');
                if(tabButtonEN) tabButtonEN.click();
                
                // Marcamos la pestaña como "rota" (¡tu idea!)
                const langTabs = formGroup.querySelectorAll('.lang-tab-btn');
                langTabs.forEach(tab => {
                    if(tab.dataset.lang === 'en') {
                        tab.style.color = 'var(--color-primario-rojo)';
                        tab.style.border = '1px solid var(--color-primario-rojo)';
                    } else {
                        tab.style.color = '';
                        tab.style.border = '';
                    }
                });

                firstInvalid.focus(); // Hacemos foco en el campo vacío

                // Reactivamos el botón y detenemos el envío
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Producto";
                return; // ¡IMPORTANTE! Detiene la función
            }
            try {
                const tipo = selectorTipoCarta.value; 
                const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;


                const { producto_es, producto_en } = recolectarDatosProducto(formGroup, tipo);

                if ((!producto_es.titulo || producto_es.titulo === '')) {
                     throw new Error("El Título (ES o Marca) es obligatorio.");
                }

                if (modoEdicion) {
                    const response = await fetch(`/api/productos/modificar/${idEventoEdicion}`, { // Usamos el ID guardado
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': getAuthToken()
                            },
                            body: JSON.stringify({ producto_es, producto_en })
                        });

                        if (!response.ok) throw new Error((await response.json()).message || "Error del servidor");
                        
                        alert("¡Producto Modificado con Éxito!");
                        
                        // Reseteamos y volvemos a la pestaña de modificación
                        resetearFormularioCarta();
                        fetchProductosData(); // ¡Actualizamos la lista!
                        document.querySelector('.tab-link[data-tab="mod-producto"]').click();

                } else {
                    // --- MODO CREAR (POST) ---
                    const response = await fetch('/api/productos/crear', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': getAuthToken()
                        },
                        body: JSON.stringify({ producto_es, producto_en })
                    });

                    if (!response.ok) throw new Error((await response.json()).message || "Error del servidor");
                    alert("¡Producto Creado con Éxito!");
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = "<i class='bx bxs-save'></i> Guardar Producto";
                    resetearFormularioCarta();
                    fetchProductosData(); 
                }

            } catch (error) {
                console.error("Error al guardar producto:", error);
                alert(`Error: ${error.message}`);
                btnSubmit.disabled = false; 
                btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            }
        }); 
    }
        
        fetchProductosData(); 
        inicializarPanelesBusquedaProductos();
    }
// --- ¡ARREGLO DE SINTAXIS! ---
// Esta es la llave que cierra el 'DOMContentLoaded'
// que se abrió en la línea 23



// -----------------------------------------------------------------
// --- FASE 2: LÓGICA DEL FORMULARIO DE ALTA (EVENTOS) ---
// (Corregido con _id y Bugfix de UX v4.5)
// -----------------------------------------------------------------

// --- ¡CAMBIO! REEMPLAZA ESTA FUNCIÓN ENTERA ---
function inicializarFormularioAlta() {
    
    const form = document.getElementById('form-alta-evento');
    const inputFecha = document.getElementById('evento-fecha');
    const checkGenerica = document.getElementById('evento-img-generica');
    const fieldsetImagen = document.getElementById('fieldset-imagen');
    const inputTag = document.getElementById('evento-tags');
    const tagContainer = document.getElementById('tag-container');
    
    // --- ¡ARREGLO PARA BUG 1 (Fecha Pasada)! ---
    // Destruimos el calendario anterior (el "fantasma") si existe
    // antes de crear uno nuevo. Esto asegura que 'onselected' funcione.


    // Volvemos a crear el picker con la lógica de 'onselected'
    picker = new Litepicker({
        element: inputFecha,
        format: 'YYYY-MM-DD',
        lang: 'es-ES',
        buttonText: {
            previousMonth: '<i class="bx bx-chevron-left"></i>',
            nextMonth: '<i class="bx bx-chevron-right"></i>',
            reset: '<i class="bx bx-refresh"></i>',
            apply: 'Aplicar'
        },
        onselected: (date) => {
            // Esta es la lógica que AHORA SÍ va a funcionar
            const fechaSeleccionadaMillis = date.toMillis();
            // Comparamos con el inicio del día de hoy
            const hoyMillis = DateTime.now().startOf('day').toMillis();
            
            if (fechaSeleccionadaMillis < hoyMillis) {
                if (!confirm("Has seleccionado una fecha en el pasado. ¿Estás seguro de que quieres continuar?")) {
                    picker.clearSelection(); 
                }
            }
        }
    });

    // (Listeners de tags y checkbox no cambian)
    // (Usamos .replaceWith(clone) para limpiar listeners viejos)
    const newCheckGenerica = checkGenerica.cloneNode(true);
    checkGenerica.parentNode.replaceChild(newCheckGenerica, checkGenerica);
    newCheckGenerica.addEventListener('change', () => {
        fieldsetImagen.disabled = newCheckGenerica.checked;
        if (newCheckGenerica.checked) {
            tags = [];
            renderizarTags();
            document.getElementById('evento-imagen-upload').value = '';
        }
    });

    const newInputTag = inputTag.cloneNode(true);
    inputTag.parentNode.replaceChild(newInputTag, inputTag);
    newInputTag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); 
            const tagTexto = newInputTag.value.trim();
            if (tagTexto.length > 0 && !tags.includes(tagTexto)) {
                tags.push(tagTexto);
                renderizarTags();
            }
            newInputTag.value = ''; 
        }
    });

    const newTagContainer = tagContainer.cloneNode(true);
    tagContainer.parentNode.replaceChild(newTagContainer, tagContainer);
    newTagContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag-btn')) {
            const tagTexto = e.target.getAttribute('data-tag');
            tags = tags.filter(t => t !== tagTexto);
            renderizarTags();
        }
    });
    
    // (Bugfix de UX "Privado/Cerrado" no cambia)
    const tipoEventoSelect = document.getElementById('evento-tipo');
    const newTipoEventoSelect = tipoEventoSelect.cloneNode(true);
    tipoEventoSelect.parentNode.replaceChild(newTipoEventoSelect, tipoEventoSelect);
    
    const tituloInput = document.getElementById('evento-titulo');
    const liveInput = document.getElementById('evento-live');
    const conciertoInput = document.getElementById('evento-concierto');
    newTipoEventoSelect.addEventListener('change', () => {
        const tipo = newTipoEventoSelect.value;
        const esEspecial = (tipo === 'Privado' || tipo === 'Cerrado');
        tituloInput.disabled = esEspecial;
        liveInput.disabled = esEspecial;
        conciertoInput.disabled = esEspecial;
        newCheckGenerica.disabled = esEspecial;
        fieldsetImagen.disabled = esEspecial;
        if (esEspecial) {
            tituloInput.value = '';
            liveInput.value = '';
            conciertoInput.value = '';
            newCheckGenerica.checked = false; 
            document.getElementById('evento-imagen-upload').value = '';
            tags = [];
            renderizarTags();
        }
    });
    
    // --- Lógica de SUBMIT (guardado) ---
    // (Limpiamos el listener anterior)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
        if (picker) {
        picker.destroy();
        picker = null;
    }
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btnSubmit = newForm.querySelector('.btn-primary');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
        
        const eventoData = {
            fecha: document.getElementById('evento-fecha').value,
            tipoEvento: document.getElementById('evento-tipo').value,
            titulo: document.getElementById('evento-titulo').value.trim(),
            live: document.getElementById('evento-live').value.trim(),
            concierto: document.getElementById('evento-concierto').value.trim(),
            usaGenerica: document.getElementById('evento-img-generica').checked,
            archivoImagen: document.getElementById('evento-imagen-upload').files[0],
            imgReferencia: tags
        };

        if (eventoData.tipoEvento === 'Regular' && !eventoData.titulo) {
            alert("Error: 'Título' es obligatorio para eventos Regulares.");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            return;
        }
        if (!eventoData.fecha) {
             alert("Error: 'Fecha' es un campo obligatorio.");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            return;
        }

        let imagenNombre = "imgBandaGenerica.jpg";
        if (!eventoData.usaGenerica) {
            if (eventoData.archivoImagen) {
                imagenNombre = eventoData.archivoImagen.name;
                console.log("Simulando subida de:", imagenNombre); 
            } else if (modoEdicion) {
                const eventoOriginal = adminEventos.find(ev => ev._id === idEventoEdicion);
                imagenNombre = eventoOriginal.imagen || "imgBandaGenerica.jpg";
            }
        }

        let eventoFinal = {
            fecha: eventoData.fecha,
            tipoEvento: eventoData.tipoEvento,
            imagen: imagenNombre,
            imgReferencia: eventoData.imgReferencia,
            titulo: eventoData.titulo,
            live: eventoData.live,
            concierto: eventoData.concierto
        };

        if (eventoFinal.tipoEvento === 'Cerrado') {
            eventoFinal.titulo = "";
            eventoFinal.imagen = "cerrado.jpg";
            eventoFinal.live = "";
            eventoFinal.concierto = "";
            eventoFinal.imgReferencia = [];
        } else if (eventoFinal.tipoEvento === 'Privado') {
            eventoFinal.titulo = "";
            eventoFinal.imagen = "eventoPrivado.jpg";
            eventoFinal.live = "";
            eventoFinal.concierto = "";
            eventoFinal.imgReferencia = [];
        }

        try {
            if (modoEdicion) {
                const response = await fetch(`/api/eventos/modificar/${idEventoEdicion}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthToken()
                    },
                    body: JSON.stringify(eventoFinal)
                });
                if (!response.ok) throw new Error((await response.json()).message || "Error del servidor");
                alert("¡Evento Modificado con Éxito!");

            } else {
                
                // --- ¡ARREGLO PARA BUG 2 (Conflicto de Fecha)! ---
                if (adminEventos.some(ev => ev.fecha === eventoFinal.fecha)) {
                    if (!confirm("¡Atención! Ya existe otro evento en esta fecha. ¿Deseas crearlo igualmente?")) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
                        return;
                    }
                }
                
                const response = await fetch('/api/eventos/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthToken()
                    },
                    body: JSON.stringify(eventoFinal)
                });
                if (!response.ok) throw new Error((await response.json()).message || "Error del servidor");
                alert("¡Evento Creado con Éxito!");
            }
            
            fetchEventosData(); 
            resetearFormularioAlta(); 

        } catch (error) {
            console.error("Error al guardar evento:", error);
            alert(`Error: ${error.message}`);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            if (modoEdicion) resetearFormularioAlta(); 
        }
    });
}
// --- FIN DE LA FUNCIÓN REEMPLAZADA ---


// (renderizarTags, esURLValida no cambian)
function renderizarTags() {
    const tagContainer = document.getElementById('tag-container');
    if (!tagContainer) return; 
    tagContainer.querySelectorAll('.tag-item').forEach(tagEl => tagEl.remove());
    tags.slice().reverse().forEach(tagTexto => {
        const tagEl = document.createElement('span');
        tagEl.classList.add('tag-item');
        tagEl.innerHTML = `${tagTexto} <span class="remove-tag-btn" data-tag="${tagTexto}">&times;</span>`;
        tagContainer.prepend(tagEl);
    });
}
function esURLValida(string) {
    try {
        new URL(string);
        return (string.startsWith('http://') || string.startsWith('https://'));
    } catch (_) {
        return false;
    }
}

// (resetearFormularioAlta no cambia)
function resetearFormularioAlta() {
    const form = document.getElementById('form-alta-evento');
    if (!form) return;
    
    // Reseteamos el formulario
    form.reset();
    tags = [];
    renderizarTags();
    
    // ¡ARREGLO! Destruimos el picker para que se
    // reinicie la próxima vez que se llame a inicializarFormularioAlta()
    if (picker) {
        picker.destroy();
        picker = null; 
    }
    
    document.getElementById('fieldset-imagen').disabled = false;
    document.getElementById('evento-titulo').disabled = false;
    document.getElementById('evento-live').disabled = false;
    document.getElementById('evento-concierto').disabled = false;
    document.getElementById('evento-img-generica').disabled = false;
    modoEdicion = false;
    idEventoEdicion = null;
    form.classList.remove('modo-edicion');
    const tabContent = form.closest('.tab-content');
    if (tabContent) { 
        tabContent.querySelector('h3').textContent = "Crear Nuevo Evento";
    }
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
    const infoImg = document.getElementById('info-img-actual');
    if (infoImg) infoImg.remove();
}

// -----------------------------------------------------------------
// --- FASE 3: LÓGICA DE BÚSQUEDA Y RESULTADOS (EVENTOS) ---
// (Esta sección no tiene cambios)
// -----------------------------------------------------------------

async function fetchEventosData() {
    try {
        const response = await fetch('/api/eventos', {
            headers: {
                'Authorization': getAuthToken()
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 alert("Error de autenticación. Saliendo...");
                 document.getElementById('logout-btn').click();
                 return;
            }
            throw new Error('No se pudo cargar eventos.json desde la API');
        }
        adminEventos = await response.json(); 
        renderizarResultadosEventos();
    } catch (error) {
        console.error(error);
        alert("Error fatal: No se pudieron cargar los datos de los eventos.");
    }
}

function inicializarPanelesBusquedaEventos() {
    const inputs = document.querySelectorAll('#form-busqueda-mod .form-input, #form-busqueda-baja .form-input');
    inputs.forEach(input => {
        const eventType = (input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, renderizarResultadosEventos);
    });
    
    document.querySelectorAll('#form-busqueda-mod .search-input-fecha, #form-busqueda-baja .search-input-fecha').forEach(input => {
        new Litepicker({
            element: input,
            format: 'YYYY-MM-DD',
            lang: 'es-ES',
            singleMode: true,
            allowRepick: true, 
            buttonText: {
                previousMonth: '<i class="bx bx-chevron-left"></i>',
                nextMonth: '<i class="bx bx-chevron-right"></i>',
                reset: '<i class="bx bx-x"></i>', 
                apply: 'Aplicar'
            },
            onselected: () => renderizarResultadosEventos(), 
        });
        input.addEventListener('change', () => {
            if (input.value === '') renderizarResultadosEventos();
        });
    });

    const modContainer = document.getElementById('mod-resultados-container');
    const bajaContainer = document.getElementById('baja-resultados-container');
    
    if (modContainer) modContainer.addEventListener('click', (e) => manejarClickTarjetaEvento(e, 'modificar'));
    if (bajaContainer) bajaContainer.addEventListener('click', (e) => manejarClickTarjetaEvento(e, 'eliminar'));
}
function renderizarResultadosEventos() {
    const contenedorMod = document.getElementById('mod-resultados-container');
    const contenedorBaja = document.getElementById('baja-resultados-container');
    if (!contenedorMod || !contenedorBaja) return;
    const filtrosMod = {
        fecha: document.getElementById('mod-search-fecha').value,
        tipo: document.getElementById('mod-search-tipo').value,
        titulo: document.getElementById('mod-search-titulo').value.toLowerCase(),
        tags: document.getElementById('mod-search-tags').value.toLowerCase(),
    };
    const filtrosBaja = {
        fecha: document.getElementById('baja-search-fecha').value,
        tipo: document.getElementById('baja-search-tipo').value,
        titulo: document.getElementById('baja-search-titulo').value.toLowerCase(),
        tags: document.getElementById('baja-search-tags').value.toLowerCase(),
    };
    const eventosFiltradosMod = filtrarEventos(filtrosMod)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const eventosFiltradosBaja = filtrarEventos(filtrosBaja)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    contenedorMod.innerHTML = eventosFiltradosMod.map(evento => crearTarjetaResultadoEvento(evento, 'modificar')).join('');
    contenedorBaja.innerHTML = eventosFiltradosBaja.map(evento => crearTarjetaResultadoEvento(evento, 'eliminar')).join('');
}
function filtrarEventos(filtros) {
    return adminEventos.filter(evento => {
        const checkTitulo = !filtros.titulo || 
                            (evento.titulo && evento.titulo.toLowerCase().includes(filtros.titulo)) ||
                            (evento.tipoEvento !== 'Regular' && evento.tipoEvento.toLowerCase().includes(filtros.titulo));
        const checkFecha = !filtros.fecha || (evento.fecha === filtros.fecha);
        const checkTipo = !filtros.tipo || (evento.tipoEvento === filtros.tipo);
        const checkTags = !filtros.tags || (evento.imgReferencia && evento.imgReferencia.join(' ').toLowerCase().includes(filtros.tags));
        return checkFecha && checkTipo && checkTitulo && checkTags;
    });
}

function crearTarjetaResultadoEvento(evento, tipoAccion) {
    const esModificar = tipoAccion === 'modificar';
    const botonHtml = esModificar
        ? `<button class="btn btn-card btn-card-modificar" data-id="${evento._id}"><i class='bx bxs-pencil'></i> Modificar</button>`
        : `<button class="btn btn-card btn-card-eliminar" data-id="${evento._id}"><i class='bx bxs-trash'></i> Eliminar</button>`;

    let tituloMostrar = evento.titulo;
    let imagenMostrar = (evento.imagen && evento.imagen !== "imgBandaGenerica.jpg") 
        ? `../img/${evento.imagen}` 
        : `../img/imgBandaGenerica.jpg`;
    
    if (evento.tipoEvento === 'Cerrado') {
        tituloMostrar = "CERRADO";
        imagenMostrar = "../img/cerrado.jpg";
    } else if (evento.tipoEvento === 'Privado') {
        tituloMostrar = "EVENTO PRIVADO";
        imagenMostrar = "../img/eventoPrivado.jpg";
    }
    const tipoClase = `tipo-${evento.tipoEvento.toLowerCase()}`;

    return `
    <div class="card-resultado" id="evento-card-${evento._id}">
        <div class="card-resultado-header">
            <img src="${imagenMostrar}" alt="${tituloMostrar}" class="card-resultado-img">
            <div class="card-resultado-info">
                <h4>${tituloMostrar || "Evento sin título"}</h4>
                <p>${evento.fecha}</p>
                <p class="${tipoClase}">${evento.tipoEvento}</p>
            </div>
        </div>
        <div class="card-resultado-body">
            <div class="data-pair">
                <strong>Live:</strong>
                <span>${evento.live || 'No asignado'}</span>
            </div>
            <div class="data-pair">
                <strong>Tags:</strong>
                <span>${(evento.imgReferencia && evento.imgReferencia.length > 0) ? evento.imgReferencia.join(', ') : 'Sin tags'}</span>
            </div>
        </div>
        <div class="card-resultado-footer">
            ${botonHtml}
        </div>
    </div>
    `;
}

function manejarClickTarjetaEvento(e, accion) {
    const boton = e.target.closest(accion === 'modificar' ? '.btn-card-modificar' : '.btn-card-eliminar');
    if (!boton) return; 
    
    const idMongo = boton.getAttribute('data-id'); 
    const evento = adminEventos.find(ev => ev._id === idMongo); 
    if (!evento) {
        alert("Error: No se encontró el evento.");
        return;
    }

    if (accion === 'modificar') {
        prellenarFormularioModEvento(evento);
    } else {
        eliminarEvento(evento, boton);
    }
}

async function eliminarEvento(evento, boton) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${evento.titulo || evento.tipoEvento}" del ${evento.fecha}? \n\n¡Esta acción es REAL y guarda un backup!`)) {
        return;
    }
    boton.disabled = true;
    boton.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
    
    try {
        const response = await fetch(`/api/eventos/eliminar/${evento._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthToken()
            }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(`Evento "${evento.titulo || evento.tipoEvento}" eliminado con éxito.`);
        
        fetchEventosData(); 
        
    } catch (error) {
        console.error("Error al eliminar evento:", error);
        alert(`Error: ${error.message}`);
        boton.disabled = false;
        boton.innerHTML = "<i class='bx bxs-trash'></i> Eliminar";
    }
}

function prellenarFormularioModEvento(evento) {
    modoEdicion = true;
    idEventoEdicion = evento._id; 
    
    const form = document.getElementById('form-alta-evento');
    form.classList.add('modo-edicion');
    
    const tabContent = form.closest('.tab-content');
    tabContent.querySelector('h3').textContent = `Modificando: ${evento.titulo || evento.tipoEvento}`;
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Modificaciones";

    const inputFecha = document.getElementById('evento-fecha');
    inputFecha.value = evento.fecha;
    
    // --- ¡ARREGLO! Aseguramos que el picker se destruya y recree
    if (picker) {
        picker.destroy();
    }
    picker = new Litepicker({
        element: inputFecha,
        format: 'YYYY-MM-DD',
        lang: 'es-ES',
        // (El resto de la config del picker...)
        buttonText: {
            previousMonth: '<i class="bx bx-chevron-left"></i>',
            nextMonth: '<i class="bx bx-chevron-right"></i>',
            reset: '<i class="bx bx-refresh"></i>',
            apply: 'Aplicar'
        },
        onselected: (date) => {
            const fechaSeleccionadaMillis = date.getTime();
            const hoyMillis = DateTime.now().startOf('day').toMillis();
            if (fechaSeleccionadaMillis < hoyMillis) {
                if (!confirm("Has seleccionado una fecha en el pasado. ¿Estás seguro de que quieres continuar?")) {
                    picker.setDate(evento.fecha); // Lo revierte a la fecha original
                }
            }
        }
    });
    picker.setDate(evento.fecha); 
    // --- FIN ARREGLO ---
    
    document.getElementById('evento-tipo').value = evento.tipoEvento;
    document.getElementById('evento-titulo').value = evento.titulo;
    document.getElementById('evento-live').value = evento.live || '';
    document.getElementById('evento-concierto').value = evento.concierto || '';
    document.getElementById('evento-tipo').dispatchEvent(new Event('change'));
    tags = evento.imgReferencia || [];
    renderizarTags();
    const checkGenerica = document.getElementById('evento-img-generica');
    const fieldsetImagen = document.getElementById('fieldset-imagen');
    const infoImg = document.getElementById('info-img-actual');
    if (infoImg) infoImg.remove();
    if (evento.imagen === 'imgBandaGenerica.jpg') {
        checkGenerica.checked = true;
        fieldsetImagen.disabled = true;
    } else {
        checkGenerica.checked = false;
        fieldsetImagen.disabled = false;
        const infoHtml = `
            <div id="info-img-actual" class="info-imagen-actual">
                <strong>Imagen Actual:</strong> ${evento.imagen}
                <br>
                <small>Sube un archivo nuevo para reemplazarla, o déjalo vacío para conservarla.</small>
            </div>
        `;
        fieldsetImagen.insertAdjacentHTML('afterbegin', infoHtml);
    }
    if (evento.tipoEvento === 'Cerrado' || evento.tipoEvento === 'Privado') {
        fieldsetImagen.disabled = true;
    }
    document.querySelector('.tab-link[data-tab="alta-evento"]').click();
    form.scrollIntoView({ behavior: 'smooth' });
}


// -----------------------------------------------------------------
// --- FASE 4/5/6: LÓGICA COMPLETA DE "CARTA" ---
// (Esta sección no tiene cambios, sigue en simulación)
// -----------------------------------------------------------------

// --- ¡¡¡INICIO DEL BLOQUE A REEMPLAZAR!!! ---
// --- ¡¡¡INICIO DEL BLOQUE A REEMPLAZAR!!! ---
// (Esta es la v4.9 - Solo construye el HTML)

function inicializarFormularioCarta() {
    const container = document.getElementById('smart-form-container');

    // 1. Rellenamos el HTML (SOLO LA PRIMERA VEZ)
    // Esto construye los <div id="fields-coctel"> etc.
    if (container.children.length === 0) {

        console.log("Construyendo formularios de carta por primera vez...");

        for (const tipo in plantillasFormCarta) {
            const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;
            const divId = `fields-${tipoPlantilla}`;
            if (!document.getElementById(divId)) {
                const div = document.createElement('div');
                div.id = divId;
                div.className = 'form-fields-group';
                div.innerHTML = plantillasFormCarta[tipoPlantilla];
                container.appendChild(div);
            }
        }
    }
}
// --- ¡¡¡FIN DEL BLOQUE A REEMPLAZAR!!! ---
// --- ¡¡¡FIN DEL BLOQUE A REEMPLAZAR!!! ---

function activarLogicaBilingue(visibleGroup) {
    const langTabs = visibleGroup.querySelectorAll('.lang-tab-btn');
    const langContents = visibleGroup.querySelectorAll('.lang-content');
    langTabs.forEach(tab => {
        // Usamos .replaceWith(cloneNode(true)) para limpiar listeners
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);

        newTab.addEventListener('click', (e) => {
            e.preventDefault(); 
            const lang = newTab.dataset.lang;
            visibleGroup.querySelectorAll('.lang-tab-btn').forEach(t => {
                t.style.color = '';
                t.style.border = '';
                t.classList.remove('active');
            });
            // Necesitamos buscar los tabs de nuevo dentro del grupo visible
            //visibleGroup.querySelectorAll('.lang-tab-btn').forEach(t => t.classList.remove('active'));
            newTab.classList.add('active');
            visibleGroup.querySelectorAll('.lang-content').forEach(c => {
                c.classList.toggle('active', c.dataset.langContent === lang);
            });
        });
    });
    
    const translateBtn = visibleGroup.querySelector('.btn-translate[data-lang-group="en"]');
    if (translateBtn) {
        // Limpiamos listener
        const newTranslateBtn = translateBtn.cloneNode(true);
        translateBtn.parentNode.replaceChild(newTranslateBtn, translateBtn);
        
        newTranslateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const langGroupES = visibleGroup.querySelector('.lang-content[data-lang-content="es"]');
            const langGroupEN = visibleGroup.querySelector('.lang-content[data-lang-content="en"]');
            const campos = ['titulo', 'descripcion', 'region', 'pais', 'varietal', 'crianza'];
            campos.forEach(campo => {
                const inputES = langGroupES.querySelector(`[id$="-${campo}-es"]`); 
                const inputEN = langGroupEN.querySelector(`[id$="-${campo}-en"]`); 
                if (inputES && inputEN && inputES.value) {
                    if (inputEN.value.trim() === '') {
                        inputEN.value = sugerirTraduccion(inputES.value); 
                    }
                }
            });
        });
    }
}
function resetearFormularioCarta() {
    const form = document.getElementById('form-alta-producto');
    if (!form) return;
    form.reset();
    document.getElementById('smart-form-container').querySelectorAll('.form-fields-group').forEach(group => {
        group.classList.remove('visible');
    });
    document.getElementById('form-actions-producto').style.display = 'none';
    document.getElementById('producto-tipo').value = "";
    modoEdicion = false;
    idEventoEdicion = null; 
    form.classList.remove('modo-edicion');
    const tabContent = document.getElementById('alta-producto');
    if (tabContent) {
        tabContent.querySelector('h3').textContent = "Crear Nuevo Producto";
    }
    const infoImg = document.getElementById('info-img-actual-prod');
    if (infoImg) infoImg.remove();
    
    // ¡IMPORTANTE!
    // Volvemos a inicializar el formulario para re-adjuntar los listeners
    // al formulario reseteado.
    //inicializarFormularioCarta();
}

// --- LÓGICA DE BÚSQUEDA Y VISIBILIDAD (CARTA) ---
// (Corregido con _id)

async function fetchProductosData() {
    try {
        const response = await fetch('/api/productos', {
             headers: {
                'Authorization': getAuthToken()
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 alert("Error de autenticación. Saliendo...");
                 document.getElementById('logout-btn').click();
                 return;
            }
            throw new Error('No se pudo cargar los archivos de carta desde la API.');
        }
        
        const data = await response.json(); 
        
        // ¡CAMBIO! La API ahora nos da la estructura completa
        // y nuestro backend la arma correctamente
        if (!data.es || !data.es.productos) {
            console.log("Datos recibidos de /api/productos:", data);
            throw new Error("La API no devolvió 'productos' para ES");
        }
        adminProductos = data.es.productos; 
        adminProductos_EN = data.en.productos; 
        
        renderizarResultadosProductos();
        
    } catch (error) {
        console.error(error);
        alert("Error fatal: No se pudieron cargar los datos de la carta.");
    }
}

function inicializarPanelesBusquedaProductos() {
    const inputs = document.querySelectorAll('#form-busqueda-producto .form-input');
    
    // --- ¡¡ARREGLO!! (Línea 1) ---
    // Volvemos a definir 'container' aquí
    const container = document.getElementById('prod-resultados-container');
    
    inputs.forEach(input => {
        const eventType = (input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, renderizarResultadosProductos);
    });

    // Listener para el botón "Modificar" (Este ya lo tenías)
    container.addEventListener('click', (e) => {
        const botonMod = e.target.closest('.btn-card-modificar');
        if (botonMod) {
            const idMongo = botonMod.dataset.id;
            const producto = adminProductos.find(p => p._id === idMongo);
            if (producto) {
                prellenarFormularioCarta(producto);
            }
        }
    });

    // --- ¡¡ARREGLO!! (Línea 2) ---
    // Este es el nuevo listener para el "Smart Switch"
    container.addEventListener('change', async (e) => {
        // Verificamos que sea el switch (el input checkbox)
        if (e.target.matches('.visibility-switch input[type="checkbox"]')) {
            const switchInput = e.target;
            const idMongo = switchInput.dataset.id;
            const nuevoEstado = switchInput.checked;
            const card = switchInput.closest('.card-resultado');

            // 1. Deshabilitamos el switch y damos feedback visual
            switchInput.disabled = true;
            card.style.opacity = '0.5';

            try {
                const response = await fetch(`/api/productos/visibilidad/${idMongo}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthToken()
                    },
                    body: JSON.stringify({ visualizacion: nuevoEstado })
                });
                
                if (!response.ok) throw new Error('Error de red al actualizar');
                
                // 2. Éxito: Actualizamos el estado visual de la card
                card.classList.toggle('deshabilitado', !nuevoEstado);

                // 3. (CRÍTICO) Actualizamos el dato local
                const productoEnCache = adminProductos.find(p => p._id === idMongo);
                if (productoEnCache) {
                    productoEnCache.visualizacion = nuevoEstado;
                }
                
            } catch (error) {
                console.error(error);
                alert("Error al guardar la visibilidad. Revirtiendo.");
                // 4. Error: Revertimos el switch
                switchInput.checked = !nuevoEstado;
            } finally {
                // 5. Siempre rehabilitamos el switch y la opacidad
                switchInput.disabled = false;
                card.style.opacity = '1';
            }
        }
    });
    // --- FIN DEL CÓDIGO NUEVO ---
}
// (renderizarResultadosProductos no cambia)
function renderizarResultadosProductos() {
    const contenedor = document.getElementById('prod-resultados-container');
    if (!contenedor) return;
    const filtros = {
        titulo: document.getElementById('prod-search-titulo').value.toLowerCase(),
        tipo: document.getElementById('prod-search-tipo').value,
    };
    const eventosFiltrados = adminProductos.filter(prod => { 
        const checkTitulo = !filtros.titulo || (prod.titulo && prod.titulo.toLowerCase().includes(filtros.titulo));
        const checkTipo = !filtros.tipo || prod.tipo === filtros.tipo;
        return checkTitulo && checkTipo;
    });
    contenedor.innerHTML = eventosFiltrados.map(prod => crearTarjetaResultadoProducto(prod)).join('');
}

function crearTarjetaResultadoProducto(prod) {
    const imgRuta = (prod.imagen) ? `../img/${prod.imagen}` : `../img/bebidaSinFoto.jpg`;
    const precio = formatarPrecio(prod.precioCopa || prod.precioBotella || prod.precioPinta);
    
    const estaHabilitado = (prod.visualizacion === undefined) ? true : prod.visualizacion; 
    const deshabilitadoClass = estaHabilitado ? '' : 'deshabilitado';
    const switchChecked = estaHabilitado ? 'checked' : '';

    return `
    <div class="card-resultado ${deshabilitadoClass}" id="prod-card-${prod._id}">
        <div class="card-resultado-header">
            <img src="${imgRuta}" alt="${prod.titulo}" class="card-resultado-img">
            <div class="card-resultado-info">
                <h4>${prod.titulo}</h4>
                <p>${prod.tipo}</p>
                <p class="tipo-regular">Precio: ${precio}</p>
            </div>
        </div>
        
        <div class="card-resultado-footer">
            <button class="btn btn-card btn-card-modificar" data-id="${prod._id}">
                <i class='bx bxs-pencil'></i> Modificar
            </button>
            
            <div class="visibility-switch">
                <label class="switch">
                    <input type="checkbox" data-id="${prod._id}" ${switchChecked}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    </div>
    `;
}

function prellenarFormularioCarta(prod) {
    //inicializarFormularioCarta();
    modoEdicion = true;
    idEventoEdicion = prod._id; 
    
    const form = document.getElementById('form-alta-producto');
    form.classList.add('modo-edicion');
    
    const tabContent = document.getElementById('alta-producto');
    if (tabContent) { 
        tabContent.querySelector('h3').textContent = `Modificando: ${prod.titulo}`;
    }
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Modificaciones";

    console.log("SIMULACIÓN: Guardando copia de seguridad de producto...", prod);

    const selectorTipo = document.getElementById('producto-tipo');
    selectorTipo.value = prod.tipo;
    selectorTipo.dispatchEvent(new Event('change'));
    
    const tipoPlantilla = prod.tipo.startsWith('vino') ? 'vino' : prod.tipo;
    const visibleGroup = document.getElementById(`fields-${tipoPlantilla}`);
    
    const prod_es = adminProductos.find(p => p._id === prod._id); 
    const prod_en = adminProductos_EN.find(p => p._id === prod._id); 
    
    if (!prod_es || !prod_en) {
        alert("Error: No se pudo encontrar el producto en ambos idiomas.");
        return;
    }

    (visibleGroup.querySelector('#producto-titulo') || {}).value = prod_es.titulo || '';
    (visibleGroup.querySelector('#producto-precio-copa') || {}).value = prod_es.precioCopa || '';
    (visibleGroup.querySelector('#producto-precio-botella') || {}).value = prod_es.precioBotella || '';
    (visibleGroup.querySelector('#producto-precio-cana') || {}).value = prod_es.precioCana || '';
    (visibleGroup.querySelector('#producto-precio-pinta') || {}).value = prod_es.precioPinta || '';
    (visibleGroup.querySelector('#producto-productor') || {}).value = prod_es.productor || '';
    (visibleGroup.querySelector('#producto-ano') || {}).value = prod_es.ano || '';
    (visibleGroup.querySelector('#producto-abv') || {}).value = prod_es.abv || '';
    (visibleGroup.querySelector('#producto-ibu') || {}).value = prod_es.ibu || '';
    (visibleGroup.querySelector('#producto-destacado') || {}).checked = prod_es.destacado || false;
    (visibleGroup.querySelector('#producto-titulo-es') || {}).value = prod_es.titulo || ''; 
    (visibleGroup.querySelector('#producto-descripcion-es') || {}).value = prod_es.descripcion || '';
    (visibleGroup.querySelector('#producto-region-es') || {}).value = prod_es.region || '';
    (visibleGroup.querySelector('#producto-pais-es') || {}).value = prod_es.pais || '';
    (visibleGroup.querySelector('#producto-varietal-es') || {}).value = prod_es.varietal || '';
    (visibleGroup.querySelector('#producto-crianza-es') || {}).value = prod_es.crianza || '';
    (visibleGroup.querySelector('#producto-titulo-en') || {}).value = prod_en.titulo || ''; 
    (visibleGroup.querySelector('#producto-descripcion-en') || {}).value = prod_en.descripcion || '';
    (visibleGroup.querySelector('#producto-region-en') || {}).value = prod_en.region || '';
    (visibleGroup.querySelector('#producto-pais-en') || {}).value = prod_en.pais || '';
    (visibleGroup.querySelector('#producto-varietal-en') || {}).value = prod_en.varietal || '';
    (visibleGroup.querySelector('#producto-crianza-en') || {}).value = prod_en.crianza || '';
    const infoImg = document.getElementById('info-img-actual-prod');
    if (infoImg) infoImg.remove();
    if (prod.imagen && prod.imagen !== 'bebidaSinFoto.jpg') {
        const infoHtml = `
            <div id="info-img-actual-prod" class="info-imagen-actual">
                <strong>Imagen Actual:</strong> ${prod.imagen}
                <br>
                <small>Sube un archivo nuevo para reemplazarla, o déjalo vacío para conservarla.</small>
            </div>
        `;
        const formSection = visibleGroup.querySelector('.form-section');
        if (formSection) {
            formSection.insertAdjacentHTML('afterbegin', infoHtml);
        }
    }
    
    document.querySelector('.tab-link[data-tab="alta-producto"]').click();
    form.scrollIntoView({ behavior: 'smooth' });
}

// --- ¡ARREGLO! Arreglo Bug Guardar Carta ---
function recolectarDatosProducto(formGroup, tipo) {

    // --- 1. DATOS ÚNICOS (No se traducen) ---
    const datosUnicos = {
        tipo: tipo,
        visualizacion: true, // Siempre visible al crear
        destacado: (formGroup.querySelector('#producto-destacado') || {}).checked || false,
        
        // ¡ARREGLO! Comprobamos si el input de imagen existe antes de leerlo
        imagen: null, 

        precioCopa: parseFloat(formGroup.querySelector('#producto-precio-copa')?.value) || null,
        precioBotella: parseFloat(formGroup.querySelector('#producto-precio-botella')?.value) || null,
        precioCana: parseFloat(formGroup.querySelector('#producto-precio-cana')?.value) || null,
        precioPinta: parseFloat(formGroup.querySelector('#producto-precio-pinta')?.value) || null,
        abv: parseFloat(formGroup.querySelector('#producto-abv')?.value) || null,
        ibu: parseInt(formGroup.querySelector('#producto-ibu')?.value) || null,
        productor: (formGroup.querySelector('#producto-productor') || {}).value || null,
        ano: (formGroup.querySelector('#producto-ano') || {}).value || null,
        tituloUnico: (formGroup.querySelector('#producto-titulo') || {}).value || null
    };

    // --- Lógica de Imagen (Corregida) ---
    const inputFile = formGroup.querySelector('#producto-imagen-upload');
    
    // ¡ARREGLO! inputFile.files puede ser null
    if (inputFile && inputFile.files && inputFile.files.length > 0) {
        // Si el input existe y tiene un archivo, guardamos el nombre
        datosUnicos.imagen = inputFile.files[0].name;
    } else if (tipo === 'coctel' || tipo.startsWith('vino')) {
        // Si no, y es un tipo que requiere imagen, ponemos la de por defecto
        datosUnicos.imagen = 'bebidaSinFoto.jpg';
    }
    // Si no es ninguno de esos (ej. Cerveza), 'imagen' se queda en 'null'

    // --- 2. DATOS TRADUCIBLES (ES) ---
    const datosES = {
        titulo: formGroup.querySelector('#producto-titulo-es')?.value || '',
        descripcion: formGroup.querySelector('#producto-descripcion-es')?.value || '',
        region: formGroup.querySelector('#producto-region-es')?.value || null,
        pais: formGroup.querySelector('#producto-pais-es')?.value || null,
        varietal: formGroup.querySelector('#producto-varietal-es')?.value || null,
        crianza: formGroup.querySelector('#producto-crianza-es')?.value || null,
    };

    // --- 3. DATOS TRADUCIBLES (EN) ---
    const datosEN = {
        titulo: formGroup.querySelector('#producto-titulo-en')?.value || '',
        descripcion: formGroup.querySelector('#producto-descripcion-en')?.value || '',
        region: formGroup.querySelector('#producto-region-en')?.value || null,
        pais: formGroup.querySelector('#producto-pais-en')?.value || null,
        varietal: formGroup.querySelector('#producto-varietal-en')?.value || null,
        crianza: formGroup.querySelector('#producto-crianza-en')?.value || null,
    };

    // --- 4. LÓGICA DE TÍTULO HÍBRIDO (Tu requisito) ---
    if (tipo === 'coctel' || tipo === 'sinAlcohol') {
        datosUnicos.tituloUnico = null; 
    } else {
        // ¡ARREGLO! Usamos el tituloUnico como fallback
        datosES.titulo = datosUnicos.tituloUnico || datosES.titulo;
        datosEN.titulo = datosUnicos.tituloUnico || datosEN.titulo;
    }

    // 5. Combinamos y devolvemos
    const producto_es = { ...datosUnicos, ...datosES };
    const producto_en = { ...datosUnicos, ...datosEN };
    
    delete producto_es.tituloUnico;
    delete producto_en.tituloUnico;

    return { producto_es, producto_en };
}
});

//ACA ESTÁ LA PALABRA CLAVE SECRETA: CONEJO
