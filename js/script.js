// EFECTO HAMBURGUESA (Consolidado)
      document.addEventListener('DOMContentLoaded', () => {
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.querySelector('.nav-links');

      // Toggle para abrir/cerrar menú
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });

      // Cerrar menú al hacer clic en un enlace
      const links = navLinks.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
        });
      });
    });
    
    // EFECTO DESVANECIMIENTO
    
    let img1 = document.querySelector('.fondo');
    window.addEventListener('scroll' ,function(){
        let value = 1 + window.scrollY/ -600;
        img1.style.opacity = value;
    });

    let img2 = document.querySelector('#containermobile .fondo');
    window.addEventListener('scroll' ,function(){
    let value = 1 + window.scrollY/ -600;
    img2.style.opacity = value;
    });

    // EFECTO SCROLL REVEAL

    ScrollReveal({
            reset: true,
            distance: '60px',
            duration: 2500,
            delay: 200
        });

        ScrollReveal().reveal('.movimientoh1', {delay: 200, origin: 'bottom'});
        ScrollReveal().reveal('.movimientoh3', {delay: 300, origin: 'bottom'});
        ScrollReveal().reveal('.btn-reservar2', {delay: 300, origin: 'bottom'});
        ScrollReveal().reveal('.mockupderecha', {delay: 300, origin: 'bottom'});
        ScrollReveal().reveal('.mockupizquierda', {delay: 300, origin: 'bottom'});

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
        document.getElementById(tab.dataset.target).classList.add('active');
    });
    });

// ------------------------------------------------------------------
// LÓGICA DE CARGA Y CARROUSEL DE EVENTOS (DINÁMICA)
// ------------------------------------------------------------------

const DateTimeLuxon = luxon.DateTime;

const track = document.querySelector('.carousel-track');
const leftBtn = document.querySelector('.carousel-btn.left');
const rightBtn = document.querySelector('.carousel-btn.right');
const HORA_LIMITE = 10; // 10:00 AM de San Sebastián (Madrid) para marcar como FINALIZADO
const HORA_CADUCIDAD_LIVE = 3; // 3:00 AM de San Sebastián (Madrid) para ocultar el LIVE

let cards = []; 
let activeIndex = 0; 
let eventos = []; // Declarar globalmente para que sea accesible en el modal y el carrusel

// Función para actualizar la vista del carrusel
function updateCarousel() {
  if (cards.length === 0) return;

  // Recalcular cards por si se ha modificado el DOM
  cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));

  const cardWidth = cards[0].offsetWidth;
  const cardMargin = 16; // 1rem del CSS
  
  // Posición de centrado (2 en desktop, 0 en mobile)
  let offsetIndex = 2; 
  if (window.innerWidth <= 900) {
      offsetIndex = 0; 
  }

  // Si el índice activo es menor que el offset, no permitimos desplazamiento negativo
  const adjustedActiveIndex = Math.max(0, activeIndex);
  
  const offset = -(adjustedActiveIndex - offsetIndex) * (cardWidth + cardMargin);
  track.style.transform = `translateX(${offset}px)`;

  cards.forEach(card => card.classList.remove('active'));
  if (cards[activeIndex]) cards[activeIndex].classList.add('active');
}

