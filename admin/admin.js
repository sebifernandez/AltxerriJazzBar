/* --- ADMIN.JS - CMS Altxerri --- */
/* --- VERSIÓN FINAL (CON LÓGICA DE LOGIN INCLUIDA) --- */

// --- Variables Globales ---
const { DateTime } = luxon; // Usamos Luxon (cargado en el head)
let adminEventos = []; // Almacén para los eventos cargados desde eventos.json
let modoEdicion = false; // Flag para saber si el form de Alta está en modo Edición
let idEventoEdicion = null; // Guarda el ID (fecha/id) del item que estamos editando

let adminProductos = []; // Almacén para CARTA_ES.JSON
let adminProductos_EN = []; // Almacén para CARTA_EN.JSON (para modificar)
let modoVisibilidad = false; // Flag para el modo On/Off de productos

/**
 * Helper para formatear precios.
 */
function formatarPrecio(precio) {
    if (!precio || precio === 0) {
        return '–'; 
    }
    return `${precio}€`;
}

/**
 * Helper de Traducción (Simulación Gratuita)
 */
function sugerirTraduccion(texto) {
    if (!texto) return "";
    console.log("Simulando traducción...");
    return texto; 
}


// --- Inicializador Principal ---
document.addEventListener('DOMContentLoaded', () => {

    // --- ¡ARREGLO! LÓGICA DE LOGIN (Paso 2.2) AÑADIDA ---
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        const errorMessage = document.getElementById('login-error');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            errorMessage.textContent = 'Verificando...';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // ¡El "PASE"! El mozo llama a la cocina (/api/login)
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }) // La "orden"
                });

                const data = await response.json();

                if (data.success) {
                    // ¡Éxito! La cocina dijo "OK". Vamos al dashboard.
                    window.location.href = 'dashboard.html';
                } else {
                    // ¡Fallo! La cocina dijo "Error".
                    errorMessage.textContent = data.message;
                }
            } catch (error) {
                console.error('Error de red al intentar login:', error);
                errorMessage.textContent = 'Error de conexión. Intenta de nuevo.';
            }
        });
    }
    // --- FIN DEL ARREGLO DE LOGIN ---


    // --- Lógica FASE 1: Navegación Base ---
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const tabLinks = document.querySelectorAll('.tab-link');
    const dashCards = document.querySelectorAll('.dash-card');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if(navLinks.length > 0) { // Solo ejecutar si estamos en el dashboard
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

                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }
    
    if(dashCards.length > 0) { // Solo ejecutar si estamos en el dashboard
        dashCards.forEach(card => {
            card.addEventListener('click', () => {
                const targetId = card.getAttribute('data-target');
                document.querySelector(`.nav-link[data-target="${targetId}"]`).click();
            });
        });
    }

    if(tabLinks.length > 0) { // Solo ejecutar si estamos en el dashboard
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
                
                if (targetId === 'alta-evento' && !modoEdicion) {
                    resetearFormularioAlta();
                }
                if (targetId === 'alta-producto' && !modoEdicion) {
                    resetearFormularioCarta();
                }
            });
        });
    }
    
    // --- Lógica FASE 2: Formulario de Alta Eventos ---
    const formAlta = document.getElementById('form-alta-evento');
    if (formAlta) {
        inicializarFormularioAlta();
    }
    
    // --- Lógica FASE 3: Búsqueda Eventos ---
    // (Solo cargamos datos si estamos en el dashboard)
    if (document.getElementById('form-busqueda-mod')) {
        fetchEventosData();
        inicializarPanelesBusquedaEventos();
    }
    
    // --- Lógica FASE 4/5/6: Formulario de Alta Carta ---
    const formAltaProducto = document.getElementById('form-alta-producto');
    if (formAltaProducto) {
        inicializarFormularioCarta();
    }

    // --- Lógica FASE 5/6: Búsqueda Carta ---
    // (Solo cargamos datos si estamos en el dashboard)
    if (document.getElementById('form-busqueda-producto')) {
        fetchProductosData();
        inicializarPanelesBusquedaProductos();
    }
});


