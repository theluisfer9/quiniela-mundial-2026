# Contrato de datos y arquitectura estática

## Decisión

El dashboard final se construirá con datos estáticos versionados. No realizará consultas a Convex, no restaurará autenticación y no enviará IDs internos al navegador.

La fuente original es el export final de producción. Ese ZIP permanece fuera del repositorio público porque contiene información sensible.

## Flujo de datos

```text
Export privado de Convex
        |
        v
Script local de extracción y validación
        |
        +--> elimina tablas y campos sensibles
        +--> filtra perfiles activos con PIN configurado
        +--> calcula standings y métricas derivadas
        +--> valida invariantes
        |
        v
Snapshot estático sanitizado
        |
        +--> página final
        +--> poster descargable
        +--> Open Graph image
```

## Artefactos esperados durante implementación

Los nombres son recomendados, no creados por esta spec:

```text
apps/web/src/features/final-dashboard/
  final-dashboard-data.ts
  final-dashboard-schema.ts
  final-dashboard-derivations.ts
  components/
  illustrations/
```

El dataset puede ser TypeScript o JSON importado durante build. Debe quedar tipado y validado con Zod antes de renderizar.

## Campos prohibidos

Nunca copiar al snapshot público:

- `_id`;
- `_creationTime` cuando no sea necesario;
- `pinHash`;
- `tokenHash`;
- sesiones;
- códigos de verificación;
- `userId`;
- IDs de Convex de jugador, partido o equipo;
- timestamps de edición de pronósticos individuales;
- variables de entorno;
- claves, tokens o URLs administrativas.

## Identificadores públicos

Usar slugs determinísticos no sensibles:

- participante: slug derivado del nombre visible y validado por unicidad;
- partido: `m-001` a `m-104`;
- selección: código deportivo existente como `ESP`, `ARG`, `POR`;
- fase: `group`, `knockout`, `overall-editorial`.

Si dos participantes generan el mismo slug, resolver durante generación con un sufijo estable que no sea un ID interno.

## Contrato lógico

```ts
type FinalDashboardData = {
  meta: {
    generatedAt: "2026-07-19";
    activePlayerCount: 29;
    finishedMatchCount: 104;
    validPredictionCount: 2408;
    overallCompletionRate: 79.8;
    scoringVersion: "3-2-1-0";
  };
  worldCup: {
    championTeamCode: "ESP";
    final: {
      matchNumber: 104;
      homeTeamCode: "ESP";
      awayTeamCode: "ARG";
      regulationScore: { home: 0; away: 0 };
      advancementMethod: "extraTime";
      extraTimeScore: { home: 1; away: 0 };
      predictionCount: 21;
      predictedOutcomeCounts: { home: 8; draw: 5; away: 8 };
      exactCount: 0;
      outcomeHitCount: 5;
    };
  };
  phases: {
    group: OfficialPhase;
    knockout: OfficialPhase;
    overallEditorial: EditorialPhase;
  };
  leaderRace: LeaderRaceSnapshot[];
  qWinningPath: ExactMoment[];
  moments: {
    collectiveJoy: MatchMoment[];
    collectiveSurprise: MatchMoment[];
  };
  awards: Award[];
};

type OfficialPhase = {
  official: true;
  matchRange: [number, number];
  matchCount: number;
  predictionCount: number;
  completionRate: number;
  leaderChangeCount: number;
  champion: {
    playerSlug: string;
    displayName: string;
    points: number;
    margin: number;
  };
  standings: StandingRow[];
};

type EditorialPhase = Omit<OfficialPhase, "official" | "champion"> & {
  official: false;
  label: "Lectura editorial";
  highestAggregate: {
    playerSlug: string;
    displayName: string;
    points: number;
  };
};

type StandingRow = {
  rank: number;
  playerSlug: string;
  displayName: string;
  points: number;
  predictionCount: number;
  exactCount: number;
  outcomeHitCount: number;
  precisionPercent: number;
};

type LeaderRaceSnapshot = {
  matchNumber: number;
  date: string;
  leaders: string[];
  leaderPoints: number;
  qPoints: number;
  featuredPoints: Record<string, number>;
};

type ExactMoment = {
  matchNumber: number;
  stage: string;
  homeTeamCode: string;
  awayTeamCode: string;
  score: { home: number; away: number };
  points: 3;
  decisive?: boolean;
};

type MatchMoment = {
  matchNumber: number;
  stage: string;
  homeTeamCode: string;
  awayTeamCode: string;
  regulationScore: { home: number; away: number };
  predictionCount: number;
  exactCount: number;
  outcomeHitCount: number;
  totalPointsAwarded: number;
  predictedOutcomeCounts: {
    home: number;
    draw: number;
    away: number;
  };
  editorialNote: string;
};

type Award = {
  key: "aggregate" | "exacts" | "precision" | "streak" | "contrarian" | "draws";
  displayNames: string[];
  value: number;
  unit: string;
  official: false;
};
```

