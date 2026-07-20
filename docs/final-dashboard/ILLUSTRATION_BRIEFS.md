# Briefs de ilustración

## Objetivo

Las ilustraciones funcionan como resumen visual de cada capítulo. Deben ayudar a recordar la historia, no decorar espacios vacíos.

El paquete mínimo tiene seis piezas narrativas y dos adaptaciones de distribución.

## Dirección artística

Nombre de trabajo:

`Torneo Vivo Editorial`

Mezcla:

- poster deportivo editorial;
- retícula suiza asimétrica;
- collage de papel recortado;
- bloques planos de color;
- líneas de marcador y cancha;
- textura halftone muy sutil;
- energía familiar sin caricatura infantil.

Referencia estructural:

- `retro-pop-grid` para organización;
- `bold-graphic` para energía deportiva;
- `linear-progression` para la carrera;
- `story-mountain` para la ruta de Q.

No mezclar estilos entre piezas. Todas deben parecer parte del mismo anuario.

## Paleta de ilustración

- canvas: `#FFF8F7`;
- ink: `#291715`;
- structural blue: `#2A398D`;
- champion red: `#BD0015`;
- action red: `#E61D25`;
- green: `#3CAC3B`;
- lilac: `#97A5FF`;
- soft red: `#FFE9E6`;
- white: `#FFFFFF`.

Se permiten colores de banderas como acentos pequeños.

## Reglas globales

- No incluir logos de FIFA ni marcas registradas del Mundial.
- No inventar el trofeo oficial en detalle. Usar una copa deportiva abstracta.
- No generar rostros realistas de Q, Otto ni otros participantes.
- Representar participantes con iniciales, dorsales, siluetas o manos.
- No incrustar párrafos ni cifras críticas dentro de la imagen.
- Reservar zonas limpias para que HTML coloque títulos y métricas.
- Entregar cada pieza sin texto y, si hace falta, una variante con labels mínimos revisados.
- Evitar manos con anatomía compleja si no son necesarias.
- No usar estética 3D glossy, clay, neon o AI-purple.
- Evitar confeti excesivo. El cierre debe sentirse alegre y archivado, no como una promo en curso.
- Mantener contraste suficiente cuando la pieza quede detrás de texto.
- Probar crops sin cortar copa, iniciales, balones o marcadores centrales.

## Entregables por pieza

- master 4K;
- WebP o AVIF optimizado;
- PNG con transparencia cuando aplique;
- crop desktop;
- crop mobile;
- miniatura 1:1 si la pieza se reutiliza;
- alt text aprobado;
- prompt y seed guardados para reproducibilidad.

## Ilustración 01: las tres coronas

### Rol

Hero y portada del archivo.

### Mensaje

Dos campeones de la quiniela y una selección campeona del mundo pueden convivir en una sola imagen sin confundir sus logros.

### Escena

Composición diagonal con tres niveles:

- izquierda, medallón azul con dorsal `O` y copa de grupos;
- centro y primer plano, medallón rojo con dorsal `Q` y siete pequeñas fichas de marcador;
- fondo superior, copa abstracta acompañada por la bandera de España;
- líneas de cancha conectan los tres elementos;
- 29 pequeñas marcas en la grada sugieren a la familia;
- una cinta de resultados termina en un `0-0` discreto.

### Composición

- Desktop 16:9: elementos principales a la derecha, 42% izquierdo libre para copy.
- Mobile 4:5: Q al centro, Otto y España como satélites; 25% superior libre.
- OG 1200 x 630: tres símbolos legibles con título agregado en HTML o diseño final controlado.

### Prompt base

```text
Editorial sports poster illustration for a family World Cup prediction pool archive, Swiss asymmetric grid mixed with cut-paper collage and subtle halftone texture, flat vector shapes, three distinct victories in one composition: a blue abstract medal with the letter O for the group-stage champion, a larger red abstract medal with the letter Q and seven small score-ticket shapes for the knockout champion, an abstract international football cup with a small Spanish flag for the tournament champion, 29 tiny crowd marks in the background, curved football pitch lines connecting the three achievements, disciplined palette #FFF8F7 #291715 #2A398D #BD0015 #E61D25 #3CAC3B #97A5FF, premium editorial finish, joyful family sports energy, no realistic faces, no FIFA logo, no brand marks, no embedded paragraph text, clean negative space on the left for headline, crisp geometry, accessible contrast
```

### Negative prompt

```text
photorealism, FIFA logo, official trophy replica, betting ad, casino chips, neon, glossy 3D, clay, generic corporate Memphis, childish mascot, realistic portraits, illegible text, crowded background, purple blue AI gradient
```

### Alt text

`Ilustración con una copa azul para Otto, una copa roja para Q con siete marcadores y una copa mundial abstracta junto a la bandera de España.`

## Ilustración 02: la carrera de catorce cambios

### Rol

Apertura de la sección de evolución del liderato.

### Mensaje

