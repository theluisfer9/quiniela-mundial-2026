# Reporte de misión: dashboard final

Fecha: 2026-07-19. Worktree: `final-dashboard-story`. Branch: `feat/final-dashboard-story`.

## Resumen

Se reemplazó la experiencia pública activa por el archivo estático final en `/` y
`/dashboard`. La ruta no monta `ConvexProvider`, no incluye rutas activas de
pronósticos, calendario, marcadores o manual en el árbol generado, y consume un
único snapshot TypeScript sanitizado. El poster toma sus cifras de ese mismo
snapshot y el Open Graph local está en `public/og-final.svg`.

## Archivos de la implementación

- `apps/web/src/features/final-dashboard/final-dashboard-data.ts`: dataset tipado,
  tablas completas, invariantes, ranking de competencia y scoring 3/2/1/0.
- `apps/web/src/features/final-dashboard/final-dashboard.tsx`: experiencia final,
  navegación, carrera, tabs, tablas, final y poster descargable.
- `apps/web/src/features/final-dashboard/final-dashboard-ui.ts`: navegación de tabs.
- `apps/web/src/features/final-dashboard/final-dashboard.test.ts`: invariantes,
  scoring, ranks y teclas de tabs.
- `apps/web/src/routes/index.tsx`, `dashboard.tsx`, `__root.tsx`, `main.tsx`:
  rutas finales, metadatos locales, skip link y sin proveedor Convex.
- Las rutas históricas de pronósticos, marcadores, calendario y manual, junto con
  sus componentes de navegación/autenticación dependientes, se retiraron de la
  superficie final. No se mantienen exclusiones de TypeScript para ocultar sus
  referencias a rutas que ya no existen.
- `apps/web/src/routeTree.gen.ts`: árbol regenerado con solo `/` y `/dashboard`.
- `apps/web/tsconfig.json`: conserva el typecheck normal, sin exclusiones de
  artefactos históricos.
- `packages/ui/src/styles/globals.css`: fallbacks locales de sistema para Anybody
  y Lexend, sin stylesheet remoto.
- `apps/web/public/og-final.svg`: composición local 1200x630.

## Decisiones cerradas verificadas

- Otto ganó grupos con 98; Q ganó eliminatorias con 47; ambos márgenes son 2.
- Las dos fases son oficiales separadas. El total se etiqueta como editorial.
- La final puntuable es España 0-0 Argentina a 90 minutos; España ganó 1-0 en
  tiempo extra sin sumarlo al scoring.
- La definición histórica de consenso se muestra como `away`, `draw`, `home`
  para empates de conteo.
- No se consultó Convex ni el ZIP privado.

## Dependencias, build y tests

Se instaló exclusivamente desde el lockfile, dentro del worktree:

```text
bun install --frozen-lockfile
2052 packages installed [8.42s]
```

Checks ejecutados:

```text
bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts
4 pass, 0 fail, 16 expect() calls

bun run --filter web check-types
exit 0; Vite build correcto

bun run --filter web build
exit 0; Vite build correcto

bun run build
exit 0; web y video build completaron

git diff --check
exit 0
```

## Addendum de segunda corrección integral (2026-07-19)

- La carrera conserva sus 32 checkpoints reales, los seis hitos M73, M88, M98,
  M100, M101 y M102, su leyenda y la alternativa textual. Cada checkpoint ahora
  es un objetivo SVG visible, enfocable y activable por mouse/teclado; actualiza
  un único detalle accesible, en vez de crear 32 tooltips solapados.
- El detalle se deriva del checkpoint activo y declara número de partido, fixture
  en español, marcador, líder o líderes y puntos del líder. El texto de cada
  `aria-label` contiene los mismos datos y el helper puro cubre casos de uno,
  dos y tres líderes.
- Los seis reconocimientos dejan de usar cards clonadas: Boris es la pieza
  principal, Sergio y Q forman las piezas secundarias y Marianne junto a los dos
  reconocimientos de Sofi se muestran como banda editorial. El encabezado y el
  texto mantienen que son lecturas editoriales y no competencia oficial.