// -----------------------------------------------------------------
// --- FASE 2: LÓGICA DEL FORMULARIO DE ALTA (EVENTOS) ---
// -----------------------------------------------------------------

let tags = []; 
let picker; 

function inicializarFormularioAlta() {
    
    const form = document.getElementById('form-alta-evento');
    const inputFecha = document.getElementById('evento-fecha');
    const checkGenerica = document.getElementById('evento-img-generica');
    const fieldsetImagen = document.getElementById('fieldset-imagen');
    const inputTag = document.getElementById('evento-tags');
    const tagContainer = document.getElementById('tag-container');
    
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
            const fechaSeleccionadaMillis = date.getTime();
            const hoyMillis = DateTime.now().startOf('day').toMillis();
            
            if (fechaSeleccionadaMillis < hoyMillis) {
                if (!confirm("Has seleccionado una fecha en el pasado. ¿Estás seguro de que quieres continuar?")) {
                    picker.clearSelection(); 
                }
            }
        }
    });

    checkGenerica.addEventListener('change', () => {
        fieldsetImagen.disabled = checkGenerica.checked;
        if (checkGenerica.checked) {
            tags = [];
            renderizarTags();
            document.getElementById('evento-imagen-upload').value = '';
        }
    });

    inputTag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); 
            const tagTexto = inputTag.value.trim();
            if (tagTexto.length > 0 && !tags.includes(tagTexto)) {
                tags.push(tagTexto);
                renderizarTags();
            }
            inputTag.value = ''; 
        }
    });
    
    tagContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-tag-btn')) {
            const tagTexto = e.target.getAttribute('data-tag');
            tags = tags.filter(t => t !== tagTexto);
            renderizarTags();
        }
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
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

        if (!eventoData.fecha || !eventoData.tipoEvento || !eventoData.titulo) {
            alert("Error: 'Fecha', 'Tipo de Evento' y 'Título' son campos obligatorios.");
            return;
        }

        if ((eventoData.live && !esURLValida(eventoData.live)) || (eventoData.concierto && !esURLValida(eventoData.concierto))) {
            alert("Error: 'Link Live' y 'Link Concierto' deben ser una URL válida (ej: https://...).");
            return;
        }
        
        let imagenNombre = "imgBandaGenerica.jpg";
        
        if (!eventoData.usaGenerica) {
            if (eventoData.archivoImagen) {
                imagenNombre = eventoData.archivoImagen.name;
                if (eventoData.imgReferencia.length === 0) {
                    alert("Error: Debes añadir al menos un 'Tag de Referencia' si subes una imagen nueva.");
                    return;
                }
            } else if (modoEdicion) {
                const eventoOriginal = adminEventos.find(ev => ev.id === idEventoEdicion);
                imagenNombre = eventoOriginal.imagen || "imgBandaGenerica.jpg";
            }
        }
        
        const eventoFinal = {
            id: modoEdicion ? idEventoEdicion : `evt_${Date.now()}`,
            fecha: eventoData.fecha,
            tipoEvento: eventoData.tipoEvento,
            imagen: imagenNombre,
            imgReferencia: eventoData.imgReferencia,
            titulo: eventoData.titulo,
            live: eventoData.live,
            concierto: eventoData.concierto
        };

        if (modoEdicion) {
            console.log("MODIFICANDO EVENTO (ID Original: " + idEventoEdicion + ")", JSON.stringify(eventoFinal, null, 2));
            alert("¡Evento Modificado con Éxito! (Simulación)");
        } else {
            if (adminEventos.some(ev => ev.fecha === eventoFinal.fecha)) {
                if (!confirm("¡Atención! Ya existe un evento en esta fecha. ¿Deseas sobrescribirlo?")) {
                    return;
                }
            }
            console.log("CREANDO NUEVO EVENTO", JSON.stringify(eventoFinal, null, 2));
            alert("¡Evento Creado con Éxito! (Simulación)");
        }
        
        fetchEventosData(); 
        resetearFormularioAlta();
    });
}

