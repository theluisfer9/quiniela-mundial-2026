# UX/UI spec

## Dirección

### Design read

Anuario deportivo interactivo para una audiencia familiar, basado en datos reales y con una voz celebratoria. Es un cierre editorial del producto `Torneo Vivo`, no un dashboard administrativo ni una landing de marketing.

### Diales

| Dial | Valor | Razón |
|---|---:|---|
| Design variance | 7/10 | La historia admite layouts asimétricos y capítulos visuales, pero las tablas deben conservar orden. |
| Motion intensity | 4/10 | El movimiento ayuda a revelar carrera y jerarquía. La página no debe parecer un producto todavía activo. |
| Visual density | 5/10 | El scroll principal respira; tablas y detalles concentran datos al final. |

### Modo de rediseño

`Redesign preserve`.

Se conserva:

- la identidad `Torneo Vivo`;
- la paleta real que llegó a producción;
- las tipografías actuales;
- el radio base de 8 px con ampliaciones consistentes;
- el lenguaje familiar y deportivo;
- las tablas semánticas y focus states.

Se retira:

- urgencia para pronosticar;
- navegación de cuenta;
- PIN y autenticación;
- estados live;
- próximas fechas;
- cards repetidas con eyebrow en cada sección;
- modales de predicciones;
- barras de consenso del producto activo;
- dependencia de Convex.

## Sistema visual

### Paleta base

Los valores salen de `packages/ui/src/styles/globals.css`.

| Token | Valor | Uso |
|---|---|---|
| Canvas | `#FFF8F7` | Fondo general. |
| Ink | `#291715` | Texto principal. |
| Surface | `#FFFFFF` | Tablas y contenido elevado. |
| Primary red | `#BD0015` | CTA, Q, momentos decisivos. |
| Structural blue | `#2A398D` | Hero, navegación, estructura de charts. |
| Action red | `#E61D25` | Datos deportivos secundarios; no competir con primary. |
| Progress green | `#3CAC3B` | Aciertos y resultados favorables. |
| Soft red | `#FFE9E6` | Superficies narrativas cálidas. |
| Lilac | `#97A5FF` | Comparación y líneas secundarias. |
| Border | `#E7BDB8` | Divisores y contornos. |
| Muted ink | `#5D3F3C` | Texto de apoyo. |

### Regla de color

- Azul organiza.
- Rojo cuenta la carrera de Q y las decisiones.
- Verde marca aciertos, nunca ranking.
- Lilac separa series secundarias.
- Los países pueden usar sus colores solo dentro de banderas o ilustraciones.
- No se usarán gradientes morado-azul de estética AI.
- No se invierte el tema por secciones.

### Tema

Light only, coherente con el producto aprobado. No se crea dark mode en este cierre.

### Tipografía

| Rol | Familia | Peso sugerido |
|---|---|---:|
| Display, nombres campeones, cifras | `Anybody` | 700-900 |
| Body, labels, navegación | `Lexend` | 400-700 |
| Datos tabulares | `Lexend` con `font-variant-numeric: tabular-nums` | 500-700 |

Escala:

- Hero: 48-72 px escritorio, 40-48 px móvil.
- H2 de capítulo: 36-56 px escritorio, 30-38 px móvil.
- Número destacado: 48-80 px según contexto.
- Body: 16-18 px.
- Labels: mínimo 12 px, sin tracking excesivo.

El hero debe caber en el viewport inicial con navegación incluida.

### Radios

Regla documentada:

- controles: 12 px;
- cards y módulos: 20 px;
- hero y capítulos ilustrados: 28-32 px;
- pills solo para tabs o filtros reales.

No se usarán círculos decorativos para cada icono.

### Sombras

Solo para elevar:

- poster descargable;
- navegación sticky sobre contenido;
- tabla o panel superpuesto.

Las sombras usarán azul estructural con baja opacidad. El resto se separará con espacio, color y bordes.

## Grid y ritmo

### Contenedor

- `max-width: 1400px`.
- Padding móvil: 16 px.
- Padding tablet: 24 px.
- Padding escritorio: 32-48 px.
- Grid escritorio: 12 columnas.
- Grid móvil: 4 columnas.

### Espaciado

- capítulos mayores: 96-144 px en escritorio, 64-88 px en móvil;
- separación interna: escala 8, 12, 16, 24, 32, 48;
- tablas: compactas, sin sacrificar touch targets.