## Addendum final: checkpoints y reconocimientos (2026-07-19)

- Baseline de esta misión: 13 tests focalizados. Resultado final: 16 tests,
  0 fallos y 83 aserciones con
  `bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts`.
- La inspección local por Chromium/CDP verificó 32 círculos con
  `role="button"`, `tabindex="0"` y etiquetas útiles. El foco de M104 actualizó
  el detalle a `M104 · España vs Argentina`, `Marcador: 0-0`, `Líderes: Q` y
  `Puntos del líder: 47`. La vista móvil emulada en 390x844 mantuvo
  `scrollWidth === innerWidth === 390`; reconocimientos contiene tres piezas de
  escala mayor y tres elementos de banda editorial. La captura visual local se
  ejecutó en desktop 1366x768 y móvil 390x844 para carrera y reconocimientos.
- Checks finales: typecheck web y build web en exit 0; `git diff --check` en
  exit 0. No se usaron Convex, recursos externos, ZIP privado ni generador
  privado; tampoco se modificaron datos de producto ni dependencias.

### Pendientes reales fuera de esta misión

- **Ilustraciones bespoke:** siguen faltando seis assets aprobados con crops
  desktop/móvil; no se inventaron recursos.
- **Lighthouse/CWV:** siguen pendientes Lighthouse y métricas LCP, INP y CLS.
- **Revisión humana:** pendiente revisión independiente de accesibilidad,
  capturas, poster y release.
- **Generador privado:** expresamente prohibido por esta misión; no se leyó el
  ZIP privado ni se simuló un generador reproducible.

## Addendum correctivo 2 (2026-07-19)

- Se añadieron seis piezas de momentos desde `finalDashboard.moments`, los seis
  reconocimientos desde `finalDashboard.awards` y el capítulo de la noche final.
  El panel Total declara: `La suma de grupos y eliminatorias es una lectura
  editorial. No fue una tercera competencia oficial.`
- Los 32 fixtures de la carrera están en español. El SVG mantiene M73, M88, M98,
  M100, M101 y M102 con etiquetas rotadas; la alternativa textual enumera los
  seis hitos. Las series usan Q rojo, Sergio azul, Tesoro verde, Sofi lila y
  Boris/Quique como tonos oscuros secundarios.
- `createPosterModel(finalDashboard)` entrega el 0-0, 1-0 TE, tres momentos y la
  firma editorial. `formatFinalNumber` conserva `2,408` tanto en página como en
  poster, sin duplicar la cifra.
- Chromium local inspeccionó hero en 390x844 y 1366x768, carrera en ambos
  viewports, final móvil y tabla desktop. No hubo overflow de página en las
  comprobaciones CDP (`scrollWidth === clientWidth`). La captura de carrera
  desktop confirmó los seis labels, leyenda y series; la móvil conserva el scroll
  interno del gráfico. El PNG descargado por el botón se verificó visualmente y
  contiene los campeones, 29/104/2,408, 14 cambios, 0-0/1-0 TE, tres momentos y
  la firma. Se eliminan las capturas temporales antes del cierre.
- La validación usa Zod y fail-fast para estructura, fases, tablas, final, ruta
  de Q, premios, checkpoints, secuencias y campos sensibles. Los tests cubren
  fixtures en español, fuente única del poster, `2,408`, los seis hitos y casos
  negativos de secretos, fases, secuencias y tipos.
- **Generador reproducible:** diferido honestamente. La misión prohíbe leer el
  ZIP/Convex y no hay fixture público que permita verificar el parser y la
  sanitización; no se simula esa garantía. Página y poster usan el snapshot
  público validado.

## Addendum correctivo 2 (2026-07-19)

