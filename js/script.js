    // EFECTO HAMBURGUESA

      document.addEventListener('DOMContentLoaded', () => {
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.querySelector('.nav-links');

      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });

      const links = navLinks.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
        });
      });
    });
    
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
    const scrollPosition = window.scrollY;
    parallax.style.backgroundPositionY = `${scrollPosition * 0.5}px`; //0.3 más lento / 0.7 más rapido
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

    // MOVIMIENTO DE CARROUSEL DE FECHAS

const track = document.querySelector('.carousel-track');
const cards = document.querySelectorAll('.event-card');
const leftBtn = document.querySelector('.carousel-btn.left');
const rightBtn = document.querySelector('.carousel-btn.right');
let activeIndex = 2;

function updateCarousel() {
  const offset = -activeIndex * (cards[0].offsetWidth + 16);
  track.style.transform = `translateX(${offset}px)`;

  cards.forEach(card => card.classList.remove('active'));
  if (cards[activeIndex]) cards[activeIndex].classList.add('active');
}

leftBtn.addEventListener('click', () => {
  activeIndex = Math.max(0, activeIndex - 1);
  updateCarousel();
});

rightBtn.addEventListener('click', () => {
  activeIndex = Math.min(cards.length - 1, activeIndex + 1);
  updateCarousel();
});

// Marcar eventos pasados según la hora de San Sebastián (Madrid)
const { DateTime } = luxon;

function marcarEventosPasados() {
  // Obtener fecha/hora actual en la zona horaria de Madrid
  const ahoraMadrid = DateTime.now().setZone("Europe/Madrid");

  const horaLimiteEvento = 10; // Hora límite de los eventos (10:00 AM)
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  let foundActive = false;

  cards.forEach((card, index) => {
    const fechaTexto = card.querySelector('.event-date').textContent;
    const [dia, mesTexto] = fechaTexto.split(" ");
    const mes = meses.indexOf(mesTexto) + 1; // Luxon usa 1-12

    // Crear fecha del evento a las 10:00 AM hora Madrid
const fechaEvento = DateTime.fromObject(
  { year: ahoraMadrid.year, month: mes, day: parseInt(dia) + 1, hour: horaLimiteEvento },
  { zone: "Europe/Madrid" }
);

    if (ahoraMadrid >= fechaEvento) {
      card.classList.add('past');
      card.querySelector('.btn-reservar').disabled = true;
      card.querySelector('.btn-reservar').textContent = "Finalizado";
    } else if (!foundActive) {
      activeIndex = index;
      foundActive = true;
    }
  });

  updateCarousel();
}


// Inicialización al cargar
marcarEventosPasados();


// SWIPE PARA MOBILE

let startX = 0;
let endX = 0;

track.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

track.addEventListener('touchend', (e) => {
  endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (Math.abs(diff) > 50) { // Umbral mínimo para evitar falsos positivos
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


//ESTO CREO QUE NO VA

        $(document).ready(function(){
			$('.customer-logos').slick({
				slidesToShow: 8,
				slidesToScroll: 1,
				autoplay: true,
				autoplaySpeed: 1000,
				arrows: false,
				dots: false,
					pauseOnHover: false,
					responsive: [{
					breakpoint: 768,
					settings: {
						slidesToShow: 3
					}
				}, {
					breakpoint: 520,
					settings: {
						slidesToShow: 2
					}
				}]
			});
		});