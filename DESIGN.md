# Grupo G&E — Sistema de diseño

Fuente para llevar el prototipo (`prototipo/v3/`) a WordPress: los tokens pasan a `theme.json` (paleta, tipografías y espaciado) y a la variante de estilo oscura.

## Dirección
- **Propósito:** conseguir solicitudes de cotización calificadas desde Google.
- **Audiencia:** constructoras, consultoras, entidades públicas, operadores industriales y mineros.
- **Tono:** industrial y técnico; preciso, sin adornos.
- **Firma visual:** el sondeo. Perfil estratigráfico en los cuatro colores del logo, pilotes que bajan como la "G", medidor de profundidad de 0 a 150 m (la capacidad real de perforación) y lenguaje de informe técnico (códigos EXP-01, N-SPT, datos en monoespaciada).
- **Mensaje central:** "Del sondeo a la obra, un solo equipo".

## Marca

El logo original solo existía como JPG de baja resolución. Se reconstruyó en vector en `assets/marca/`; el generador está en `_fuente/generar_logo.py`.

| Archivo | Uso |
|---|---|
| `logo-ge.svg` | Logo completo sobre fondos claros (web, documentos, impresión) |
| `logo-ge-negativo.svg` | Logo completo sobre fondos oscuros (letras blancas, "&" gris claro) |
| `logo-ge-simbolo.svg` / `-negativo.svg` | Solo el símbolo: favicon, avatar, sellos |
| `logo-ge-1600.png` | Para quien pida PNG (Word, correo) |
| `logo-ge-simbolo-512.png` | Foto de perfil de Google Business Profile y WhatsApp |
| `logo-ge.png` / `logo-ge.webp` | Raster original del brochure. Ya no se usa; se conserva como referencia |

Reglas de uso:
- **Área libre:** alrededor del logo, como mínimo el alto de la "E".
- **Tamaño mínimo:** logo completo desde 110 px de ancho; por debajo de 32 px el símbolo pierde detalle y hace falta una versión simplificada (pendiente).
- **No:** deformar, cambiar los colores de las franjas, poner el logo claro sobre fondo oscuro (usar el negativo) ni encerrarlo en una caja blanca sobre fondos oscuros.
- **Tipografía del texto del logo:** Michroma (libre), equivalente a la Eurostile Bold Extended del original. Si la empresa entrega la fuente o el archivo original, se reemplaza.
- **Estado:** reconstrucción pendiente de aprobación por la empresa.

## Color

Colores de marca muestreados del logo y del brochure 2026 (`assets/imagenes.json → colores_marca`).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--g-green` / `--g-blue` / `--g-brown` / `--g-orange` | `#076035` / `#266BAA` / `#623A16` / `#D85C19` | igual | Franjas del logo, perfil estratigráfico, barra de progreso |
| `--ink` | `#0F202D` | igual | Secciones oscuras (portada, obra, proceso, cotizar, pie) |
| `--concrete` | `#EDF2F6` | `#0B1824` | Fondo de página |
| `--paper` | `#FFFFFF` | `#13283B` | Superficies (tarjetas, formulario, modal) |
| `--line` | `#CFD9E2` | `#2A4054` | Bordes y divisores |
| `--text` / `--muted` | `#0F202D` / `#4E5D6A` | `#E6EDF3` / `#A9B8C5` | Texto principal y secundario |
| `--clay` | `#B84A10` | igual | Fondo de botones de acción (5.2:1 con blanco) |
| `--accent` | `#B84A10` | `#F29A5E` | Texto de acento (etiquetas, enlaces) |
| `--signal` | `#F29A5E` | igual | Acento y foco sobre secciones oscuras |

- El naranja de marca (`#D85C19`) no llega a 4.5:1 con texto blanco; los botones usan `--clay`, su versión oscurecida.
- Sobre fondos oscuros, el verde y el café del logo no tienen contraste suficiente para texto. Por eso el eslogan usa tonos claros de las cuatro franjas: `#3FBF7F`, `#5B98CF`, `#C98B4E` y `#F29A5E`.
- **Modo oscuro:** sigue a `prefers-color-scheme` y se puede forzar con `html[data-theme]`; la elección se guarda en `localStorage` (`gye-theme`). Las secciones oscuras no cambian; los logos de clientes y los diagramas técnicos se muestran en tarjetas blancas.

## Tipografía
- **Barlow Condensed** 700/800, en mayúsculas: títulos (eco del brochure).
- **IBM Plex Sans** 400/500/600: texto.
- **IBM Plex Mono** 400/500: etiquetas y datos técnicos.
- En WordPress se sirven desde el propio sitio, no desde Google Fonts.

Espaciado: 4 / 8 / 16 / 24 / 40 / 64 / 104 px. Radio: 2 px (aristas casi rectas, como planos).

## Movimiento
Elegido con la skill awesome-ai-motion: excavación del perfil y anotaciones de los estratos, título con `mask-reveal`, contadores, apariciones escalonadas, proceso ligado al scroll y medidor de profundidad. Solo se anima `transform` y `opacity`, y nada se mueve si el visitante tiene activado `prefers-reduced-motion`.

## Reglas
- Un solo color de acción (`--clay`). Nada de degradados decorativos ni glassmorphism; la única excepción es el eslogan con las franjas de marca.
- Solo fotos reales de obra, nunca de stock.
- Los datos sin confirmar llevan subrayado punteado (`.tbd`).
- Contraste AA verificado de forma automática en ambos modos (`node prototipo/v3/e2e.mjs <ancho> <alto> [dark]`).
- Formulario: validación accesible y autorización obligatoria según la Ley 1581 de 2012.

## Auditoría del sitio anterior (grupogye.com)
- Plantilla de demostración de Astra ("Grace Bryant", tema de escritora) sin personalizar: latín de relleno, dirección de Los Ángeles, `mail@example.com`, "books" usado como Proyectos.
- Sin H1 ni meta description, sin datos estructurados, WhatsApp sin número, redes sin enlace, boletín en inglés.
- Foto de stock (Gran Cañón) sin relación con el negocio.
