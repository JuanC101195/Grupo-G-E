// Prueba de extremo a extremo en tiempo real (Edge headless + CDP, sin dependencias).
// Uso: node e2e.mjs [ancho] [alto] [dark]   → capturas en ../capturas/v3-*.png
// "dark" emula un dispositivo en modo oscuro (prefers-color-scheme: dark).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'capturas');
const [w = 1440, h = 900] = process.argv.slice(2, 4).map(Number);
const dark = process.argv[4] === 'dark';
const mode = dark ? 'dark' : 'light';
const edge = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;   // ruta absoluta: no depende del PATH
const profiles = path.join(out, '.perfiles');
fs.mkdirSync(profiles, { recursive: true, mode: 0o700 });
const prof = fs.mkdtempSync(path.join(profiles, 'e2e-'));
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${prof}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Reintenta fn hasta que no lance error (sin await dentro de un bucle)
const retry = async (fn, tries = 40) => {
  try { return await fn(); } catch (e) {
    if (tries <= 1) throw e;
    await sleep(250);
    return retry(fn, tries - 1);
  }
};
const port = await retry(() => fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim() || Promise.reject(new Error('sin puerto')));
const tabs = await retry(async () => {
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  if (!list.length) throw new Error('sin pestañas');
  return list;
});
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {}; const errors = []; const formPosts = [];
// En el sitio publicado, el envío del formulario se intercepta y se responde "enviado" sin mandar correos reales
const MOCK_CF7 = Buffer.from(JSON.stringify({ status: 'mail_sent', message: 'ok (simulado por la prueba)' })).toString('base64');
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Fetch.requestPaused') {
    formPosts.push(m.params.request.url);
    ws.send(JSON.stringify({ id: ++id, method: 'Fetch.fulfillRequest', params: { requestId: m.params.requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: MOCK_CF7 } }));
  }
  if (pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, `v3-${w}-${mode}-${name}.png`), Buffer.from(r.data, 'base64'));
};
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
// Reintenta una condición hasta ms milisegundos (la red del sitio publicado no tiene tiempos fijos)
const until = async (expr, ms = 5000) => (await js(expr)) === true || (ms > 0 && (await sleep(200), until(expr, ms - 200)));

await send('Runtime.enable');
// E2E_ENVIO_REAL=1 deja pasar UN envío real al correo (para verificar la entrega de punta a punta)
const realSend = process.env.E2E_ENVIO_REAL === '1';
if (process.env.E2E_URL && !realSend) await send('Fetch.enable', { patterns: [{ urlPattern: '*contact-form-7/v1/contact-forms/*/feedback*' }] });
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: mode }] });
// E2E_URL permite probar el sitio publicado (p. ej. E2E_URL=https://grupogye.com/ node e2e.mjs 1440 900)
await send('Page.navigate', { url: process.env.E2E_URL || pathToFileURL(path.join(here, 'index.html')).href });
await sleep(5000);
await shot('1-hero');

// Modo de color: sigue al sistema y usa el logo correcto
check(`página en modo ${mode} según el sistema`, await js(String.raw`(()=>{const c=getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);const l=(c[0]+c[1]+c[2])/3;return ${dark} ? l<60 : l>200;})()`));
check('logo visible acorde al modo', await js(`getComputedStyle(document.querySelector(".logo-${dark ? 'd' : 'l'}")).display!=="none" && getComputedStyle(document.querySelector(".logo-${dark ? 'l' : 'd'}")).display==="none"`));
check('botón de tema refleja el modo', await js(`document.getElementById("themeBtn").getAttribute("aria-pressed")==="${dark}"`));

// Auditoría de contraste WCAG AA de todo el texto visible (contra el fondo sólido real)
async function contrastAudit() {
  return js(String.raw`(()=>{
    const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
    const L=c=>0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);
    const rgba=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0]};
    const bad=[];let n=0;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const seen=new Set();
    while(walker.nextNode()){
      const t=walker.currentNode; if(!t.textContent.trim())continue;
      const el=t.parentElement; if(seen.has(el))continue; seen.add(el);
      const cs=getComputedStyle(el);
      if(cs.visibility==='hidden'||cs.display==='none'||el.closest('[hidden],[aria-hidden="true"],.sr,dialog:not([open]),svg,noscript'))continue;
      const r=el.getBoundingClientRect(); if(!r.width||!r.height)continue;
      if(cs.backgroundClip==='text'||cs.webkitBackgroundClip==='text')continue;
      let fg=rgba(cs.color), op=1, bg=null, a=el;
      for(;a;a=a.parentElement){const s=getComputedStyle(a);op*=Number(s.opacity);
        if(s.backgroundImage!=='none'){bg='img';break}
        const b=rgba(s.backgroundColor); if(b.length>3?b[3]>0.5:true){bg=b;break}}
      if(bg==='img'||!bg)continue;
      if(op<0.95)continue;   // elementos en plena animación de entrada
      n++;
      const l1=L(fg),l2=L(bg),ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
      const size=parseFloat(cs.fontSize),bold=Number(cs.fontWeight)>=700;
      const need=(size>=24||(size>=18.66&&bold))?3:4.5;
      if(ratio<need)bad.push(el.tagName.toLowerCase()+'.'+(el.className||'')+' "'+t.textContent.trim().slice(0,30)+'" '+ratio.toFixed(2)+'<'+need);
    }
    return JSON.stringify({n,bad:bad.slice(0,12),total:bad.length});
  })()`).then(JSON.parse);
}
await js('document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("in"));document.querySelectorAll(".step").forEach(e=>e.classList.add("on"))');
await sleep(800);
const ca = await contrastAudit();
check(`contraste AA en modo ${mode} (${ca.n} textos revisados)`, ca.total === 0, ca.bad.join(' | '));