Los literales numéricos del ejemplo documentan el snapshot actual. En código pueden modelarse como `number`, pero las validaciones deben comprobar los valores finales esperados.

## Definiciones

### Participante público válido

Perfil con:

- `active === true`;
- `pinHash` presente en la fuente privada;
- nombre visible no vacío.

El `pinHash` solo se usa para decidir inclusión durante extracción. Nunca se copia al resultado.

### Partido puntuable

Partido con:

- estado `finished` o el estado final equivalente del snapshot;
- `homeScore` y `awayScore` definidos;
- marcador normalizado a entero no negativo;
- número de partido entre 1 y 104.

### Marcador de puntuación

En eliminatorias se usa el marcador después de 90 minutos. No se suman goles de tiempo extra ni penales al marcador que puntúa la quiniela.

### Resultado

```text
home: homeScore > awayScore
draw: homeScore = awayScore
away: homeScore < awayScore
```

### Puntos

```text
3 = ambos goles exactos
2 = resultado correcto y goles exactos de un equipo
1 = resultado correcto o goles exactos de un equipo
0 = ningún criterio
```

Orden de evaluación obligatorio: exacto, dos puntos, un punto, cero.

### Precisión

```text
outcomeHitCount / predictionCount * 100
```

Redondear a una cifra decimal solo para display. Conservar el valor completo durante cálculos.

### Participación

```text
predictionCount / (activePlayerCount * matchCount) * 100
```

### Posiciones compartidas

Usar ranking de competencia:

```text
1, 2, 2, 4
```

No usar ranking ordinal forzado `1, 2, 3, 4` cuando hay empate.

### Cambio de líder

Se cuenta cuando el conjunto de personas empatadas en el máximo puntaje cambia después de puntuar un partido.

El orden de snapshots es:

1. `kickoffAt` ascendente;
2. `matchNumber` ascendente como desempate.

### Acierto contra el consenso

Se conserva la definición histórica del producto: un participante suma cuando acierta el resultado real y su resultado pronosticado es distinto del resultado de consenso del partido.

El consenso es la categoría con mayor cantidad de pronósticos. La implementación original resolvía empates de conteo de forma estable en el orden `away`, `draw`, `home`. El generador del archivo debe reproducir esa regla para que los reconocimientos coincidan con lo que mostró el producto. Si en el futuro se adopta una definición sin consenso cuando hay empate, debe versionarse como una métrica nueva y no reescribir el archivo histórico.

### Casi exacto

Predicción no exacta donde:

```text
abs(predictedHome - actualHome) + abs(predictedAway - actualAway) = 1
```

## Invariantes del snapshot

El build debe fallar si no se cumplen:

