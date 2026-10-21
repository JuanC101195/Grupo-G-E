/* Grupo G&E — v2. Cada módulo tiene una sola responsabilidad y se inicia desde boot(). */
(function () {
  'use strict';

  // ---------- Configuración (reemplazar con datos reales del brochure) ----------
  var CONFIG = {
    whatsapp: '573000000000',      // TODO: número real, formato internacional sin "+"
    maxDepth: 30                   // metros que representa el scroll completo del sitio
  };

  var SERVICES = {
    suelos: 'Estudio de suelos',
    cimentaciones: 'Diseño de cimentaciones',
    taludes: 'Taludes y contención',
    riesgo: 'Amenaza y riesgo',
    construccion: 'Construcción',
    interventoria: 'Interventoría',
    asesoria: 'Asesoría (no definido)'
  };

  var LAYERS = [
    { name: 'Relleno · 0.0–1.2 m', text: 'Material removido o depositado por el hombre. No es apto para apoyar cimentaciones: se retira o se atraviesa.' },
    { name: 'Arcilla limosa · N-SPT 6–9', text: 'Suelo blando y compresible. Si la obra se apoya aquí puede asentarse; por eso los pilotes lo atraviesan.' },
    { name: 'Arena densa · N-SPT 28–35', text: 'Buena capacidad portante. Puede recibir cargas moderadas o aportar fricción a los pilotes.' },
    { name: 'Roca meteorizada · N-SPT >50', text: 'Estrato competente. Aquí se apoya la punta de los pilotes para transmitir las cargas del edificio.' }
  ];

  // Proyectos de EJEMPLO: se reemplazan con el brochure (en WordPress serán un tipo de contenido "Proyecto").
  var PROJECTS = [
    { service: 'cimentaciones', title: 'Cimentación profunda para edificio residencial de 18 pisos', city: 'Ciudad', year: 2025,
      problem: 'Edificio de 18 pisos y 2 sótanos sobre un lote con arcillas blandas superficiales.',
      soil: 'Relleno y arcilla limosa hasta 7 m; arena densa y roca meteorizada desde 9 m.',
      solution: 'Pilotes preexcavados de 80 cm apoyados en roca, con pantalla para los sótanos.',
      result: 'Asentamientos medidos dentro del límite de diseño durante toda la construcción.' },
    { service: 'taludes', title: 'Estabilización de talud en corredor vial', city: 'Ciudad', year: 2024,
      problem: 'Deslizamiento activo que comprometía un carril de la vía.',
      soil: 'Suelo residual saturado sobre roca fracturada.',
      solution: 'Muro anclado, drenes horizontales y revegetalización de la corona.',
      result: 'Vía habilitada y talud estable tras dos temporadas de lluvia.' },
    { service: 'suelos', title: 'Exploración geotécnica para bodega industrial', city: 'Ciudad', year: 2024,
      problem: 'Bodega de 6.000 m² con cargas concentradas de estanterías.',
      soil: 'Arenas sueltas con nivel freático alto.',
      solution: '12 sondeos SPT, ensayos de laboratorio y recomendación de losa sobre suelo mejorado.',
      result: 'Informe NSR-10 aprobado para licencia en el primer trámite.' },
    { service: 'construccion', title: 'Construcción de muro de contención en concreto', city: 'Ciudad', year: 2023,
      problem: 'Excavación de 6 m junto a edificaciones vecinas.',
      soil: 'Arcillas firmes con lentes de arena.',
      solution: 'Muro en voladizo construido por tramos alternos con monitoreo topográfico.',
      result: 'Cero afectaciones a vecinos, entregado en el plazo.' },
    { service: 'riesgo', title: 'Estudio de amenaza por remoción en masa para plan parcial', city: 'Ciudad', year: 2023,
      problem: 'Plan parcial en ladera que requería zonificación de amenaza.',
      soil: 'Depósitos de vertiente sobre roca meteorizada.',
      solution: 'Cartografía geomorfológica, modelación de estabilidad y zonificación.',
      result: 'Áreas urbanizables definidas con medidas de mitigación.' },
    { service: 'interventoria', title: 'Interventoría geotécnica de pilotaje', city: 'Ciudad', year: 2022,
      problem: 'Control independiente de 140 pilotes en obra de terceros.',
      soil: 'Perfil variable con roca a profundidad irregular.',
      solution: 'Verificación de longitudes, registros de perforación y pruebas de integridad.',
      result: 'Ajustes de longitud en obra que evitaron sobrecostos.' }
  ];

  var motion = document.documentElement.classList.contains('motion');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function tween(dur, delay, fn) {
    var t0 = null;
    function step(ts) {
      if (t0 === null) { t0 = ts + delay; }
      var t = Math.min(Math.max((ts - t0) / dur, 0), 1);
      fn(ease(t));
      if (t < 1) { requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }
  function waLink(text) {
    return 'https://wa.me/' + CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  // ---------- Navegación ----------
  function initNav() {
    var btn = $('.menu-btn'), menu = $('#mnav');
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    $$('[data-wa]').forEach(function (a) {
      a.href = waLink('Hola, quiero información sobre sus servicios de geotecnia.');
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  // ---------- Scroll: barra de progreso, medidor de profundidad, menú activo ----------
  function initScroll() {
    var root = document.documentElement, hdr = $('.hdr');
    var depthEl = $('#gDepth'), layerEl = $('#gLayer');
    var sections = $$('[data-stratum]');
    var links = $$('.nav a');
    var ticking = false;

    function update() {
      ticking = false;
      var max = root.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(scrollY / max, 1) : 0;
      root.style.setProperty('--scroll', p.toFixed(4));
      hdr.classList.toggle('scrolled', scrollY > 8);
      depthEl.textContent = (p * CONFIG.maxDepth).toFixed(1) + ' m';
      var current = sections[0];
      sections.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.4) { current = s; } });
      layerEl.textContent = current.dataset.stratum;
      links.forEach(function (a) { a.setAttribute('aria-current', String(current.id !== '' && a.hash === '#' + current.id)); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // ---------- Hero: curvas de nivel generadas (determinísticas) ----------
  function initContours() {
    var svg = $('#contours'), ns = 'http://www.w3.org/2000/svg';
    var centers = [{ x: 860, y: 260, ph: 0.4 }, { x: 240, y: 700, ph: 2.1 }];
    centers.forEach(function (c, ci) {
      for (var k = 1; k <= 13; k++) {
        var R = 26 + k * 34, d = '';
        for (var i = 0; i <= 96; i++) {
          var a = (i / 96) * Math.PI * 2;
          var r = R * (1 + 0.10 * Math.sin(3 * a + c.ph + k * 0.18) + 0.05 * Math.sin(5 * a - c.ph * 2 + k * 0.1));
          d += (i ? 'L' : 'M') + (c.x + r * Math.cos(a) * 1.25).toFixed(1) + ' ' + (c.y + r * Math.sin(a)).toFixed(1);
        }
        var path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d + 'Z');
        if (k % 5 === 0) { path.setAttribute('class', 'idx'); }
        svg.appendChild(path);
        if (motion) {
          path.style.setProperty('--len', Math.ceil(path.getTotalLength()));
          path.style.setProperty('--d', (ci * 0.3 + k * 0.07).toFixed(2) + 's');
        }
      }
    });
    if (motion && matchMedia('(pointer:fine)').matches) {
      var hero = $('.hero');
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        svg.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * -24 + 'px');
        svg.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * -24 + 'px');
      });
    }
  }

  // ---------- Hero: perfil estratigráfico (excavación + estratos interactivos) ----------
  function initStrata() {
    var svg = $('#strata'), layers = $$('.layer', svg);
    var title = $('#lcTitle'), text = $('#lcText');

    function select(g) {
      var was = g.classList.contains('active');
      layers.forEach(function (l) { l.classList.remove('active'); l.setAttribute('aria-pressed', 'false'); });
      svg.classList.toggle('has-active', !was);
      if (was) {
        title.textContent = 'Sondeo S-01 · ilustrativo';
        text.textContent = 'Así leemos un terreno antes de construir. Toque cada estrato para ver qué significa para su obra.';
        return;
      }
      var info = LAYERS[+g.dataset.k];
      g.classList.add('active'); g.setAttribute('aria-pressed', 'true');
      title.textContent = info.name; text.textContent = info.text;
    }
    layers.forEach(function (g) {
      g.setAttribute('aria-label', LAYERS[+g.dataset.k].name);
      g.addEventListener('click', function () { select(g); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g); }
      });
    });

    var labels = $$('.st-l', svg);
    if (!motion) { labels.forEach(function (l) { l.classList.add('on'); }); return; }
    var dig = $('#digRect');
    dig.setAttribute('height', '0');
    tween(1300, 250, function (k) {
      var y = 78 + 430 * k;
      dig.setAttribute('height', String(430 * k));
      labels.forEach(function (l) { if (y >= +l.dataset.y) { l.classList.add('on'); } });
    });
  }

  // ---------- Contadores ----------
  function initCounters() {
    if (!motion) { return; }
    $$('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, pre = el.dataset.prefix || '';
      el.textContent = pre + '0';
      tween(1650, 1800, function (k) { el.textContent = pre + Math.round(end * k); });
    });
  }

  // ---------- Proyectos: filtros + caso en modal ----------
  function initProjects(onQuote) {
    var grid = $('#projGrid'), chips = $('#chips'), dlg = $('#caseDlg');
    var current = null, active = 'todos';

    var counts = PROJECTS.reduce(function (acc, p) { acc[p.service] = (acc[p.service] || 0) + 1; return acc; }, {});
    var filters = [['todos', 'Todos', PROJECTS.length]].concat(
      Object.keys(counts).map(function (k) { return [k, SERVICES[k], counts[k]]; }));

    filters.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.f = f[0];
      b.setAttribute('aria-pressed', String(f[0] === 'todos'));
      b.textContent = f[1];
      var n = document.createElement('span'); n.className = 'n'; n.textContent = f[2];
      b.appendChild(n);
      chips.appendChild(b);
    });

    PROJECTS.forEach(function (p, i) {
      var card = document.createElement('button');
      card.type = 'button'; card.className = 'proj'; card.dataset.service = p.service; card.dataset.i = i;
      card.innerHTML = '<div class="proj-img"><span class="mono">Foto · pendiente</span></div>' +
        '<div class="proj-body"><span class="badge">Ejemplo</span><div class="proj-meta mono"><span class="tag"></span><span></span></div><h3></h3></div>';
      $('.tag', card).textContent = SERVICES[p.service];
      $('.proj-meta span:last-child', card).textContent = p.city + ' · ' + p.year;
      $('h3', card).textContent = p.title;
      card.addEventListener('click', function () { openCase(p); });
      grid.appendChild(card);
    });
    var empty = document.createElement('p');
    empty.className = 'empty'; empty.hidden = true;
    empty.textContent = 'Aún no hay proyectos publicados en esta categoría. Escríbanos y le contamos casos similares.';
    grid.appendChild(empty);

    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b || b.dataset.f === active) { return; }
      active = b.dataset.f;
      $$('.chip', chips).forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      applyFilter();
    });

    function applyFilter() {
      var cards = $$('.proj', grid), shown = 0;
      cards.forEach(function (c) {
        var match = active === 'todos' || c.dataset.service === active;
        if (match) { shown++; }
        if (!motion) { c.hidden = !match; return; }
        if (!match && !c.hidden) {
          c.classList.add('out');
          setTimeout(function () { c.hidden = true; }, 280);
        } else if (match && c.hidden) {
          setTimeout(function () {
            c.hidden = false; c.classList.add('out', 'in');
            requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove('out'); }); });
          }, 280);
        }
      });
      empty.hidden = shown > 0;
    }

    function openCase(p) {
      current = p;
      $('#caseMeta').textContent = SERVICES[p.service] + ' · ' + p.city + ' · ' + p.year + ' · EJEMPLO';
      $('#caseTitle').textContent = p.title;
      $('#caseProblem').textContent = p.problem;
      $('#caseSoil').textContent = p.soil;
      $('#caseSolution').textContent = p.solution;
      $('#caseResult').textContent = p.result;
      dlg.showModal();
    }
    $('#caseClose').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { dlg.close(); } });
    $('#caseQuote').addEventListener('click', function () { dlg.close(); onQuote(current.service); });
  }

  // ---------- Cotizador en 3 pasos ----------
  function initWizard() {
    var form = $('#wizard'), steps = $$('fieldset', form), marks = $$('.wsteps li', form);
    var back = $('#back'), next = $('#next'), done = $('#doneBox'), nav = $('#wnav');
    var step = 1;

    function validEmail(v) {
      var at = v.indexOf('@'), dot = v.lastIndexOf('.');
      return !v.includes(' ') && at > 0 && at === v.lastIndexOf('@') && dot > at + 1 && dot < v.length - 1;
    }
    function checkField(el) {
      var w = el.closest('.f'), msg = w && $('.msg', w), t = '';
      if (el.type === 'checkbox') {
        if (!el.checked) { t = 'Necesitamos su autorización para responderle.'; }
      } else if (!el.value.trim()) {
        t = 'Este campo es obligatorio.';
      } else if (el.type === 'email' && !validEmail(el.value.trim())) {
        t = 'Escriba un correo válido.';
      } else if (el.type === 'tel' && el.value.replace(/\D/g, '').length < 7) {
        t = 'Escriba un teléfono válido.';
      }
      if (w) { w.classList.toggle('err', !!t); }
      el.setAttribute('aria-invalid', String(!!t));
      if (msg) { msg.textContent = t; }
      return !t;
    }
    function checkStep(n) {
      var fs = steps[n - 1];
      if (n === 1) {
        var ok = !!$('input[name="servicio"]:checked', form);
        $('#svcOpts').classList.toggle('err', !ok);
        $('#svcMsg').textContent = ok ? '' : 'Seleccione una opción para continuar.';
        if (!ok) { $('input[name="servicio"]', form).focus(); }
        return ok;
      }
      var first = null;
      $$('[required]', fs).forEach(function (el) { if (!checkField(el) && !first) { first = el; } });
      if (first) { first.focus(); }
      return !first;
    }
    function show(n) {
      step = n;
      steps.forEach(function (fs, i) {
        fs.hidden = i !== n - 1;
        fs.classList.toggle('wz-anim', motion && i === n - 1);
      });
      marks.forEach(function (m, i) {
        m.classList.toggle('done', i < n - 1);
        m.classList.toggle('current', i === n - 1);
        if (i === n - 1) { m.setAttribute('aria-current', 'step'); } else { m.removeAttribute('aria-current'); }
      });
      back.hidden = n === 1;
      next.textContent = n === 3 ? 'Enviar solicitud' : 'Continuar';
      $('legend', steps[n - 1]).focus({ preventScroll: true });
    }
    function finish() {
      var data = new FormData(form);
      var rows = [
        ['Servicio', SERVICES[data.get('servicio')]], ['Ciudad', data.get('ciudad')], ['Tipo de obra', data.get('tipo')],
        ['Área', data.get('area') ? data.get('area') + ' m²' : ''], ['Pisos', data.get('pisos')], ['Plazo', data.get('plazo')],
        ['Detalles', data.get('detalle')], ['Nombre', data.get('nombre')], ['Empresa', data.get('empresa')],
        ['Teléfono', data.get('tel')], ['Correo', data.get('email')]
      ].filter(function (r) { return r[1]; });
      var list = $('#summary'); list.textContent = '';
      rows.forEach(function (r) {   // textContent: nunca HTML con datos del usuario
        var li = document.createElement('li'), b = document.createElement('b');
        b.textContent = r[0] + ': '; li.appendChild(b); li.appendChild(document.createTextNode(r[1]));
        list.appendChild(li);
      });
      $('#waSend').href = waLink('Hola Grupo G&E, quiero cotizar:\n' + rows.map(function (r) { return '• ' + r[0] + ': ' + r[1]; }).join('\n'));
      steps.forEach(function (fs) { fs.hidden = true; });
      marks.forEach(function (m) { m.classList.add('done'); m.classList.remove('current'); });
      nav.hidden = true; done.hidden = false;
      $('#doneTitle').focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checkStep(step)) { return; }
      if (step < 3) { show(step + 1); } else { finish(); }
    });
    back.addEventListener('click', function () { show(step - 1); });
    $$('[required]', form).forEach(function (el) {
      if (el.type !== 'radio') { el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') { checkField(el); } }); }
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'servicio') { $('#svcOpts').classList.remove('err'); $('#svcMsg').textContent = ''; }
    });
    $('#restart').addEventListener('click', function () {
      form.reset(); done.hidden = true; nav.hidden = false; show(1);
    });

    // API para otros módulos: preseleccionar servicio y saltar al paso 2
    return function quote(service) {
      var r = $('input[name="servicio"][value="' + service + '"]', form);
      if (r) { r.checked = true; }
      done.hidden = true; nav.hidden = false;
      $('#cotizar').scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
      show(r ? 2 : 1);
    };
  }

  // ---------- Apariciones al hacer scroll + proceso ligado al scroll ----------
  function initReveal() {
    if (!motion) { return; }
    ['.sec-head', '.value .wrap>div', '.svc', '.proj', '.faq details', '.quote-info', '.wizard'].forEach(function (sel) {
      $$(sel).forEach(function (el, i) { el.setAttribute('data-reveal', ''); el.style.setProperty('--i', i % 6); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });

    var steps = $('.steps'), items = $$('.step', steps), ticking = false;
    function scrub() {
      ticking = false;
      var r = steps.getBoundingClientRect(), vh = innerHeight;
      var p = Math.min(Math.max((vh * 0.85 - r.top) / (vh * 0.6), 0), 1);
      steps.style.setProperty('--p', p.toFixed(3));
      items.forEach(function (it, i) { it.classList.toggle('on', p >= i / items.length + 0.05); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(scrub); } }, { passive: true });
    scrub();
  }

  function boot() {
    initNav();
    initContours();
    initStrata();
    initCounters();
    var quote = initWizard();
    initProjects(quote);
    $$('[data-quote]').forEach(function (b) { b.addEventListener('click', function () { quote(b.dataset.quote); }); });
    initReveal();
    initScroll();
  }
  boot();
})();