La punta fue una carrera con varios relevos, no una victoria de principio a fin.

### Escena

- pista de atletismo reinterpretada como líneas de chart;
- dorsales Q, Sergio, Tesoro y Sofi se cruzan en diferentes puntos;
- Boris y Quique aparecen cerca del cierre;
- catorce banderines pequeños marcan cambios de líder;
- el último banderín rojo se alinea con el marcador `1-2`;
- no mostrar posiciones o puntos inventados dentro de la imagen.

### Layout

`linear-progression` horizontal.

- Desktop 21:9 para acompañar el chart.
- Mobile 9:16 como camino vertical.
- Zona limpia inferior para anotaciones HTML.

### Prompt base

```text
Wide editorial infographic illustration of a close football prediction race, fourteen leadership changes represented by fourteen small flag markers along intertwined score lines, abstract runners or jersey tokens labeled only Q, Sergio, Tesoro, Sofi, Boris and Quique, Q's red path reaches the final lead at a clear 1-2 score ticket, Swiss grid, retro sports print, cut paper geometry, subtle halftone, flat vector, disciplined World Cup inspired palette with dark blue red green lilac on warm off-white, dynamic but readable, no realistic people, no extra names, no fake statistics, no logos, large clean area for an HTML chart overlay
```

### Alt text

`Pistas de colores se cruzan catorce veces hasta que la línea roja de Q termina al frente con un marcador 1-2.`

## Ilustración 03: siete exactos

### Rol

Resumen visual del recorrido ganador de Q.

### Mensaje

La victoria se construyó con siete momentos concretos.

### Escena

Camino en forma de número siete hecho con boletos de marcador:

1. 0-1
2. 2-1
3. 1-2
4. 2-0
5. 2-1
6. 1-1
7. 1-2

Los boletos 6 y 7 son mayores. El último se convierte en una pequeña copa roja.

Los nombres de equipos se agregan en HTML. La imagen solo puede llevar los siete marcadores si pasan revisión tipográfica.

### Layout

`story-mountain` con ascenso suave, caída corta y remate final.

- Master 4:3.
- Mobile 4:5.
- Transparencia opcional para superponer en fondo claro.

### Prompt base

```text
Editorial cut-paper illustration of seven exact football score predictions forming a rising path shaped like the number seven, score tickets in this exact sequence 0-1, 2-1, 1-2, 2-0, 2-1, 1-1, 1-2, the final 1-2 ticket transforms into a small red abstract trophy, dynamic Swiss sports poster composition, flat vector geometry, warm off-white background, red primary with structural blue green and lilac accents, subtle halftone print texture, no people, no logos, no extra scores, no paragraph text, clear spacing around every ticket
```

### Alt text

`Siete boletos de marcador forman un camino ascendente y el último 1-2 se convierte en la copa roja de Q.`

## Ilustración 04: la alegría y el golpe

### Rol

Acompañar la sección de momentos colectivos.

### Mensaje

La misma familia que acertó en masa también falló en masa.

### Escena

Split diagonal, no comparación simétrica perfecta.

Lado celebración:

- marcador Portugal 2-1 Croacia;
- 18 fichas verdes entran en una red;
- papel picado mínimo;
- energía ascendente.

Lado sorpresa:

- marcador Ecuador 2-1 Alemania;
- 20 flechas azules apuntan en dirección equivocada;
- una ficha verde toma la dirección correcta;
- balón rompe la expectativa sin humillar a nadie.

### Layout

`binary-comparison` editorial.

- Desktop 16:9.
- Mobile: dos piezas 4:3 separadas para que no pierdan legibilidad.

### Prompt base

```text
Editorial split-scene football infographic about collective prediction joy and surprise, asymmetrical diagonal composition, one side shows Portugal 2-1 Croatia with eighteen green score tokens flying into a football net in celebration, the other side shows Ecuador 2-1 Germany with twenty blue arrows moving the wrong way and one green token moving toward the correct result, retro Swiss sports poster, cut paper collage, subtle halftone, flat vector, warm off-white canvas, disciplined red blue green palette, playful but respectful, no realistic faces, no mocking caricature, no logos, no betting imagery, minimal embedded text limited to the two verified scorelines
```

### Alt text

`A un lado, dieciocho fichas celebran el 2-1 de Portugal; al otro, veinte flechas fallan el 2-1 de Ecuador sobre Alemania y una ficha acierta.`

## Ilustración 05: salón de estilos

### Rol

Dar identidad a los reconocimientos acumulados.

### Mensaje

La tabla completa revela diferentes formas de jugar.

### Escena

Seis objetos sobre una mesa de premiación vista desde arriba:

- Boris: contador `141`;
- Sergio: quince pequeñas dianas;
- Q: medidor de precisión `64.7%`;
- Marianne: cadena de once eslabones;
- Sofi: flecha que se separa del bloque de consenso;
- Sofi: veintinueve símbolos de empate agrupados como un segundo reconocimiento.