function renderizarTags() {
    const tagContainer = document.getElementById('tag-container');
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

function resetearFormularioAlta() {
    const form = document.getElementById('form-alta-evento');
    form.reset();
    tags = [];
    renderizarTags();
    if (picker) picker.clearSelection();
    document.getElementById('fieldset-imagen').disabled = false;
    
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
// -----------------------------------------------------------------

async function fetchEventosData() {
    try {
        // ¡CAMBIO! Ahora llamamos a nuestra API (el Backend)
        const response = await fetch('/api/eventos');
        if (!response.ok) {
            throw new Error('No se pudo cargar eventos.json desde la API');
        }
        // ¡CAMBIO! La API ya nos da el JSON directamente
        adminEventos = await response.json(); 

        adminEventos.forEach((ev, index) => ev.id = ev.id || ev.fecha || `evt_${index}`);
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
    // Si no estamos en el dashboard, no hacer nada
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
    
    const eventosFiltradosMod = filtrarEventos(filtrosMod).reverse();
    const eventosFiltradosBaja = filtrarEventos(filtrosBaja).reverse();

    contenedorMod.innerHTML = eventosFiltradosMod.map(evento => crearTarjetaResultadoEvento(evento, 'modificar')).join('');
    contenedorBaja.innerHTML = eventosFiltradosBaja.map(evento => crearTarjetaResultadoEvento(evento, 'eliminar')).join('');
}

function filtrarEventos(filtros) {
    return adminEventos.filter(evento => {
        const checkFecha = !filtros.fecha || (evento.fecha === filtros.fecha);
        const checkTipo = !filtros.tipo || (evento.tipoEvento === filtros.tipo);
        const checkTitulo = !filtros.titulo || (evento.titulo.toLowerCase().includes(filtros.titulo));
        const checkTags = !filtros.tags || (evento.imgReferencia && evento.imgReferencia.join(' ').toLowerCase().includes(filtros.tags));
        
        return checkFecha && checkTipo && checkTitulo && checkTags;
    });
}

function crearTarjetaResultadoEvento(evento, tipoAccion) {
    const esModificar = tipoAccion === 'modificar';
    const botonHtml = esModificar
        ? `<button class="btn btn-card btn-card-modificar" data-id="${evento.id}"><i class='bx bxs-pencil'></i> Modificar</button>`
        : `<button class="btn btn-card btn-card-eliminar" data-id="${evento.id}"><i class='bx bxs-trash'></i> Eliminar</button>`;

    const tipoClase = `tipo-${evento.tipoEvento.toLowerCase()}`;
    const imgRuta = (evento.imagen && evento.imagen !== "imgBandaGenerica.jpg") 
        ? `../img/${evento.imagen}` 
        : `../img/imgBandaGenerica.jpg`; 

    return `
    <div class="card-resultado" id="evento-card-${evento.id}">
        <div class="card-resultado-header">
            <img src="${imgRuta}" alt="${evento.titulo}" class="card-resultado-img">
            <div class="card-resultado-info">
                <h4>${evento.titulo || "Evento sin título"}</h4>
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
    
    const idEvento = boton.getAttribute('data-id');
    const evento = adminEventos.find(ev => ev.id === idEvento);
    if (!evento) {
        alert("Error: No se encontró el evento.");
        return;
    }

    if (accion === 'modificar') {
        prellenarFormularioModEvento(evento);
    } else {
        eliminarEvento(evento);
    }
}

function eliminarEvento(evento) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${evento.titulo}" del ${evento.fecha}? \n\nEsta acción es permanente (simulación).`)) {
        return;
    }

    const eventoEliminado = {
        ...evento,
        fechaEliminacion: DateTime.now().toISODate(),
        horaEliminacion: DateTime.now().toISOTime()
    };
    
    console.log("SIMULACIÓN: Enviando a eventosEliminados.json", JSON.stringify(eventoEliminado, null, 2));
    alert(`Evento "${evento.titulo}" eliminado (Simulación).`);
    
    adminEventos = adminEventos.filter(ev => ev.id !== evento.id);
    renderizarResultadosEventos();
}

function prellenarFormularioModEvento(evento) {
    modoEdicion = true;
    idEventoEdicion = evento.id; 
    
    const form = document.getElementById('form-alta-evento');
    form.classList.add('modo-edicion');
    
    const tabContent = form.closest('.tab-content');
    tabContent.querySelector('h3').textContent = `Modificando: ${evento.titulo}`;
    
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Modificaciones";

    const eventoModificado = {
        ...evento,
        fechaModificacion: DateTime.now().toISODate(),
        horaModificacion: DateTime.now().toISOTime()
    };
    console.log("SIMULACIÓN: Guardando copia de seguridad en eventosModificados.json", JSON.stringify(eventoModificado, null, 2));

    document.getElementById('evento-fecha').value = evento.fecha;
    if (picker) picker.setDate(evento.fecha); 
    
    document.getElementById('evento-tipo').value = evento.tipoEvento;
    document.getElementById('evento-titulo').value = evento.titulo;
    document.getElementById('evento-live').value = evento.live || '';
    document.getElementById('evento-concierto').value = evento.concierto || '';

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

    document.querySelector('.tab-link[data-tab="alta-evento"]').click();
    form.scrollIntoView({ behavior: 'smooth' });
}


// -----------------------------------------------------------------
// --- FASE 4/5/6: LÓGICA COMPLETA DE "CARTA" (BILINGÜE v2.0) ---
// -----------------------------------------------------------------

// --- Plantillas HTML para el "Smart Form" Bilingüe (v2.0) ---
const plantillasBloques = {
    // --- Bloques de DATOS ÚNICOS (No se traducen) ---
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
                    <label for="producto-precio-copa">Precio (Vaso) *</label>
                    <input type="number" step="0.01" id="producto-precio-copa" class="form-input" placeholder="Ej: 8" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Botella)</label>
                    <input type="number" step="0.01" id="producto-precio-botella" class="form-input" placeholder="Ej: 65">
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

    // --- Bloques de DATOS TRADUCIBLES (ES) ---
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

    
    // --- Bloques de DATOS TRADUCIBLES (EN) ---
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
    
    // --- Bloque Contenedor Bilingüe ---
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

// --- AHORA CONSTRUIMOS LAS PLANTILLAS USANDO LOS BLOQUES ---
const plantillasFormCarta = {
    // --- Títulos Traducibles (Genéricos) ---
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
    
    // --- Títulos Únicos (De Marca) ---
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
            // (Mod #1) 'crianza' movido a traducibles
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
            // (Mod #1) 'crianza' movido a traducibles
            plantillasBloques.trad_es_region_pais + plantillasBloques.trad_es_crianza_destilado + plantillasBloques.trad_es_descripcion,
            plantillasBloques.trad_en_region_pais + plantillasBloques.trad_en_crianza_destilado + plantillasBloques.trad_en_descripcion
        )}
    `
};

// --- Función Principal de la Fase 4/6 ---
function inicializarFormularioCarta() {
    const selectorTipo = document.getElementById('producto-tipo');
    const container = document.getElementById('smart-form-container');
    const actions = document.getElementById('form-actions-producto');
    const form = document.getElementById('form-alta-producto');

    // 1. Crear los contenedores para cada tipo
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

    // 2. Escuchar cambios en el selector
    selectorTipo.addEventListener('change', () => {
        let tipoSeleccionado = selectorTipo.value;
        container.querySelectorAll('.form-fields-group').forEach(group => {
            group.classList.remove('visible');
        });

        const tipoPlantilla = tipoSeleccionado.startsWith('vino') ? 'vino' : tipoSeleccionado;

        if (tipoSeleccionado) {
            const grupoAMostrar = document.getElementById(`fields-${tipoPlantilla}`);
            if (grupoAMostrar) {
                grupoAMostrar.classList.add('visible');
                activarLogicaBilingue(grupoAMostrar);
            }
            actions.style.display = 'block'; 
        } else {
            actions.style.display = 'none'; 
        }
    });

    // 3. Lógica de Submit Bilingüe
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tipo = selectorTipo.value;
        if (!tipo) {
            alert("Error: Debes seleccionar un tipo de producto.");
            return;
        }

        const tipoPlantilla = tipo.startsWith('vino') ? 'vino' : tipo;
        const visibleGroup = document.getElementById(`fields-${tipoPlantilla}`);
        
        if (!visibleGroup) {
            alert("Error interno: No se encontró el grupo de formulario.");
            return;
        }
        
        // --- A. Recolección de Datos ---
        const producto_es = { id: modoEdicion ? idEventoEdicion : `prod_${Date.now()}`, tipo: tipo };
        const producto_en = { id: producto_es.id, tipo: tipo };

        // --- B. Campos Únicos (se copian a ambos) ---
        const camposUnicos = {
            visualizacion: true,
            destacado: (visibleGroup.querySelector('#producto-destacado') || {}).checked || false,
            imagen: (visibleGroup.querySelector('#producto-imagen-upload') || {}).files[0]?.name || (modoEdicion ? adminProductos.find(p => p.id === idEventoEdicion).imagen : 'bebidaSinFoto.jpg'),
            precioCopa: (visibleGroup.querySelector('#producto-precio-copa') || {}).value || null,
            precioBotella: (visibleGroup.querySelector('#producto-precio-botella') || {}).value || null,
            precioCana: (visibleGroup.querySelector('#producto-precio-cana') || {}).value || null,
            precioPinta: (visibleGroup.querySelector('#producto-precio-pinta') || {}).value || null,
            productor: (visibleGroup.querySelector('#producto-productor') || {}).value || null,
            ano: (visibleGroup.querySelector('#producto-ano') || {}).value || null,
            abv: (visibleGroup.querySelector('#producto-abv') || {}).value || null,
            ibu: (visibleGroup.querySelector('#producto-ibu') || {}).value || null,
            titulo: (visibleGroup.querySelector('#producto-titulo') || {}).value || null 
        };
        Object.assign(producto_es, camposUnicos);
        Object.assign(producto_en, camposUnicos);

        // --- C. Campos Traducibles (ES) ---
        producto_es.titulo = producto_es.titulo || (visibleGroup.querySelector('#producto-titulo-es') || {}).value; // Título genérico
        producto_es.descripcion = (visibleGroup.querySelector('#producto-descripcion-es') || {}).value;
        producto_es.region = (visibleGroup.querySelector('#producto-region-es') || {}).value;
        producto_es.pais = (visibleGroup.querySelector('#producto-pais-es') || {}).value;
        producto_es.varietal = (visibleGroup.querySelector('#producto-varietal-es') || {}).value;
        producto_es.crianza = (visibleGroup.querySelector('#producto-crianza-es') || {}).value;
        
        // --- D. Campos Traducibles (EN) ---
        producto_en.titulo = producto_en.titulo || (visibleGroup.querySelector('#producto-titulo-en') || {}).value; // Título genérico
        producto_en.descripcion = (visibleGroup.querySelector('#producto-descripcion-en') || {}).value;
        producto_en.region = (visibleGroup.querySelector('#producto-region-en') || {}).value;
        producto_en.pais = (visibleGroup.querySelector('#producto-pais-en') || {}).value;
        producto_en.varietal = (visibleGroup.querySelector('#producto-varietal-en') || {}).value;
        producto_en.crianza = (visibleGroup.querySelector('#producto-crianza-en') || {}).value;

        // --- E. Validación ---
        if (!producto_es.titulo || !producto_en.titulo) {
            alert("Error: El campo Título es obligatorio.");
            return;
        }
         if (!producto_es.descripcion || !producto_en.descripcion) {
            alert("Error: El campo Descripción es obligatorio.");
            return;
        }
        
        // --- F. Simulación de Guardado ---
        if (modoEdicion) {
            console.log("MODIFICANDO PRODUCTO (ES)", JSON.stringify(producto_es, null, 2));
            console.log("MODIFICANDO PRODUCTO (EN)", JSON.stringify(producto_en, null, 2));
            alert(`¡Producto "${producto_es.titulo}" modificado con éxito! (Simulación)`);
        } else {
            console.log("CREANDO PRODUCTO (ES)", JSON.stringify(producto_es, null, 2));
            console.log("CREANDO PRODUCTO (EN)", JSON.stringify(producto_en, null, 2));
            alert(`¡Producto "${producto_es.titulo}" creado con éxito! (Simulación)`);
        }
        
        fetchProductosData();
        resetearFormularioCarta();
    });
}

/**
 * Añade la lógica a las pestañas de idioma,
 * botones de traducción y auto-completado.
 */
function activarLogicaBilingue(visibleGroup) {
    // 1. Pestañas de Idioma (para Móvil)
    const langTabs = visibleGroup.querySelectorAll('.lang-tab-btn');
    const langContents = visibleGroup.querySelectorAll('.lang-content');

    langTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault(); 
            const lang = tab.dataset.lang;
            langTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            langContents.forEach(c => {
                c.classList.toggle('active', c.dataset.langContent === lang);
            });
        });
    });

    // 2. Botón "Sugerir Traducción" (Mod #3)
    const translateBtn = visibleGroup.querySelector('.btn-translate[data-lang-group="en"]');
    if (translateBtn) {
        translateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const langGroupES = visibleGroup.querySelector('.lang-content[data-lang-content="es"]');
            const langGroupEN = visibleGroup.querySelector('.lang-content[data-lang-content="en"]');

            // --- ¡ARREGLO 2! (Añadimos 'pais') ---
            // Lista de todos los campos a traducir
            const campos = ['titulo', 'descripcion', 'region', 'pais', 'varietal', 'crianza'];
            
            campos.forEach(campo => {
                const inputES = langGroupES.querySelector(`[id$="-${campo}-es"]`); // Busca ej: producto-titulo-es
                const inputEN = langGroupEN.querySelector(`[id$="-${campo}-en"]`); // Busca ej: producto-titulo-en
                
                if (inputES && inputEN && inputES.value) {
                    // Solo traduce si el campo EN está vacío
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
}


// -----------------------------------------------------------------
// --- FASE 5: LÓGICA DE BÚSQUEDA Y VISIBILIDAD (CARTA) ---
// (Actualizada para funcionar con datos ES y EN)
// -----------------------------------------------------------------

async function fetchProductosData() {
    try {
        // ¡CAMBIO! Llamamos a la nueva API de productos
        const response = await fetch('/api/productos');

        if (!response.ok) {
            throw new Error('No se pudo cargar los archivos de carta desde la API.');
        }

        // ¡CAMBIO! La API nos devuelve un objeto { es: ..., en: ... }
        const data = await response.json(); 

        adminProductos = data.es.productos; 
        adminProductos_EN = data.en.productos;

        // Asignamos IDs únicos
        adminProductos.forEach((prod, index) => {
            const id = prod.id || `prod_${prod.titulo.replace(/\s/g, '_')}_${index}`;
            prod.id = id;
            if (adminProductos_EN[index]) {
                adminProductos_EN[index].id = id;
            }
        });

        renderizarResultadosProductos();

    } catch (error) {
        console.error(error);
        alert("Error fatal: No se pudieron cargar los datos de la carta.");
    }
}

function inicializarPanelesBusquedaProductos() {
    const inputs = document.querySelectorAll('#form-busqueda-producto .form-input');
    inputs.forEach(input => {
        const eventType = (input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, renderizarResultadosProductos);
    });

    // Lógica del "Modo Visibilidad"
    const btnToggle = document.getElementById('btn-toggle-visibility');
    const btnConfirm = document.getElementById('btn-confirm-visibility');
    const container = document.getElementById('prod-resultados-container');
    
    btnToggle.addEventListener('click', () => {
        modoVisibilidad = !modoVisibilidad;
        container.classList.toggle('visibility-mode', modoVisibilidad);
        
        if (modoVisibilidad) {
            btnToggle.innerHTML = "<i class='bx bx-pencil'></i> Salir de Modo Visibilidad";
            btnToggle.classList.replace('btn-secondary', 'btn-primary');
            btnConfirm.style.display = 'inline-flex';
        } else {
            btnToggle.innerHTML = "<i class='bx bx-toggle-left'></i> Activar Modo Visibilidad";
            btnToggle.classList.replace('btn-primary', 'btn-secondary');
            btnConfirm.style.display = 'none';
        }
    });
    
    btnConfirm.addEventListener('click', () => {
        const cambios = [];
        container.querySelectorAll('.visibility-switch input').forEach(toggle => {
            const id = toggle.dataset.id;
            const producto = adminProductos.find(p => p.id === id);
            
            const estadoActual = (producto.visualizacion !== undefined) ? producto.visualizacion : true;
            
            if (producto && toggle.checked !== estadoActual) {
                cambios.push({ id: id, nuevoEstado: toggle.checked });
            }
        });

        if (cambios.length === 0) {
            alert("No se ha realizado ningún cambio de visibilidad.");
            return;
        }

        console.log("SIMULACIÓN: Guardando cambios de visibilidad...", cambios);
        alert(`Se han actualizado ${cambios.length} productos. (Simulación)`);
        
        cambios.forEach(cambio => {
            const productoES = adminProductos.find(p => p.id === cambio.id);
            const productoEN = adminProductos_EN.find(p => p.id === cambio.id);
            if (productoES) productoES.visualizacion = cambio.nuevoEstado;
            if (productoEN) productoEN.visualizacion = cambio.nuevoEstado;
        });
        
        btnToggle.click(); 
        renderizarResultadosProductos();
    });

    container.addEventListener('click', (e) => {
        const botonMod = e.target.closest('.btn-card-modificar');
        if (botonMod) {
            const id = botonMod.dataset.id;
            const producto = adminProductos.find(p => p.id === id);
            if (producto) {
                prellenarFormularioCarta(producto);
            }
        }
    });
}

function renderizarResultadosProductos() {
    const filtros = {
        titulo: document.getElementById('prod-search-titulo').value.toLowerCase(),
        tipo: document.getElementById('prod-search-tipo').value,
    };
    
    const eventosFiltrados = adminProductos.filter(prod => { // Filtramos por ES
        const checkTitulo = !filtros.titulo || prod.titulo.toLowerCase().includes(filtros.titulo);
        const checkTipo = !filtros.tipo || prod.tipo === filtros.tipo;
        return checkTitulo && checkTipo;
    });

    const contenedor = document.getElementById('prod-resultados-container');
    contenedor.innerHTML = eventosFiltrados.map(prod => crearTarjetaResultadoProducto(prod)).join('');
}

function crearTarjetaResultadoProducto(prod) {
    const imgRuta = (prod.imagen) ? `../img/${prod.imagen}` : `../img/bebidaSinFoto.jpg`;
    const precio = formatarPrecio(prod.precioCopa || prod.precioBotella || prod.precioPinta);
    
    const estaHabilitado = (prod.visualizacion === undefined) ? true : prod.visualizacion; 
    const deshabilitadoClass = estaHabilitado ? '' : 'deshabilitado';
    const switchChecked = estaHabilitado ? 'checked' : '';

    return `
    <div class="card-resultado ${deshabilitadoClass}" id="prod-card-${prod.id}">
        <div class="card-resultado-header">
            <img src="${imgRuta}" alt="${prod.titulo}" class="card-resultado-img">
            <div class="card-resultado-info">
                <h4>${prod.titulo}</h4>
                <p>${prod.tipo}</p>
                <p class="tipo-regular">Precio: ${precio}</p>
            </div>
        </div>
        
        <div class="card-resultado-footer">
            <button class="btn btn-card btn-card-modificar" data-id="${prod.id}">
                <i class='bx bxs-pencil'></i> Modificar
            </button>
            
            <div class="visibility-switch">
                <label class="switch">
                    <input type="checkbox" data-id="${prod.id}" ${switchChecked}>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    </div>
    `;
}

function prellenarFormularioCarta(prod) {
    modoEdicion = true;
    idEventoEdicion = prod.id;
    
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
    
    // --- LÓGICA DE PRE-LLENADO BILINGÜE ---
    const prod_es = adminProductos.find(p => p.id === prod.id);
    const prod_en = adminProductos_EN.find(p => p.id === prod.id);
    
    if (!prod_es || !prod_en) {
        alert("Error: No se pudo encontrar el producto en ambos idiomas.");
        return;
    }

    // Llenamos campos ÚNICOS (desde prod_es)
    (visibleGroup.querySelector('#producto-titulo') || {}).value = prod_es.titulo || ''; // Para Títulos de Marca
    (visibleGroup.querySelector('#producto-precio-copa') || {}).value = prod_es.precioCopa || '';
    (visibleGroup.querySelector('#producto-precio-botella') || {}).value = prod_es.precioBotella || '';
    (visibleGroup.querySelector('#producto-precio-cana') || {}).value = prod_es.precioCana || '';
    (visibleGroup.querySelector('#producto-precio-pinta') || {}).value = prod_es.precioPinta || '';
    (visibleGroup.querySelector('#producto-productor') || {}).value = prod_es.productor || '';
    (visibleGroup.querySelector('#producto-ano') || {}).value = prod_es.ano || '';
    (visibleGroup.querySelector('#producto-abv') || {}).value = prod_es.abv || '';
    (visibleGroup.querySelector('#producto-ibu') || {}).value = prod_es.ibu || '';
    (visibleGroup.querySelector('#producto-destacado') || {}).checked = prod_es.destacado || false;

    // Llenamos campos ES
    (visibleGroup.querySelector('#producto-titulo-es') || {}).value = prod_es.titulo || ''; // Para Títulos Genéricos
    (visibleGroup.querySelector('#producto-descripcion-es') || {}).value = prod_es.descripcion || '';
    (visibleGroup.querySelector('#producto-region-es') || {}).value = prod_es.region || '';
    (visibleGroup.querySelector('#producto-pais-es') || {}).value = prod_es.pais || '';
    (visibleGroup.querySelector('#producto-varietal-es') || {}).value = prod_es.varietal || '';
    (visibleGroup.querySelector('#producto-crianza-es') || {}).value = prod_es.crianza || '';
    
    // Llenamos campos EN (¡Ahora desde prod_en!)
    (visibleGroup.querySelector('#producto-titulo-en') || {}).value = prod_en.titulo || ''; // Para Títulos Genéricos
    (visibleGroup.querySelector('#producto-descripcion-en') || {}).value = prod_en.descripcion || '';
    (visibleGroup.querySelector('#producto-region-en') || {}).value = prod_en.region || '';
    (visibleGroup.querySelector('#producto-pais-en') || {}).value = prod_en.pais || '';
    (visibleGroup.querySelector('#producto-varietal-en') || {}).value = prod_en.varietal || '';
    (visibleGroup.querySelector('#producto-crianza-en') || {}).value = prod_en.crianza || '';
    
    // Info de Imagen
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