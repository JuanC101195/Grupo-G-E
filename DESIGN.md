# Grupo G&E — Sistema de diseño (v0, prototipo)

Base para portar el prototipo a WordPress (`theme.json` de un tema hijo o tema de bloques).

## Dirección
- **Propósito:** generar solicitudes de cotización calificadas.
- **Audiencia:** constructoras, gerentes de proyecto, entidades públicas, interventores.
- **Tono:** industrial y técnico; preciso, sin adornos.
- **Firma visual:** perfil estratigráfico (capas de suelo + pilotes) y lenguaje de informe técnico (códigos GEO-01, "Sondeo S-01", datos en monoespaciada).
- **Mensaje central:** "Del estudio a la obra, un solo responsable".

## Tokens
| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#15181B` | Fondos oscuros (hero, proceso, footer), texto principal |
| `--concrete` | `#F2F0EB` | Fondo general |
| `--paper` | `#FFFFFF` | Superficies (servicios, formulario) |
| `--line` | `#D9D4C9` | Bordes y divisores |
| `--muted` | `#5A6066` | Texto secundario sobre claro |
| `--clay` | `#B4532A` | Acento principal / CTA (contraste 6.9:1 con blanco) |
| `--clay-soft` | `#E9C2AC` | Acento sobre oscuro |
| `--signal` | `#E8A33D` | Etiquetas técnicas sobre oscuro, foco |
| `--sand` / `--silt` / `--rock` | `#E6D5AC` / `#9A8466` / `#8E99A3` | Ilustración de estratos |

Tipografía (Google Fonts):
- **Archivo** (ancho variable, 750–800): títulos.
- **IBM Plex Sans**: texto.
- **IBM Plex Mono**: etiquetas y datos técnicos.

Espaciado: 4 / 8 / 16 / 24 / 40 / 64 / 104 px. Radio: 2 px (aristas casi rectas, como planos).

## Reglas
- Un solo color de acción (arcilla). Nada de degradados ni glassmorphism.
- Fotos reales de obra, nunca de stock. Mientras no haya fotos, se usa un rayado tipo plano marcado como "pendiente".
- Cifras y datos de contacto sin confirmar llevan subrayado punteado (`.tbd`) hasta que lleguen del brochure.
- Formulario: validación accesible, autorización Ley 1581/2012 (habeas data) obligatoria.

## Pendiente del brochure
Logo real, cifras (proyectos, años), lista final de servicios, proyectos con fotos, contacto, NIT, sectores.

## Auditoría del sitio anterior (grupogye.com)
- Plantilla de demostración de Astra ("Grace Bryant", tema de escritora) sin personalizar: latín de relleno, dirección de Los Ángeles, `mail@example.com`, "books" usado como Proyectos.
- Sin H1 ni meta description, sin datos estructurados, WhatsApp sin número, redes sin enlace, boletín en inglés.
- Foto de stock (Gran Cañón) sin relación con el negocio.