// Genera el HTML de una card de evento
function createEventCard(evento) {
    const luxonFecha = DateTimeLuxon.fromISO(evento.fecha);
    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");

    // --- ¡ARREGLO AQUÍ! ---
    // 1. Lógica de "Evento Pasado" (FINALIZADO)
    // Se mueve aquí arriba para que esté disponible para TODOS los tipos de evento.
    const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
        .plus({ days: 1 })
        .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });

    const esPasado = ahoraMadrid >= fechaCorteFinalizado;
    
    // ----------------------------------------------------
    // LÓGICA DE EVENTOS CERRADO/PRIVADO
    // ----------------------------------------------------
    if (evento.tipoEvento === "Cerrado" || evento.tipoEvento === "Privado") {
        const isClosed = evento.tipoEvento === "Cerrado";
        const specialImage = isClosed ? "eventoPrivado.jpg" : "cerrado.jpg";
        const specialClass = isClosed ? "closed" : "private";
        const specialTitle = isClosed ? "Cerrado por Descanso" : "Evento Privado";
        const specialText = isClosed 
            ? "¡Volvemos pronto con más Jazz!"
            : "Lo sentimos... ¡Te esperamos el resto de la semana!";
        
        // --- ¡ARREGLO AQUÍ! ---
        // 2. Añadimos la clase 'past' si el evento especial ya pasó.
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
                        Sigue en ambiente: 
                        <a href="https://instagram.com/altxerribar" target="_blank">Instagram</a> | 
                        <!-- <a href="https://youtube.com" target="_blank">YouTube</a> -->
                    </div>
                </div>
            </div>
        `;
    }
    
    // ----------------------------------------------------
    // LÓGICA DE EVENTOS REGULARES (Regular)
    // ----------------------------------------------------

    // 2. Lógica de Botones Adicionales (LIVE y CONCIERTO)
    // (Esta lógica ya estaba perfecta en tu archivo, no se toca)
    let botonAdicionalHTML = '';

    // Criterio 1: ¿Debe aparecer "Reviví el concierto"? (Prioridad máxima)
    if (evento.concierto && evento.concierto.trim() !== '') {
        botonAdicionalHTML = `<a href="${evento.concierto}" target="_blank" class="btn-adicional btn-archive">Reviví el concierto</a>`;

    } else if (evento.live && evento.live.trim() !== '') {
        // Criterio 2: ¿Debe aparecer "Ver en vivo"?
        
        // Cálculo de la hora de caducidad del LIVE (3:00 AM del día siguiente)
        const fechaCorteLive = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
            .plus({ days: 1 })
            .set({ hour: HORA_CADUCIDAD_LIVE, minute: 0, second: 0, millisecond: 0 });

        // Mostrar LIVE si NO está caducado Y si es para el día del evento
        const liveCaducado = ahoraMadrid >= fechaCorteLive;
        const isToday = ahoraMadrid.toISODate() === luxonFecha.toISODate();
        
        // Permitir LIVE si el evento NO es pasado (10 AM del día siguiente)
        if (!liveCaducado && (isToday || !esPasado)) { 
             botonAdicionalHTML = `<a href="${evento.live}" target="_blank" class="btn-adicional btn-live">Ver en vivo</a>`;
        }
    }
    
// 3. Renderizado de Card Regular
    const isLiveActive = botonAdicionalHTML.indexOf('btn-live') !== -1;
    const finalizadoClass = (esPasado && !isLiveActive) ? 'past' : '';
    const finalizadoDisabled = (esPasado && !isLiveActive) ? "disabled" : "";
    const finalizadoText = (esPasado && !isLiveActive) ? "Finalizado" : "Reservar";
    
    // --- INICIO DEL ARREGLO ---
    let imagenMostrar;
    if (evento.imagen && (evento.imagen.startsWith('http') || evento.imagen.startsWith('https'))) {
        imagenMostrar = evento.imagen; // Es una URL de Cloudinary
    } else {
        imagenMostrar = `img/${evento.imagen || 'imgBandaGenerica.jpg'}`; // Es local o fallback
    }
    // --- FIN DEL ARREGLO ---

    return `
      <div class="event-card ${finalizadoClass}">
        <div class="card-image">
          <img src="${imagenMostrar}" alt="${evento.titulo}">
          <div class="event-date">${luxonFecha.toFormat("dd LLLL")}</div>
        </div>
        <div class="card-content">
          <h3>${evento.titulo}</h3>

          <button class="btn-reservar" ${finalizadoDisabled}>
            ${finalizadoText}
          </button>
          ${botonAdicionalHTML}
        </div>
      </div>
    `;
}

// Carga los eventos y renderiza el carrusel
function inicializarEventos() {
    if (!eventos || eventos.length === 0) return; 

    track.innerHTML = ''; // Limpiar el contenido estático

    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");
    let primerEventoProximoIndex = -1;

    eventos.forEach((evento, index) => {
        // Generar el HTML de la card
        const cardHTML = createEventCard(evento);
        track.insertAdjacentHTML('beforeend', cardHTML);

        // LÓGICA DE DETECCIÓN DEL EVENTO ACTUAL/PRÓXIMO:
        
        // 1. Obtener la fecha de corte para el evento (Día del evento + 1 a las 10:00 AM Madrid)
        const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
            .plus({ days: 1 })
            .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });
            
        // 2. Determinar si YA pasó el tiempo de caducidad
        const esPasado = ahoraMadrid >= fechaCorteFinalizado;

        // 3. Encontrar el primer evento que AÚN NO HA CADUCADO (no es pasado)
        if (!esPasado && primerEventoProximoIndex === -1) {
            primerEventoProximoIndex = index;
        }
    });

    cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));

    // 1. Establecemos activeIndex al primer evento no finalizado (ej: 16/10/2025)
    activeIndex = (primerEventoProximoIndex !== -1) 
                    ? primerEventoProximoIndex 
                    : Math.max(0, cards.length - 1); 
    
    // 2. ¡ELIMINAMOS EL BLOQUE DE CÓDIGO QUE CAUSABA EL DESFASE!
    // La función updateCarousel ya se encarga de centrar el índice activo correctamente.
    
    updateCarousel();
    setupCarouselControls();
}

function setupCarouselControls() {
    leftBtn.addEventListener('click', () => {
        activeIndex = Math.max(0, activeIndex - 1);
        updateCarousel();
    });

    rightBtn.addEventListener('click', () => {
        activeIndex = Math.min(cards.length - 1, activeIndex + 1);
        updateCarousel();
    });
}


// Modal del calendario (Integrado)

const modal = document.getElementById("modalCalendario");
const btnAbrir = document.getElementById("abrirCalendario");
const btnCerrar = document.getElementById("cerrarCalendario");
const filtro = document.getElementById("filtroEstado");
const inputBusqueda = document.getElementById("busquedaEventos");
const calendarioDiv = document.getElementById("calendario");
const detalleEvento = document.getElementById("detalleEvento");

btnAbrir.addEventListener("click", () => modal.style.display = "block");
btnCerrar.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// ✅ Cargar JSON desde la API e Inicializar (VERSIÓN CORREGIDA)
fetch("/api/eventos") // CAMBIO: Llamamos a nuestra nueva API
  .then(res => {
      if (!res.ok) {
          throw new Error('Error al cargar la API de eventos');
      }
      return res.json();
  })
  .then(data => {
    // 1. Recibimos los datos
    eventos = data;
    
    // 2. ¡AQUÍ VA EL ARREGLO! Los ordenamos por fecha
    eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // 3. (Y solo ahora) Inicializamos todo con los datos ordenados
    inicializarEventos(); 
    inicializarCalendario();
    aplicarFiltros(); 
  })
  .catch(error => {
      console.error(error);
      // Opcional: Mostrar un error en el carrusel
      if (track) track.innerHTML = "<p style='color: white; text-align: center;'>Error al cargar eventos.</p>";
  });

function inicializarCalendario() {
  const picker = new Litepicker({
    element: calendarioDiv,
    format: 'YYYY-MM-DD',
    lang: 'es-ES',
    inlineMode: true,
    setup: (picker) => {
      picker.on('selected', (date) => {
        const seleccionada = date.format('yyyy-MM-dd');
        mostrarEvento(seleccionada);
      });
    }
  });
}

function mostrarEvento(fecha) {
  const evento = eventos.find(ev => ev.fecha === fecha);
  if (!evento) {
    detalleEvento.innerHTML = `<p>No hay evento en esta fecha.</p>`;
    return;
  }
  
  const ahora = DateTimeLuxon.now().setZone("Europe/Madrid");
  const fechaEvento = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" });
  const fechaCorteFinalizado = fechaEvento.plus({ days: 1 }).set({ hour: HORA_LIMITE });
  const esPasado = ahora >= fechaCorteFinalizado;

  // Lógica de "Cerrado/Privado" para el Modal
  if (evento.tipoEvento === "Cerrado" || evento.tipoEvento === "Privado") {
      const isClosed = evento.tipoEvento === "Cerrado";
      const specialImage = isClosed ? "eventoPrivado.jpg" : "cerrado.jpg";
      const specialTitle = isClosed ? "Cerrado por Descanso" : "Evento Privado";
      const specialText = isClosed 
          ? "El local permanecerá cerrado al público."
          : "El local está reservado para un evento privado.";
      
      // --- ¡ARREGLO AQUÍ! ---
      // 3. Añadimos la clase 'past' al modal también
      const finalizadoClass = esPasado ? 'past' : '';

      detalleEvento.innerHTML = `
          <div class="event-card special ${isClosed ? 'closed' : 'private'} ${finalizadoClass}">
              <div class="card-image special">
                  <img src="img/${specialImage}" alt="${specialTitle}">
                  <div class="event-date">${DateTimeLuxon.fromISO(evento.fecha).toFormat("dd LLLL")}</div>
              </div>
              <div class="card-content">
                  <h3>${specialTitle}</h3>
                  <p>${specialText}</p>
              </div>
          </div>`;
      return;
  }

// Lógica de Evento Regular para el Modal
  // (La lógica de botones aquí ya era correcta, priorizando 'concierto')
  let botonAdicionalHTML = '';
  if (evento.concierto && evento.concierto.trim() !== '') {
      botonAdicionalHTML = `<a href="${evento.concierto}" target="_blank" class="btn-adicional btn-archive">Reviví el concierto</a>`;
  }

  // --- INICIO DEL ARREGLO ---
  let imagenMostrarModal;
  if (evento.imagen && (evento.imagen.startsWith('http') || evento.imagen.startsWith('https'))) {
      imagenMostrarModal = evento.imagen; // Es una URL de Cloudinary
  } else {
      imagenMostrarModal = `img/${evento.imagen || 'imgBandaGenerica.jpg'}`; // Es local o fallback
  }
  // --- FIN DEL ARREGLO ---

  detalleEvento.innerHTML = `
    <div class="event-card ${esPasado ? 'past' : ''}">
      <div class="card-image">
        <img src="${imagenMostrarModal}" alt="Evento ${evento.fecha}">
        <div class="event-date">${DateTimeLuxon.fromISO(evento.fecha).toFormat("dd LLLL")}</div>
      </div>
      <div class="card-content">
        <h3>${evento.titulo}</h3>

        <button class="btn-reservar" ${esPasado ? "disabled" : ""}>
          ${esPasado ? "Finalizado" : "Reservar"}
        </button>
        ${botonAdicionalHTML}
      </div>
    </div>`;
}

// 🔍 Filtrar eventos por texto y estado
function aplicarFiltros() {
  const texto = inputBusqueda.value.toLowerCase();
  const estado = filtro.value;
  const ahora = DateTimeLuxon.now().setZone("Europe/Madrid");

  let resultados = eventos.filter(ev => {
    const eventoFecha = DateTimeLuxon.fromISO(ev.fecha, { zone: "Europe/Madrid" });
    const fechaCorte = eventoFecha.plus({ days: 1 }).set({ hour: HORA_LIMITE });
    const esPasado = ahora >= fechaCorte;
    
    // Filtrar por estado
    const coincideEstado = estado === "proximos" ? !esPasado : esPasado;
    
    // Filtrar por texto (si es Regular)
    const coincideTexto = ev.tipoEvento === "Regular" 
      ? ev.titulo.toLowerCase().includes(texto) 
      : ev.tipoEvento.toLowerCase().includes(texto) && texto !== "";

    // Siempre incluimos los eventos no regulares si no se está buscando texto
    const esEspecial = ev.tipoEvento !== "Regular";

    return (coincideEstado && coincideTexto) || (esEspecial && coincideEstado && texto === "");
  });

  if (resultados.length > 0) {
      // Priorizar el evento más próximo o más reciente
      if (estado === "finalizados") {
          resultados.sort((a, b) => b.fecha.localeCompare(a.fecha));
      } else {
          resultados.sort((a, b) => a.fecha.localeCompare(b.fecha));
      }
      mostrarEvento(resultados[0].fecha);
  } else {
      detalleEvento.innerHTML = `<p>No hay eventos que coincidan.</p>`;
  }
}

inputBusqueda.addEventListener("input", aplicarFiltros);
filtro.addEventListener("change", aplicarFiltros);


// SWIPE PARA MOBILE (Carrusel de Eventos)

let startX = 0;
let endX = 0;

track.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

track.addEventListener('touchend', (e) => {
  endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (Math.abs(diff) > 50) { 
    if (diff > 0) {
      // Swipe izquierda → siguiente
      activeIndex = Math.min(cards.length - 1, activeIndex + 1);
      updateCarousel();
    } else {
      // Swipe derecha → anterior
      activeIndex = Math.max(0, activeIndex - 1);
      updateCarousel();
    }
  }
});


// ------------------------------------------------------------------
// LÓGICA DE CARRUSEL DE GALERÍA DE IMÁGENES
// ------------------------------------------------------------------

const galleryTrack = document.querySelector('.gallery-track');
const gallerySlides = document.querySelectorAll('.gallery-slide');
const leftGalleryBtn = document.querySelector('.left-gallery-btn');
const rightGalleryBtn = document.querySelector('.right-gallery-btn');
const galleryIndicatorsContainer = document.querySelector('.gallery-indicators');

let currentGalleryIndex = 0;
const totalSlides = gallerySlides.length;

// 1. Crear Indicadores
function createIndicators() {
    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        indicator.dataset.index = i;
        indicator.addEventListener('click', () => moveToSlide(i));
        galleryIndicatorsContainer.appendChild(indicator);
    }
}

// 2. Función para mover al slide
function moveToSlide(index) {
    // Asegura que el índice esté dentro de los límites (ciclico)
    if (index >= totalSlides) {
        index = 0;
    } else if (index < 0) {
        index = totalSlides - 1;
    }

    currentGalleryIndex = index;
    // Mueve por porcentaje de ancho (100% por slide)
    const offset = -currentGalleryIndex * 100; 
    galleryTrack.style.transform = `translateX(${offset}vw)`;

    updateIndicators();
}

// 3. Actualizar Indicadores (y clase activa)
function updateIndicators() {
    const indicators = document.querySelectorAll('.gallery-indicators .indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentGalleryIndex);
    });
}

// 4. Navegación con botones
if (leftGalleryBtn) leftGalleryBtn.addEventListener('click', () => {
    moveToSlide(currentGalleryIndex - 1);
});

if (rightGalleryBtn) rightGalleryBtn.addEventListener('click', () => {
    moveToSlide(currentGalleryIndex + 1);
});

// 5. Inicialización y Autoplay
if (galleryTrack) {
    createIndicators();
    moveToSlide(0); 
    setInterval(() => {
        moveToSlide(currentGalleryIndex + 1);
    }, 4000); // Cambia de slide cada 4 segundos
}

// 6. Manejo de Swipe para móvil en la galería
let galleryStartX = 0;
let galleryEndX = 0;

if (galleryTrack) {
    galleryTrack.addEventListener('touchstart', (e) => {
        galleryStartX = e.touches[0].clientX;
    });

    galleryTrack.addEventListener('touchend', (e) => {
        galleryEndX = e.changedTouches[0].clientX;
        const diff = galleryStartX - galleryEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe izquierda → siguiente
                moveToSlide(currentGalleryIndex + 1);
            } else {
                // Swipe derecha → anterior
                moveToSlide(currentGalleryIndex - 1);
            }
        }
    });
}


// ------------------------------------------------------------------
// LÓGICA DEL MODAL NEWSLETTER
// ------------------------------------------------------------------

const newsletterModal = document.getElementById('newsletterModal');
const openModalBtn = document.getElementById('openNewsletterModal');
const openModalParallaxBtn = document.getElementById('openNewsletterModalParallax');
const closeModalSpan = document.querySelector('.close-newsletter-modal');
const newsletterForm = document.getElementById('newsletterForm');
const formError = document.getElementById('formError');
const successMessage = document.getElementById('newsletterSuccessMessage');
const formContainer = document.getElementById('newsletterFormContainer');
const closeSuccessBtn = document.getElementById('closeNewsletterSuccess');

// Función para abrir el modal
function openModal() {
    newsletterModal.classList.add('show');
}

// Función para cerrar el modal
function closeModal() {
    newsletterModal.classList.remove('show');
    // Resetear a la vista del formulario
    formContainer.style.display = 'block';
    successMessage.style.display = 'none';
    formError.textContent = '';
    newsletterForm.reset();
}

// Abrir modal con botones
if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (openModalParallaxBtn) openModalParallaxBtn.addEventListener('click', openModal);

// Cerrar modal con el botón X
if (closeModalSpan) closeModalSpan.addEventListener('click', closeModal);

// Cerrar modal con el botón de éxito
if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

// Cerrar modal si el usuario hace clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target === newsletterModal) {
        closeModal();
    }
});

// Validación y Guardado (Simulación)
newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('newsletterName').value.trim();
    const email = document.getElementById('newsletterEmail').value.trim();

    // Validación simple de Email (cliente)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        formError.textContent = 'Por favor, introduce un correo electrónico válido.';
        return;
    }

    if (name === '') {
        formError.textContent = 'El nombre no puede estar vacío.';
        return;
    }
    
    formError.textContent = '';

    // --- SIMULACIÓN DE GUARDADO EN JSON ---
    const dataToSave = {
        nombre: name,
        mail: email,
        fecha_suscripcion: new Date().toISOString()
    };
    
    console.log("Datos listos para enviar (simulación JSON):", dataToSave);
    
    // Ocultar formulario y mostrar éxito
    formContainer.style.display = 'none';
    successMessage.style.display = 'block';

});

// --- ¡ARREGLO AQUÍ! ---
// 4. Eliminamos el código antiguo de JQuery/Slick
// (El bloque que estaba aquí fue eliminado)