### Layouts por sección

| Sección | Layout escritorio | Fallback móvil |
|---|---|---|
| Hero | Split 7/5, copy izquierda e ilustración derecha | Copy, cifra campeona e ilustración apilados |
| Cifras | Banda de cinco columnas sin cards completas | Scroll snap de cifras o grid 2 x 3 |
| Dos coronas | Dos bloques 5/7 con siluetas distintas | Dos capítulos verticales |
| Carrera | Chart ancho con rail de anotaciones | Resumen textual y hitos apilados; chart simplificado opcional |
| Ruta de Q | Camino serpenteante con siete marcadores | Lista vertical conectada |
| Momentos | Mosaico 7/5 y luego 5/7 | Cards editoriales apiladas |
| Reconocimientos | Grid asimétrico 2 + 4 | Carrusel scroll snap o lista 2 columnas |
| Final | Composición 6/6 con ilustración y distribución | Ilustración, marcador, distribución |
| Tablas | Panel ancho con tabs | Lista paginada o table scroll con headers visibles |

No se repetirá el mismo layout de cards en secciones consecutivas.

## Componentes

### FinalHeader

- logo o wordmark `Quiniela Mundial 2026`;
- anchors;
- botón `Descargar resumen`;
- sticky después de abandonar el hero;
- máximo 72 px de alto;
- una línea en escritorio;
- focus visible.

### ClosingHero

Contenido máximo:

1. label de archivo;
2. título;
3. texto de 20 palabras aproximadamente;
4. CTA y descarga.

La ilustración debe reservar espacio desde el HTML para evitar CLS.

### StatRibbon

No usar cinco cards blancas idénticas. Cada cifra vive sobre una misma banda con divisores y variaciones tipográficas.

Requisitos:

- números tabulares;
- labels completos;
- orden de lectura semántico;
- 79.8% con explicación accesible.

### ChampionDiptych

Dos campeones oficiales.

Otto:

- blue dominant;
- marcador `98`;
- detalle del recorrido desde puesto 13;
- ilustración o medallón propio.

Q:

- red dominant;
- marcador `47`;
- siete fichas de marcador como motivo;
- tratamiento un poco mayor porque conduce al siguiente capítulo.

Ninguno debe parecer subcampeón del otro.

### LeaderRaceChart

Pregunta que responde:

`¿Cómo cambió la punta de eliminatorias hasta que Q ganó?`

Diseño:

- eje horizontal por partido o fecha;
- eje vertical por puntos acumulados;
- línea de Q en rojo;
- Sergio en azul;
- Tesoro en verde;
- Sofi en lilac;
- Boris y Quique en tonos oscuros secundarios;
- líneas del resto agrupadas como campo tenue, no individualizadas;
- anotaciones en M73, M88, M98, M100, M101 y M102;
- M103 y M104 se extienden como cierre plano.

Interacción:

- hover y focus muestran partido, líder y puntos;
- no depender de hover;
- botones `Anterior` y `Siguiente` para recorrer hitos con teclado;
- resumen textual siempre presente;
- no usar animación infinita.

Mobile:

- mostrar solo Q, Sergio y la línea de líder;
- acompañar con seis hitos en cards;
- permitir scroll horizontal solo dentro del chart;
- no reducir labels por debajo de 12 px.

### ExactScorePath

Siete nodos, uno por exacto de Q.

Cada nodo incluye:

- número de partido;
- ronda;
- selecciones;
- marcador;
- puntos `+3`;
- alt text o texto visible equivalente.

El partido 102 usa un nodo final mayor con texto `liderato definitivo`.

### MatchStory

Cada momento tiene:

- marcador;
- partido y fase;
- una frase editorial;
- dos o tres métricas;
- mini visual de distribución si aporta.

Celebraciones usan fondo verde muy suave. Sorpresas usan rojo suave o azul profundo, sin usar rojo como señal de error personal.

### AwardGallery

Seis reconocimientos, pero no seis cards iguales.

Composición sugerida:

- Boris y Sergio ocupan módulos grandes;
- Q, Marianne, Teto y Sofi ocupan módulos pequeños;
- cada módulo usa un motivo ilustrado diferente;
- el valor siempre es visible sin hover;
- la nota `lectura editorial` se mantiene junto al título.

### FinalNight

Dos datos se separan visualmente:

- marcador para puntuación: `0-0 a los 90'`;
- campeón: `España, 1-0 en tiempo extra`.

