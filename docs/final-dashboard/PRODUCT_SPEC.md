# Product spec: dashboard final informativo

## Resumen

El dashboard final transforma la antigua pantalla pública de estadísticas en un archivo narrativo del torneo. La página debe responder cuatro preguntas, en este orden:

1. ¿Quiénes ganaron?
2. ¿Cómo cambió la competencia?
3. ¿Qué partidos recordará la familia?
4. ¿Qué dicen los números cuando se mira el torneo completo?

La experiencia debe poder abrirse años después y seguir teniendo sentido sin un backend vivo.

## Contexto

La quiniela terminó el 19 de julio de 2026. El frontend fue retirado y el proyecto Convex se eliminó después de exportar toda la información. El repositorio y el respaldo permanecen archivados.

El producto original estaba orientado a acción inmediata: entrar con PIN, completar pronósticos, revisar cierres y ver movimientos en la tabla. El dashboard final tiene otra función. Ya no debe pedir acción ni simular que el torneo sigue vivo. Debe convertir el resultado en memoria compartida.

## Objetivo de producto

Crear una página pública de solo lectura que narre la historia completa de la quiniela con datos verificables, tablas oficiales, visualizaciones comprensibles e ilustraciones originales.

## Resultados esperados

Una persona que visite la página debe poder:

- reconocer a Otto y Q como campeones de las dos competencias oficiales;
- entender que la punta de eliminatorias cambió 14 veces;
- seguir el recorrido con el que Q llegó a 47 puntos;
- identificar los partidos de mayor celebración y mayor sorpresa;
- consultar las tablas completas sin perder la narrativa;
- descargar o compartir una pieza resumen;
- distinguir datos oficiales de lecturas editoriales.

## Usuarios

### Audiencia principal

Los 29 participantes activos y sus familiares.

Características:

- ya conocen la dinámica de la quiniela;
- usarán principalmente teléfonos;
- valoran nombres, anécdotas y resultados por encima de análisis estadístico complejo;
- tienen niveles distintos de familiaridad técnica;
- quieren recordar y compartir, no operar una aplicación.

### Audiencia secundaria

Personas cercanas que no participaron, pero quieren entender qué pasó sin conocer las reglas de antemano.

## Principios

### La historia antes que la tabla

La clasificación completa importa, pero no debe ocupar el primer viewport ni dominar el recorrido.

### Dos campeonatos, dos campeones

Grupos y eliminatorias fueron competencias oficiales separadas. La interfaz nunca debe fusionarlas en una sola corona.

### Precisión sin frialdad

Los números deben ser exactos y trazables, pero el tono puede ser cercano, celebratorio y familiar.

### El archivo no finge estar vivo

No habrá próximas fechas, rachas actuales, alertas, CTA para pronosticar ni estados `live`.

### Cada visualización debe explicar algo

No se incluirá un gráfico solo porque hay datos disponibles. Toda visualización debe responder una pregunta editorial concreta.

### Privacidad por construcción

La página usará un dataset estático sanitizado. Ningún artefacto enviado al navegador contendrá PIN, hashes, sesiones, tokens o IDs internos.

## Alcance funcional

### Ruta canónica

`/`

Si se conserva `/dashboard`, debe redirigir a `/` o renderizar exactamente el mismo documento. No debe existir una segunda versión divergente.

### Navegación

Navegación de una sola línea en escritorio:

- Historia
- Campeones
- Momentos
- Tabla final
- Descargar resumen

En móvil se usará un menú compacto o una barra de anchors desplazable. No se mostrará navegación del antiguo flujo de pronósticos.

### Secciones

#### Apertura: el torneo terminó, la historia quedó

Debe mostrar:

- nombre del evento;
- fecha de cierre;
- campeona de eliminatorias: Q, 47 puntos;
- campeón mundial: España;
- ilustración principal;
- CTA único: `Ver cómo se decidió`;
- acción secundaria: `Descargar resumen`.

No debe mostrar más de cuatro bloques de texto en el hero.

#### El torneo en números

Banda breve con:

- 29 participantes activos;
- 104 partidos;
- 2,408 predicciones públicas válidas;
- 79.8% de participación total;
- 14 cambios de líder en eliminatorias.

Los números deben usar labels visibles, no depender de tooltips.

#### Dos fases, dos coronas

Comparación editorial de los campeones oficiales:

- Otto, grupos, 98 puntos, margen de 2;
- Q, eliminatorias, 47 puntos, margen de 2.

Debe evitar el patrón de tres cards iguales. Se recomienda una composición dividida 5/7 con dos tratamientos visuales relacionados pero no idénticos.

#### La carrera por la punta

Visualización principal de eliminatorias.

Debe:

- mostrar los cambios de líder a lo largo de 32 partidos;
- destacar a Q, Sergio, Tesoro, Sofi, Boris y Quique Menjívar;
- indicar que hubo 14 cambios;
- marcar los partidos 101 y 102 como desenlace;
- ofrecer una versión textual equivalente para lectores de pantalla y móvil reducido.

No debe intentar dibujar 29 líneas simultáneas.

#### Siete exactos para ganar

Capítulo centrado en Q.

Debe mostrar los siete marcadores exactos en orden, con especial énfasis en:

