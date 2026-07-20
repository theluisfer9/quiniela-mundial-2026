# Misión de publicación estática e integración de ilustraciones

## Objetivo

Integrar las doce ilustraciones WebP finales ya presentes en `apps/web/public/illustrations/` y dejar `packages/infra/alchemy.run.ts` listo para publicar el dashboard histórico como frontend estático en Cloudflare, sin Convex ni backend en runtime.

## Restricciones absolutas

- No cambiar cifras, narrativa, snapshot deportivo, scoring, carrera o standings.
- No recrear Convex, auth, sesiones, admin, crons ni endpoints.
- No introducir recursos externos, CDN de imágenes, Google Fonts ni runtime APIs.
- No modificar ni regenerar los WebP.
- No commit, push, PR ni deploy.
- Mantener `/` y `/dashboard` en la misma experiencia histórica.

## Assets y ubicación

Cada capítulo tiene variante desktop y mobile:

1. `/illustrations/01-tres-coronas-{desktop,mobile}.webp`
2. `/illustrations/02-carrera-catorce-cambios-{desktop,mobile}.webp`
3. `/illustrations/03-siete-exactos-{desktop,mobile}.webp`
4. `/illustrations/04-alegria-y-golpe-{desktop,mobile}.webp`
5. `/illustrations/05-salon-de-estilos-{desktop,mobile}.webp`
6. `/illustrations/06-final-nadie-clavo-{desktop,mobile}.webp`

## Integración requerida

En `apps/web/src/features/final-dashboard/final-dashboard.tsx`:

- Crear un componente pequeño y reutilizable para una ilustración editorial responsive usando `<picture>`.
- El `<source media="(max-width: 767px)">` debe servir la variante mobile y `<img>` la desktop.
- Declarar `width` y `height` para evitar layout shift.
- Hero: `fetchPriority="high"`, `loading="eager"`; todas las demás: `loading="lazy"`, `decoding="async"`.
- Usar `object-cover`/`object-contain` según preserve mejor el contenido, con border/radius coherentes y sin recortes destructivos.
- Reemplazar la ilustración CSS del hero por la pieza 01; no eliminar las cifras HTML accesibles existentes.
- Insertar pieza 02 en la sección `#carrera` acompañando la introducción/chart sin ocultar ni sustituir el SVG interactivo.
- Insertar pieza 03 en la sección de siete exactos, antes o junto al listado; mantener los siete resultados en HTML.
- Insertar pieza 04 en `#momentos`; mantener las cards completas.
- Insertar pieza 05 en `#reconocimientos`; mantener la jerarquía y cifras HTML.
- Insertar pieza 06 en `#noche-final`; mantener marcador, explicación y poster.
- Alt texts exactos:
  1. `Ilustración con una copa azul para Otto, una copa roja para Q con siete marcadores y una copa mundial abstracta junto a la bandera de España.`
  2. `Pistas de colores se cruzan catorce veces hasta que la línea roja de Q termina al frente.`
  3. `Siete boletos de marcador forman un camino ascendente y el último se convierte en la copa roja de Q.`
  4. `A un lado, dieciocho fichas celebran un acierto colectivo; al otro, veinte flechas fallan y una ficha acierta.`
  5. `Seis objetos deportivos representan el puntaje, los exactos, la precisión, la racha, los aciertos contra el consenso y los empates.`
  6. `Un tablero marca una final sin goles, veintiuna fichas se dividen en grupos de ocho, cinco y ocho, y España aparece campeona.`
- Las imágenes son resumen visual; ninguna cifra crítica debe depender de leer píxeles.
- Actualizar o añadir tests específicos que verifiquen las rutas y alt texts, el `<picture>` responsive, hero eager/high priority y demás lazy.

## Cloudflare estático

En `packages/infra/alchemy.run.ts`:

- Mantener la app `quiniela-mundial-2026`, recurso `web`, `cwd: "../../apps/web"`, assets `dist`, adopt y dominio `quiniela.luisralda.com`.
- Eliminar completamente `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` y cualquier `bindings`/`alchemy.env` asociado.
- No agregar backend, Worker API ni binding sustituto.
- Mantener una configuración Vite/Cloudflare compatible con SPA fallback. Usa solo opciones válidas para la versión instalada de Alchemy; si el recurso Vite ya provee fallback, no inventes una propiedad.
- El log final debe describir explícitamente que es un archivo estático.

## Verificación obligatoria

Ejecutar:

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun test apps/web/src/features/final-dashboard/final-dashboard.test.ts
bun run --filter web check-types
bun run --filter web build
git diff --check
```

Además:

- inspeccionar `apps/web/dist` y fallar si contiene `.convex.cloud`, `.convex.site`, `fonts.googleapis.com`, `flagcdn`, `VITE_CONVEX_URL` o `VITE_CONVEX_SITE_URL`;
- comprobar que los doce WebP aparezcan en el build;
- actualizar `docs/final-dashboard/MISSION_REPORT.md` con integración y resultados reales.
