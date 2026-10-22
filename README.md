# Grupo G&E — Sitio web

Sitio web de **Grupo G&E S.A.S.**, consultoría geotécnica, estructural e integral (Medellín, Colombia). Su objetivo es que clientes nuevos encuentren a la empresa en Google y pidan cotización en línea.

## Estructura

| Carpeta | Contenido |
|---|---|
| `prototipo/v3/` | Prototipo vigente: `index.html`, `styles.css`, `app.js` y `data.js`, este último generado por `build-data.py` |
| `prototipo/v2/`, `prototipo/index.html` | Versiones anteriores (v2 y v1), como referencia |
| `contenido/` | Datos del brochure 2026 en JSON (empresa, servicios, 31 proyectos) y textos web |
| `assets/` | Imágenes optimizadas (WebP), logos y `imagenes.json` con los textos alternativos y los colores de marca |
| `assets/marca/` | Logo en vector (claro, negativo y símbolo), PNG de apoyo y su generador en `_fuente/` |
| `seo/estrategia-seo.md` | Investigación de competencia, mapa de URLs, metadatos y plan de contenido |
| `DESIGN.md` | Sistema de diseño |
| `ESTADO.md` | **Estado del proyecto: qué está en vivo, cómo se publica y qué falta** |

## Cómo trabajar

```bash
# Regenerar los datos del prototipo después de editar contenido/ o assets/
python prototipo/v3/build-data.py

# Pruebas de extremo a extremo (Edge headless, sin dependencias)
node prototipo/v3/e2e.mjs 1440 900
node prototipo/v3/e2e.mjs 390 844
node prototipo/v3/e2e.mjs 320 640
node prototipo/v3/e2e.mjs 1440 900 dark   # modo oscuro, con auditoría de contraste AA
```

El prototipo se abre directamente con `prototipo/v3/index.html`.

## Sitio publicado

https://grupogye.com/ es la v3 publicada en WordPress (portada = página «inicio»). Todo se maneja con los scripts de `scripts/`, que leen las credenciales de `.env` (ver `.env.example`; nunca se sube):

```bash
python scripts/publicar_v3.py --publicar      # republica la portada tras cambiar contenido/ o prototipo/v3/
python scripts/formulario_cf7.py              # formulario de cotización (Contact Form 7 → info@grupogye.com)
python scripts/redirecciones.py               # 301 de las URLs del sitio anterior
python scripts/respaldo_wp.py                 # respaldo del contenido por la API
E2E_URL=https://grupogye.com/ node prototipo/v3/e2e.mjs 1440 900   # pruebas sobre el sitio en vivo (el envío del formulario se simula)
```

## Datos pendientes de confirmar con la empresa

Horario, NIT, correo(s) de destino de las cotizaciones, autorización de uso de logos de clientes, aprobación del logo reconstruido, fotos en alta resolución, la ubicación de 7 proyectos y el cliente del logo de la "A" roja.

## Próximos pasos

Tema propio de WordPress (reemplazar Astra), páginas por servicio para SEO, metadatos SEO en el `<head>`, Google Business Profile y Search Console.
