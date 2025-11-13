/* --- ADMIN.JS (Versión 3.0 - CONECTADO AL BACKEND REAL) --- */

// --- Variables Globales ---
const { DateTime } = luxon; 
let adminEventos = []; 
let modoEdicion = false; 
let idEventoEdicion = null; 

let adminProductos = []; 
let adminProductos_EN = []; 
let modoVisibilidad = false; 

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

// --- ¡NUEVO! Helper de Seguridad ---
/**
 * Obtiene el token de autenticación guardado.
 * @returns {string} El token o un string vacío.
 */
function getAuthToken() {
    return localStorage.getItem('altxerri_token') || '';
}


// --- Inicializador Principal ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica de "PORTERO" (BOUNCER) DE SEGURIDAD ---
    const loginForm = document.querySelector('.login-form');
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (loginForm) {
        // --- ESTAMOS EN LA PÁGINA DE LOGIN (index.html) ---
        
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
                    // ¡CAMBIO! Guardamos el "ticket" Y la "llave" (token)
                    localStorage.setItem('altxerri_auth', 'true');
                    localStorage.setItem('altxerri_token', data.token); // ¡NUEVO!
                    
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
        // --- ESTAMOS EN LA PÁGINA DE DASHBOARD (dashboard.html) ---

        // 1. Revisar el "ticket" (sin cambios)
        if (localStorage.getItem('altxerri_auth') !== 'true') {
            alert("Acceso denegado. Por favor, inicia sesión.");
            window.location.href = 'index.html';
            return; 
        }

        // 2. Lógica del botón "Salir"
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // ¡CAMBIO! Destruye el "ticket" Y la "llave"
                localStorage.removeItem('altxerri_auth');
                localStorage.removeItem('altxerri_token'); // ¡NUEVO!
                
                window.location.href = 'index.html';
            });
        }

        // --- Lógica FASE 1: Navegación Base ---
        // (Esta parte no cambia, la omito por brevedad...)
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
        
        // --- Lógica FASE 2: Formulario de Alta Eventos ---
        const formAlta = document.getElementById('form-alta-evento');
        if (formAlta) {
            inicializarFormularioAlta();
        }
        
        // --- Lógica FASE 3: Búsqueda Eventos ---
        // ¡CAMBIO! Ahora le pasamos el token de seguridad
        fetchEventosData(); // Esta función ahora usa el token
        inicializarPanelesBusquedaEventos();
        
        // --- Lógica FASE 4/5/6: Formulario de Alta Carta ---
        const formAltaProducto = document.getElementById('form-alta-producto');
        if (formAltaProducto) {
            inicializarFormularioCarta();
        }

        // --- Lógica FASE 5/6: Búsqueda Carta ---
        // ¡CAMBIO! Ahora le pasamos el token de seguridad
        fetchProductosData(); // Esta función ahora usa el token
        inicializarPanelesBusquedaProductos();
    }
});


// -----------------------------------------------------------------
// --- FASE 2: LÓGICA DEL FORMULARIO DE ALTA (EVENTOS) ---
// (Conectado al Backend Real)
// -----------------------------------------------------------------

let tags = []; 
let picker; 

