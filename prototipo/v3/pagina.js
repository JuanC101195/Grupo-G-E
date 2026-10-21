/* Grupo G&E — JS de las páginas interiores (servicios). Solo lo común: menú móvil, modo claro/oscuro y barra de progreso. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function initNav() {
    var btn = $('.menu-btn'), menu = $('#mnav');
    function close(focusBtn) {
      menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menú');
      if (focusBtn) { btn.focus(); }
    }
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') { close(false); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { close(true); } });
  }

  function initTheme() {
    var root = document.documentElement, btn = $('#themeBtn'), media = matchMedia('(prefers-color-scheme: dark)');
    function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : media.matches; }
    function sync() {
      var dark = isDark();
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    }
    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('gye-theme', next); } catch (e) { /* almacenamiento bloqueado: el cambio vale solo para esta visita */ }
      sync();
    });
    media.addEventListener('change', sync);
    sync();
  }

  function initScroll() {
    var root = document.documentElement, hdr = $('.hdr'), ticking = false;
    function update() {
      ticking = false;
      var max = root.scrollHeight - innerHeight;
      root.style.setProperty('--scroll', (max > 0 ? Math.min(scrollY / max, 1) : 0).toFixed(4));
      hdr.classList.toggle('scrolled', scrollY > 8);
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  initNav();
  initTheme();
  initScroll();
})();