Las cifras críticas se renderizan en HTML. La ilustración entrega los objetos y espacios, no el texto final.

### Layout

`knolling` con grid asimétrico.

- Master 3:2.
- Adaptación 1:1 para compartir.

### Prompt base

```text
Top-down editorial knolling illustration of six abstract football prediction awards arranged on a warm off-white table, a mechanical point counter for Boris, a cluster of target symbols for Sergio, a precision gauge for Q, an eleven-link chain for Marianne, a bold arrow for Sofi moving away from a consensus block, a separate collection of draw symbols for Sofi, Swiss grid alignment with slight asymmetry, flat vector cut-paper objects, subtle halftone print texture, blue red green lilac palette, no realistic portraits, no trophies with official logos, no embedded names or fake numbers, six clearly separated spaces for HTML labels
```

### Alt text

`Seis objetos deportivos representan el puntaje, los exactos, la precisión, la racha, los aciertos contra el consenso y los empates.`

## Ilustración 06: la final que nadie clavó

### Rol

Capítulo final de la historia.

### Mensaje

La final decidió al campeón mundial, pero no la quiniela.

### Escena

- marcador grande `0-0` al centro como tablero físico;
- 21 fichas se dividen 8 a la izquierda, 5 al centro y 8 a la derecha;
- ninguna ficha entra en un pequeño marco de `exacto`;
- una línea superior conduce a una copa abstracta y bandera española;
- un ticket pequeño `1-0 TE` explica tiempo extra, si la tipografía se revisa;
- la copa de Q permanece estable en una base lateral para mostrar que el podio no cambió.

### Layout

`hub-spoke` sobrio.

- Desktop 16:9.
- Mobile 4:5.
- Espacio inferior para explicación HTML.

### Prompt base

```text
Editorial football final illustration centered on a physical 0-0 scoreboard, twenty-one prediction tokens arranged in three exact groups of eight, five and eight, none inside the exact-score target, an upper path leads to an abstract winner cup and a small Spanish flag with a separate extra-time 1-0 ticket, a small stable red Q trophy remains on its podium at the side, retro Swiss sports poster, cut-paper flat vector, subtle halftone, warm off-white blue red green palette, precise clean grouping, no official FIFA logo, no realistic trophy replica, no photorealistic players, no fake crowd text
```

### Alt text

`Un tablero marca 0-0, veintiuna fichas se dividen en grupos de ocho, cinco y ocho, y España aparece campeona tras un 1-0 en tiempo extra.`

## Pieza 07: poster vertical descargable

### Rol

Resumen compartible del dashboard.

### Formato

1080 x 1920.

### Jerarquía

1. `Quiniela Mundial 2026`.
2. Q, campeona de eliminatorias, 47.
3. Otto, campeón de grupos, 98.
4. España, campeona mundial.
5. 29 participantes, 104 partidos, 2,408 predicciones.
6. Catorce cambios de líder.
7. Tres momentos: Portugal-Croacia, Ecuador-Alemania, final 0-0.
8. URL o firma del archivo.

### Recomendación

No generar todo el poster como una sola imagen AI. Generar la ilustración base sin texto y componer números, títulos y nombres con HTML/CSS para preservar exactitud y accesibilidad.

### Ilustración base

Reutilizar la pieza `las tres coronas` en composición vertical y agregar motivos de las piezas 02, 04 y 06 en un footer gráfico.

## Pieza 08: Open Graph

### Formato

1200 x 630.

### Contenido

- título corto: `La historia de la quiniela`;
- Q `47`;
- Otto `98`;
- España campeona;
- tres símbolos: línea de carrera, siete tickets, marcador 0-0.

El título y las cifras se componen en código.

## Flujo de producción

1. Aprobar style frame de la ilustración 01.
2. Bloquear paleta, textura, grosor de línea y lenguaje de formas.
3. Producir 02 y 03.
4. Revisar consistencia de iniciales y marcadores.
5. Producir 04, 05 y 06.
6. Crear crops responsive.
7. Integrar en HTML sin texto crítico embebido.
8. Componer poster y OG.
9. Validar alt text, peso y contraste.
10. Guardar prompts, seeds y versiones en el repositorio de assets.

## Checklist de aprobación artística

- [ ] La pieza cuenta un hecho, no solo decora.
- [ ] Las cifras visibles coinciden con `DATA_SNAPSHOT.md`.
- [ ] No aparecen logos oficiales ni marcas no autorizadas.
- [ ] No se inventan rostros.
- [ ] Q y Otto se leen como campeones de fases distintas.
- [ ] España se lee como campeona mundial, no de la quiniela.
- [ ] El 0-0 se distingue del 1-0 en tiempo extra.
- [ ] No hay texto ilegible generado dentro de la imagen.
- [ ] El crop móvil conserva el mensaje.
- [ ] La paleta coincide con el producto.
- [ ] El archivo optimizado cumple el presupuesto de peso.
- [ ] El alt text describe la información relevante.
