# Criterios de aceptación

## Uso

Este checklist define cuándo el dashboard final puede considerarse completo. Una implementación no se aprueba solo porque renderiza. Debe pasar contenido, datos, narrativa, privacidad, accesibilidad, rendimiento y revisión visual.

## Fuente y arquitectura

- [ ] El dashboard consume un snapshot estático sanitizado.
- [ ] No importa `convex/react` ni la API generada de Convex.
- [ ] No realiza solicitudes a dominios Convex.
- [ ] No requiere autenticación, PIN ni sesión.
- [ ] El bundle público no contiene IDs internos, hashes, tokens o sesiones.
- [ ] El export privado no está dentro del repositorio.
- [ ] El script de generación es reproducible y no modifica la fuente.
- [ ] La página y el poster consumen la misma fuente tipada.
- [ ] El build falla si un invariante del snapshot no se cumple.

## Datos principales

- [ ] Se muestran 29 participantes activos.
- [ ] Se muestran 104 partidos.
- [ ] Se muestran 2,408 predicciones públicas válidas.
- [ ] Se muestra 79.8% de participación total.
- [ ] Grupos contiene 72 partidos y 1,553 predicciones.
- [ ] Eliminatorias contiene 32 partidos y 855 predicciones.
- [ ] Otto aparece campeón de grupos con 98 puntos.
- [ ] Boris aparece segundo de grupos con 96.
- [ ] Q aparece campeona de eliminatorias con 47 puntos.
- [ ] Boris y Quique Menjívar comparten segundo con 45.
- [ ] Se conserva un margen final de 2 puntos en ambas fases.
- [ ] La suma acumulada se etiqueta como lectura editorial.
- [ ] Boris aparece como mayor acumulado con 141, sin llamarlo campeón total.

## Historia de Q

- [ ] La interfaz muestra siete exactos de Q.
- [ ] Los siete marcadores coinciden con `DATA_SNAPSHOT.md`.
- [ ] El partido 102 aparece como Inglaterra 1-2 Argentina.
- [ ] El partido 102 se identifica como el liderato definitivo.
- [ ] Se muestran 20 resultados acertados en 31 predicciones.
- [ ] Se muestra 64.5% de precisión para eliminatorias.
- [ ] Se explica que Q no sumó en el tercer lugar ni la final.
- [ ] No se afirma que Q ganó gracias a la final.

## Carrera por el liderato

- [ ] Se indica que hubo 14 cambios de líder en eliminatorias.
- [ ] El chart no intenta destacar 29 líneas simultáneas.
- [ ] Q y Sergio son legibles en todo momento.
- [ ] Tesoro, Sofi, Boris y Quique se incluyen como series o hitos secundarios.
- [ ] M100 muestra a Sergio en la punta con 44.
- [ ] M101 muestra empate entre Q y Sergio.
- [ ] M102 muestra a Q con 47 y liderato definitivo.
- [ ] M103 y M104 no alteran el podio.
- [ ] Existe un resumen textual equivalente al chart.
- [ ] El chart puede recorrerse con teclado.
- [ ] La información no depende exclusivamente de hover o color.

## Momentos colectivos

- [ ] Portugal 2-1 Croacia muestra 18 exactos y 67 puntos.
- [ ] Costa de Marfil 1-2 Noruega muestra 14 exactos y 60 puntos.
- [ ] Francia 3-1 Senegal muestra 10 exactos.
- [ ] Ecuador 2-1 Alemania muestra 20 de 21 con Alemania y un acierto de resultado.
- [ ] Francia 4-6 Inglaterra muestra 0 exactos y 4 aciertos de resultado.
- [ ] Suiza 0-0 Colombia se presenta como fallo del consenso.
- [ ] El tono no ridiculiza a una persona por un fallo.

## Final del Mundial

- [ ] El marcador reglamentario visible es España 0-0 Argentina.
- [ ] España aparece campeona.
- [ ] El tiempo extra aparece separado: España 1-0 Argentina.
- [ ] Se muestran 21 predicciones.
- [ ] La distribución aparece como 8 España, 5 empate, 8 Argentina.
- [ ] Se indica que hubo 0 exactos.
- [ ] Se indica que 5 personas acertaron el empate.
- [ ] Se indica que la final no cambió el podio de la quiniela.
- [ ] La UI no suma el gol de tiempo extra al marcador puntuable.

## Reconocimientos

