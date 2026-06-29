'use strict';

/* Utility: throttle scroll handlers */
function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================
   Mobile menu
   ============================================ */
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');
const siteNav = document.getElementById('siteNav');
const navBackdrop = document.getElementById('navBackdrop');
const navLinks = document.querySelectorAll('.nav-link');

function setMobileMenuOpen(isOpen) {
    if (!navMenu || !mobileMenuToggle) return;
    navMenu.classList.toggle('active', isOpen);
    siteNav?.classList.toggle('is-open', isOpen);
    mobileMenuToggle.classList.toggle('active', isOpen);
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('nav-open', isOpen);

    const spans = mobileMenuToggle.querySelectorAll('span');
    if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translateY(6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-6px)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
}

function closeMobileMenu() {
    setMobileMenuOpen(false);
}

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        setMobileMenuOpen(!navMenu.classList.contains('active'));
    });
}

if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMobileMenu);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeMobileMenu();
    });
});

/* ============================================
   Navbar scroll state
   ============================================ */
const navbar = document.getElementById('navbar');

const handleScroll = throttle(() => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}, 100);

window.addEventListener('scroll', handleScroll, { passive: true });

/* ============================================
   Active nav link
   ============================================ */
const sections = document.querySelectorAll('section[id]');

const setActiveLink = throttle(() => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const top = section.offsetTop - 120;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) current = id;
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}, 100);

window.addEventListener('scroll', setActiveLink, { passive: true });

/* ============================================
   Smooth scroll for anchor links
   ============================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const offset = (navbar?.offsetHeight || 72) + 16;
        window.scrollTo({
            top: target.offsetTop - offset,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        history.pushState(null, '', targetId);
    });
});

/* ============================================
   Scroll reveal
   ============================================ */
function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (prefersReducedMotion) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.08}s`;
        observer.observe(el);
    });
}

/* ============================================
   Stats counter
   ============================================ */
function animateCounter(el, target, duration = 1800) {
    if (prefersReducedMotion) {
        el.textContent = target;
        return;
    }
    const start = performance.now();
    const step = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const num = entry.target.querySelector('.stat-number');
        const target = parseInt(num?.getAttribute('data-target'), 10);
        if (num && !num.classList.contains('animated') && !isNaN(target)) {
            num.classList.add('animated');
            animateCounter(num, target);
        }
        statsObserver.unobserve(entry.target);
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => statsObserver.observe(stat));

/* ============================================
   Contact form
   ============================================ */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async e => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            showNotification('Thank you! Your message has been sent successfully.', 'success');
            contactForm.reset();
        } catch {
            showNotification('Sorry, there was an error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function showNotification(message, type = 'success') {
    const region = document.getElementById('toast-region');
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    (region || document.body).appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

/* ============================================
   Hero carousel
   ============================================ */
const carouselSlides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let slideInterval;

function loadSlideImage(slide) {
    if (!slide || slide.dataset.loaded === 'true') return;

    const url = slide.dataset.bg;
    if (!url) return;

    slide.style.backgroundImage = `url('${url}')`;
    slide.dataset.loaded = 'true';
}

function preloadAdjacentSlides(index) {
    loadSlideImage(carouselSlides[index]);
    loadSlideImage(carouselSlides[(index + 1) % carouselSlides.length]);
}

function goToSlide(index) {
    if (!carouselSlides.length) return;

    carouselSlides[currentSlide]?.classList.remove('active');
    indicators[currentSlide]?.classList.remove('active');
    indicators[currentSlide]?.setAttribute('aria-selected', 'false');

    currentSlide = index;

    preloadAdjacentSlides(currentSlide);

    carouselSlides[currentSlide]?.classList.add('active');
    indicators[currentSlide]?.classList.add('active');
    indicators[currentSlide]?.setAttribute('aria-selected', 'true');
}

function nextSlide() {
    goToSlide((currentSlide + 1) % carouselSlides.length);
}

function startSlideTimer() {
    if (prefersReducedMotion || carouselSlides.length <= 1) return;
    slideInterval = setInterval(nextSlide, 3000);
}

function resetSlideTimer() {
    clearInterval(slideInterval);
    startSlideTimer();
}

function initCarousel() {
    if (!carouselSlides.length) return;

    preloadAdjacentSlides(0);

    const preloadRemaining = () => {
        carouselSlides.forEach(slide => loadSlideImage(slide));
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadRemaining, { timeout: 4000 });
    } else {
        setTimeout(preloadRemaining, 2000);
    }

    startSlideTimer();

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
            resetSlideTimer();
        });
    });
}

/* ============================================
   Clients carousel
   ============================================ */
const clientsCarousel = document.getElementById('clientsCarousel');
const carouselWrapper = clientsCarousel?.closest('.clients-carousel-wrapper');

if (carouselWrapper && clientsCarousel) {
    carouselWrapper.addEventListener('mouseenter', () => {
        if (!prefersReducedMotion) clientsCarousel.style.animationPlayState = 'paused';
    });
    carouselWrapper.addEventListener('mouseleave', () => {
        clientsCarousel.style.animationPlayState = '';
    });

    carouselWrapper.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            carouselWrapper.scrollLeft += e.deltaY;
        }
    }, { passive: false });

    let isDragging = false;
    let startX = 0;
    let startScroll = 0;

    carouselWrapper.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.pageX;
        startScroll = carouselWrapper.scrollLeft;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    carouselWrapper.addEventListener('mouseleave', () => { isDragging = false; });

    carouselWrapper.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        carouselWrapper.scrollLeft = startScroll - (e.pageX - startX) * 1.1;
    });
}

/* ============================================
   Product navigation
   ============================================ */
const productRoutes = {
    1: 'category-filling-systems.html',
    2: 'category-industrial-scales.html',
    3: 'category-retail-scales.html',
    4: 'category-customized-software-applications.html',
    5: 'retail-software.html',
    6: 'category-weighing-accessories.html',
    7: 'category-pos-hardware-accessories.html'
};

document.querySelectorAll('.btn-show-more').forEach(button => {
    button.addEventListener('click', () => {
        const id = parseInt(button.getAttribute('data-product'), 10);
        const title = encodeURIComponent(button.getAttribute('data-title') || '');
        const route = productRoutes[id];
        window.location.href = route || `gallery.html?product=${id}&title=${title}`;
    });
});

/* ============================================
   Image error fallback
   ============================================ */
const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23F4F4F5" width="400" height="300"/%3E%3Ctext fill="%2371717A" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';

document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function onError() {
        this.removeEventListener('error', onError);
        this.src = PLACEHOLDER;
        this.alt = 'Image unavailable';
    }, { once: true });
});

/* ============================================
   Keyboard / accessibility
   ============================================ */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenu();
});

/* ============================================
   Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    handleScroll();
    setActiveLink();
    initCarousel();
    initReveal();
});
