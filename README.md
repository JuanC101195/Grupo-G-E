# Grupo G&E — Sitio web

Sitio web de **Grupo G&E S.A.S.**, consultoría geotécnica, estructural e integral (Medellín, Colombia). Su objetivo es que clientes nuevos encuentren a la empresa en Google y pidan cotización en línea.

## Estructura

| Carpeta | Contenido |
|---|---|
| `prototipo/v3/` | Prototipo vigente: `index.html`, `styles.css`, `app.js` y `data.js`, este último generado por `build-data.py` |
| `prototipo/v2/`, `prototipo/index.html` | Versiones anteriores (v2 y v1), como referencia |
| `contenido/` | Datos del brochure 2026 en JSON (empresa, servicios, 31 proyectos) y textos web |
| `assets/` | Imágenes optimizadas (WebP), logos y `imagenes.json` con los textos alternativos y los colores de marca |
| `seo/estrategia-seo.md` | Investigación de competencia, mapa de URLs, metadatos y plan de contenido |
| `DESIGN.md` | Sistema de diseño |

## Cómo trabajar

```bash
# Regenerar los datos del prototipo después de editar contenido/ o assets/
python prototipo/v3/build-data.py

# Pruebas de extremo a extremo (Edge headless, sin dependencias)
node prototipo/v3/e2e.mjs 1440 900
node prototipo/v3/e2e.mjs 390 844
node prototipo/v3/e2e.mjs 320 640
```

El prototipo se abre directamente con `prototipo/v3/index.html`.

## Datos pendientes de confirmar con la empresa

WhatsApp, horario, NIT, autorización de uso de logos de clientes, logo en vector, fotos en alta resolución y la ubicación de 7 proyectos. En el sitio aparecen con subrayado punteado (`.tbd`).

## Próximo paso

Llevar el prototipo a WordPress en HostGator: tema de bloques con `theme.json`, tipos de contenido Servicio y Proyecto, y formulario con envío por correo.
