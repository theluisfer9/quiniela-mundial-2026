# Misión: implementar el dashboard final informativo de la Quiniela Mundial 2026

## Meta

Implementar una experiencia pública, estática y de alta calidad que cuente la historia final de la quiniela según la spec completa en `docs/final-dashboard/`.

## Repositorio autorizado

- Worktree: `/home/lralda/projects/quiniela-mundial-2026/.worktrees/final-dashboard-story`
- Branch: `feat/final-dashboard-story`
- Base exacta: `3e6cd19aed6c24712f6f52dd2eff1f2c8851745f`

Trabaja exclusivamente dentro de ese worktree.

## Fuente de verdad

Lee en este orden:

1. `docs/final-dashboard/README.md`
2. `docs/final-dashboard/PRODUCT_SPEC.md`
3. `docs/final-dashboard/STORY_AND_CONTENT.md`
4. `docs/final-dashboard/UX_UI_SPEC.md`
5. `docs/final-dashboard/ILLUSTRATION_BRIEFS.md`
6. `docs/final-dashboard/DATA_CONTRACT.md`
7. `docs/final-dashboard/DATA_SNAPSHOT.md`
8. `docs/final-dashboard/ACCEPTANCE_CRITERIA.md`

También respeta `AGENTS.md`, `CLAUDE.md` y las instrucciones globales de OpenCode. Para UI, sigue el flujo Lazyweb configurado si sus herramientas están disponibles.

## Alcance confirmado

- Convertir `/` en la experiencia final canónica.
- Hacer que `/dashboard` redirija o renderice la misma experiencia sin divergencia.
- Retirar de la experiencia final autenticación, PIN, próximas fechas, pronósticos, estados live y CTA del torneo activo.
- Construir un snapshot estático tipado y sanitizado desde `DATA_SNAPSHOT.md`; no leer el ZIP privado.
- Implementar hero, cifras, dos campeones, carrera por el liderato, ruta de Q, momentos colectivos, reconocimientos, final, tablas completas, metodología, navegación y poster compartible.
- Preservar identidad real: Anybody, Lexend, canvas `#FFF8F7`, rojo `#BD0015`, azul `#2A398D`, verde `#3CAC3B`.
- Implementar responsive mobile first, accesibilidad y reduced motion.
- Añadir tests relevantes para datos, invariantes, tabs, scoring y narrativa crítica.
- Validar build y checks del repositorio.
- Hacer inspección visual real en navegador si el entorno lo permite, incluyendo viewport móvil y escritorio.
- Producir o integrar las ilustraciones según los briefs si existe una herramienta de generación de imágenes disponible. Si no existe, no finjas haberlas generado: implementa composiciones visuales locales de alta calidad que mantengan la narrativa y documenta con precisión el gap de assets en el reporte.

## Decisiones de producto obligatorias

- Grupos y eliminatorias son competencias oficiales separadas.
- Otto ganó grupos con 98.
- Q ganó eliminatorias con 47.
- El total de 104 partidos es solo lectura editorial.
- La final puntuable fue España 0-0 Argentina a 90 minutos.
- España ganó 1-0 en tiempo extra.
- No sumar tiempo extra al marcador de puntuación.
- La definición histórica de acierto contra el consenso debe reproducir `DATA_CONTRACT.md`.
- No inventar cifras, anécdotas, rostros o marcas oficiales.

## Restricciones

- No accedas ni copies el ZIP privado del respaldo.
- No restaures ni consultes Convex.
- No agregues requests a Convex, Better Auth o APIs externas en runtime.
- No expongas IDs, hashes, PIN, tokens o sesiones.
- No uses `as any`.
- No hagas commit.
- No hagas push.
- No abras PR.
- No despliegues.
- No borres historial del repositorio.
- No edites el worktree principal.
- No amplíes alcance a funcionalidades de torneo activo.

## Criterios de aceptación mínimos

- Los 8 documentos de spec se conservan.
- Todas las cifras visibles coinciden con `DATA_SNAPSHOT.md`.
- Las tres tablas tienen 29 filas y ranks compartidos correctos.
- La ruta final no depende de backend.
- La experiencia funciona en 360 px y escritorio.
- Navegación por teclado y alternativa textual para charts.
- `prefers-reduced-motion` funciona.
- Poster descargable usa la misma fuente de datos.
- Build de producción pasa.
- Tests enfocados pasan.
- `git diff --check` pasa.
- No hay errores de consola ni requests a Convex durante el smoke test final.

## Evidencia requerida

Deja cambios sin commit para revisión de Hermes y crea:

`docs/final-dashboard/MISSION_REPORT.md`

El reporte debe incluir:

- resumen de implementación;
- archivos agregados/modificados;
- decisiones visuales;
- resultado de Lazyweb si se usó, con URL;
- ilustraciones generadas o gap explícito;
- comandos de tests y outputs concretos;
- resultado de build;
- evidencia de inspección visual y screenshots si existen;
- limitaciones reales;
- confirmación de no commit/push/PR/deploy.

## Cierre

No declares la misión completa solo por haber escrito código. Ejecuta los checks, inspecciona el resultado y compáralo contra `ACCEPTANCE_CRITERIA.md`. Si algo bloquea una implementación segura, documenta el bloqueo con evidencia en lugar de inventar éxito.
