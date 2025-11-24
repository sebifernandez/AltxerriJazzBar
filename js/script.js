// ======================================================
// 1. VARIABLES GLOBALES Y ESTADO
// ======================================================
let contenidoWeb = { es: {}, en: {} };
let idiomaActual = localStorage.getItem('altxerri_lang') || 'es';
let eventos = [];
const DateTimeLuxon = luxon.DateTime;

// ======================================================
// 2. INICIALIZACIÓN (DOM LOADED)
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // A. Efectos Visuales (Hamburguesa, Scroll, etc.)
    inicializarEfectosVisuales();

    // B. Cargar Textos desde la API
    await cargarContenidoDesdeAPI();

    // C. Aplicar el idioma guardado o por defecto
    aplicarIdioma(idiomaActual);

    // D. Cargar Eventos (Depende del idioma para los textos de las cards)
    cargarEventos();
});

// ======================================================
// 3. LÓGICA DE GESTIÓN DE CONTENIDOS E IDIOMA
// ======================================================

async function cargarContenidoDesdeAPI() {
    try {
        const response = await fetch('/api/contenido/home');
        if (!response.ok) throw new Error('Error al cargar contenido');
        const data = await response.json();
        
        contenidoWeb.es = data.es;
        contenidoWeb.en = data.en;
        
        console.log("Textos cargados:", contenidoWeb);
    } catch (error) {
        console.error("Fallo crítico cargando textos:", error);
    }
}

function aplicarIdioma(lang) {
    const textos = contenidoWeb[lang];
    if (!textos) return;

    idiomaActual = lang;
    localStorage.setItem('altxerri_lang', lang);
    document.documentElement.lang = lang;

    // 1. Navbar Dinámico
    renderizarNavbar(textos.navbar, lang);

    // 2. Textos Estáticos (Hero, Historia, etc.)
    setText('hero-titulo', textos.hero.titulo);
    setHTML('hero-subtitulo', textos.hero.subtitulo);
    
    setText('historia-titulo', textos.historia.titulo);
    setHTML('historia-texto', textos.historia.texto);
    
    setText('galeria-titulo', textos.galeria.titulo);
    setText('galeria-subtitulo', textos.galeria.subtitulo);
    
    setText('parallax-titulo', textos.parallax.titulo);
    setText('parallax-btn', textos.parallax.btnTexto);
    
    setText('eventos-titulo', textos.eventos.titulo);
    
    setText('contacto-titulo', textos.contacto.titulo);
    
    // 3. Tabs de Contacto
    setText('tab-cliente', textos.contacto.pestanas.cliente);
    setText('tab-banda', textos.contacto.pestanas.banda);
    setText('tab-comercial', textos.contacto.pestanas.comercial);
    setText('tab-prensa', textos.contacto.pestanas.prensa);

    // 4. Formularios
    actualizarFormularios(textos.contacto.formularios);

    // 5. Ubicación
    setText('ubicacion-titulo', textos.ubicacion.titulo);
    setHTML('ubicacion-subtitulo', textos.ubicacion.subtitulo);
    setText('ubicacion-texto', textos.ubicacion.texto);

    // 6. Newsletter Modal
    setText('newsletter-modal-titulo', textos.newsletter.titulo);
    setText('newsletter-modal-subtitulo', textos.newsletter.subtitulo);
    setPlaceholder('newsletterName', textos.newsletter.phNombre);
    setPlaceholder('newsletterEmail', textos.newsletter.phMail);
    setText('newsletter-btn-enviar', textos.newsletter.btnSuscribir);

    // 8. Renderizar Galería Dinámica (NUEVO)
    if (textos.galeria && textos.galeria.imagenes) {
        renderizarGaleria(textos.galeria.imagenes);
    }

    // 7. Actualizar Carrusel de Eventos (si ya se cargaron)
    if (eventos.length > 0) {
        inicializarEventos(); 
    }
}