// El botón alterna el modo y lo recuerda
await js('document.getElementById("themeBtn").click()'); await sleep(300);
check('el botón cambia de modo y lo guarda', await js(`document.documentElement.dataset.theme==="${dark ? 'light' : 'dark'}" && localStorage.getItem("gye-theme")==="${dark ? 'light' : 'dark'}"`));
const ca2 = await contrastAudit();
check(`contraste AA tras cambiar a modo ${dark ? 'light' : 'dark'} (${ca2.n} textos)`, ca2.total === 0, ca2.bad.join(' | '));
await js('document.getElementById("themeBtn").click();localStorage.removeItem("gye-theme");document.documentElement.removeAttribute("data-theme")'); await sleep(300);
check('sin scroll horizontal', await js('document.documentElement.scrollWidth <= innerWidth'), await js('document.documentElement.scrollWidth + "/" + innerWidth'));
check('etiquetas del perfil visibles', await js('document.querySelectorAll(".st-l.on").length === 4'));
check('contador llegó a 150 m', await js('document.querySelector("[data-count]").textContent === "150 m"'));
check('6 servicios del brochure', await js('document.querySelectorAll(".svc").length === 6'));
check('13 logos de clientes', await js('document.querySelectorAll(".logos img").length === 13'));
// antes de cualquier paso que fuerce la carga de imágenes: los logos deben cargar solos al llegar a ellos
await js('document.querySelector(".logos").scrollIntoView({block:"center"})'); await sleep(2500);
check('logos de clientes cargados al verlos', await js('[...document.querySelectorAll(".logos img")].every(i=>i.complete&&i.naturalWidth>0)'));

// Estrato interactivo
await js('document.querySelector(".layer[data-k=\'1\']").dispatchEvent(new MouseEvent("click",{bubbles:true}))');
check('estrato muestra su explicación', (await js('document.getElementById("lcTitle").textContent')).startsWith('Limo'));

// Proyectos: vista previa, filtro, ver todos
await js('document.getElementById("proyectos").scrollIntoView()'); await sleep(900);
check('vista previa muestra 9', await until('[...document.querySelectorAll(".proj")].filter(c=>!c.hidden).length === 9'));
await js('document.querySelector(".chip[data-f=\'vias-taludes\']").click()'); await sleep(900);
check('filtro vías y taludes deja 4', await until('[...document.querySelectorAll(".proj")].filter(c=>!c.hidden).length === 4'));
await shot('2-proyectos-filtrados');
await js('document.querySelector(".chip[data-f=\'todos\']").click()'); await sleep(1000);
check('"Todos" vuelve a la vista previa de 9', await until('[...document.querySelectorAll(".proj")].filter(c=>!c.hidden).length === 9'));
await js('document.getElementById("moreProj").click()'); await sleep(1000);
check('"Ver todos" muestra los 30', await until('[...document.querySelectorAll(".proj")].filter(c=>!c.hidden).length === 30'));
check('el proyecto confidencial no se publica', await js('!document.getElementById("projGrid").textContent.includes("Mulatos")'));
await js('document.getElementById("proyectos").scrollIntoView()'); await sleep(1200);
check('tarjetas visibles en pantalla con opacidad 1', await until('[...document.querySelectorAll(".proj")].filter(c=>{const r=c.getBoundingClientRect();return !c.hidden&&r.top>0&&r.bottom<innerHeight;}).every(c=>getComputedStyle(c).opacity==="1")'),
  await js('JSON.stringify([...document.querySelectorAll(".proj")].filter(c=>{const r=c.getBoundingClientRect();return !c.hidden&&r.top>0&&r.bottom<innerHeight;}).filter(c=>getComputedStyle(c).opacity!=="1").map(c=>c.className+" op="+getComputedStyle(c).opacity+" "+c.querySelector("h3").textContent.slice(0,20)))'));
await js('document.querySelectorAll("img").forEach(i=>{i.loading="eager"})');
check('todas las imágenes cargan', await until('[...document.images].every(i=>i.complete&&i.naturalWidth>0)', 10000),
  await js('[...document.images].filter(i=>!(i.complete&&i.naturalWidth>0)).map(i=>i.currentSrc||i.src).join(" ")'));

