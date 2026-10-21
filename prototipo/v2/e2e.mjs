// Prueba de extremo a extremo en tiempo real (Edge headless + CDP, sin dependencias).
// Uso: node e2e.mjs [ancho] [alto]   → capturas en ../capturas/v2-*.png
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'capturas');
const [w = 1440, h = 900] = process.argv.slice(2).map(Number);
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'gye-e2e-'));
const browser = spawn(edge, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let tabs;
for (let i = 0; i < 40 && !tabs?.length; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {}; const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, `v2-${w}-${name}.png`), Buffer.from(r.data, 'base64'));
};
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
await send('Page.navigate', { url: pathToFileURL(path.join(here, 'index.html')).href });
await sleep(5000);
await shot('1-hero');
check('sin scroll horizontal', await js('document.documentElement.scrollWidth <= innerWidth'), await js('document.documentElement.scrollWidth + "/" + innerWidth'));
check('etiquetas del perfil visibles', await js('document.querySelectorAll(".st-l.on").length === 4'));
check('contador llegó a +120', await js('document.querySelector("[data-count]").textContent === "+120"'));

// Estrato interactivo
await js('document.querySelector(".layer[data-k=\'1\']").dispatchEvent(new MouseEvent("click",{bubbles:true}))');
check('estrato muestra su explicación', (await js('document.getElementById("lcTitle").textContent')).startsWith('Arcilla'));

// Filtro de proyectos
await js('document.getElementById("proyectos").scrollIntoView()'); await sleep(900);
await js('document.querySelector(".chip[data-f=\'taludes\']").click()'); await sleep(900);
check('filtro deja 1 proyecto', await js('[...document.querySelectorAll(".proj")].filter(c=>!c.hidden).length === 1'));
await shot('2-proyectos-filtrados');
await js('document.querySelector(".chip[data-f=\'todos\']").click()'); await sleep(1600);
const vis = await js('[...document.querySelectorAll(".proj")].map(c=>(c.hidden?"H":"V")+getComputedStyle(c).opacity).join(",")');
check('filtro "Todos" restaura 6', vis.split(',').every((v) => v === 'V1'), vis);

// Caso en modal → cotizar similar
await js('document.querySelector(".proj").click()'); await sleep(600);
check('modal del caso abierto', await js('document.getElementById("caseDlg").open'));
await shot('3-caso');
await js('document.getElementById("caseQuote").click()'); await sleep(1200);
check('cotizar similar salta al paso 2 con servicio', await js('!document.querySelector("[data-step=\'2\']").hidden && document.querySelector("input[name=servicio]:checked").value === "cimentaciones"'));

// Validación y envío
await js('document.getElementById("next").click()'); await sleep(200);
check('paso 2 bloquea sin ciudad', await js('document.getElementById("ciudad").getAttribute("aria-invalid") === "true"'));
await js(`(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;};s("ciudad","Medellín");s("tipo","Edificio");s("area","1200");document.getElementById("next").click();})()`);
await sleep(300);
await js(`(()=>{const s=(id,v)=>{document.getElementById(id).value=v;};s("nombre","Prueba <script>alert(1)</script>");s("tel","3001234567");s("email","malo@");document.getElementById("habeas").checked=true;document.getElementById("next").click();})()`);
check('correo inválido bloquea', await js('document.getElementById("email").getAttribute("aria-invalid") === "true"'));
await js('document.getElementById("email").value="prueba@empresa.com";document.getElementById("next").click()'); await sleep(500);
check('solicitud completada', await js('!document.getElementById("doneBox").hidden'));
check('botones del asistente ocultos al terminar', await js('getComputedStyle(document.getElementById("wnav")).display === "none"'));
check('resumen escapa HTML del usuario', await js('!document.querySelector("#summary script") && document.getElementById("summary").textContent.includes("<script>")'));
check('enlace WhatsApp con datos', await js('document.getElementById("waSend").href.startsWith("https://wa.me/") && decodeURIComponent(document.getElementById("waSend").href).includes("Medellín")'));
await js('document.getElementById("cotizar").scrollIntoView()'); await sleep(700);
await shot('4-cotizacion-enviada');

check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));
console.log(`\n${w}x${h}\n` + results.join('\n'));
ws.close(); browser.kill();
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
