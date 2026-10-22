# Estado del proyecto — Sitio web Grupo G&E

**Última actualización:** 22 de octubre de 2026

## En pocas palabras

**https://grupogye.com** ya está en línea con el sitio nuevo. Es una portada única con servicios, equipos, 30 proyectos, clientes, preguntas frecuentes, un cotizador que envía al correo y WhatsApp, y modo oscuro.

Además hay **5 páginas de servicio para posicionar en Google**. Están publicadas **en revisión**: con `noindex`, fuera del sitemap y sin enlazar desde la portada, hasta que la empresa las apruebe.

El objetivo de negocio es que los clientes lleguen por Google y no solo por referidos.

---

## Qué hay en vivo

| Qué | Dónde | Estado |
|---|---|---|
| Portada (v3) | `/` (página WP 2256, slug `inicio`) | ✅ Publicada e indexable |
| Estudio de suelos | `/estudio-de-suelos/` (2270) | 🟡 En revisión (noindex) |
| Estudios geotécnicos | `/estudios-geotecnicos/` (2271) | 🟡 En revisión (noindex) |
| Pilotes y micropilotes | `/pilotes-y-micropilotes/` (2272) | 🟡 En revisión (noindex) |
| Estabilidad de taludes | `/estabilidad-de-taludes/` (2269) | 🟡 En revisión (noindex) |
| Vulnerabilidad sísmica | `/vulnerabilidad-sismica-reforzamiento/` (2273) | 🟡 En revisión (noindex) |
| Política de datos (Ley 1581) | `/politica-de-privacidad/` (3) | 🟡 En revisión (noindex) |
| Redirecciones 301 | `/about/`, `/contact/`, `/books/`, `/servicios/`, `/recursos/`, `/home/`, `/proximamente/`, `/estudio-de-suelos-medellin/` | ✅ |

**Cotizaciones:** Contact Form 7 (formulario 2262 «Cotización web») envía a **gyeconsultoriaintegral@gmail.com**, con Reply-To del cliente. Los buzones `@grupogye.com` a veces fallan, por eso se usa Gmail.

### WordPress (HostGator, Plan Emprendedor, vence 04-ago-2027)
- WordPress 7.1.3, PHP 8.3 y tema Astra 4.14.1. Twenty Twenty-Five queda instalado como respaldo.
- Plugins: Contact Form 7, Really Simple Security (SSL), Redirection, Stop User Enumeration y Slim SEO (títulos y descripciones para Google).
- Usuarios: `Juan Cardozo` (administrador de la empresa) y `editor-web` (usado por los scripts mediante una contraseña de aplicación). El usuario del socio anterior fue eliminado.
- Dominio, DNS y 5 buzones de correo en la misma cuenta. SPF y DKIM están bien; **falta DMARC**.

---

## Cómo se trabaja

El sitio se arma en `prototipo/v3/` y se publica en WordPress con los scripts de `scripts/`, que usan la API REST. Las credenciales están en `.env` (ignorado por git; ver `.env.example`).

```bash
# Datos del prototipo (después de editar contenido/ o assets/)
python prototipo/v3/build-data.py

# Publicar
python scripts/publicar_v3.py --publicar            # portada
python scripts/publicar_servicios.py --revision     # páginas de servicio en revisión (noindex)
python scripts/publicar_servicios.py --publicar     # páginas de servicio aprobadas (indexables)
python scripts/politica_datos.py --revision         # política de datos (--publicar al aprobarla)
python scripts/formulario_cf7.py                    # formulario de cotización
python scripts/redirecciones.py                     # 301 del sitio anterior
python scripts/respaldo_wp.py                       # respaldo del contenido por la API

# Pruebas (Edge headless, sin dependencias)
node prototipo/v3/e2e.mjs 1440 900                                  # prototipo local
E2E_URL=https://grupogye.com/ node prototipo/v3/e2e.mjs 390 844 dark  # sitio en vivo (simula el envío del formulario)
node prototipo/v3/e2e-servicios.mjs https://grupogye.com/estudio-de-suelos/ 1440 900
```

- **Git:** una rama por cambio y PR a `main`, revisado por SonarQube Cloud (proyecto público `JuanC101195_Grupo-G-E`). Sin atribución a IA en los commits.
- Antes de subir a una rama ya usada, hay que verificar que su PR no se haya mezclado. Si ya se mezcló, se crea una rama nueva desde `main`.