- Se completaron seis piezas de momentos desde `finalDashboard.moments`, los seis reconocimientos desde `finalDashboard.awards` y el capítulo dedicado a la noche final. El total muestra literalmente que es una lectura editorial y no una tercera competencia oficial.
- Los 32 fixtures visibles de la carrera usan nombres de selecciones en español. Las etiquetas de M73, M88, M98, M100, M101 y M102 se rotaron para conservar separación, incluido el desenlace M100/M101/M102. La alternativa textual y la leyenda de seis series siguen presentes.
- `createPosterModel(finalDashboard)` ahora entrega 0-0, 1-0 en tiempo extra, tres momentos verificados y la firma editorial. El poster toma esas props, y conserva `2,408` desde `meta`.
- La validación de importación usa Zod para la estructura y conserva invariantes fail-fast para cantidades, tablas, fases, ranking compartido, final, ruta de Q, premios, checkpoints y campos sensibles. Los tests cubren fixtures en español, fuente única del poster, secretos, secuencias, fase inválida y un tipo inválido.
- **Generador reproducible:** diferido honestamente. No hay fixture público que reproduzca la exportación privada y esta misión prohíbe leer el ZIP/Convex; un generador sin poder verificar su parser/sanitización contra esa forma de fuente afirmaría una garantía que no se puede demostrar. El snapshot público validado sigue siendo el único artefacto usado por página y poster.
- Chromium capturó la ruta local en 390x844 y 1366x768; no se inspeccionó el contenido de esas capturas por la restricción de lectura de artefactos temporales. Poster descargado, consola/red, Lighthouse, JavaScript deshabilitado y revisión humana permanecen pendientes. No se declara PASS integral hasta ejecutar esas comprobaciones.

El build web final reportó `final-dashboard-*.js` de 24.67 kB (7.67 kB gzip) y
dejó `html2canvas` como chunk diferido de 46.78 kB gzip, cargado únicamente al
pedir el poster.

## Smoke y aislamiento de red

Se sirvió el build local con `bun run --filter web serve -- --host 127.0.0.1`
y se consultó con `Bun.fetch` local:

```text
/ 200
/dashboard 200
```

Además, `rg -l "convex|googleapis|flagcdn" apps/web/dist || true` no devolvió
archivos. El árbol final no incluye imports de Convex ni URLs de Google Fonts,
Wikimedia, FlagCDN o APIs de runtime. No hay herramienta de navegador/screenshot
disponible en esta sesión, así que no se pudo capturar 360px/escritorio ni revisar
consola/red del navegador; esa inspección queda pendiente.

## Visual, fuentes e ilustraciones

- Se usa el canvas, rojo, azul, verde y radios de la spec; el tema permanece light.
- No hay fuentes Anybody/Lexend versionadas localmente. Se retiró el stylesheet
  remoto y se declararon fallbacks de sistema; por ello la identidad tipográfica
  exacta queda como gap hasta añadir archivos de fuente con licencia.
- No se usó un generador de imágenes. Las aperturas se resuelven con composición
  HTML/CSS local (símbolos O, Q y ESP, trayectoria, fichas y distribución final).
  Existe OG local, pero no hay seis assets raster/vector separados con crops desktop
  y móvil; ese criterio no está completo.
- Lazyweb: se ejecutó la búsqueda de referencias inicial; no hubo reporte URL ni
  mockups, porque no se contó con captura de la pantalla y no se fabricaron assets.

## Matriz contra ACCEPTANCE_CRITERIA.md

### Cumplido con evidencia automática

- Fuente/arquitectura: snapshot estático, sin Convex en bundle final, sin auth/PIN
  en rutas públicas, mismo dataset para página/poster, invariantes de conteos y
  campeones cubiertos por test.
- Datos, historia, carrera, momentos, final y reconocimientos: las cifras
  requeridas están codificadas desde `DATA_SNAPSHOT.md`; hay 29 filas en cada
  tabla, ranks compartidos y disclaimer del total.
- Tablas/accesibilidad: tabs con `role=tablist/tab/tabpanel`, flechas/Home/End,
  tabla semántica con `caption` y scopes, skip link, un H1, controles de 44px y
  resumen textual de la carrera.
