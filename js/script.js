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

// CAMBIAR FECHA DEL EVENTO DEL CARROUSEL A FINALIZADO

function marcarEventosPasados() {
  const ahora = new Date();
  const horaLimite = 10; // 10 de la mañana
  const fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horaLimite);

  if (ahora < fechaLimite) {
    fechaLimite.setDate(fechaLimite.getDate() - 1);
  }

  cards.forEach(card => {
    const fechaTexto = card.querySelector('.event-date').textContent;
    const [dia, mesTexto] = fechaTexto.split(" ");
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const mes = meses.indexOf(mesTexto);

    const fechaEvento = new Date(ahora.getFullYear(), mes, parseInt(dia));

    if (fechaEvento < fechaLimite) {
      card.classList.add('past');
      card.querySelector('.btn-reservar').disabled = true;
      card.querySelector('.btn-reservar').textContent = "Finalizado";
    }
  });
}


updateCarousel();
marcarEventosPasados();


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