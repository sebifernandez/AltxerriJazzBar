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