function toggleIdioma() {
    const nuevoIdioma = idiomaActual === 'es' ? 'en' : 'es';
    aplicarIdioma(nuevoIdioma);
}

// --- HELPERS DE RENDERIZADO ---

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}
function setPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el) el.placeholder = text;
}

function renderizarNavbar(navData, lang) {
    const container = document.getElementById('nav-links-container');
    if (!container) return;

    let html = '';
    
    // 1. Enlaces normales
    navData.items.forEach(item => {
        const targetAttr = item.link.includes('carta') ? 'target="_blank"' : '';
        html += `<a href="${item.link}" ${targetAttr}>${item.texto}</a>`;
    });

    // 2. Botón Newsletter de la LISTA (Solo visible en Desktop por CSS)
    html += `<button class="btn-newsletter" id="nav-btn-newsletter-list" style="height: 40px; padding: 0 1.5rem; margin-left: 1rem;">${navData.btnExtra}</button>`;

    // 3. Botón Idioma MÓVIL (Dentro de la lista)
    html += `
        <button class="btn-newsletter btn-lang-list" id="btn-lang-mobile" style="background: #000; border: 1px solid #fff;">
            ${lang === 'es' ? 'ENG' : 'ESP'}
        </button>
    `;
    
    container.innerHTML = html;

    // 4. Actualizar textos de botones FIJOS (Header)
    const desktopLangBtn = document.getElementById('btn-lang-desktop');
    const mobileNewsBtn = document.getElementById('nav-btn-newsletter-mobile'); // <--- NUEVO

    if(desktopLangBtn) desktopLangBtn.textContent = lang === 'es' ? 'ENG' : 'ESP';
    if(mobileNewsBtn) mobileNewsBtn.textContent = navData.btnExtra; // <--- NUEVO: Traduce el botón móvil

    // 5. Asignar Listeners
    document.getElementById('nav-btn-newsletter-list')?.addEventListener('click', openNewsletter);
    document.getElementById('btn-lang-mobile')?.addEventListener('click', toggleIdioma);
    if(desktopLangBtn) desktopLangBtn.onclick = toggleIdioma; 
    
    // Listener para el nuevo botón móvil
    if(mobileNewsBtn) mobileNewsBtn.addEventListener('click', openNewsletter);

    // Cerrar menú al hacer clic en enlaces
    const links = container.querySelectorAll('a, button');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (link.id !== 'btn-lang-mobile') {
                container.classList.remove('active');
            }
        });
    });
}

function actualizarFormularios(forms) {
    // Cliente
    setPlaceholder('input-cliente-nombre', forms.cliente.phNombre);
    setPlaceholder('input-cliente-mail', forms.cliente.phMail);
    setPlaceholder('input-cliente-asunto', forms.cliente.phAsunto);
    setPlaceholder('msg-cliente', forms.cliente.phMensaje);
    setText('btn-cliente', forms.cliente.btnEnviar);

    // Banda
    setPlaceholder('input-banda-nombre', forms.banda.phNombreBanda);
    setPlaceholder('input-banda-contacto', forms.banda.phContacto);
    setPlaceholder('input-banda-mail', forms.banda.phMail);
    setPlaceholder('input-banda-material', forms.banda.phMaterial);
    setPlaceholder('msg-banda', forms.banda.phMensaje);
    setText('btn-banda', forms.banda.btnEnviar);

    // Comercial
    setPlaceholder('input-comercial-empresa', forms.comercial.phEmpresa);
    setPlaceholder('input-comercial-contacto', forms.comercial.phContacto);
    setPlaceholder('input-comercial-mail', forms.comercial.phMail);
    setPlaceholder('input-comercial-tipo', forms.comercial.phTipo);
    setPlaceholder('msg-comercial', forms.comercial.phMensaje);
    setText('btn-comercial', forms.comercial.btnEnviar);

    // Prensa
    setPlaceholder('input-prensa-medio', forms.prensa.phMedio);
    setPlaceholder('input-prensa-contacto', forms.prensa.phContacto);
    setPlaceholder('input-prensa-mail', forms.prensa.phMail);
    setPlaceholder('input-prensa-motivo', forms.prensa.phMotivo);
    setPlaceholder('msg-prensa', forms.prensa.phMensaje);
    setText('btn-prensa', forms.prensa.btnEnviar);
}