- Contenido: se eliminan CTA de torneo activo, estado live, PIN y autenticación;
  metodología y 90 minutos se explican; no hay emojis.
- Motion: no hay loops, parallax, scroll listeners ni animación de layout.
- Poster: composición 1080x1920, Web Share cuando el navegador admite archivos,
  fallback PNG `quiniela-mundial-2026-resumen-final.png`, y OG local 1200x630.

### No aprobable todavía / evidencia pendiente (criterios fallidos o no verificables)

- **1.7, 1.17:** no hay script reproducible desde el ZIP ni build que pueda validar
  extracción privada, por prohibición explícita de leer el ZIP. Se valida el
  snapshot público embebido, no la extracción.
- **Ilustraciones 140-155:** faltan style frame aprobado, seis piezas separadas,
  crops desktop/móvil, assets lazy y comprobación de peso de hero. La alternativa
  CSS local evita inventar imágenes, pero no sustituye esa entrega de assets.
- **Fuentes/rendimiento 202, 218-229:** no se ejecutó Lighthouse ni se midieron
  LCP, INP o CLS; Anybody/Lexend no están self-hosted; no se verificó JavaScript
  deshabilitado. El build SPA no garantiza contenido esencial sin JavaScript.
- **Responsive 171-184:** no hubo navegador disponible para 360x800, 390x844,
  768x1024, 1024x768, 1366x768, 1440x900, 1920x1080, zoom 200% ni capturas.
- **Accesibilidad 202:** Lighthouse Accessibility >=95 no fue ejecutado. La
  estructura semántica está implementada, pero falta auditoría automatizada.
- **Poster 164-168:** el flujo existe y compila, pero no se accionó en un navegador
  real ni se inspeccionó el PNG resultante.
- **Smoke 230-231:** el build y la exploración estática no contienen endpoints
  externos/Convex; consola, 404s y red del navegador siguen sin observación real.
- **Revisión humana 250-257:** Luis, segunda persona, revisión de poster/crops,
  sesión limpia y release/commit no se pueden completar en esta misión. No se hizo
  commit por restricción.

## Operaciones prohibidas

No hubo commit, push, PR, deploy, acceso a producción, consulta/restauración de
Convex, lectura/copia del ZIP privado, uso de secretos ni modificación del
worktree principal.

## Addendum de cierre: fuente única, hitboxes y disclosure móvil (2026-07-19)

- `createDashboardViewModel(finalDashboard)` concentra las cifras críticas de
  campeones/subcampeones, resumen oficial de Q, cambios de líder, premios, meta
  y final. El JSX consume ese modelo para los valores visibles; el test muta un
  fixture sintético y verifica que cambien grupos, Q, premio, final y meta sin
  editar JSX.
- La carrera conserva 32 checkpoints. Cada uno es un `<g role="button"
  tabIndex="0">` con círculo transparente `r="22"` (área efectiva 44x44),
  círculo visual `r="5"`, `aria-label`, hover, click, foco, Enter/Espacio y
  trazo de foco; los seis labels de hitos tienen `fontSize="12"`.
- En móvil la clasificación muestra 6 filas y el control exacto `Ver los 29
  participantes`; al expandir muestra 29 y cambia a `Mostrar solo los primeros
  6`. Al cambiar de pestaña vuelve predeciblemente a 6. En `md+` se conserva la
  tabla semántica completa con 29 filas.

Resultados reales ejecutados:

```text
bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts
16 pass, 0 fail, 84 expect() calls

bun run --filter web check-types
exit 0

bun run --filter web build
exit 0

git diff --check
exit 0
```

Verificación local Chromium/CDP contra `http://127.0.0.1:4175/`:

```text
390x844: clientWidth=375, scrollWidth=375; filas 6 → 29 → 6;
labels exactos de disclosure; 32 grupos accionables, 32 hitboxes r=22,
6 labels >=12px; foco y Enter en M104 actualizaron el detalle.
1366x768: tabla visible con 29 filas.
```

