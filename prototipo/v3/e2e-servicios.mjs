// Prueba de las páginas de servicio (Edge headless + CDP, sin dependencias).
// Uso: node e2e-servicios.mjs <url-o-ruta-de-una-página> [ancho] [alto] [dark]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [target, w = '1440', h = '900', dk] = process.argv.slice(2);
const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const mode = dk === 'dark' ? 'dark' : 'light';
const profiles = path.join(here, '..', 'capturas', '.perfiles');
fs.mkdirSync(profiles, { recursive: true, mode: 0o700 });
const prof = fs.mkdtempSync(path.join(profiles, 'svc-'));
const edge = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${prof}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const retry = async (fn, tries = 40) => {
  try { return await fn(); } catch (e) { if (tries <= 1) throw e; await sleep(250); return retry(fn, tries - 1); }
};
const port = await retry(() => fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim() || Promise.reject(new Error('sin puerto')));
const tabs = await retry(async () => { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (!l.length) throw new Error('sin pestañas'); return l; });
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
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 600 });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: mode }] });
await send('Page.navigate', { url });
await sleep(3500);

check('sin scroll horizontal', await js('document.documentElement.scrollWidth <= innerWidth'), await js('document.documentElement.scrollWidth + "/" + innerWidth'));
check('un solo H1', await js('document.querySelectorAll("h1").length === 1'));
check('H1 en Barlow Condensed', await js('getComputedStyle(document.querySelector("h1")).fontFamily.includes("Barlow")'));
check('JSON-LD válido (Service, BreadcrumbList, FAQPage)', await js(`(()=>{try{const t=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)["@type"]);return ["Service","BreadcrumbList","FAQPage"].every(x=>t.includes(x))}catch(e){return false}})()`));
check('botones "Cotizar" llevan al cotizador con el servicio', await js(String.raw`[...document.querySelectorAll('main a.btn-clay')].filter(a=>/Cotizar/.test(a.textContent)).every(a=>/\/\?servicio=[a-z-]+#cotizar$/.test(a.getAttribute("href")))`));
check('enlaces del menú apuntan a la portada', await js('[...document.querySelectorAll(".nav a")].every(a=>a.getAttribute("href").startsWith("/#"))'));
check('WhatsApp con número principal', await js('[...document.querySelectorAll("a[href*=\'wa.me\']")].every(a=>a.href.includes("573126523638"))'));
check('el proyecto confidencial no aparece', await js('!document.body.textContent.includes("Mulatos")'));
check('preguntas frecuentes se abren', await js('(()=>{const d=document.querySelector(".faq details");if(!d)return false;d.open=true;return d.open})()'));

await js('document.getElementById("themeBtn").click()'); await sleep(300);
check('el botón cambia de modo', await js(`document.documentElement.dataset.theme === "${mode === 'dark' ? 'light' : 'dark'}"`));
await js('document.getElementById("themeBtn").click();localStorage.removeItem("gye-theme");document.documentElement.removeAttribute("data-theme")'); await sleep(300);

const ca = JSON.parse(await js(String.raw`(()=>{
  const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  const L=c=>0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);
  const rgba=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0]};
  const bad=[];let n=0;const seen=new Set();
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(tw.nextNode()){const t=tw.currentNode;if(!t.textContent.trim())continue;const el=t.parentElement;if(seen.has(el))continue;seen.add(el);
    const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||el.closest('[hidden],[aria-hidden="true"],.sr,svg,noscript,script,style,details:not([open]) > p'))continue;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
    let bg=null;for(let a=el;a;a=a.parentElement){const s=getComputedStyle(a);if(s.backgroundImage!=='none'){bg='img';break}const b=rgba(s.backgroundColor);if(b.length>3?b[3]>0.5:true){bg=b;break}}
    if(bg==='img'||!bg)continue;n++;
    const l1=L(rgba(cs.color)),l2=L(bg),ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    const size=parseFloat(cs.fontSize),bold=Number(cs.fontWeight)>=700,need=(size>=24||(size>=18.66&&bold))?3:4.5;
    if(ratio<need)bad.push(el.tagName.toLowerCase()+'.'+el.className+' "'+t.textContent.trim().slice(0,25)+'" '+ratio.toFixed(2));}
  return JSON.stringify({n,bad:bad.slice(0,8),total:bad.length})})()`));
check(`contraste AA en modo ${mode} (${ca.n} textos)`, ca.total === 0, ca.bad.join(' | '));
check('sin errores de JavaScript', errors.length === 0, errors.join(' | '));

console.log(`\n${path.basename(url.split('?')[0])} ${w}x${h} ${mode}\n` + results.join('\n'));
ws.close(); browser.kill();
browser.on('exit', () => { try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { console.warn('perfil temporal no borrado:', e.code); } });
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