// ======================================================
// 4. EFECTOS VISUALES (Tus efectos originales)
// ======================================================

function inicializarEfectosVisuales() {
    // EFECTO HAMBURGUESA
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links-container'); // ID actualizado

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // EFECTO DESVANECIMIENTO
    let img1 = document.querySelector('.fondo');
    if (img1) {
        window.addEventListener('scroll', function() {
            let value = 1 + window.scrollY / -600;
            img1.style.opacity = value;
        });
    }

    let img2 = document.querySelector('#containermobile .fondo');
    if (img2) {
        window.addEventListener('scroll', function() {
            let value = 1 + window.scrollY / -600;
            img2.style.opacity = value;
        });
    }

    // EFECTO SCROLL REVEAL
    ScrollReveal({
        reset: true,
        distance: '60px',
        duration: 2500,
        delay: 200
    });

    ScrollReveal().reveal('.movimientoh1', { delay: 200, origin: 'bottom' });
    ScrollReveal().reveal('.movimientoh3', { delay: 300, origin: 'bottom' });
    ScrollReveal().reveal('.btn-reservar2', { delay: 300, origin: 'bottom' });

    // EFECTO PARALLAX
    window.addEventListener('scroll', function() {
        const parallax = document.querySelector('.parallax-section');
        if (parallax) {
            const rect = parallax.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;
            const sectionCenter = rect.top + parallax.offsetHeight / 2;
            const distanceToCenter = viewportCenter - sectionCenter;
            const backgroundPositionY = (distanceToCenter * 0.5);
            parallax.style.backgroundPositionY = `calc(50% + ${backgroundPositionY}px)`;
        }
    });

    // EFECTO CAMBIO FORMULARIOS DE CONTACTO
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.contact-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.dataset.target; // Usamos data-target
            const targetForm = document.getElementById(targetId);
            if (targetForm) targetForm.classList.add('active');
        });
    });
}

// ======================================================
// 5. LÓGICA DE EVENTOS (Carga y Carrusel)
// ======================================================

const track = document.querySelector('.carousel-track');
const leftBtn = document.querySelector('.carousel-btn.left');
const rightBtn = document.querySelector('.carousel-btn.right');
const HORA_LIMITE = 10; 
const HORA_CADUCIDAD_LIVE = 3; 

let cards = [];
let activeIndex = 0;

function cargarEventos() {
    const preloader = document.getElementById('preloader');
    
    fetch("/api/eventos")
        .then(res => {
            if (!res.ok) throw new Error('Error API eventos');
            return res.json();
        })
        .then(data => {
            eventos = data;
            eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
            
            inicializarEventos();
            inicializarCalendario();
            
            if (preloader) preloader.classList.add('preloader-hidden');
        })
        .catch(error => {
            console.error(error);
            if (track) track.innerHTML = "<p style='color:white;text-align:center;'>Error cargando eventos.</p>";
            if (preloader) preloader.classList.add('preloader-hidden');
        });
}