- [ ] Boris: 141 puntos acumulados.
- [ ] Sergio: 15 exactos.
- [ ] Q: 64.7% de precisión acumulada.
- [ ] Marianne: racha de 11.
- [ ] Sofi: 13 aciertos contra el consenso según la lógica histórica del producto.
- [ ] Sofi: 29 empates pronosticados.
- [ ] Los reconocimientos están etiquetados como editoriales.
- [ ] Los empates estadísticos muestran todos los nombres cuando corresponde.
- [ ] Ningún desempate alfabético se presenta como mérito deportivo.

## Tablas

- [ ] Hay tabs para `Grupos`, `Eliminatorias` y `Total informativo`.
- [ ] Grupos y eliminatorias se marcan como oficiales.
- [ ] Total mantiene un disclaimer visible.
- [ ] Cada tabla incluye los 29 participantes.
- [ ] Se preservan ranks compartidos `1, 2, 2, 4`.
- [ ] Las columnas incluyen posición, nombre, puntos, predicciones, exactos, aciertos y precisión.
- [ ] Los números usan tabular nums.
- [ ] La tabla de escritorio usa markup semántico.
- [ ] La versión móvil conserva labels comprensibles.
- [ ] La paginación móvil puede usarse con teclado y lector de pantalla.
- [ ] El campeón sigue siendo fácil de identificar sin duplicar filas.

## Contenido

- [ ] El H1 es `La quiniela terminó. La historia quedó.` o una variante aprobada.
- [ ] El hero identifica a Q, Otto y España sin confundir logros.
- [ ] No aparece lenguaje de torneo en curso.
- [ ] No hay CTA para pronosticar o iniciar sesión.
- [ ] No se inventan emociones, conversaciones o anécdotas.
- [ ] Cada cifra visible aparece en `DATA_SNAPSHOT.md`.
- [ ] La metodología 3/2/1/0 está explicada.
- [ ] La regla de 90 minutos en eliminatorias está explicada.
- [ ] El texto distingue campeón mundial y campeones de la quiniela.
- [ ] El copy se revisó en voz alta.
- [ ] No hay frases promocionales genéricas ni tono corporativo.
- [ ] No se usan emojis decorativos.

## Sistema visual

- [ ] Se conserva la paleta documentada en `UX_UI_SPEC.md`.
- [ ] `Anybody` se usa para display y cifras.
- [ ] `Lexend` se usa para body y controles.
- [ ] El tema es light only y consistente.
- [ ] No hay secciones que cambien a un tema desconectado.
- [ ] La forma de cards y controles sigue la regla de radios.
- [ ] No hay tres cards idénticas como patrón repetido.
- [ ] No hay eyebrow sobre cada sección.
- [ ] No hay gradientes AI purple.
- [ ] No se usan glows neon.
- [ ] El hero cabe en el viewport inicial.
- [ ] La navegación ocupa una línea en escritorio y mide 72 px o menos.
- [ ] Los layouts de capítulos tienen al menos cuatro familias distintas.
- [ ] Las tablas se sienten parte del mismo producto.

## Ilustraciones

- [ ] Existe un style frame aprobado antes de producir toda la serie.
- [ ] Las seis piezas narrativas comparten estilo, paleta y textura.
- [ ] No se usan logos de FIFA ni marcas no autorizadas.
- [ ] No se replica el trofeo oficial en detalle.
- [ ] No se inventan rostros realistas.
- [ ] Q y Otto se representan con iniciales, dorsales o símbolos.
- [ ] España se representa como campeona mundial.
- [ ] Las cifras críticas se componen en HTML o se revisan manualmente.
- [ ] No hay texto ilegible generado dentro de imágenes.
- [ ] Cada pieza tiene crop desktop y móvil.
- [ ] Cada pieza informativa tiene alt text aprobado.
- [ ] Las imágenes decorativas usan alt vacío.
- [ ] Las imágenes below the fold usan lazy loading.
- [ ] El hero visual móvil pesa menos de 250 KB.

## Poster y compartir

- [ ] El poster mide 1080 x 1920.
- [ ] Incluye Q 47, Otto 98 y España campeona.
- [ ] Incluye 29 participantes, 104 partidos y 2,408 predicciones.
- [ ] Incluye los 14 cambios de líder.
- [ ] No llama campeón total a Boris.
- [ ] Usa Web Share API cuando está disponible.
- [ ] Descarga PNG cuando compartir no está disponible o se cancela.
- [ ] El archivo se llama `quiniela-mundial-2026-resumen-final.png`.
- [ ] Espera a que fuentes e ilustraciones estén listas antes de capturar.
- [ ] El poster usa la misma fuente de datos que la página.
- [ ] Existe Open Graph image de 1200 x 630.