// Caso en modal → cotizar similar
await js('document.querySelector(".proj-open").click()'); await sleep(600);
check('modal del caso abierto', await js('document.getElementById("caseDlg").open'));
await shot('3-caso');
await js('document.getElementById("caseQuote").click()'); await sleep(1200);
check('cotizar similar salta al paso 2 con servicio', await js('!document.querySelector("[data-step=\'2\']").hidden && document.querySelector("input[name=servicio]:checked").value === "analisis-geotecnicos-especializados"'));

// Validación y envío
await js('document.getElementById("next").click()'); await sleep(200);
check('paso 2 bloquea sin ciudad', await js('document.getElementById("ciudad").getAttribute("aria-invalid") === "true"'));
await js(`(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;};s("ciudad","Medellín");s("tipo","Edificio");s("area","1200");document.getElementById("next").click();})()`);
await sleep(300);
await js(`(()=>{const s=(id,v)=>{document.getElementById(id).value=v;};s("nombre","Prueba <script>alert(1)</script>");s("tel","3001234567");s("email","malo@");document.getElementById("habeas").checked=true;document.getElementById("next").click();})()`);
check('correo inválido bloquea', await js('document.getElementById("email").getAttribute("aria-invalid") === "true"'));
await js('document.getElementById("email").value="prueba@empresa.com";document.getElementById("next").click()'); await sleep(500);
check('solicitud completada', await until('!document.getElementById("doneBox").hidden'));
if (process.env.E2E_URL) {
  if (!realSend) check('el cotizador envía al formulario de correo', formPosts.length === 1, formPosts.join(' '));
  check('confirma la solicitud enviada', await until('document.getElementById("doneTitle").textContent.startsWith("Recibimos")', 15000),
    await js('document.getElementById("doneTitle").textContent'));
} else {
  check('sin servidor, ofrece WhatsApp', await js('document.getElementById("doneTitle").textContent.includes("WhatsApp")'));
}
check('botones del asistente ocultos al terminar', await js('getComputedStyle(document.getElementById("wnav")).display === "none"'));
check('resumen escapa HTML del usuario', await js('!document.querySelector("#summary script") && document.getElementById("summary").textContent.includes("<script>")'));
check('enlace WhatsApp con datos', await js('document.getElementById("waSend").href.startsWith("https://wa.me/") && decodeURIComponent(document.getElementById("waSend").href).includes("Medellín")'));
await js('document.getElementById("cotizar").scrollIntoView()'); await sleep(700);
await shot('4-cotizacion-enviada');

// Tipografía propia (el tema de WordPress no debe imponer la suya) y logos que cargan solos al llegar a ellos
check('títulos del pie en tamaño pequeño', await js('[...document.querySelectorAll("footer h2")].every(h=>parseFloat(getComputedStyle(h).fontSize)<=16)'));
check('títulos con Barlow Condensed', await js('getComputedStyle(document.getElementById("h-svc")).fontFamily.includes("Barlow")'));

// Diagramas técnicos: marco uniforme 16:10, sin tarjetas estiradas
check('diagramas con marco uniforme 16:10', await js('[...document.querySelectorAll(".calc img")].every(i=>{const r=i.getBoundingClientRect();return Math.abs(r.height-r.width*10/16)<2})'));
// solo se comparan tarjetas de la misma fila (en celular van apiladas y es normal que difieran)
check('tarjetas de diagramas de igual alto', await js('(()=>{const f=[...document.querySelectorAll(".calc figure")].map(x=>x.getBoundingClientRect());const filas={};f.forEach(r=>{(filas[Math.round(r.top)]=filas[Math.round(r.top)]||[]).push(r.height)});return Object.values(filas).every(h=>Math.max(...h)-Math.min(...h)<=1)})()'));

// Regresiones de la auditoría QA
check('sin encabezados dentro de botones', await js('document.querySelectorAll("button h1,button h2,button h3").length === 0'));
check('errores del formulario asociados a su campo', await js('[...document.querySelectorAll("#wizard [required]:not([type=radio])")].every(f=>f.getAttribute("aria-describedby"))'));
check('estado de proyectos anunciado', await js(String.raw`/Mostrando \d+ de 30/.test(document.getElementById("projStatus").textContent)`));
check('Universidad del Valle no aparece como cliente', await js('!document.querySelector(".value").textContent.includes("Universidad del Valle")'));
check('enlaces WhatsApp con número real', await js('[...document.querySelectorAll("[data-wa]")].every(a=>a.href.startsWith("https://wa.me/573126523638"))'));
if (w < 960) {
  await js('scrollTo(0,0);document.querySelector(".menu-btn").click()'); await sleep(200);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(200);
  check('Escape cierra el menú móvil', await js('document.querySelector(".menu-btn").getAttribute("aria-expanded") === "false" && !document.getElementById("mnav").classList.contains("open")'));
}
await js('document.getElementById("tickerBtn").click()');
check('marquesina se puede pausar', await js('document.querySelector(".ticker").classList.contains("paused")'));

check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));
console.log(`\n${w}x${h}\n` + results.join('\n'));
ws.close(); browser.kill();
browser.on('exit', () => {
  // El navegador libera el perfil al cerrarse; si Windows aún lo bloquea, se limpia en la siguiente corrida
  try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { console.warn('perfil temporal no borrado:', e.code); }
});
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
