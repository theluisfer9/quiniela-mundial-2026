# Corrección final de revisión

## Meta

Resolver los dos últimos bloqueadores de UI del re-review final. La contradicción documental España/Suiza ya fue corregida en `PRODUCT_SPEC.md`; no revertirla.

## Bloqueador 1: hover/focus en la carrera

`UX_UI_SPEC.md:221-227` exige que hover/focus muestre partido, líder y puntos.

Implementar en `RaceChart` una interacción accesible y derivada del dataset real:

- Cada uno de los 32 checkpoints debe tener un target visible o claramente interactivo sobre la gráfica.
- Mouse hover y keyboard focus actualizan un detalle que muestra:
  - número de partido;
  - fixture en español;
  - marcador;
  - líder(es);
  - puntos del líder.
- Cada target debe tener `tabIndex=0` y `aria-label` útil, o una solución semántica equivalente.
- El detalle activo debe ser visible y accesible; no depender solo de color.
- Mantener los botones de seis hitos y la alternativa textual.
- Mantener legibles M73, M88, M98, M100, M101 y M102.
- No introducir 32 tooltips flotantes simultáneos ni solapamientos.
- Añadir tests para un helper puro de selección/formato del checkpoint si evita infraestructura DOM pesada.

## Bloqueador 2: reconocimientos no homogéneos

`UX_UI_SPEC.md:263-265` y `ACCEPTANCE_CRITERIA.md:131` prohíben seis cards iguales.

Rediseñar la composición sin cambiar los datos:

- Boris como reconocimiento principal de mayor escala.
- Sergio y Q como piezas secundarias destacadas.
- Marianne y los dos reconocimientos de Sofi como banda/chips/lista editorial de menor escala, no cards clonadas.
- Variar jerarquía, proporción y layout; conservar lectura clara en 390 px.
- Mantener explícito que son lecturas editoriales, no competencia oficial.
- No usar un carrusel obligatorio ni animaciones en loop.

## Cierre documental

Actualizar `docs/final-dashboard/MISSION_REPORT.md` con:

- addendum de la segunda corrección integral;
- addendum final de estos dos fixes;
- resultados reales actuales: 13 tests antes de esta misión, y el nuevo total después;
- distinguir pendientes reales: ilustraciones bespoke, Lighthouse/CWV, revisión humana y generador privado prohibido.

## Checks

- focused tests;
- web typecheck;
- web build;
- `git diff --check`;
- revisión visual desktop y 390x844 enfocada en chart/reconocimientos;
- no recursos externos ni Convex.

## Restricciones

- No leer ZIP privado.
- No inventar datos.
- No `as any` nuevo.
- No commit, push, PR ni deploy.
- No tocar infraestructura.
- No ampliar alcance fuera de estos dos bloqueadores y reporte.
