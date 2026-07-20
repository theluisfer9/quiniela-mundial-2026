# Segunda misión correctiva integral

## Meta

Llevar el dashboard final de FAIL a PASS contra **todas** las specs de `docs/final-dashboard/`, no solo contra los siete bloqueadores de la primera corrección.

## Fuentes obligatorias

Leer completas antes de editar:

- `PRODUCT_SPEC.md`
- `STORY_AND_CONTENT.md`
- `UX_UI_SPEC.md`
- `DATA_CONTRACT.md`
- `DATA_SNAPSHOT.md`
- `ACCEPTANCE_CRITERIA.md`
- `LEADER_RACE_DATA.md`
- `MISSION_REPORT.md`

## Evidencia ya aprobada

No degradar:

- tests 8/8;
- typecheck/build web y build monorepo;
- fuentes Anybody/Lexend locales;
- cero recursos externos/Convex;
- `lang=es`, noscript, navegación móvil;
- 32 checkpoints reales y 14 cambios de líder;
- poster descargable 1080x1920;
- desktop y 390x844 sin overflow.

## Seis bloqueadores obligatorios

### 1. Implementar los módulos narrativos ausentes

La página debe incluir, con estructura editorial real y datos derivados del snapshot:

1. **Seis momentos** como seis piezas/cards diferenciadas, no un párrafo único. Usar únicamente hechos/copy verificados en `STORY_AND_CONTENT.md` y `DATA_SNAPSHOT.md`.
2. **Reconocimientos** usando `finalDashboard.awards`: Boris 141, Sergio 15 exactos, Q 64.7%, Marianne racha 11, Sofi contra consenso 13 y Sofi 29 empates. Mostrar que son lecturas editoriales, no competencias oficiales.
3. **La noche final** como capítulo dedicado:
   - 90 minutos: España 0-0 Argentina;
   - tiempo extra: España 1-0 Argentina;
   - campeón: España;
   - scoring usa solo 0-0;
   - 21 pronósticos;
   - distribución 8 España / 5 empate / 8 Argentina;
   - 0 exactos;
   - 5 aciertos de empate.
4. Mantener el total acumulado como lectura editorial, nunca tercera competencia.

Usar IDs/anchors coherentes y navegación si corresponde.

### 2. Todo el copy visible en español

- Los 32 fixtures de `leader-race-data.ts` deben mostrarse en español.
- Puede transcribirse el dataset con nombres traducidos o usar un mapper tipado y exhaustivo.
- Ningún hito visible puede mostrar `South Africa`, `France`, `England`, etc.
- Añadir test que compruebe que no quedan nombres ingleses conocidos en los checkpoints visibles.

### 3. Corregir solapamiento M100/M101/M102

- Mantener visibles M73, M88, M98, M100, M101 y M102.
- Usar labels rotados, escalonados, callouts o layout equivalente.
- Deben ser legibles en desktop y móvil sin superposición.
- Mantener seis series y leyenda accesible.

### 4. Completar el poster

El poster 1080x1920 debe derivarse de `createPosterModel(finalDashboard)` e incluir:

- Q 47, Otto 98, España campeona;
- 29 participantes, 104 partidos, 2,408 predicciones;
- final 0-0 y 1-0 TE;
- tres momentos destacados verificados;
- firma editorial, por ejemplo `Quiniela Mundial 2026 · Archivo familiar · 19 de julio de 2026` (no usar dominio retirado como URL activa);
- datos desde la misma fuente, sin duplicación numérica independiente.

Actualizar modelo y tests de fuente única.

### 5. Validación exhaustiva con Zod

- Usar Zod para el schema del snapshot estático.
- Mantener validación fail-fast al importar.
- Validar tipos, cantidades e invariantes críticos:
  - meta 29/104/2408/79.8;
  - tres tablas de 29;
  - grupos 72/1553, eliminatorias 32/855, total 104/2408;
  - campeones/márgenes;
  - empates deportivos/competition ranking;
  - final y distribución;
  - Q path 7 exactos;
  - awards esperados;
  - 32 checkpoints, secuencia única/continua, valores finales, M101/M102/M103/M104, 14 cambios;
  - no campos o strings prohibidos: `_id`, `pinHash`, hashes, token, session, auth, `convex`.
- El schema/validator debe rechazar snapshots inválidos con mensajes claros.
- Añadir tests negativos representativos.

### 6. Disclaimer editorial inequívoco

En la pestaña y contenido de total, mostrar literalmente una explicación equivalente a:

> La suma de grupos y eliminatorias es una lectura editorial. No fue una tercera competencia oficial.

No basta con `total editorial`.

## Hallazgos menores obligatorios

Resolver también:

- agregar anchor/entrada clara para descargar/compartir si la navegación spec lo pide;
- fecha de cierre visible en hero: 19 de julio de 2026;
- explicar que Q no sumó en M103 ni M104 y aun así mantuvo el liderato;
- aplicar el mapeo de color de participantes definido en `UX_UI_SPEC.md` para las seis series;
- alternativa textual del chart debe describir los seis hitos requeridos;
- mostrar `2,408` exactamente con separador en página y poster;
- cualquier contenido visible debe estar en español.

## Reproducibilidad

Sin leer el ZIP privado:

- si es viable, crear un generador documentado que acepte una exportación Convex por path, emita solo datos públicos y tenga guardas de privacidad;
- probarlo solo con fixture público/sintético, nunca con el ZIP privado;
- si no puede implementarse de forma honesta y verificable dentro de esta misión, documentarlo como diferido, no simular éxito.

## Restricciones

- No leer/copy el ZIP privado.
- No consultar/restaurar Convex.
- No usar recursos externos runtime.
- No inventar estadísticas.
- No `as any` nuevo.
- No degradar responsive/accesibilidad.
- No commit, push, PR ni deploy.
- No modificar el worktree principal.

## Checks obligatorios

- focused tests;
- typecheck web;
- build web;
- build monorepo;
- `git diff --check`;
- búsqueda de contenido inglés visible y recursos prohibidos;
- actualización del addendum en `MISSION_REPORT.md`.

## Cierre

No declarar PASS si falta uno de los seis bloqueadores. Dejar cambios sin commit para revisión independiente.
