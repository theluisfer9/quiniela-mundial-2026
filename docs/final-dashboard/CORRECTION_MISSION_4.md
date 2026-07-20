# Corrección de cierre: fuente única, hitboxes y tabla móvil

## Meta

Resolver exclusivamente los tres últimos bloqueadores confirmados por revisión fail-closed.

## 1. Fuente única de cifras críticas

Eliminar literales numéricos visibles duplicados de `final-dashboard.tsx` cuando ya existen en `finalDashboard`.

Crear helpers/view-models tipados derivados del snapshot, por ejemplo `createDashboardViewModel(data)`, y usarlos para:

- subcampeones y puntos de grupos/eliminatorias;
- resumen de Q: puntos, exactos, aciertos, predicciones y precisión desde su fila oficial y `qPath`;
- cambios de líder y cantidad de partidos de eliminatorias;
- reconocimientos, incluyendo Boris/141, desde `awards`;
- final: 0-0, 1-0, 21, 0, 5 y distribución 8/5/8 desde `worldCup.final`;
- meta 104/2408 desde snapshot;
- cualquier otra cifra crítica visible que pueda divergir de la fuente.

El copy sin cifras puede permanecer literal. Añadir tests del view-model y demostrar que mutar un fixture sintético cambia la salida derivada sin editar JSX.

## 2. Chart: 44x44 y texto mínimo

- Los 32 checkpoints deben tener un área interactiva real mínima de 44x44px.
- Mantener punto visual pequeño mediante `<g>` con círculo transparente `r=22` y círculo visible, o solución SVG equivalente.
- El elemento focalizable/accionable debe ser el grupo/hitbox, con `role=button`, `tabIndex=0`, aria-label, hover, focus y click.
- Mantener foco visible.
- Labels de hitos mínimo 12px y legibles.
- No crear solapamientos ni volver visualmente gigantes los puntos.

## 3. Tabla móvil con disclosure

Implementar patrón responsive requerido:

- En móvil, mostrar inicialmente solo seis participantes de la pestaña activa.
- Botón accesible `Ver los 29 participantes` expande a los 29.
- Botón `Mostrar solo los primeros 6` vuelve a colapsar.
- Al cambiar de pestaña, puede resetear a seis o mantener estado de forma predecible.
- Las filas móviles deben priorizar posición, participante, puntos y métricas esenciales sin scroll horizontal obligatorio.
- En `md`/desktop conservar la tabla semántica completa de 29 filas.
- El contenido completo debe seguir disponible y los empates deportivos preservarse.
- Añadir tests de helper puro para selección inicial/expandida y, si es viable, labels del control.

## Reporte

Agregar addendum de cierre a `MISSION_REPORT.md` con resultados reales y estas tres correcciones.

## Checks

- focused tests;
- web typecheck;
- web build;
- `git diff --check`;
- visual desktop y 390x844;
- interacción teclado/chart;
- disclosure móvil 6→29→6.

## Restricciones

- No cambiar datos deportivos.
- No leer ZIP privado.
- No agregar recursos externos.
- No `as any` nuevo.
- No commit, push, PR ni deploy.
- No ampliar alcance.
