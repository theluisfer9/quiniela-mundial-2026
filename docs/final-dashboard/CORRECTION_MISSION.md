# Misión correctiva: dashboard final

## Meta

Corregir todos los bloqueadores de la revisión independiente del dashboard final, sin ampliar el producto ni degradar el diseño ya validado visualmente.

## Worktree autorizado

`/home/lralda/projects/quiniela-mundial-2026/.worktrees/final-dashboard-story`

Branch: `feat/final-dashboard-story`.

## Fuente de verdad

- Specs en `docs/final-dashboard/`.
- Implementación actual sin commit.
- Dataset real nuevo: `docs/final-dashboard/LEADER_RACE_DATA.md`.
- Reporte anterior: `docs/final-dashboard/MISSION_REPORT.md`.

## Evidencia ya verificada por Hermes

- Tests enfocados: 4 pass.
- Typecheck, build y `git diff --check`: pass.
- `/` y `/dashboard`: HTTP 200.
- Escritorio 1280 y móvil 390 sin overflow ni solapamientos.
- Consola: 0 errores.
- Requests Convex/externos: 0.
- Tab de eliminatorias: primera fila Q, 47/31/7/20/64.5%.
- Poster: 1080x1920, descarga PNG con nombre correcto.

## Bloqueadores obligatorios

### 1. Validación del snapshot en build/runtime

`validateFinalDashboard` no puede vivir solo en tests.

- Ejecutar una aserción fail-fast al importar o construir el snapshot.
- Validar todos los invariantes críticos, no solo cuatro cifras.
- Si un valor o cantidad no coincide, el build o módulo debe fallar con error claro.
- Añadir tests de fallo para snapshot inválido.

### 2. Fuente única para página y poster

Eliminar duplicación de cifras críticas en `final-dashboard.tsx`.

- Hero, banda numérica, campeones, ruta de Q, premios, final, tablas y poster deben derivar sus números de `finalDashboard` o de modelos derivados tipados.
- Copy editorial puede permanecer como contenido, pero no duplicar valores que puedan divergir.
- Añadir test que compruebe que el modelo del poster usa el mismo snapshot.

### 3. Contenido esencial sin JavaScript

- Cambiar `apps/web/index.html` para incluir un `<noscript>` útil en español.
- Debe mostrar al menos título, Q 47, Otto 98, España campeona, 29 participantes, 104 partidos, 2,408 predicciones, final 0-0 y metodología 3/2/1/0.
- No intentar reconstruir toda la SPA en HTML duplicado.
- Mantener diseño legible básico dentro del fallback.

### 4. Idioma del documento

- Cambiar `lang="en"` a `lang="es"` en `apps/web/index.html`.
- Añadir test o check verificable.

### 5. Carrera real respaldada por datos

Reemplazar las curvas decorativas actuales.

- Transcribir de forma exacta y tipada los 32 checkpoints de `LEADER_RACE_DATA.md` al snapshot estático.
- Incluir Q, Sergio, Tesoro, Sofi, Boris y Quique Menjívar.
- Generar el gráfico desde esos valores reales.
- Mostrar seis series distinguibles con labels o leyenda accesible.
- Marcar M73, M88, M98, M100, M101 y M102.
- M103/M104 deben quedar planos para el líder.
- Los controles de hitos deben leer del mismo dataset.
- La alternativa textual debe conservarse.
- Añadir tests: 32 filas, valores finales, M101, M102, M103/M104 y 14 cambios del conjunto de líderes.

### 6. Navegación móvil

- Agregar una navegación compacta usable bajo 1024 px.
- Puede ser un rail horizontal de anchors o un menú accesible.
- Debe incluir Historia, Campeones, Momentos y Tabla final.
- No romper el header 390 px ya validado.
- Touch targets >=44 px y foco visible.

### 7. Fuentes self-hosted

- Empaquetar `Anybody` y `Lexend` localmente.
- Preferencia: paquetes Fontsource versionados con lockfile, o WOFF2 locales con licencias claras.
- No usar Google Fonts ni otro recurso externo en runtime.
- Configurar `@font-face`/imports correctamente y conservar fallbacks.
- Verificar que el build contiene las fuentes y el browser no solicita hosts externos.

## P2 obligatorios

### Poster robusto

- Manejar errores de import/canvas/blob/share/download sin dejar promesas rechazadas.
- Revocar Blob URL después de que el navegador procese el click, no inmediatamente.
- Mantener Web Share con fallback de descarga.

### Cobertura

Agregar tests para:

- invariantes completos;
- snapshot inválido;
- datos prohibidos ausentes;
- carrera real;
- fuente única del poster;
- navegación de tabs;
- `lang=es` y contenido noscript, si es viable sin introducir infraestructura pesada.

## Restricciones

- No leer ni copiar el ZIP privado.
- No consultar Convex.
- No usar `as any`.
- No inventar puntos ni checkpoints.
- No modificar el worktree principal.
- No commit.
- No push.
- No PR.
- No deploy.
- No borrar las specs.
- No ocultar fallos alterando tsconfig o excluyendo archivos nuevos.

## Checks obligatorios

- `bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts`
- `bun run --filter web check-types`
- `bun run --filter web build`
- `bun run build`
- `git diff --check`
- confirmar fuentes locales en `dist`;
- confirmar ausencia de `convex`, Google Fonts, FlagCDN o APIs externas en `dist`;
- actualizar `docs/final-dashboard/MISSION_REPORT.md` con un addendum correctivo y resultados concretos.

## Cierre

Deja los cambios sin commit. No declares PASS si uno de los siete bloqueadores permanece.