function inicializarFormularioAlta() {
    
    // (Esta parte no cambia, la omito por brevedad...)
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
    
    // --- ¡CAMBIO! Lógica de SUBMIT (guardado) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const btnSubmit = form.querySelector('.btn-primary');
        btnSubmit.disabled = true; // Deshabilita el botón
        btnSubmit.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
        
        // --- 1. Recolección de datos (sin cambios) ---
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

        // --- 2. Validación (sin cambios) ---
        if (!eventoData.fecha || !eventoData.tipoEvento || !eventoData.titulo) {
            alert("Error: 'Fecha', 'Tipo de Evento' y 'Título' son campos obligatorios.");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            return;
        }
        // ... (Aquí irían tus otras validaciones como la de URL)

        // --- 3. Lógica de Imagen (sin cambios) ---
        // (Aquí iría tu lógica de 'btn-elegir-img' y subida de imagen)
        // Por ahora, solo guardamos el nombre.
        let imagenNombre = "imgBandaGenerica.jpg";
        if (!eventoData.usaGenerica) {
            if (eventoData.archivoImagen) {
                imagenNombre = eventoData.archivoImagen.name;
                // NOTA: Aún no hemos implementado la subida real del archivo
                console.log("Simulando subida de:", imagenNombre); 
            } else if (modoEdicion) {
                const eventoOriginal = adminEventos.find(ev => ev.id === idEventoEdicion);
                imagenNombre = eventoOriginal.imagen || "imgBandaGenerica.jpg";
            }
        }

        // --- 4. Creación del objeto final (sin cambios) ---
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

        // --- 5. ¡NUEVA LÓGICA DE GUARDADO REAL! ---
        try {
            if (modoEdicion) {
                // --- MODO EDICIÓN (PUT) ---
                const response = await fetch(`/api/eventos/modificar/${eventoFinal.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthToken() // ¡Enviamos la "llave"!
                    },
                    body: JSON.stringify(eventoFinal)
                });
                if (!response.ok) throw new Error(await response.json().message);
                alert("¡Evento Modificado con Éxito!");

            } else {
                // --- MODO CREAR (POST) ---
                
                // Validación de sobrescritura (Tu requisito)
                if (adminEventos.some(ev => ev.fecha === eventoFinal.fecha)) {
                    if (!confirm("¡Atención! Ya existe un evento en esta fecha. ¿Deseas sobrescribirlo? \n\n(Nota: Esto no lo sobrescribe, lo crea duplicado. La lógica de sobrescribir es más compleja)")) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
                        return;
                    }
                }
                
                const response = await fetch('/api/eventos/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getAuthToken() // ¡Enviamos la "llave"!
                    },
                    body: JSON.stringify(eventoFinal)
                });
                if (!response.ok) throw new Error(await response.json().message);
                alert("¡Evento Creado con Éxito!");
            }
            
            // Si todo salió bien:
            fetchEventosData(); // Recarga los datos
            resetearFormularioAlta(); // Resetea el form

        } catch (error) {
            console.error("Error al guardar evento:", error);
            alert(`Error: ${error.message}`);
        } finally {
            // Re-habilita el botón pase lo que pase
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = modoEdicion ? "<i class='bx bxs-save'></i> Guardar Modificaciones" : "<i class='bx bxs-save'></i> Guardar Evento";
            if (modoEdicion) resetearFormularioAlta(); // Resetea también al terminar de editar
        }
    });
}

// (renderizarTags, esURLValida, resetearFormularioAlta no cambian)
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
    if (!form) return;
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
// (Conectado al Backend Real)
// -----------------------------------------------------------------

async function fetchEventosData() {
    try {
        // ¡CAMBIO! Enviamos el token de seguridad
        const response = await fetch('/api/eventos', {
            headers: {
                'Authorization': getAuthToken()
            }
        });
        if (!response.ok) {
            // Si el token falla, la API devuelve 401 o 403
            if (response.status === 401 || response.status === 403) {
                 alert("Error de autenticación. Saliendo...");
                 document.getElementById('logout-btn').click();
                 return;
            }
            throw new Error('No se pudo cargar eventos.json desde la API');
        }
        adminEventos = await response.json(); 
        adminEventos.forEach((ev, index) => ev.id = ev.id || ev.fecha || `evt_${index}`); 
        renderizarResultadosEventos();
    } catch (error) {
        console.error(error);
        alert("Error fatal: No se pudieron cargar los datos de los eventos.");
    }
}

// (inicializarPanelesBusquedaEventos, renderizarResultadosEventos, filtrarEventos, crearTarjetaResultadoEvento no cambian)
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

// (manejarClickTarjetaEvento no cambia)
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
        eliminarEvento(evento, boton); // ¡CAMBIO! Pasamos el botón para deshabilitarlo
    }
}

// --- ¡CAMBIO! Lógica de ELIMINAR (Baja) ---
async function eliminarEvento(evento, boton) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${evento.titulo}" del ${evento.fecha}? \n\n¡Esta acción es REAL y guarda un backup!`)) {
        return;
    }

    boton.disabled = true;
    boton.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
    
    try {
        const response = await fetch(`/api/eventos/eliminar/${evento.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': getAuthToken() // ¡Enviamos la "llave"!
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        alert(`Evento "${evento.titulo}" eliminado con éxito.`);
        
        // Eliminamos la card del DOM para no tener que recargar todo
        const cardElement = document.getElementById(`evento-card-${evento.id}`);
        if (cardElement) cardElement.remove();
        
        // Sincronizamos el array local
        adminEventos = adminEventos.filter(ev => ev.id !== evento.id);
        
    } catch (error) {
        console.error("Error al eliminar evento:", error);
        alert(`Error: ${error.message}`);
        boton.disabled = false;
        boton.innerHTML = "<i class='bx bxs-trash'></i> Eliminar";
    }
}

// (prellenarFormularioModEvento no cambia)
function prellenarFormularioModEvento(evento) {
    modoEdicion = true;
    idEventoEdicion = evento.id; 
    
    const form = document.getElementById('form-alta-evento');
    form.classList.add('modo-edicion');
    
    const tabContent = form.closest('.tab-content');
    tabContent.querySelector('h3').textContent = `Modificando: ${evento.titulo}`;
    
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Modificaciones";

    // YA NO NECESITAMOS LA SIMULACIÓN DE BACKUP AQUÍ
    // console.log("SIMULACIÓN: Guardando copia de seguridad...");

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
// --- FASE 4/5/6: LÓGICA COMPLETA DE "CARTA" ---
// (Aún en modo SIMULACIÓN, pendiente de conectar)
// -----------------------------------------------------------------

// (Toda esta sección de "plantillasBloques", "plantillasFormCarta", 
// "inicializarFormularioCarta", "activarLogicaBilingue", "resetearFormularioCarta"
// sigue exactamente igual por ahora, la omito por brevedad)

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
            <h4>Imagen del Producto (¡ObligatorIA para Vinos!)</h4>
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

    // 3. Lógica de Submit Bilingüe (AÚN EN SIMULACIÓN)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ... (Tu lógica de recolección de datos bilingüe va aquí) ...
        // (Por ahora, la dejamos en simulación)
        
        alert(`¡"Guardar Producto" aún está en modo simulación!`);
        
        // fetchProductosData();
        // resetearFormularioCarta();
    });
}

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

            const campos = ['titulo', 'descripcion', 'region', 'pais', 'varietal', 'crianza'];
            
            campos.forEach(campo => {
                const inputES = langGroupES.querySelector(`[id$="-${campo}-es"]`); 
                const inputEN = langGroupEN.querySelector(`[id$="-${campo}-en"]`); 
                
                if (inputES && inputEN && inputES.value) {
                    if (inputEN.value.trim() === '') {
                        inputEN.value = sugerirTraduccion(inputES.value); // (Aún en simulación)
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
}


// --- LÓGICA DE BÚSQUEDA Y VISIBILIDAD (CARTA) ---

async function fetchProductosData() {
    try {
        // ¡CAMBIO! Enviamos el token de seguridad
        const response = await fetch('/api/productos', {
             headers: {
                'Authorization': getAuthToken()
            }
        });
        
        if (!response.ok) {
            // Si el token falla, la API devuelve 401 o 403
            if (response.status === 401 || response.status === 403) {
                 alert("Error de autenticación. Saliendo...");
                 document.getElementById('logout-btn').click();
                 return;
            }
            throw new Error('No se pudo cargar los archivos de carta desde la API.');
        }
        
        const data = await response.json(); 
        
        adminProductos = data.es.productos; 
        adminProductos_EN = data.en.productos; 
        
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

// (inicializarPanelesBusquedaProductos, renderizarResultadosProductos, crearTarjetaResultadoProducto, prellenarFormularioCarta
// siguen exactamente igual por ahora, la omito por brevedad)

function inicializarPanelesBusquedaProductos() {
    const inputs = document.querySelectorAll('#form-busqueda-producto .form-input');
    inputs.forEach(input => {
        const eventType = (input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, renderizarResultadosProductos);
    });

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
        // ... (Lógica de Visibilidad AÚN EN SIMULACIÓN) ...
        alert("¡"Confirmar Visibilidad" aún está en modo simulación!");
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
    const contenedor = document.getElementById('prod-resultados-container');
    if (!contenedor) return;

    const filtros = {
        titulo: document.getElementById('prod-search-titulo').value.toLowerCase(),
        tipo: document.getElementById('prod-search-tipo').value,
    };
    
    const eventosFiltrados = adminProductos.filter(prod => { 
        const checkTitulo = !filtros.titulo || prod.titulo.toLowerCase().includes(filtros.titulo);
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
    
    const prod_es = adminProductos.find(p => p.id === prod.id);
    const prod_en = adminProductos_EN.find(p => p.id === prod.id);
    
    if (!prod_es || !prod_en) {
        alert("Error: No se pudo encontrar el producto en ambos idiomas.");
        return;
    }

    // Llenamos campos ÚNICOS (desde prod_es)
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

    // Llenamos campos ES
    (visibleGroup.querySelector('#producto-titulo-es') || {}).value = prod_es.titulo || ''; 
    (visibleGroup.querySelector('#producto-descripcion-es') || {}).value = prod_es.descripcion || '';
    (visibleGroup.querySelector('#producto-region-es') || {}).value = prod_es.region || '';
    (visibleGroup.querySelector('#producto-pais-es') || {}).value = prod_es.pais || '';
    (visibleGroup.querySelector('#producto-varietal-es') || {}).value = prod_es.varietal || '';
    (visibleGroup.querySelector('#producto-crianza-es') || {}).value = prod_es.crianza || '';
    
    // Llenamos campos EN
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