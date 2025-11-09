/* --- ADMIN.JS - CMS Altxerri --- */
/* --- FASES 1, 2, 3, 4 y 5 INTEGRADAS --- */

// --- Variables Globales ---
const { DateTime } = luxon; // Usamos Luxon (cargado en el head)
let adminEventos = []; // Almacén para los eventos cargados desde eventos.json
let modoEdicion = false; // Flag para saber si el form de Alta está en modo Edición
let idEventoEdicion = null; // Guarda el ID (fecha) del evento que estamos editando

// --- NUEVO FASE 5 ---
let adminProductos = []; // Almacén para los productos de carta.json
let modoVisibilidad = false; // Flag para el modo On/Off de productos

function formatarPrecio(precio) {
    // Verifica si el precio es nulo, undefined, string vacío, o 0
    if (!precio || precio === 0) {
        return '–'; // Devuelve un guion largo
    }
    return `${precio}€`;
}

// --- Inicializador Principal ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica FASE 1: Navegación Base ---
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
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
            
            // (dentro del bucle tabLinks.forEach)
            if (targetId === 'alta-evento' && !modoEdicion) {
                resetearFormularioAlta();
            }
            // --- NUEVO FASE 5 (CON ARREGLO) ---
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
    fetchEventosData();
    inicializarPanelesBusquedaEventos();
    
    // --- Lógica FASE 4: Formulario de Alta Carta ---
    const formAltaProducto = document.getElementById('form-alta-producto');
    if (formAltaProducto) {
        inicializarFormularioCarta();
    }

    // --- Lógica FASE 5: Búsqueda Carta ---
    fetchProductosData();
    inicializarPanelesBusquedaProductos();
});


// -----------------------------------------------------------------
// --- FASE 2: LÓGICA DEL FORMULARIO DE ALTA (EVENTOS) ---
// -----------------------------------------------------------------

let tags = []; // Almacén temporal para los tags
let picker; // Hacemos el picker global para poder acceder a él

function inicializarFormularioAlta() {
    
    const form = document.getElementById('form-alta-evento');
    const inputFecha = document.getElementById('evento-fecha');
    const checkGenerica = document.getElementById('evento-img-generica');
    const fieldsetImagen = document.getElementById('fieldset-imagen');
    const inputTag = document.getElementById('evento-tags');
    const tagContainer = document.getElementById('tag-container');
    
    // --- 2. Lógica del Calendario (Litepicker) ---
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

    // --- 3. Lógica del Checkbox "Imagen Genérica" ---
    checkGenerica.addEventListener('change', () => {
        fieldsetImagen.disabled = checkGenerica.checked;
        if (checkGenerica.checked) {
            tags = [];
            renderizarTags();
            document.getElementById('evento-imagen-upload').value = '';
        }
    });

    // --- 4. Lógica del Input de Tags (Opción A) ---
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
    
    // --- 5. Lógica de Envío del Formulario (Submit) ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        // --- A. Recopilación de Datos ---
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

        // --- B. Validación de Campos ---
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
                const eventoOriginal = adminEventos.find(ev => ev.fecha === idEventoEdicion);
                imagenNombre = eventoOriginal.imagen || "imgBandaGenerica.jpg";
            }
        }
        
        // --- C. Construcción del Objeto JSON Final ---
        const eventoFinal = {
            id: modoEdicion ? idEventoEdicion : `evt_${Date.now()}`, // Usamos ID único
            fecha: eventoData.fecha,
            tipoEvento: eventoData.tipoEvento,
            imagen: imagenNombre,
            imgReferencia: eventoData.imgReferencia,
            titulo: eventoData.titulo,
            live: eventoData.live,
            concierto: eventoData.concierto
        };

        // --- D. Simulación de Guardado (Alta o Modificación) ---
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
        
        fetchEventosData(); // Actualizar la data local y recargar las listas
        resetearFormularioAlta();
    });
}

// --- Funciones Helper de Formulario (Fase 2) ---

function renderizarTags() {
    const tagContainer = document.getElementById('tag-container');
    const inputTag = document.getElementById('evento-tags');
    
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
    form.querySelector('h3').textContent = "Crear Nuevo Evento";
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Evento";
    
    const infoImg = document.getElementById('info-img-actual');
    if (infoImg) infoImg.remove();
}


// -----------------------------------------------------------------
// --- FASE 3: LÓGICA DE BÚSQUEDA Y RESULTADOS (EVENTOS) ---
// -----------------------------------------------------------------

