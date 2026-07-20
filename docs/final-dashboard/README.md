# Dashboard final de la Quiniela Mundial 2026

## Propósito

Este paquete define el dashboard informativo que contará cómo se vivió la quiniela después de terminado el Mundial 2026.

No es una continuación del producto transaccional. Es un archivo digital: una pieza editorial, pública, estática y visual que conserva los resultados, las carreras por el liderato y los momentos que la familia compartió.

## Design read

Dashboard editorial de cierre para una familia, con lenguaje de anuario deportivo interactivo. Debe conservar la energía de `Torneo Vivo`, pero cambiar la urgencia de pronosticar por el placer de recordar.

## Decisiones cerradas

- La experiencia será pública y de solo lectura.
- No requerirá PIN, cuenta ni sesión.
- No dependerá de Convex ni de otro backend en ejecución.
- Los datos se generarán desde un snapshot estático y sanitizado.
- Se mantendrán separadas las tablas oficiales de grupos y eliminatorias.
- La suma de 104 partidos se presentará solo como lectura editorial.
- La identidad visual conservará `Anybody`, `Lexend` y la paleta real del producto.
- El dashboard incluirá ilustraciones originales como aperturas de capítulo y piezas de resumen.
- La experiencia será mobile first y tendrá una composición más editorial en escritorio.
- El contenido principal estará en español.

## Documentos

| Archivo | Contenido |
|---|---|
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | Alcance, objetivos, usuarios, narrativa, módulos y requisitos funcionales. |
| [STORY_AND_CONTENT.md](./STORY_AND_CONTENT.md) | Tesis editorial, guion, copy propuesto y jerarquía de mensajes. |
| [UX_UI_SPEC.md](./UX_UI_SPEC.md) | Dirección visual, tokens, layouts, componentes, charts, responsive, motion y accesibilidad. |
| [ILLUSTRATION_BRIEFS.md](./ILLUSTRATION_BRIEFS.md) | Sistema de ilustración y briefs listos para producir los complementos visuales. |
| [DATA_CONTRACT.md](./DATA_CONTRACT.md) | Arquitectura estática, contrato de datos, fórmulas, privacidad y reglas de generación. |
| [DATA_SNAPSHOT.md](./DATA_SNAPSHOT.md) | Fuente de verdad numérica derivada del respaldo final. |
| [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) | Checklist verificable para aprobar contenido, diseño e implementación. |

## La historia en una frase

Otto ganó la fase de grupos. Q ganó las eliminatorias después de una carrera con 14 cambios de líder, y España cerró el Mundial con un 0-0 que casi nadie vio venir.

## Orden recomendado de lectura

1. `PRODUCT_SPEC.md`
2. `STORY_AND_CONTENT.md`
3. `UX_UI_SPEC.md`
4. `ILLUSTRATION_BRIEFS.md`
5. `DATA_CONTRACT.md`
6. `DATA_SNAPSHOT.md`
7. `ACCEPTANCE_CRITERIA.md`

## Fuente y trazabilidad

Los números provienen de la exportación final de producción del 19 de julio de 2026. El snapshot documentado incluye 29 participantes activos, 104 partidos terminados y 2,408 predicciones públicas válidas.

El respaldo original no forma parte de esta carpeta porque contiene información sensible. Los documentos de esta spec no incluyen hashes, PIN, IDs internos, tokens ni sesiones.

## Fuera de alcance de esta spec

- Reabrir la quiniela para editar pronósticos.
- Restaurar autenticación o perfiles.
- Volver a desplegar Convex.
- Mostrar datos privados o credenciales.
- Crear un nuevo sistema de competencia.
- Cambiar los campeones oficiales.
- Generar las ilustraciones finales. Este paquete contiene los briefs para producirlas.