### Problemas conocidos de WordPress y cómo se resolvieron
- WordPress convierte `&&` en `&#038;&#038;` dentro del contenido. El JS se publica en base64 con un cargador mínimo (`script_seguro`).
- ModSecurity bloquea la subida binaria de imágenes. Se suben como multipart.
- Astra impone sus tipografías y tamaños. Los overrides están en `CSS_ASTRA`, en `publicar_v3.py`.
- Toda página nueva debe llevar `META_ASTRA` y el marco `envolver()` de `publicar_servicios.py`. Si no, muestra el encabezado y el pie viejos de Astra.
- Contact Form 7 por API exige `context=save` para guardar y multipart para enviar.
- **No publicar páginas con contraseña**: WordPress las mete en el sitemap. Para revisión se usa `noindex` de Slim SEO.

---

## Qué falta

### Esperando a la empresa
- [ ] Aprobación (o cambios) de las **5 páginas de servicio**, después de acortarlas a ~450 palabras.
- [ ] Aprobación de la **política de datos**.
- [ ] Aprobación de los textos de los 6 servicios y de «Cómo trabajamos» de la portada.
- [ ] Autorización para mostrar **logos y nombres de clientes** (ya publicados en la portada).
- [ ] Pilotes y micropilotes: 1 o 2 casos donde los hayan **construido** (hoy el portafolio no tiene ninguno).
- [ ] Anclajes (¿también los construyen?), instrumentación en Cañasgordas–Uramita (¿instalada o diseñada?) e interventoría o construcción en reforzamientos.
- [ ] Revisión de los textos técnicos por un ingeniero de G&E.
- [ ] Servicios a priorizar en la Costa Caribe (la región ya está definida: toda la Costa).
- [ ] **Excel con los años** de cada proyecto (no habrá fotos nuevas).

### Cuando aprueben
- [ ] `publicar_servicios.py --publicar` y `politica_datos.py --publicar`.
- [ ] Enlazar las páginas de servicio desde las tarjetas de servicios de la portada y desde el pie.
- [ ] Enlazar la política en la casilla de autorización del cotizador y en el pie.

### Pendientes de Juan (panel / Google)
- [ ] DMARC en el Zone Editor: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:gyeconsultoriaintegral@gmail.com`.
- [ ] Revisar las cuotas de los buzones `@grupogye.com` (probable causa de que «se caigan»).
- [ ] Google Search Console con la cuenta de la empresa, y enviar `https://grupogye.com/sitemap.xml`.
- [ ] Google Business Profile. Clientes para pedir reseñas: Bioexplora, Poliobras, Aschner, PriceSmart, IngenioBIM, MC Arquitectos y ACCA.
- [ ] Quitar los íconos sociales de Astra (solo se ven en la página 404): *Apariencia → Personalizar → Encabezado / Pie*.

### Siguiente fase técnica
- [ ] Tema propio de WordPress que reemplace Astra (con `theme.json` desde `DESIGN.md`).
- [ ] Más páginas para SEO: ciudades de la Costa con proyectos reales y un blog técnico (`seo/estrategia-seo.md`).
- [ ] Fuentes servidas desde el propio sitio (hoy vienen de Google Fonts).
- [ ] Imagen para redes sociales (`og:image` de 1200×630).

---

## Datos confirmados por la empresa
- **Grupo G&E S.A.S.**, NIT **901017577-0**, fundada el 6-oct-2016 (10 años).
- Dirección: Cra 81A #47-73, Floresta, Medellín. Solo va en contacto y pie, no en los textos.
- WhatsApp y teléfono principal: **+57 312 652 3638**; secundario +57 324 248 9898.
- Instagram: @grupo_gye. Sin horario público: se muestra «respuesta en menos de 24 horas».
- Logo reconstruido en vector y **aprobado** (no existe el original editable).
- Proyecto *Puentes Mulatos y San Juan* es **confidencial**: `publicar: false` en `proyectos.json`.
- No quieren mostrar el equipo de ingenieros. Solo afiliados a la Cámara de Comercio de Medellín.
- Micropilotes: IGU (inyección global única), IR (inyección repetitiva), IRS (inyección repetitiva selectiva).
- No hacen interventoría de obras que ellos mismos diseñaron.
- No limitar la comunicación a Medellín. Muchos proyectos son solo estudio o diseño (no afirmar que las obras ya están construidas).