## Responsive

- [ ] Se verificó 360 x 800.
- [ ] Se verificó 390 x 844.
- [ ] Se verificó 768 x 1024.
- [ ] Se verificó 1024 x 768.
- [ ] Se verificó 1366 x 768.
- [ ] Se verificó 1440 x 900.
- [ ] Se verificó 1920 x 1080.
- [ ] No hay overflow horizontal de página.
- [ ] El chart puede tener scroll interno controlado sin arrastrar todo el sitio.
- [ ] Los títulos no quedan huérfanos o cortados.
- [ ] Los CTA no hacen wrap en escritorio.
- [ ] El contenido sigue siendo usable a zoom 200%.

## Accesibilidad

- [ ] Existe skip link.
- [ ] Hay un solo H1.
- [ ] La jerarquía de headings es válida.
- [ ] Todos los controles tienen nombre accesible.
- [ ] Focus visible cumple contraste.
- [ ] Touch targets miden al menos 44 x 44 px.
- [ ] Body text cumple 4.5:1.
- [ ] Texto grande cumple 3:1.
- [ ] Tabs implementan roles y navegación esperada.
- [ ] Charts tienen alternativa textual.
- [ ] Color no es el único indicador.
- [ ] Las tablas tienen caption y scopes.
- [ ] Se respeta `prefers-reduced-motion`.
- [ ] No se bloquea zoom.
- [ ] Lighthouse Accessibility es al menos 95.

## Motion

- [ ] Cada animación comunica jerarquía, secuencia o estado.
- [ ] No hay loops decorativos infinitos.
- [ ] No hay parallax continuo.
- [ ] No hay scroll hijack.
- [ ] No hay listeners manuales de scroll.
- [ ] Solo se animan transform y opacity.
- [ ] La línea de carrera se dibuja una sola vez.
- [ ] Reduced motion muestra inmediatamente el estado final.
- [ ] Los tabs funcionan sin animación.

## Rendimiento y robustez

- [ ] LCP móvil es menor a 2.5 s.
- [ ] INP es menor a 200 ms.
- [ ] CLS es menor a 0.1.
- [ ] Lighthouse Performance móvil es al menos 90.
- [ ] Lighthouse Best Practices es al menos 95.
- [ ] El bundle inicial objetivo es menor a 180 KB gzip sin imágenes.
- [ ] El hero reserva dimensiones para evitar CLS.
- [ ] Fonts son self hosted con `font-display: swap`.
- [ ] Chart y poster se cargan de forma diferida.
- [ ] El contenido esencial aparece en HTML inicial.
- [ ] La página conserva contenido útil si falla una ilustración.
- [ ] La página conserva contenido esencial sin JavaScript.
- [ ] No hay errores en consola.
- [ ] No hay requests 404.

## Tests

- [ ] Unit tests cubren puntuación 3/2/1/0.
- [ ] Unit tests cubren marcador reglamentario separado de tiempo extra.
- [ ] Unit tests cubren ranks compartidos.
- [ ] Unit tests cubren empates en premios.
- [ ] Snapshot tests validan las cifras principales.
- [ ] Tests detectan campos prohibidos en el dataset público.
- [ ] Tests comprueban que `Total informativo` muestra disclaimer.
- [ ] Tests comprueban tabs y navegación por teclado.
- [ ] Tests comprueban el resumen textual del chart.
- [ ] Test de red confirma cero requests a Convex.
- [ ] El build de producción pasa.
- [ ] TypeScript pasa sin `as any`.

## Revisión final humana

- [ ] Luis confirma el tono y la jerarquía de la historia.
- [ ] Otto y Q aparecen con el título correcto.
- [ ] Los nombres públicos están escritos correctamente.
- [ ] Una segunda persona compara cifras con `DATA_SNAPSHOT.md`.
- [ ] Se revisa el poster antes de habilitar descarga.
- [ ] Se revisan los crops de ilustraciones en dispositivos reales.
- [ ] Se abre el dashboard desde una sesión limpia sin credenciales.
- [ ] Se documenta el commit o release final del archivo.

## Definición de terminado

El dashboard está terminado cuando todos los checks aplicables pasan, las cifras coinciden con la fuente de verdad y la experiencia puede alojarse como sitio estático sin depender de ninguna infraestructura de la quiniela original.