async function fetchEventosData() {
    try {
        // Usamos ../ para subir un nivel desde la carpeta /admin/
        const response = await fetch('../data/eventos.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar eventos.json');
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
    
    modContainer.addEventListener('click', (e) => manejarClickTarjetaEvento(e, 'modificar'));
    bajaContainer.addEventListener('click', (e) => manejarClickTarjetaEvento(e, 'eliminar'));
}

function renderizarResultadosEventos() {
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

    const contenedorMod = document.getElementById('mod-resultados-container');
    const contenedorBaja = document.getElementById('baja-resultados-container');
    
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
        ? `<button class="btn btn-card btn-card-modificar" data-id="${evento.fecha}"><i class='bx bxs-pencil'></i> Modificar</button>`
        : `<button class="btn btn-card btn-card-eliminar" data-id="${evento.fecha}"><i class='bx bxs-trash'></i> Eliminar</button>`;

    const tipoClase = `tipo-${evento.tipoEvento.toLowerCase()}`;
    const imgRuta = (evento.imagen && evento.imagen !== "imgBandaGenerica.jpg") 
        ? `../img/${evento.imagen}` 
        : `../img/imgBandaGenerica.jpg`; 

    return `
    <div class="card-resultado" id="evento-card-${evento.fecha}">
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
    const evento = adminEventos.find(ev => ev.fecha === idEvento);
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
    
    adminEventos = adminEventos.filter(ev => ev.fecha !== evento.fecha);
    renderizarResultadosEventos();
}

function prellenarFormularioModEvento(evento) {
    modoEdicion = true;
    idEventoEdicion = evento.fecha; 
    
    const form = document.getElementById('form-alta-evento');
    form.classList.add('modo-edicion');
    
    // --- ¡ARREGLO AQUÍ! ---
    // Buscamos el contenedor padre (la pestaña) y luego el H3 dentro de él.
    const tabContent = form.closest('.tab-content');
    tabContent.querySelector('h3').textContent = `Modificando: ${evento.titulo}`;
    // --- FIN DEL ARREGLO ---
    
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
// --- FASE 4: LÓGICA DEL FORMULARIO DE ALTA (CARTA) ---
// -----------------------------------------------------------------

// --- Plantillas HTML para el "Smart Form" ---
const plantillasFormCarta = {
    // (Estas plantillas se copian de tu respuesta anterior)
    coctel: `
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-titulo">Título / Nombre *</label>
                    <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Gin Tonic" required>
                </div>
                <div class="form-group">
                    <label for="producto-precio-copa">Precio (Copa) *</label>
                    <input type="number" id="producto-precio-copa" class="form-input" placeholder="Ej: 8" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-descripcion">Descripción / Ingredientes *</label>
                    <textarea id="producto-descripcion" class="form-input" style="min-height: 130px;" placeholder="Ej: Gin Bombay Sapphire combinado con..."></textarea>
                </div>
            </div>
        </div>
        <div class="form-section">
            <h4>Imagen de la Card (¡Obligatoria para Cocteles!)</h4>
            <div class="form-group">
                <label for="producto-imagen-upload">Subir Imagen *</label>
                <input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required>
            </div>
        </div>
    `,
    cervezaBarril: `
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Franziskaner" required>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-cana">Precio (Caña) *</label>
                    <input type="number" id="producto-precio-cana" class="form-input" placeholder="Ej: 4" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-pinta">Precio (Pinta) *</label>
                    <input type="number" id="producto-precio-pinta" class="form-input" placeholder="Ej: 7" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region">Región</label>
                    <input type="text" id="producto-region" class="form-input" placeholder="Ej: Munich">
                </div>
            </div>
            <div class="form-col">
                <label for="producto-pais">País</label>
                <input type="text" id="producto-pais" class="form-input" placeholder="Ej: Alemania">
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-abv">ABV (%)</label>
                    <input type="number" id="producto-abv" class="form-input" placeholder="Ej: 5.0">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-ibu">IBU</label>
                    <input type="number" id="producto-ibu" class="form-input" placeholder="Ej: 12">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="producto-descripcion">Descripción *</label>
            <textarea id="producto-descripcion" class="form-input" style="min-height: 100px;" placeholder="Ej: Cerveza de trigo alemana..."></textarea>
        </div>
    `,
    cervezaEnvasada: `
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Paulaner Envasada" required>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Unidad) *</label>
                    <input type="number" id="producto-precio-botella" class="form-input" placeholder="Ej: 7" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region">Región</label>
                    <input type="text" id="producto-region" class="form-input" placeholder="Ej: Munich">
                </div>
            </div>
            <div class="form-col">
                <label for="producto-pais">País</label>
                <input type="text" id="producto-pais" class="form-input" placeholder="Ej: Alemania">
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-abv">ABV (%)</label>
                    <input type="number" id="producto-abv" class="form-input" placeholder="Ej: 5.5">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-ibu">IBU</label>
                    <input type="number" id="producto-ibu" class="form-input" placeholder="Ej: 12">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="producto-descripcion">Descripción *</label>
            <textarea id="producto-descripcion" class="form-input" style="min-height: 100px;" placeholder="Ej: Weissbier alemana dorada..."></textarea>
        </div>
    `,
    vino: `
        <div class="form-group-checkbox-inline">
            <input type="checkbox" id="producto-destacado">
            <label for="producto-destacado">Marcar como "Vino Destacado de la Semana"</label>
        </div>
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Luca – Beso de Dante" required>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-copa">Precio (Copa)</label>
                    <input type="number" id="producto-precio-copa" class="form-input" placeholder="Ej: 10">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Botella)</label>
                    <input type="number" id="producto-precio-botella" class="form-input" placeholder="Ej: 40">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region">Región</label>
                    <input type="text" id="producto-region" class="form-input" placeholder="Ej: Valle de Uco, Mendoza">
                </div>
            </div>
            <div class="form-col">
                <label for="producto-pais">País</label>
                <input type="text" id="producto-pais" class="form-input" placeholder="Ej: Argentina">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-productor">Bodega (Productor)</label>
                    <input type="text" id="producto-productor" class="form-input" placeholder="Ej: Luca Wines">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-varietal">Varietal</label>
                    <input type="text" id="producto-varietal" class="form-input" placeholder="Ej: Blend (Malbec, Cabernet)">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-ano">Año</label>
                    <input type="text" id="producto-ano" class="form-input" placeholder="Ej: 2021">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-crianza">Crianza</label>
                    <input type="text" id="producto-crianza" class="form-input" placeholder="Ej: 14 meses en barricas">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="producto-descripcion">Descripción / Notas de Cata *</label>
            <textarea id="producto-descripcion" class="form-input" style="min-height: 100px;" placeholder="Ej: Blend de Cabernet Sauvignon y Malbec..."></textarea>
        </div>
        <div class="form-section">
            <h4>Imagen del Producto</h4>
            <div class="form-group">
                <label for="producto-imagen-upload">Subir Imagen *</label>
                <input type="file" id="producto-imagen-upload" class="form-input-file" accept="image/jpeg, image/png, image/webp" required>
            </div>
        </div>
    `,
    destilado: `
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Jack Daniel's" required>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-copa">Precio (Vaso) *</label>
                    <input type="number" id="producto-precio-copa" class="form-input" placeholder="Ej: 8" required>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Botella)</label>
                    <input type="number" id="producto-precio-botella" class="form-input" placeholder="Ej: 65">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-region">Región</label>
                    <input type="text" id="producto-region" class="form-input" placeholder="Ej: Tennessee">
                </div>
            </div>
            <div class="form-col">
                <label for="producto-pais">País</label>
                <input type="text" id="producto-pais" class="form-input" placeholder="Ej: Estados Unidos">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-productor">Productor</label>
                    <input type="text" id="producto-productor" class="form-input" placeholder="Ej: Jack Daniel Distillery">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-crianza">Crianza</label>
                    <input type="text" id="producto-crianza" class="form-input" placeholder="Ej: En barricas nuevas...">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="producto-descripcion">Descripción *</label>
            <textarea id="producto-descripcion" class="form-input" style="min-height: 100px;" placeholder="Ej: Whiskey suave con notas..."></textarea>
        </div>
    `,
    sinAlcohol: `
        <div class="form-group">
            <label for="producto-titulo">Título / Nombre *</label>
            <input type="text" id="producto-titulo" class="form-input" placeholder="Ej: Limonada de la casa" required>
        </div>
        <div class="form-grid">
            <div class="form-col">
                <div class="form-group">
                    <label for="producto-precio-botella">Precio (Unidad) *</label>
                    <input type="number" id="producto-precio-botella" class="form-input" placeholder="Ej: 6" required>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="producto-descripcion">Descripción *</label>
            <textarea id="producto-descripcion" class="form-input" style="min-height: 100px;" placeholder="Ej: Limonada fresca con limón..."></textarea>
        </div>
    `
};

// --- Función Principal de la Fase 4 ---
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
            }
            actions.style.display = 'block'; 
        } else {
            actions.style.display = 'none'; 
        }
    });

    // 3. Lógica de Submit (¡CORREGIDA!)
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

        const tituloInput = visibleGroup.querySelector('[id^="producto-titulo"]'); 
        
        if (!tituloInput || !tituloInput.value.trim()) {
            alert("Error: El campo Título es obligatorio.");
            tituloInput.focus(); 
            return;
        }
        
        const titulo = tituloInput.value.trim();
        
        // (Aquí iría la validación completa y recolección de TODOS los campos)
        const nuevoProducto = {
            id: modoEdicion ? idEventoEdicion : `prod_${Date.now()}`, // idEventoEdicion se reutiliza para productos
            tipo: tipo,
            titulo: titulo,
            // ... (recolectar todos los demás campos del visibleGroup)
        };
        
        if (modoEdicion) {
            console.log("MODIFICANDO PRODUCTO", JSON.stringify(nuevoProducto, null, 2));
            alert(`¡Producto "${titulo}" modificado con éxito! (Simulación)`);
        } else {
            console.log("CREANDO PRODUCTO", JSON.stringify(nuevoProducto, null, 2));
            alert(`¡Producto "${titulo}" creado con éxito! (Simulación)`);
        }
        
        // Simular recarga de datos
        fetchProductosData();
        
        // Resetear
        resetearFormularioCarta();
    });
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
    idEventoEdicion = null; // Reutilizamos esta variable global

    form.classList.remove('modo-edicion');

    // --- ¡AQUÍ ESTÁ EL ARREGLO DE LA CONSOLA! ---
    const tabContent = form.closest('.tab-content');
    if (tabContent) { // Verificamos que lo encontramos
        tabContent.querySelector('h3').textContent = "Crear Nuevo Producto";
    }
    // --- FIN DEL ARREGLO ---

    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Producto";

    const infoImg = document.getElementById('info-img-actual-prod');
    if (infoImg) infoImg.remove();
}


// -----------------------------------------------------------------
// --- FASE 5: LÓGICA DE BÚSQUEDA Y VISIBILIDAD (CARTA) ---
// -----------------------------------------------------------------

async function fetchProductosData() {
    try {
        // Asumimos que la ESTRUCTURA de carta_es.json es { "textosUI": {}, "productos": [] }
        // Cargamos ambas cartas para simular la actualización de 'visualizacion'
        const resES = await fetch('../data/carta_es.json');
        const resEN = await fetch('../data/carta_en.json');
        
        if (!resES.ok || !resEN.ok) {
            throw new Error('No se pudo cargar uno o ambos archivos de carta.');
        }
        
        const dataES = await resES.json();
        // const dataEN = await resEN.json(); // Lo necesitaríamos en el backend
        
        // Usamos adminProductos para guardar la lista
        adminProductos = dataES.productos; 
        
        // Damos un ID único a cada producto (basado en su título) para poder modificarlo
        adminProductos.forEach(prod => {
            prod.id = prod.id || `prod_${prod.titulo.replace(/\s/g, '_')}`;
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
        // 1. Recolectar todos los cambios
        const cambios = [];
        container.querySelectorAll('.visibility-switch input').forEach(toggle => {
            const id = toggle.dataset.id;
            const producto = adminProductos.find(p => p.id === id);
            
            // Si el estado del switch (checked) es DIFERENTE al estado del JSON
            if (producto && toggle.checked !== producto.visualizacion) {
                cambios.push({ id: id, nuevoEstado: toggle.checked });
            }
        });

        if (cambios.length === 0) {
            alert("No se ha realizado ningún cambio de visibilidad.");
            return;
        }

        // 2. Simular guardado
        console.log("SIMULACIÓN: Guardando cambios de visibilidad...", cambios);
        alert(`Se han actualizado ${cambios.length} productos. (Simulación)`);
        
        // 3. Actualizar el estado local (adminProductos)
        cambios.forEach(cambio => {
            const producto = adminProductos.find(p => p.id === cambio.id);
            if (producto) {
                producto.visualizacion = cambio.nuevoEstado;
            }
        });
        
        // 4. Salir del modo visibilidad y re-renderizar
        btnToggle.click(); // Simula clic para salir del modo
        renderizarResultadosProductos();
    });

    // Delegación de eventos para los botones de las tarjetas
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
    
    const eventosFiltrados = adminProductos.filter(prod => {
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
    
    // Para el switch On/Off
    const estaHabilitado = (prod.visualizacion === undefined) ? true : prod.visualizacion; // Asumir 'true' si no existe
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
    // 1. Marcar el formulario como "Modo Edición"
    modoEdicion = true;
    idEventoEdicion = prod.id; // Reutilizamos la variable global
    
    const form = document.getElementById('form-alta-producto');
    form.classList.add('modo-edicion');
    
    // --- ¡ARREGLO AQUÍ! ---
    // Buscamos el contenedor padre (la pestaña) y luego el H3 dentro de él.
    const tabContent = form.closest('.tab-content');
    tabContent.querySelector('h3').textContent = `Modificando: ${prod.titulo}`;
    // --- FIN DEL ARREGLO ---
    
    form.querySelector('.btn-primary').innerHTML = "<i class='bx bxs-save'></i> Guardar Modificaciones";

    // 2. Simulación de Backup
    console.log("SIMULACIÓN: Guardando copia de seguridad de producto...", prod);

    // 3. Seleccionar el Tipo y mostrar el formulario correcto
    const selectorTipo = document.getElementById('producto-tipo');
    selectorTipo.value = prod.tipo;
    // Disparamos el evento 'change' para que se muestre el formulario correcto
    selectorTipo.dispatchEvent(new Event('change'));
    
    // 4. Pre-llenar todos los campos (del formulario ahora visible)
    const tipoPlantilla = prod.tipo.startsWith('vino') ? 'vino' : prod.tipo;
    const visibleGroup = document.getElementById(`fields-${tipoPlantilla}`);
    
    // Llenamos TODOS los campos posibles. Si no existen en el form, no da error.
    (visibleGroup.querySelector('[id^="producto-titulo"]') || {}).value = prod.titulo || '';
    (visibleGroup.querySelector('[id^="producto-descripcion"]') || {}).value = prod.descripcion || '';
    (visibleGroup.querySelector('[id^="producto-precio-copa"]') || {}).value = prod.precioCopa || '';
    (visibleGroup.querySelector('[id^="producto-precio-botella"]') || {}).value = prod.precioBotella || '';
    (visibleGroup.querySelector('[id^="producto-precio-cana"]') || {}).value = prod.precioCana || '';
    (visibleGroup.querySelector('[id^="producto-precio-pinta"]') || {}).value = prod.precioPinta || '';
    (visibleGroup.querySelector('[id^="producto-region"]') || {}).value = prod.region || '';
    (visibleGroup.querySelector('[id^="producto-pais"]') || {}).value = prod.pais || '';
    (visibleGroup.querySelector('[id^="producto-abv"]') || {}).value = prod.abv || '';
    (visibleGroup.querySelector('[id^="producto-ibu"]') || {}).value = prod.ibu || '';
    (visibleGroup.querySelector('[id^="producto-productor"]') || {}).value = prod.productor || '';
    (visibleGroup.querySelector('[id^="producto-varietal"]') || {}).value = prod.varietal || '';
    (visibleGroup.querySelector('[id^="producto-ano"]') || {}).value = prod.ano || '';
    (visibleGroup.querySelector('[id^="producto-crianza"]') || {}).value = prod.crianza || '';
    (visibleGroup.querySelector('[id^="producto-destacado"]') || {}).checked = prod.destacado || false;

    // 5. Mostrar info de imagen actual
    const infoImg = document.getElementById('info-img-actual-prod');
    if (infoImg) infoImg.remove();
    
    if (prod.imagen && prod.imagen !== 'imgBandaGenerica.jpg') {
        const infoHtml = `
            <div id="info-img-actual-prod" class="info-imagen-actual">
                <strong>Imagen Actual:</strong> ${prod.imagen}
                <br>
                <small>Sube un archivo nuevo para reemplazarla, o déjalo vacío para conservarla.</small>
            </div>
        `;
        // Usamos querySelector para encontrar el form-section DENTRO del grupo visible
        const formSection = visibleGroup.querySelector('.form-section');
        if (formSection) {
            formSection.insertAdjacentHTML('afterbegin', infoHtml);
        }
    }
    
    // 6. Cambiar a la pestaña "Alta"
    document.querySelector('.tab-link[data-tab="alta-producto"]').click();
    form.scrollIntoView({ behavior: 'smooth' });
}