/* Grupo G&E — v3. Datos en data.js (generado por build-data.py). Cada módulo tiene una sola responsabilidad. */
(function () {
  'use strict';

  var D = window.GYE;
  var CONFIG = {
    whatsapp: '573242489898',   // TODO confirmar que el +57 324 248 9898 tiene WhatsApp
    maxDepth: 150,              // la página representa la capacidad real de perforación de G&E
    projectsPreview: 9
  };

  var TIPOS = { consultoria: 'Consultoría', interventoria: 'Interventoría', obra: 'Obra' };
  var GROUPS = [
    { id: 'comercio-industria', label: 'Comercio e industria', sectors: ['comercial', 'industrial'], color: 'var(--g-blue)' },
    { id: 'publico', label: 'Público e institucional', sectors: ['institucional-publico'], color: 'var(--g-green)' },
    { id: 'educacion-salud', label: 'Educación y salud', sectors: ['educativo', 'salud'], color: 'var(--g-green)' },
    { id: 'vias-taludes', label: 'Vías, taludes y mitigación', sectors: ['infraestructura-vial', 'puentes-mitigacion'], color: 'var(--g-brown)' },
    { id: 'agua', label: 'Agua y saneamiento', sectors: ['acueducto-alcantarillado', 'saneamiento-residuos'], color: 'var(--g-blue)' },
    { id: 'mineria-puertos', label: 'Minería y puertos', sectors: ['mineria', 'portuario'], color: 'var(--g-orange)' },
    { id: 'vivienda', label: 'Vivienda', sectors: ['vivienda'], color: 'var(--g-orange)' }
  ];
  var ICONS = {
    'exploracion-geologico-geotecnica': '<path d="M22 4v26M16 30h12M14 4h16"/><path d="M4 36h36M8 41h28" stroke-dasharray="3 3"/>',
    'consultoria-integral': '<rect x="7" y="6" width="30" height="34"/><path d="M14 15h16M14 22h16M14 29h9"/>',
    'analisis-geotecnicos-especializados': '<path d="M4 40L24 8l16 32z"/><path d="M14 24l20 4M18 32l18 2"/>',
    'analisis-estructural-avanzado': '<path d="M6 40V12h32v28M6 22h32M6 31h32M17 12v28M28 12v28"/>',
    'construccion-de-cimentaciones': '<path d="M6 14h32v6H6zM12 20v20M32 20v20M22 20v14"/>',
    'interventoria-tecnica-y-administrativa': '<rect x="8" y="6" width="28" height="34"/><path d="M15 16h14M15 23h14M15 30l4 4 8-8"/>'
  };
  var LAYERS = [
    { name: 'Capa vegetal · 0.0–1.2 m', text: 'Suelo orgánico superficial. Se retira antes de construir: no tiene capacidad para soportar cargas.' },
    { name: 'Limo saturado · bajo el nivel freático', text: 'Bajo el agua el suelo pierde resistencia y puede asentarse. La exploración define si hace falta cimentación profunda.' },
    { name: 'Suelo residual · N-SPT 15–30', text: 'Roca descompuesta in situ, muy común en Antioquia. Aporta fricción a pilotes y micropilotes.' },
    { name: 'Roca meteorizada · N-SPT >50', text: 'Estrato competente: aquí se empotran los pilotes, igual que la "G" del logo atraviesa los cuatro estratos.' }
  ];

  var motion = document.documentElement.classList.contains('motion');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var svcBySlug = {};
  D.servicios.forEach(function (s) { svcBySlug[s.slug] = s; });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }
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
  function waLink(text) { return 'https://wa.me/' + CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function groupOf(p) { return GROUPS.find(function (g) { return g.sectors.indexOf(p.sector) >= 0; }) || GROUPS[0]; }
  function place(p) { return p.municipio ? p.municipio + (p.departamento ? ', ' + p.departamento : '') : 'Ubicación por confirmar'; }

  // ---------- Navegación ----------
  function initNav() {
    var btn = $('.menu-btn'), menu = $('#mnav');
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    function close(focusBtn) {
      menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir menú');
      if (focusBtn) { btn.focus(); }
    }
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') { close(false); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { close(true); } });
    var tb = $('#tickerBtn'), ticker = $('.ticker');
    tb.addEventListener('click', function () {
      var paused = ticker.classList.toggle('paused');
      tb.setAttribute('aria-pressed', String(paused));
      tb.textContent = paused ? 'Seguir' : 'Pausar';
    });
    $$('[data-wa]').forEach(function (a) {
      a.href = waLink('Hola Grupo G&E, quiero información sobre sus servicios.');
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  // ---------- Modo claro / oscuro (sigue al sistema hasta que el visitante elige) ----------
  function initTheme() {
    var root = document.documentElement, btn = $('#themeBtn');
    var media = matchMedia('(prefers-color-scheme: dark)');
    function isDark() {
      var t = root.getAttribute('data-theme');
      return t ? t === 'dark' : media.matches;
    }
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

  // ---------- Servicios (tarjetas, otros servicios, pie de página) ----------
  function renderServices(onQuote) {
    var grid = $('#svcGrid'), foot = $('#footSvc');
    D.servicios.forEach(function (s) {
      var card = el('article', 'svc');
      var top = el('div', 'svc-top');
      top.innerHTML = '<svg class="svc-ico" viewBox="0 0 44 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">' + (ICONS[s.slug] || '') + '</svg>';
      top.appendChild(el('span', 'mono', s.codigo));
      card.appendChild(top);
      card.appendChild(el('h3', '', s.nombre));
      card.appendChild(el('p', '', s.resumen));
      var ul = el('ul');
      s.incluye.forEach(function (it, i) { var li = el('li', '', it); li.hidden = i >= 4; ul.appendChild(li); });
      if (s.incluye.length > 4) {
        var more = el('button', 'more-inc', '+' + (s.incluye.length - 4) + ' más');
        more.type = 'button';
        more.setAttribute('aria-expanded', 'false');
        more.addEventListener('click', function () {
          $$('li', ul).forEach(function (li) { li.hidden = false; });
          more.remove();
        });
        ul.appendChild(more);
      }
      card.appendChild(ul);
      var b = el('button', 'link', 'Cotizar este servicio →');
      b.type = 'button';
      b.addEventListener('click', function () { onQuote(s.slug); });
      card.appendChild(b);
      grid.appendChild(card);

      var li = el('li'), a = el('a', '', s.nombre);
      a.href = '#servicios'; li.appendChild(a); foot.appendChild(li);
    });
    D.otros.forEach(function (o) { $('#others').appendChild(el('li', '', o)); });
  }

  // ---------- Scroll: barra de progreso, medidor de profundidad, menú activo ----------
  function initScroll() {
    var root = document.documentElement, hdr = $('.hdr');
    var depthEl = $('#gDepth'), layerEl = $('#gLayer');
    var sections = $$('[data-stratum]'), links = $$('.nav a'), ticking = false;
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

  // ---------- Hero: curvas de nivel ----------
  function initContours() {
    var svg = $('#contours'), ns = 'http://www.w3.org/2000/svg';
    [{ x: 860, y: 260, ph: 0.4 }, { x: 240, y: 700, ph: 2.1 }].forEach(function (c, ci) {
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

  // ---------- Hero: perfil estratigráfico ----------
  function initStrata() {
    var svg = $('#strata'), layers = $$('.layer', svg), title = $('#lcTitle'), text = $('#lcText');
    var defTitle = title.textContent, defText = text.textContent;
    function select(g) {
      var was = g.classList.contains('active');
      layers.forEach(function (l) { l.classList.remove('active'); l.setAttribute('aria-pressed', 'false'); });
      svg.classList.toggle('has-active', !was);
      if (was) { title.textContent = defTitle; text.textContent = defText; return; }
      var info = LAYERS[+g.dataset.k];
      g.classList.add('active'); g.setAttribute('aria-pressed', 'true');
      title.textContent = info.name + ' · ilustrativo'; text.textContent = info.text;
    }
    layers.forEach(function (g) {
      g.setAttribute('aria-label', LAYERS[+g.dataset.k].name);
      g.addEventListener('click', function () { select(g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g); } });
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

  function initCounters() {
    if (!motion) { return; }
    $$('[data-count]').forEach(function (n) {
      var end = +n.dataset.count, suf = n.dataset.suffix || '';
      n.textContent = '0' + suf;
      tween(1650, 1800, function (k) { n.textContent = Math.round(end * k) + suf; });
    });
  }

  // ---------- Proyectos: filtros por sector, vista previa y ficha ----------
  function initProjects(onQuote) {
    var grid = $('#projGrid'), chips = $('#chips'), dlg = $('#caseDlg'), moreBtn = $('#moreProj');
    var active = 'todos', expanded = false, current = null;
    var list = D.proyectos.slice().sort(function (a, b) { return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || a.id - b.id; });

    function chip(id, label, n) {
      var b = el('button', 'chip', label);
      b.type = 'button'; b.dataset.f = id; b.setAttribute('aria-pressed', String(id === 'todos'));
      b.appendChild(el('span', 'n', String(n)));
      chips.appendChild(b);
    }
    chip('todos', 'Todos', list.length);
    GROUPS.forEach(function (g) {
      var n = list.filter(function (p) { return groupOf(p).id === g.id; }).length;
      if (n) { chip(g.id, g.label, n); }
    });

    list.forEach(function (p) {
      var g = groupOf(p), card = el('article', 'proj');
      card.dataset.group = g.id;
      card.style.setProperty('--c', g.color);
      var badges = el('div', 'proj-meta mono');
      badges.appendChild(el('span', 'tag', TIPOS[p.tipo] || p.tipo));
      badges.appendChild(el('span', '', p.municipio || 'Colombia'));
      if (p.destacado) { card.appendChild(el('span', 'badge star', 'Destacado')); }
      card.appendChild(badges);
      var h = el('h3'), open = el('button', 'proj-open', p.titulo_corto);
      open.type = 'button'; open.setAttribute('aria-haspopup', 'dialog');
      open.addEventListener('click', function () { openCase(p); });
      h.appendChild(open); card.appendChild(h);
      card.appendChild(el('p', 'client', p.cliente));
      var go = el('span', 'go', 'Ver ficha'); go.setAttribute('aria-hidden', 'true'); go.appendChild(el('span', '', '→'));
      card.appendChild(go);
      grid.appendChild(card);
    });

    function visible(card, i) {
      if (active !== 'todos') { return card.dataset.group === active; }
      return expanded || i < CONFIG.projectsPreview;
    }
    function apply(animate) {
      $$('.proj', grid).forEach(function (c, i) {
        var show = visible(c, i);
        if (!animate || !motion) { c.hidden = !show; return; }
        if (!show && !c.hidden) {
          c.classList.add('out');
          setTimeout(function () { c.hidden = true; }, 280);
        } else if (show && c.hidden) {
          setTimeout(function () {
            c.hidden = false; c.classList.add('out', 'in');
            requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove('out'); }); });
          }, 280);
        }
      });
      moreBtn.parentElement.hidden = expanded || active !== 'todos';
      var n = $$('.proj', grid).filter(function (c, i) { return visible(c, i); }).length;
      $('#projStatus').textContent = 'Mostrando ' + n + ' de ' + list.length + ' proyectos';
    }
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b || b.dataset.f === active) { return; }
      active = b.dataset.f;
      $$('.chip', chips).forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      apply(true);
    });
    moreBtn.addEventListener('click', function () { expanded = true; apply(true); });
    apply(false);

    var seen = {};
    list.forEach(function (p) { if (p.municipio && !seen[p.municipio]) { seen[p.municipio] = 1; $('#where').appendChild(el('span', 'pl', p.municipio)); } });

    function openCase(p) {
      current = p;
      $('#caseMeta').textContent = (TIPOS[p.tipo] || '') + ' · ' + groupOf(p).label;
      $('#caseTitle').textContent = p.titulo_corto;
      $('#caseDesc').textContent = p.descripcion;
      var ul = $('#caseScope'); ul.textContent = '';
      (p.alcance || []).forEach(function (a) { ul.appendChild(el('li', '', a)); });
      $('#caseClient').textContent = p.cliente;
      $('#casePlace').textContent = place(p);
      $('#caseLines').textContent = p.lineas.map(function (l) { return svcBySlug[l] ? svcBySlug[l].nombre : l; }).join(' · ');
      dlg.showModal();
    }
    $('#caseClose').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { dlg.close(); } });
    $('#caseQuote').addEventListener('click', function () { dlg.close(); onQuote(current.lineas[0]); });
  }

  // ---------- Clientes ----------
  function renderClients() {
    var ul = $('#logos');
    D.clientes.forEach(function (c) {
      var li = el('li'), img = el('img');
      img.src = c.logo; img.alt = c.nombre; img.loading = 'lazy';
      li.appendChild(img); ul.appendChild(li);
    });
  }

  // ---------- Preguntas frecuentes + JSON-LD FAQPage ----------
  function renderFaq() {
    var deps = {};
    D.proyectos.forEach(function (p) { if (p.departamento) { deps[p.departamento] = 1; } });
    var depList = Object.keys(deps).sort(function (a, b) { return (b === 'Antioquia') - (a === 'Antioquia') || a.localeCompare(b, 'es'); });
    var items = [{ pregunta: '¿Dónde trabajan?', respuesta: 'Nuestra sede está en Medellín (Floresta). Hemos ejecutado proyectos en ' + depList.join(', ') + ', y prestamos servicios a nivel nacional e internacional.' }];
    D.servicios.forEach(function (s) {   // una por línea, solo respuestas confirmadas
      var f = (s.faq || []).find(function (q) { return !q.pendiente_confirmar; });
      if (f) { items.push(f); }
    });
    var box = $('#faq');
    items.forEach(function (f) {
      var d = el('details');
      d.appendChild(el('summary', '', f.pregunta));
      d.appendChild(el('p', '', f.respuesta));
      box.appendChild(d);
    });
    var ld = el('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: items.map(function (f) { return { '@type': 'Question', name: f.pregunta, acceptedAnswer: { '@type': 'Answer', text: f.respuesta } }; })
    });
    document.head.appendChild(ld);
  }

  // ---------- Cotizador en 3 pasos ----------
  function initWizard() {
    var form = $('#wizard'), opts = $('#svcOpts');
    D.servicios.concat([{ slug: 'asesoria', nombre: 'No estoy seguro, necesito asesoría' }]).forEach(function (s, i) {
      var lab = el('label', 'opt'), inp = el('input');
      inp.type = 'radio'; inp.name = 'servicio'; inp.value = s.slug;
      if (i === 0) { inp.required = true; }
      lab.appendChild(inp); lab.appendChild(el('span', '', s.nombre));
      opts.appendChild(lab);
    });
    $$('.f', form).forEach(function (w) {
      var f = $('input,select,textarea', w), msg = $('.msg', w);
      if (f && msg) { msg.id = 'msg-' + f.id; msg.removeAttribute('aria-live'); f.setAttribute('aria-describedby', msg.id); }
    });
    var steps = $$('fieldset', form), marks = $$('.wsteps li', form);
    var back = $('#back'), next = $('#next'), done = $('#doneBox'), nav = $('#wnav');
    var step = 1;

    function validEmail(v) {
      var at = v.indexOf('@'), dot = v.lastIndexOf('.');
      return !v.includes(' ') && at > 0 && at === v.lastIndexOf('@') && dot > at + 1 && dot < v.length - 1;
    }
    function checkField(f) {
      var w = f.closest('.f'), msg = w && $('.msg', w), t = '';
      if (f.type === 'checkbox') {
        if (!f.checked) { t = 'Necesitamos su autorización para responderle.'; }
      } else if (!f.value.trim()) {
        t = 'Este campo es obligatorio.';
      } else if (f.type === 'email' && !validEmail(f.value.trim())) {
        t = 'Escriba un correo válido.';
      } else if (f.type === 'tel' && f.value.replace(/\D/g, '').length < 7) {
        t = 'Escriba un teléfono válido.';
      }
      if (w) { w.classList.toggle('err', !!t); }
      f.setAttribute('aria-invalid', String(!!t));
      if (msg) { msg.textContent = t; }
      return !t;
    }
    function checkStep(n) {
      if (n === 1) {
        var ok = !!$('input[name="servicio"]:checked', form);
        opts.classList.toggle('err', !ok);
        $('#svcMsg').textContent = ok ? '' : 'Seleccione una opción para continuar.';
        if (!ok) { $('input[name="servicio"]', form).focus(); }
        return ok;
      }
      var first = null;
      $$('[required]', steps[n - 1]).forEach(function (f) { if (!checkField(f) && !first) { first = f; } });
      if (first) { first.focus(); }
      return !first;
    }
    function show(n) {
      step = n;
      steps.forEach(function (fs, i) { fs.hidden = i !== n - 1; fs.classList.toggle('wz-anim', motion && i === n - 1); });
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
      var data = new FormData(form), svc = data.get('servicio');
      var rows = [
        ['Servicio', svcBySlug[svc] ? svcBySlug[svc].nombre : 'Asesoría (no definido)'], ['Municipio', data.get('ciudad')],
        ['Tipo de obra', data.get('tipo')], ['Área', data.get('area') ? data.get('area') + ' m²' : ''], ['Pisos', data.get('pisos')],
        ['Plazo', data.get('plazo')], ['Detalles', data.get('detalle')], ['Nombre', data.get('nombre')],
        ['Empresa', data.get('empresa')], ['Teléfono', data.get('tel')], ['Correo', data.get('email')]
      ].filter(function (r) { return r[1]; });
      var list = $('#summary'); list.textContent = '';
      rows.forEach(function (r) {   // textContent: nunca HTML con datos del usuario
        var li = el('li'), b = el('b', '', r[0] + ': ');
        li.appendChild(b); li.appendChild(document.createTextNode(r[1])); list.appendChild(li);
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
    $$('[required]', form).forEach(function (f) {
      if (f.type !== 'radio') { f.addEventListener('blur', function () { if (f.value || f.type === 'checkbox') { checkField(f); } }); }
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'servicio') { opts.classList.remove('err'); $('#svcMsg').textContent = ''; }
    });
    $('#restart').addEventListener('click', function () { form.reset(); done.hidden = true; nav.hidden = false; show(1); });

    return function quote(slug) {
      var r = $('input[name="servicio"][value="' + CSS.escape(slug) + '"]', form);
      if (r) { r.checked = true; }
      done.hidden = true; nav.hidden = false;
      $('#cotizar').scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
      show(r ? 2 : 1);
    };
  }

  // ---------- Apariciones al hacer scroll + proceso ligado al scroll ----------
  function initReveal() {
    if (!motion) { return; }
    ['.sec-head', '.value .wrap>div', '.svc', '.proj:not([hidden])', '.photos figure', '.calc figure', '.logos li', '.about .wrap>div', '.faq details', '.quote-info', '.wizard'].forEach(function (sel) {
      $$(sel).forEach(function (n, i) { n.setAttribute('data-reveal', ''); n.style.setProperty('--i', i % 6); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('[data-reveal], .build figure').forEach(function (n) { io.observe(n); });
    $$('.proj[hidden]').forEach(function (n) { n.classList.add('in'); });

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
    initTheme();
    var quote = initWizard();
    renderServices(quote);
    initContours();
    initStrata();
    initCounters();
    initProjects(quote);
    renderClients();
    renderFaq();
    $$('[data-quote]').forEach(function (b) { b.addEventListener('click', function () { quote(b.dataset.quote); }); });
    initReveal();
    initScroll();
  }
  boot();
})();