La distribución 8/5/8 se representa con 21 fichas o una barra tripartita etiquetada. No usar un pie chart.

### FinalStandings

Tabs accesibles con roles apropiados y estado visible.

Desktop:

- tabla semántica;
- rank, participante, puntos, predicciones, exactos, aciertos, precisión;
- números tabulares;
- highlight sobrio para campeón y top 3;
- filas compartidas conservan mismo rank.

Mobile:

- primeras seis filas visibles;
- paginación de seis en seis o disclosure por posición;
- campeón permanece visible al cambiar de página solo en un resumen, no duplicado en la tabla;
- los labels no se esconden completamente;
- no convertir cada métrica en una pill.

### DownloadPoster

Componente fuera del viewport visual, renderizado a 1080 x 1920.

Debe:

- cargar fuentes antes de capturar;
- reservar ilustración local;
- usar la misma fuente de datos;
- incluir alt text en la UI que dispara descarga;
- generar nombre `quiniela-mundial-2026-resumen-final.png`.

## Ilustración y fotografía

No se requiere fotografía real. Esta experiencia puede sostenerse con ilustración editorial porque la petición es un resumen visual y no existen retratos autorizados.

Reglas:

- usar los briefs de `ILLUSTRATION_BRIEFS.md`;
- no inventar rostros realistas de los participantes;
- representar personas con dorsales, iniciales, siluetas o manos;
- no usar logos oficiales de FIFA si no hay licencia;
- banderas y colores nacionales pueden usarse como información;
- texto crítico siempre se renderiza en HTML, no dentro de una imagen generada;
- ilustraciones deben tener variantes desktop y mobile crop.

## Motion

### Permitido

- entrada del hero con opacity y translate suave;
- trazado único de la carrera al entrar en viewport;
- aparición secuencial de los siete exactos;
- contador estático que anima una vez desde 0 solo si no distrae;
- hover táctil en CTA;
- transiciones de tabs de 160-220 ms.

### Prohibido

- parallax continuo;
- scroll hijack;
- confeti infinito;
- marcador pulsando;
- autoplay de carruseles;
- animar width, top o left;
- listeners manuales de scroll;
- movimiento que sugiera datos live.

### Reduced motion

Con `prefers-reduced-motion: reduce`:

- todas las líneas aparecen completas;
- no hay conteos animados;
- los reveals son instantáneos;
- tabs cambian sin transición;
- la narrativa conserva el mismo orden.

## Accesibilidad

- WCAG 2.2 AA como mínimo.
- Body y labels con contraste 4.5:1.
- Texto grande con 3:1.
- Foco visible en anchors, tabs, chart controls y descarga.
- Skip link a contenido.
- H1 único.
- Jerarquía H2/H3 lineal.
- Todas las cifras tienen labels.
- Charts incluyen tabla o resumen textual equivalente.
- Color nunca es el único indicador.
- Touch targets de 44 x 44 px.
- Ilustraciones informativas tienen alt text; decoración usa alt vacío.
- Las tablas conservan `caption`, `thead`, `tbody`, `th scope`.
- No se bloquea zoom.

## Rendimiento

- SVG o WebP/AVIF para ilustraciones según complejidad.
- Hero preloaded y responsive.
- Ilustraciones below the fold lazy loaded.
- Fonts self hosted con `font-display: swap`.
- Chart lazy loaded después de contenido inicial.
- No cargar Convex SDK en la ruta final.
- Bundle inicial objetivo menor a 180 KB gzip, sin contar imágenes.
- Hero visual menor a 250 KB en móvil.
- Poster de descarga solo se carga al solicitarlo.

## SEO y metadatos

Title:

`La historia de la Quiniela Mundial 2026`

Description:

`Resultados, campeones, cambios de líder y momentos que definieron la quiniela familiar del Mundial 2026.`

OG image:

Versión 1200 x 630 de la ilustración-resumen con Q, Otto, España y cifras principales.

Structured data:

`Article` o `WebPage`, no `SportsEvent` si implicaría que la quiniela fue el evento oficial.

## QA visual

Probar al menos:

- 360 x 800;
- 390 x 844;
- 768 x 1024;
- 1024 x 768;
- 1366 x 768;
- 1440 x 900;
- 1920 x 1080;
- zoom 200%;
- movimiento reducido;
- JavaScript deshabilitado para contenido esencial.