- 29 participantes públicos válidos;
- 104 partidos puntuables;
- 72 partidos de grupos;
- 32 partidos eliminatorios;
- 2,408 predicciones públicas válidas;
- 1,553 predicciones en grupos;
- 855 predicciones en eliminatorias;
- Otto es primero en grupos con 98;
- Q es primera en eliminatorias con 47;
- Boris y Quique Menjívar comparten segundo en eliminatorias con 45;
- Boris tiene el mayor acumulado editorial con 141;
- Q tiene siete exactos en eliminatorias;
- el partido 102 es exacto de Q con 1-2;
- el partido 104 tiene marcador reglamentario 0-0;
- España es campeona por tiempo extra con 1-0;
- la final tiene 21 predicciones, 0 exactos y distribución 8/5/8;
- eliminatorias tiene 14 cambios de líder.

## Reglas de orden

Standings:

1. puntos descendentes;
2. nombre visible ascendente solo para estabilidad visual;
3. el nombre no rompe empates de rank.

Momentos:

- narrativa manual definida en `STORY_AND_CONTENT.md`;
- métricas tomadas del snapshot;
- no ordenar automáticamente por una fórmula si eso rompe el guion.

## Empates en premios

El generador debe devolver todos los nombres con el valor máximo.

Ejemplos de eliminatorias:

- más exactos: Q, Quique Menjívar y Tesoro con 7;
- más resultados acertados: Q, Boris, Profe y Sofi con 20.

La UI puede destacar una lectura editorial distinta, pero no debe afirmar un ganador único si el cálculo terminó empatado.

## Sanitización de texto

- escapar contenido al renderizar;
- nombres solo como texto, nunca como HTML;
- limitar longitud visual sin alterar el valor almacenado;
- preservar acentos;
- validar ausencia de URLs o markup en nombres;
- no incluir notas privadas.

## Estrategia de generación

### Opción recomendada

Script reproducible dentro de `scripts/` que:

1. recibe una ruta local al ZIP;
2. carga `profiles`, `teams`, `matches` y `predictions`;
3. filtra participantes válidos;
4. calcula métricas;
5. ejecuta invariantes;
6. escribe el snapshot público;
7. imprime un resumen sin datos sensibles;
8. nunca modifica el ZIP.

### Política de repositorio

Puede versionarse:

- snapshot sanitizado;
- script;
- tests;
- documentación;
- ilustraciones finales.

No puede versionarse:

- export completo;
- archivos extraídos sin sanitizar;
- `.env`;
- logs con tokens;
- sesiones;
- hashes.

## Runtime

El bundle final no debe importar:

- `convex/react`;
- API generada de Convex;
- Better Auth;
- lógica de PIN;
- llamadas a endpoints eliminados.

El dashboard renderiza desde un import estático. Si se usa SSR o prerender, el HTML inicial debe contener hero, campeones, cifras y texto esencial.

## Poster y OG

Poster y página consumen el mismo `FinalDashboardData`.

No duplicar cifras en archivos separados. Las piezas derivadas reciben props del snapshot y agregan únicamente layout.

## Tests mínimos

### Extracción

- excluye perfiles inactivos;
- excluye perfiles sin PIN;
- elimina campos prohibidos;
- normaliza BigInt o enteros de Convex;
- no muta la fuente.

### Scoring

- cubre casos de 3, 2, 1 y 0 puntos;
- usa empate a 90 minutos en eliminatorias;
- no suma tiempo extra;
- preserva posiciones compartidas.

### Snapshot

- ejecuta todos los invariantes;
- compara un hash o snapshot aprobado del dataset sanitizado;
- detecta cambios accidentales de nombres o cifras.

### UI

- tabs muestran fase correcta;
- `Total informativo` mantiene disclaimer;
- chart y texto alternativo usan los mismos hitos;
- poster usa las mismas cifras;
- no hay solicitudes de red a Convex.

## Trazabilidad

Toda cifra visible debe poder ubicarse en:

1. `DATA_SNAPSHOT.md` para revisión humana;
2. snapshot estático para implementación;
3. test de invariante para evitar regresiones.