function createEventCard(evento) {
    // OBTIENE LOS TEXTOS TRADUCIDOS DE LA BD (O usa fallback si no cargó aún)
    const textosUI = contenidoWeb[idiomaActual]?.eventos?.ui || {};
    
    // Textos por defecto para botones
    const txtReservar = idiomaActual === 'en' ? 'Book' : 'Reservar';
    const txtFinalizado = idiomaActual === 'en' ? 'Ended' : 'Finalizado';

    const luxonFecha = DateTimeLuxon.fromISO(evento.fecha);
    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");    

    // 1. Evento Pasado
    const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
        .plus({ days: 1 })
        .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });
    const esPasado = ahoraMadrid >= fechaCorteFinalizado;
    
    // 2. Especiales (Cerrado/Privado) - ESTE BLOQUE RETORNA Y TERMINA LA FUNCIÓN SI ES ESPECIAL
    if (evento.tipoEvento === "Cerrado" || evento.tipoEvento === "Privado") {
        const isClosed = evento.tipoEvento === "Cerrado";
        const specialImage = isClosed ? "cerrado.jpg" : "eventoPrivado.jpg";
        const specialClass = isClosed ? "closed" : "private";
        
        // Textos traducidos
        const specialTitle = isClosed 
            ? (textosUI.labelCerrado || "Cerrado") 
            : (textosUI.labelPrivado || "Privado");
        
        const specialText = isClosed 
            ? (textosUI.txtCerrado || "...") 
            : (textosUI.txtPrivado || "...");
            
        const txtSigueAmbiente = textosUI.txtEspecial || "Sigue en ambiente:";
        const finalizadoClass = esPasado ? 'past' : '';

        return `
            <div class="event-card special ${specialClass} ${finalizadoClass}">
                <div class="card-image special">
                    <img src="img/${specialImage}" alt="${specialTitle}">
                    <div class="event-date">${luxonFecha.toFormat("dd LLLL")}</div>
                </div>
                <div class="card-content">
                    <h3>${specialTitle}</h3>
                    <p>${specialText}</p>
                    <div class="special-links">
                        ${txtSigueAmbiente} <a href="https://instagram.com/altxerribar" target="_blank">Instagram</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 3. LÓGICA DE EVENTOS REGULARES (Si no entró en el if anterior, sigue aquí)
    
    // --- AQUÍ ESTÁ LA LÓGICA BILINGÜE (NUEVO) ---
    // Si estamos en inglés Y existe título en inglés, úsalo. Si no, usa el normal.
    const tituloMostrar = (idiomaActual === 'en' && evento.titulo_en) ? evento.titulo_en : evento.titulo;
    // Lo mismo para la descripción
    const descData = (idiomaActual === 'en' && evento.descripcion_en) ? evento.descripcion_en : evento.descripcion;
    // ---------------------------------------------

    let botonAdicionalHTML = '';
    let descripcionHTML = '';

    const fechaCorteLive = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
        .plus({ days: 1 })
        .set({ hour: HORA_CADUCIDAD_LIVE, minute: 0, second: 0, millisecond: 0 });
    const liveCaducado = ahoraMadrid >= fechaCorteLive;
    
    if (evento.concierto && evento.concierto.trim() !== '') {
        const txtArchivo = textosUI.btnArchivo || "Reviví el concierto";
        botonAdicionalHTML = `<a href="${evento.concierto}" target="_blank" class="btn-adicional btn-archive">${txtArchivo}</a>`;
    
    } else {
        if (!liveCaducado) { 
            if (evento.live && evento.live.trim() !== '') {
                const txtVivo = textosUI.btnVivo || "Ver en Vivo";
                botonAdicionalHTML = `<a href="${evento.live}" target="_blank" class="btn-adicional btn-live">${txtVivo}</a>`;
            }
            // Usamos la variable traducida 'descData'
            if (descData && descData.trim() !== '') {
                descripcionHTML = `<p class="card-descripcion-precio">${descData}</p>`;
            }
        }
    }
    
    const isLiveActive = botonAdicionalHTML.indexOf('btn-live') !== -1;
    const finalizadoClass = (esPasado && !isLiveActive) ? 'past' : '';
    const finalizadoDisabled = (esPasado && !isLiveActive) ? "disabled" : "";
    const finalizadoTextStr = (esPasado && !isLiveActive) ? txtFinalizado : txtReservar;

    let imagenMostrar;
    if (evento.imagen && (evento.imagen.startsWith('http') || evento.imagen.startsWith('https'))) {
        imagenMostrar = evento.imagen; 
    } else {
        imagenMostrar = `img/${evento.imagen || 'imgBandaGenerica.jpg'}`; 
    }

    // HTML FINAL PARA EVENTOS REGULARES
    return `
        <div class="event-card ${finalizadoClass}">
            <div class="card-image">
                <img src="${imagenMostrar}" alt="${tituloMostrar}">
                <div class="event-date">${luxonFecha.toFormat("dd LLLL")}</div>
            </div>
            <div class="card-content">
                <h3>${tituloMostrar}</h3> ${descripcionHTML}
                <button class="btn-reservar" ${finalizadoDisabled}>
                    ${finalizadoTextStr}
                </button>
                ${botonAdicionalHTML}
            </div>
        </div>
    `;
}

function inicializarEventos() {
    if (!eventos || eventos.length === 0) return; 
    track.innerHTML = ''; 

    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");
    let primerEventoProximoIndex = -1;

    eventos.forEach((evento, index) => {
        const cardHTML = createEventCard(evento);
        track.insertAdjacentHTML('beforeend', cardHTML);

        const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
            .plus({ days: 1 })
            .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });
        const esPasado = ahoraMadrid >= fechaCorteFinalizado;

        if (!esPasado && primerEventoProximoIndex === -1) {
            primerEventoProximoIndex = index;
        }
    });

    cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));
    activeIndex = (primerEventoProximoIndex !== -1) ? primerEventoProximoIndex : Math.max(0, cards.length - 1); 
    
    updateCarousel();
    setupCarouselControls();
}

function updateCarousel() {
    if (cards.length === 0) return;
    cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));
    const cardWidth = cards[0].offsetWidth;
    const cardMargin = 16; 
    
    let offsetIndex = 2; 
    if (window.innerWidth <= 900) offsetIndex = 0; 

    const adjustedActiveIndex = Math.max(0, activeIndex);
    const offset = -(adjustedActiveIndex - offsetIndex) * (cardWidth + cardMargin);
    track.style.transform = `translateX(${offset}px)`;

    cards.forEach(card => card.classList.remove('active'));
    if (cards[activeIndex]) cards[activeIndex].classList.add('active');
}

function setupCarouselControls() {
    // Buscamos los botones frescos del DOM
    const left = document.querySelector('.carousel-btn.left');
    const right = document.querySelector('.carousel-btn.right');

    if (!left || !right) return;

    // Clona y reemplaza para limpiar listeners viejos de forma segura
    const newLeft = left.cloneNode(true);
    const newRight = right.cloneNode(true);
    
    if (left.parentNode) {
        left.parentNode.replaceChild(newLeft, left);
    }
    if (right.parentNode) {
        right.parentNode.replaceChild(newRight, right);
    }

    // Asignamos los nuevos listeners
    newLeft.addEventListener('click', () => {
        activeIndex = Math.max(0, activeIndex - 1);
        updateCarousel();
    });

    newRight.addEventListener('click', () => {
        activeIndex = Math.min(cards.length - 1, activeIndex + 1);
        updateCarousel();
    });
}

// Swipe Mobile
let startX = 0;
track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
track.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) { 
        if (diff > 0) {
            activeIndex = Math.min(cards.length - 1, activeIndex + 1);
        } else {
            activeIndex = Math.max(0, activeIndex - 1);
        }
        updateCarousel();
    }
});

// ======================================================
// 6. GALERÍA Y MODALES
// ======================================================

// GALERÍA DINÁMICA
const galleryTrack = document.getElementById('gallery-track');
const galleryIndicatorsContainer = document.getElementById('gallery-indicators');
const leftGalleryBtn = document.querySelector('.left-gallery-btn');
const rightGalleryBtn = document.querySelector('.right-gallery-btn');

let currentGalleryIndex = 0;
let totalGallerySlides = 0;
let galleryInterval;

function renderizarGaleria(imagenes) {
    if (!galleryTrack || !imagenes || imagenes.length === 0) return;

    // 1. Limpiar
    galleryTrack.innerHTML = '';
    if(galleryIndicatorsContainer) galleryIndicatorsContainer.innerHTML = '';
    
    // 2. Generar Slides
    imagenes.forEach((imgSrc, index) => {
        // Si no empieza con http, asumimos que está en img/
        const ruta = imgSrc.startsWith('http') ? imgSrc : `img/${imgSrc}`;
        
        const img = document.createElement('img');
        img.src = ruta;
        img.className = 'gallery-slide';
        img.alt = `Galería imagen ${index + 1}`;
        galleryTrack.appendChild(img);

        // Generar Indicador
        if(galleryIndicatorsContainer) {
            const dot = document.createElement('div');
            dot.className = 'indicator';
            dot.addEventListener('click', () => moveToGallerySlide(index));
            galleryIndicatorsContainer.appendChild(dot);
        }
    });

    totalGallerySlides = imagenes.length;
    currentGalleryIndex = 0;
    moveToGallerySlide(0);

    // Reiniciar Intervalo
    if (galleryInterval) clearInterval(galleryInterval);
    galleryInterval = setInterval(() => moveToGallerySlide(currentGalleryIndex + 1), 4000);
}

function moveToGallerySlide(index) {
    if (totalGallerySlides === 0) return;

    if (index >= totalGallerySlides) index = 0;
    else if (index < 0) index = totalGallerySlides - 1;

    currentGalleryIndex = index;
    const offset = -currentGalleryIndex * 100;
    galleryTrack.style.transform = `translateX(${offset}vw)`;

    // Actualizar indicadores
    if(galleryIndicatorsContainer) {
        const dots = galleryIndicatorsContainer.querySelectorAll('.indicator');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentGalleryIndex));
    }
}

// Listeners Botones Galería
if (leftGalleryBtn) {
    // Clonar para limpiar listeners viejos si se recarga
    const newLeft = leftGalleryBtn.cloneNode(true);
    leftGalleryBtn.parentNode.replaceChild(newLeft, leftGalleryBtn);
    newLeft.addEventListener('click', () => {
        moveToGallerySlide(currentGalleryIndex - 1);
        if(galleryInterval) clearInterval(galleryInterval); // Pausa auto al interactuar
    });
}

if (rightGalleryBtn) {
    const newRight = rightGalleryBtn.cloneNode(true);
    rightGalleryBtn.parentNode.replaceChild(newRight, rightGalleryBtn);
    newRight.addEventListener('click', () => {
        moveToGallerySlide(currentGalleryIndex + 1);
        if(galleryInterval) clearInterval(galleryInterval);
    });
}

// Swipe Mobile Galería
let galleryStartX = 0;
if (galleryTrack) {
    galleryTrack.addEventListener('touchstart', (e) => { galleryStartX = e.touches[0].clientX; });
    galleryTrack.addEventListener('touchend', (e) => {
        const diff = galleryStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) moveToGallerySlide(currentGalleryIndex + 1);
            else moveToGallerySlide(currentGalleryIndex - 1);
            if(galleryInterval) clearInterval(galleryInterval);
        }
    });
}

// MODAL CALENDARIO (Variables y Listeners)
const modalCalendario = document.getElementById("modalCalendario");
const btnAbrirCal = document.getElementById("abrirCalendario");
const btnCerrarCal = document.getElementById("cerrarCalendario");
const filtroCal = document.getElementById("filtroEstado");
const inputBusquedaCal = document.getElementById("busquedaEventos");
const calendarioDiv = document.getElementById("calendario");
const detalleEvento = document.getElementById("detalleEvento");

if (btnAbrirCal) btnAbrirCal.addEventListener("click", () => modalCalendario.style.display = "block");
if (btnCerrarCal) btnCerrarCal.addEventListener("click", () => modalCalendario.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modalCalendario) modalCalendario.style.display = "none";
});

function inicializarCalendario() {
    // Asegurarse de que Litepicker existe
    if (typeof Litepicker !== 'undefined' && calendarioDiv) {
        new Litepicker({
            element: calendarioDiv,
            format: 'YYYY-MM-DD',
            lang: 'es-ES',
            inlineMode: true,
            setup: (picker) => {
                picker.on('selected', (date) => {
                    mostrarEvento(date.format('yyyy-MM-dd'));
                });
            }
        });
    }
}

function mostrarEvento(fecha) {
    // Esta función usa la variable global 'eventos'
    const evento = eventos.find(ev => ev.fecha === fecha);
    if (!evento) {
        detalleEvento.innerHTML = `<p>No hay evento en esta fecha.</p>`;
        return;
    }
    // Reutiliza createEventCard para consistencia visual y de idioma
    detalleEvento.innerHTML = createEventCard(evento);
}

if (inputBusquedaCal) inputBusquedaCal.addEventListener("input", aplicarFiltros);
if (filtroCal) filtroCal.addEventListener("change", aplicarFiltros);

function aplicarFiltros() {
    const texto = inputBusquedaCal.value.toLowerCase();
    const estado = filtroCal.value;
    const ahora = DateTimeLuxon.now().setZone("Europe/Madrid");

    let resultados = eventos.filter(ev => {
        const fechaEv = DateTimeLuxon.fromISO(ev.fecha, { zone: "Europe/Madrid" });
        const fechaCorte = fechaEv.plus({ days: 1 }).set({ hour: HORA_LIMITE });
        const esPasado = ahora >= fechaCorte;
        
        const coincideEstado = estado === "proximos" ? !esPasado : esPasado;
        const coincideTexto = ev.titulo.toLowerCase().includes(texto); // Simplificado

        return coincideEstado && coincideTexto;
    });

    if (resultados.length > 0) {
        mostrarEvento(resultados[0].fecha);
    } else {
        detalleEvento.innerHTML = `<p>No hay eventos que coincidan.</p>`;
    }
}

// MODAL NEWSLETTER
const newsletterModal = document.getElementById('newsletterModal');
const navBtnNewsletter = document.getElementById('nav-btn-newsletter'); 
const parallaxBtn = document.getElementById('parallax-btn'); 
const closeModalSpan = document.querySelector('.close-newsletter-modal');
const newsletterForm = document.getElementById('newsletterForm');
const successMessage = document.getElementById('newsletterSuccessMessage');
const formContainer = document.getElementById('newsletterFormContainer');
const closeSuccessBtn = document.getElementById('closeNewsletterSuccess');

// Función para abrir
function openNewsletter() {
    if(newsletterModal) newsletterModal.classList.add('show');
}

// Función para cerrar
function closeNewsletter() {
    if(newsletterModal) newsletterModal.classList.remove('show');
    // Reseteamos estados visuales
    if(formContainer) formContainer.style.display = 'block';
    if(successMessage) successMessage.style.display = 'none';
    if(newsletterForm) newsletterForm.reset();
}

// Listeners (Conectamos los botones a las funciones)
if (navBtnNewsletter) navBtnNewsletter.addEventListener('click', openNewsletter);
if (parallaxBtn) parallaxBtn.addEventListener('click', openNewsletter);
if (closeModalSpan) closeModalSpan.addEventListener('click', closeNewsletter);
if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeNewsletter);

// Cerrar si clickean fuera
window.addEventListener('click', (event) => {
    if (event.target === newsletterModal) closeNewsletter();
});

// Envío del formulario
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulación de éxito
        if(formContainer) formContainer.style.display = 'none';
        if(successMessage) successMessage.style.display = 'block';
    });
}