- partido 99, Noruega 1-1 Inglaterra;
- partido 102, Inglaterra 1-2 Argentina;
- 20 aciertos de resultado en 31 predicciones;
- 64.5% de precisión;
- ventaja final de 2 puntos.

La ausencia de predicción en un partido no debe ocultarse ni dramatizarse.

#### Lo que todos celebramos y lo que nadie vio venir

Módulo de momentos destacados con dos ritmos visuales.

Celebraciones:

- Portugal 2-1 Croacia: 18 exactos y 67 puntos repartidos.
- Costa de Marfil 1-2 Noruega: 14 exactos.
- Francia 3-1 Senegal: 10 exactos en grupos.

Sorpresas:

- Ecuador 2-1 Alemania: 20 de 21 fueron con Alemania; solo un acierto de resultado.
- Francia 4-6 Inglaterra: 4 aciertos de resultado y 0 exactos.
- Suiza 0-0 Colombia: la mayoría esperaba victoria colombiana y no hubo marcadores exactos.

La final España 0-0 Argentina se presenta por separado en el capítulo **La noche final**, con sus 0 exactos y 5 pronósticos de empate.

Cada momento debe incluir contexto humano breve, no solo el marcador.

#### Salón de reconocimientos

Reconocimientos acumulados, claramente etiquetados como estadísticas editoriales:

- Boris: mayor puntaje acumulado, 141.
- Sergio: más exactos, 15.
- Q: mejor precisión, 64.7%.
- Marianne: mejor racha, 11.
- Sofi: más aciertos contra el consenso, 13.
- Sofi: más empates pronosticados, 29.

Los empates en una categoría deben mostrarse completos cuando corresponda. No se elegirá un ganador alfabético para simplificar.

#### La noche final

Debe explicar en una sola composición:

- España 0-0 Argentina a los 90 minutos;
- España ganó 1-0 en tiempo extra;
- 21 predicciones registradas;
- 8 fueron con España, 5 con empate, 8 con Argentina;
- nadie clavó el 0-0;
- la tabla de eliminatorias no cambió.

El marcador usado para puntuar y el resultado del campeón deben verse como datos distintos.

#### Tablas completas

Control segmentado con:

- Grupos, oficial.
- Eliminatorias, oficial.
- Total, lectura editorial.

Requisitos:

- mostrar los 29 participantes;
- conservar posiciones compartidas;
- incluir puntos, predicciones, exactos, aciertos y precisión;
- encabezados de tabla fijos en escritorio si la tabla lo requiere;
- lista o tabla adaptada en móvil;
- nota persistente en `Total`: `Esta suma no fue una tercera competencia oficial`.

#### Metodología y archivo

Cierre sobrio con:

- explicación del sistema 3/2/1/0;
- aclaración de los 90 minutos en eliminatorias;
- fecha del snapshot;
- acceso a una versión descargable del resumen;
- sin enlace al respaldo sensible.

## Compartir y descargar

### Pieza requerida

Poster vertical 1080 x 1920 con:

- Q campeona de eliminatorias;
- Otto campeón de grupos;
- España campeona mundial;
- 29 participantes, 104 partidos y 2,408 predicciones;
- tres momentos destacados;
- URL o firma del archivo.

### Comportamiento

- usar Web Share API cuando esté disponible;
- descargar PNG como fallback;
- generar el poster desde un componente real, no desde una imagen raster de baja resolución;
- permitir que la pieza use la ilustración-resumen aprobada.

## Estados

El contenido final es inmutable. Solo se requieren:

- carga del bundle y assets;
- error de asset ilustrado;
- fallback sin JavaScript con contenido esencial visible;
- preferencia de movimiento reducido.

No se requieren estados vacíos de datos, porque el snapshot validado forma parte del build. Si el dataset está incompleto, el build debe fallar.

## No objetivos

- crear estadísticas predictivas;
- comparar personas con modelos probabilísticos;
- publicar picks privados de partidos que nunca iniciaron;
- gamificar un torneo terminado;
- agregar comentarios, reacciones o perfiles;
- introducir una tabla general como campeonato oficial;
- mostrar un feed cronológico de las 2,408 predicciones;
- restaurar el admin.

## Métricas de calidad

El éxito se medirá por calidad del artefacto, no por retención:

- 100% de las cifras visibles coinciden con `DATA_SNAPSHOT.md`;
- cero solicitudes al proyecto Convex eliminado;
- contenido esencial disponible sin interacción compleja;
- Lighthouse móvil: Performance >= 90, Accessibility >= 95, Best Practices >= 95;
- LCP < 2.5 s en conexión móvil de referencia;
- CLS < 0.1;
- navegación completa por teclado;
- contraste WCAG AA;
- poster descargable generado correctamente en móvil y escritorio.

## Dependencias conceptuales

- [Snapshot de datos](./DATA_SNAPSHOT.md)
- [Guion editorial](./STORY_AND_CONTENT.md)
- [Sistema visual](./UX_UI_SPEC.md)
- [Ilustraciones](./ILLUSTRATION_BRIEFS.md)
- [Contrato técnico](./DATA_CONTRACT.md)
- [Criterios de aceptación](./ACCEPTANCE_CRITERIA.md)