Se generaron capturas locales en
`/tmp/opencode/final-dashboard-m4-390.png` y
`/tmp/opencode/final-dashboard-m4-1366.png`. No se usaron Convex, recursos
externos, ZIP privado ni dependencias nuevas.

## Addendum correctivo (2026-07-19)

- El snapshot ahora se valida al importar: metadatos, tres tablas, campeones,
  final, 32 checkpoints, finales, M101/M102, cierre M103/M104 y los 14 cambios
  de líder. Un error detiene el módulo con `Snapshot final inválido` y detalla
  los invariantes que fallaron.
- `leader-race-data.ts` contiene los 32 checkpoints públicos tipados. La gráfica,
  sus seis series, leyenda, hitos, controles y alternativa textual se derivan de
  ese dataset. `createPosterModel(finalDashboard)` evita otra fuente para poster.
- `index.html` declara `lang="es"` y añade un `noscript` limitado con los datos
  esenciales. La navegación móvil usa los cuatro anchors requeridos con controles
  de mínimo 44 px y foco visible.
- Anybody y Lexend se empaquetan desde `@fontsource-variable/*` (lockfile
  actualizado): el build produjo seis WOFF2 locales, incluidos latin y vietnamese.
- El poster captura import/canvas/blob/share/descarga; conserva Web Share,
  descarga como fallback y revoca la Blob URL en un tick posterior al click.

Resultados reales de verificación:

```text
bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts
8 pass, 0 fail, 41 expect() calls

bun run --filter web check-types
exit 0

bun run --filter web build
exit 0

bun run build
exit 0 (web y video; clasificatoria-por-dia.mp4 generado)

git diff --check
exit 0
```

## Addendum: snapshot mutable completo (2026-07-19)

- El caso de fixture mutable conserva su aserción de `awards[0]`, muta ahora
  explícitamente los seis reconocimientos (`awards[0]` a `awards[5]`) y compara
  con `toEqual` el arreglo completo devuelto por `createDashboardViewModel`.
- Conteo reproducible tras el cambio: la salida de
  `bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts`
  informa `84 expect() calls` (incluye las expectativas ejecutadas dentro de
  los bucles del caso).

## Publicación estática e ilustraciones finales (2026-07-19)

### Cambios

- `apps/web/src/features/final-dashboard/final-dashboard.tsx` define
  `EditorialIllustration`: un `<picture>` con fuente móvil a `max-width: 767px`,
  `<img>` desktop, dimensiones explícitas, `object-contain` y bordes/radios
  coherentes. La pieza 01 es hero `eager` con prioridad alta; 02–06 son lazy y
  decodifican de forma asíncrona. Se conservaron las cifras HTML, el SVG de
  carrera y todas las cards, reconocimientos, marcador y poster existentes.
- `apps/web/src/features/final-dashboard/final-dashboard.test.ts` cubre las
  doce rutas, los seis textos alternativos literales, el `<picture>`, las
  dimensiones y las políticas de carga.
- `packages/infra/alchemy.run.ts` conserva app, recurso, cwd, assets, adopt y
  dominio; se eliminaron carga de `.env` y bindings Convex. Alchemy `0.91.2`
  implementa el fallback SPA internamente mediante `Vite` (`spa: true`), por lo
  que no se añadió una propiedad no soportada. El log describe el sitio estático.

### Verificación ejecutada

```text
export PATH="$HOME/.bun/bin:$PATH"
bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts
17 pass, 0 fail, 111 expect() calls

bun run --filter web check-types
exit 0

bun run --filter web build
exit 0

git diff --check
exit 0

Escaneo apps/web/dist de .convex.cloud, .convex.site, fonts.googleapis.com,
flagcdn, VITE_CONVEX_URL y VITE_CONVEX_SITE_URL: 0 coincidencias.
Los doce WebP de apps/web/public/illustrations existen bajo
apps/web/dist/illustrations: 12 verificados.
```

No se modificaron los WebP, datos históricos, rutas, Convex ni recursos de
runtime. No se hizo commit, push, PR ni deploy.
