import { knockoutRace, type RaceCheckpoint } from "./leader-race-data";
import { z } from "zod";
export type { RaceCheckpoint } from "./leader-race-data";

export type Standing = {
  rank: number;
  name: string;
  points: number;
  predictions: number;
  exacts: number;
  hits: number;
  precision: number;
};

type Phase = {
  official: boolean;
  label: string;
  matchCount: number;
  predictionCount: number;
  champion?: { name: string; points: number; margin: number };
  standings: Standing[];
};

export type FinalDashboardSnapshot = {
  meta: { date: string; participants: number; matches: number; predictions: number; participation: number };
  phases: Record<"group" | "knockout" | "overall", Phase>;
  qPath: readonly (readonly [number, string, string, string, string])[];
  worldCup: { champion: string; final: { regulation: readonly [number, number]; extraTime: readonly [number, number]; predictions: number; distribution: readonly [number, number, number]; exacts: number; drawHits: number } };
  awards: readonly (readonly [string, string, string])[];
  moments: readonly { title: string; score: string; detail: string; tone: "celebración" | "sorpresa" }[];
  knockoutRace: readonly RaceCheckpoint[];
};

const standingSchema = z.object({ rank: z.number().int().positive(), name: z.string().min(1), points: z.number().nonnegative(), predictions: z.number().nonnegative(), exacts: z.number().nonnegative(), hits: z.number().nonnegative(), precision: z.number().nonnegative() });
const raceSchema = z.object({ sequence: z.number().int().positive(), match: z.number().int().min(73).max(104), date: z.string(), fixture: z.string().min(1), score: z.string().regex(/^\d+-\d+$/), scores: z.object({ q: z.number(), sergio: z.number(), tesoro: z.number(), sofi: z.number(), boris: z.number(), quique: z.number() }), leaders: z.array(z.string().min(1)).min(1), leaderPoints: z.number().nonnegative() });
const snapshotSchema = z.object({
  meta: z.object({ date: z.string(), participants: z.number(), matches: z.number(), predictions: z.number(), participation: z.number() }),
  phases: z.object({ group: z.object({ official: z.literal(true), label: z.string(), matchCount: z.number(), predictionCount: z.number(), champion: z.object({ name: z.string(), points: z.number(), margin: z.number() }), standings: z.array(standingSchema) }), knockout: z.object({ official: z.literal(true), label: z.string(), matchCount: z.number(), predictionCount: z.number(), champion: z.object({ name: z.string(), points: z.number(), margin: z.number() }), standings: z.array(standingSchema) }), overall: z.object({ official: z.literal(false), label: z.string(), matchCount: z.number(), predictionCount: z.number(), standings: z.array(standingSchema) }) }),
  qPath: z.array(z.tuple([z.number(), z.string(), z.string(), z.string(), z.string()])),
  worldCup: z.object({ champion: z.string(), final: z.object({ regulation: z.tuple([z.number(), z.number()]), extraTime: z.tuple([z.number(), z.number()]), predictions: z.number(), distribution: z.tuple([z.number(), z.number(), z.number()]), exacts: z.number(), drawHits: z.number() }) }),
  awards: z.array(z.tuple([z.string(), z.string(), z.string()])),
  moments: z.array(z.object({ title: z.string(), score: z.string(), detail: z.string(), tone: z.enum(["celebración", "sorpresa"]) })),
  knockoutRace: z.array(raceSchema),
});

function rows(source: string): Standing[] {
  return source.trim().split("\n").map((line) => {
    const [rank, name, points, predictions, exacts, hits, precision] = line.split("|");
    return {
      rank: Number(rank), name, points: Number(points), predictions: Number(predictions),
      exacts: Number(exacts), hits: Number(hits), precision: Number(precision),
    };
  });
}

const group = rows(`1|Otto|98|72|9|45|62.5
2|Boris|96|72|7|46|63.9
3|Sergio|95|72|9|44|61.1
4|Estuardo|93|71|8|44|62
4|Profe|93|72|7|44|61.1
4|Q|93|71|5|46|64.8
7|Rob|91|72|5|44|61.1
8|Marianne|90|71|6|45|63.4
8|Rocio|90|70|8|44|62.9
10|Teto|89|71|9|45|63.4
11|Fer|88|71|4|45|63.4
12|Yuyito|82|70|3|39|55.7
13|Ale|81|72|5|42|58.3
13|Eve|81|71|6|40|56.3
15|LF|80|72|3|34|47.2
15|Rolando|80|71|5|37|52.1
17|Chata|79|68|5|39|57.4
18|Sofi|77|70|7|36|51.4
19|Tesoro|75|68|3|39|57.4
20|Coco|73|66|6|40|60.6
21|Pucho|72|69|2|35|50.7
22|Lily|70|71|1|34|47.9
23|Isabella|0|0|0|0|0
23|Kimberly|0|0|0|0|0
23|Marta Renée|0|0|0|0|0
23|Mildred|0|0|0|0|0
23|Quique Menjívar|0|0|0|0|0
23|Santiago|0|0|0|0|0
23|Tonito|0|0|0|0|0`);

const knockout = rows(`1|Q|47|31|7|20|64.5
2|Boris|45|31|5|20|64.5
2|Quique Menjívar|45|32|7|19|59.4
4|Profe|44|32|6|20|62.5
4|Sergio|44|32|6|19|59.4
4|Sofi|44|31|6|20|64.5
7|Tesoro|43|32|7|18|56.2
8|Fer|42|32|5|18|56.2
9|Rob|41|32|6|17|53.1
9|Rocio|41|31|4|18|58.1
9|Tonito|41|32|6|18|56.2
12|Ale|39|32|3|18|56.2
13|Eve|38|32|4|19|59.4
14|Chata|37|31|3|19|61.3
15|Marta Renée|35|32|2|16|50
15|Mildred|35|29|5|14|48.3
17|Kimberly|34|30|0|16|53.3
17|Otto|34|30|3|17|56.7
17|Rolando|34|27|2|14|51.8
17|Yuyito|34|30|2|17|56.7
21|Isabella|33|31|2|18|58.1
21|Teto|33|30|3|14|46.7
23|Coco|32|20|2|14|70
24|Estuardo|31|22|4|15|68.2
24|Lily|31|32|3|15|46.9
26|LF|29|29|1|15|51.7
26|Marianne|29|24|4|12|50
28|Santiago|26|29|3|11|37.9
29|Pucho|20|17|3|9|52.9`);

const overall = rows(`1|Boris|141|103|12|66|64.1
2|Q|140|102|12|66|64.7
3|Sergio|139|104|15|63|60.6
4|Profe|137|104|13|64|61.5
5|Otto|132|102|12|62|60.8
5|Rob|132|104|11|61|58.7
7|Rocio|131|101|12|62|61.4
8|Fer|130|103|9|63|61.2
9|Estuardo|124|93|12|59|63.4
10|Teto|122|101|12|59|58.4
11|Sofi|121|101|13|56|55.5
12|Ale|120|104|8|60|57.7
13|Eve|119|103|10|59|57.3
13|Marianne|119|95|10|57|60
15|Tesoro|118|100|10|57|57
16|Chata|116|99|8|58|58.6
16|Yuyito|116|100|5|56|56
18|Rolando|114|98|7|51|52
19|LF|109|101|4|49|48.5
20|Coco|105|86|8|54|62.8
21|Lily|101|103|4|49|47.6
22|Pucho|92|86|5|44|51.2
23|Quique Menjívar|45|32|7|19|59.4
24|Tonito|41|32|6|18|56.2
25|Marta Renée|35|32|2|16|50
25|Mildred|35|29|5|14|48.3
27|Kimberly|34|30|0|16|53.3
28|Isabella|33|31|2|18|58.1
29|Santiago|26|29|3|11|37.9`);

export const finalDashboard = {
  meta: { date: "19 de julio de 2026", participants: 29, matches: 104, predictions: 2408, participation: 79.8 },
  phases: {
    group: { official: true, label: "Grupos", matchCount: 72, predictionCount: 1553, champion: { name: "Otto", points: 98, margin: 2 }, standings: group },
    knockout: { official: true, label: "Eliminatorias", matchCount: 32, predictionCount: 855, champion: { name: "Q", points: 47, margin: 2 }, standings: knockout },
    overall: { official: false, label: "Total informativo", matchCount: 104, predictionCount: 2408, standings: overall },
  },
  qPath: [
    [73, "Dieciseisavos", "Sudáfrica", "Canadá", "0-1"], [76, "Dieciseisavos", "Brasil", "Japón", "2-1"],
    [78, "Dieciseisavos", "Costa de Marfil", "Noruega", "1-2"], [81, "Dieciseisavos", "Estados Unidos", "Bosnia y Herzegovina", "2-0"],
    [83, "Dieciseisavos", "Portugal", "Croacia", "2-1"], [99, "Cuartos", "Noruega", "Inglaterra", "1-1"],
    [102, "Semifinal", "Inglaterra", "Argentina", "1-2"],
  ],
  worldCup: { champion: "España", final: { regulation: [0, 0], extraTime: [1, 0], predictions: 21, distribution: [8, 5, 8], exacts: 0, drawHits: 5 } },
  awards: [
    ["Boris", "Mayor puntaje acumulado", "141 puntos"], ["Sergio", "Más exactos", "15"], ["Q", "Mejor precisión", "64.7%"],
    ["Marianne", "Mejor racha", "11 seguidos"], ["Sofi", "Contra el consenso", "13"], ["Sofi", "Empates pronosticados", "29"],
  ],
  moments: [
    { title: "Cuando medio chat cantó el mismo gol", score: "Portugal 2-1 Croacia", detail: "18 exactos y 67 puntos repartidos.", tone: "celebración" },
    { title: "El otro marcador compartido", score: "Costa de Marfil 1-2 Noruega", detail: "14 exactos y 60 puntos.", tone: "celebración" },
    { title: "Exactitud en grupos", score: "Francia 3-1 Senegal", detail: "10 personas acertaron el marcador.", tone: "celebración" },
    { title: "La tabla de consensos también se equivoca", score: "Ecuador 2-1 Alemania", detail: "20 de 21 fueron con Alemania; solo hubo un acierto de resultado.", tone: "sorpresa" },
    { title: "El tercer lugar inesperado", score: "Francia 4-6 Inglaterra", detail: "0 exactos y 4 aciertos de resultado.", tone: "sorpresa" },
    { title: "El empate que rompió el consenso", score: "Suiza 0-0 Colombia", detail: "Nadie clavó el marcador exacto.", tone: "sorpresa" },
  ],
  knockoutRace,
} satisfies FinalDashboardSnapshot;

export function scorePrediction(actual: readonly [number, number], prediction: readonly [number, number]) {
  if (actual[0] === prediction[0] && actual[1] === prediction[1]) return 3;
  const outcome = Math.sign(actual[0] - actual[1]) === Math.sign(prediction[0] - prediction[1]);
  const exactTeam = actual[0] === prediction[0] || actual[1] === prediction[1];
  return outcome && exactTeam ? 2 : outcome || exactTeam ? 1 : 0;
}

export function rankCompetition(points: readonly number[]) {
  return points.map((point, index) => index === 0 || point !== points[index - 1] ? index + 1 : points.indexOf(point) + 1);
}

export function formatFinalNumber(value: number) {
  return value.toLocaleString("en-US");
}

export const leaderRaceSummary = "Alternativa textual: M73 abrió con Q compartiendo la punta. M88 dejó a Sergio solo con 30. M98 empató a Sergio y Sofi en 42. M100 dejó a Sergio líder con 44. M101 terminó con Q y Sergio empatados en 44. Q tomó el liderato definitivo con 47 en M102 y lo mantuvo plano en M103 y M104.";

export function formatRaceCheckpoint(checkpoint: RaceCheckpoint) {
  const leaders = checkpoint.leaders.length > 1
    ? `${checkpoint.leaders.slice(0, -1).join(", ")} y ${checkpoint.leaders.at(-1)}`
    : checkpoint.leaders[0]!;
  return {
    title: `M${checkpoint.match} · ${checkpoint.fixture}`,
    description: `Marcador: ${checkpoint.score}. Líderes: ${leaders}. Puntos del líder: ${checkpoint.leaderPoints}.`,
    ariaLabel: `M${checkpoint.match}, ${checkpoint.fixture}, marcador ${checkpoint.score}. Lideran ${leaders} con ${checkpoint.leaderPoints} puntos.`,
  };
}

export function createPosterModel(data: FinalDashboardSnapshot) {
  const groupChampion = data.phases.group.champion;
  const knockoutChampion = data.phases.knockout.champion;
  if (!groupChampion || !knockoutChampion) throw new Error("No se puede construir el poster sin campeones");
  return {
    groupChampion,
    knockoutChampion,
    worldChampion: data.worldCup.champion,
    finalScore: data.worldCup.final.regulation.join("-"),
    extraTimeScore: data.worldCup.final.extraTime.join("-"),
    meta: data.meta,
    leaderChanges: countLeaderChanges(data.knockoutRace),
    moments: data.moments.slice(0, 3),
    signature: `Quiniela Mundial 2026 · Archivo familiar · ${data.meta.date}`,
  };
}

export function createDashboardViewModel(data: FinalDashboardSnapshot) {
  const groupChampion = data.phases.group.champion;
  const knockoutChampion = data.phases.knockout.champion;
  const groupRunnerUp = data.phases.group.standings[1];
  const qRow = data.phases.knockout.standings.find((row) => row.name === "Q");
  if (!groupChampion || !knockoutChampion || !groupRunnerUp || !qRow) throw new Error("No se puede construir el dashboard sin clasificaciones oficiales");
  return {
    meta: data.meta,
    groupChampion,
    knockoutChampion,
    groupRunnerUp: { name: groupRunnerUp.name, points: groupRunnerUp.points },
    knockoutRunnerUps: data.phases.knockout.standings.filter((row) => row.rank === 2).map((row) => ({ name: row.name, points: row.points })),
    qSummary: { points: qRow.points, exacts: qRow.exacts, hits: qRow.hits, predictions: qRow.predictions, precision: qRow.precision },
    leaderChanges: countLeaderChanges(data.knockoutRace),
    awards: data.awards,
    final: {
      score: data.worldCup.final.regulation.join("-"),
      extraTimeScore: data.worldCup.final.extraTime.join("-"),
      predictions: data.worldCup.final.predictions,
      exacts: data.worldCup.final.exacts,
      drawHits: data.worldCup.final.drawHits,
      distribution: data.worldCup.final.distribution,
    },
  };
}

function countLeaderChanges(race: readonly RaceCheckpoint[]) {
  return race.filter((checkpoint, index) => index > 0 && checkpoint.leaders.join("|") !== race[index - 1]?.leaders.join("|")).length;
}

export function validateFinalDashboard(data: FinalDashboardSnapshot) {
  const errors: string[] = [];
  const parsed = snapshotSchema.safeParse(data);
  if (!parsed.success) errors.push(`Estructura inválida: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  const forbidden = ["_id", "_creationtime", "pinhash", "tokenhash", "token", "session", "auth", "convex", "userid"];
  const checkForbidden = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(checkForbidden);
    else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
      if (forbidden.includes(key.toLowerCase())) errors.push(`Campo prohibido: ${key}`);
      checkForbidden(child);
    }
    else if (typeof value === "string" && forbidden.some((word) => value.toLowerCase().includes(word))) errors.push("String prohibido en snapshot");
  };
  checkForbidden(data);
  if (data.meta.participants !== 29) errors.push(`Participantes: se esperaban 29 y llegaron ${data.meta.participants}`);
  if (data.meta.matches !== 104) errors.push(`Partidos: se esperaban 104 y llegaron ${data.meta.matches}`);
  if (data.meta.predictions !== 2408) errors.push(`Predicciones: se esperaban 2408 y llegaron ${data.meta.predictions}`);
  if (data.meta.participation !== 79.8) errors.push("Participación inválida");
  for (const [name, phase] of Object.entries(data.phases)) if (phase.standings.length !== 29) errors.push(`Tabla de ${name} incompleta: ${phase.standings.length}/29`);
  if (data.phases.group.champion?.name !== "Otto" || data.phases.group.champion.points !== 98 || data.phases.group.champion.margin !== 2) errors.push("Campeón de grupos inválido");
  if (data.phases.knockout.champion?.name !== "Q" || data.phases.knockout.champion.points !== 47 || data.phases.knockout.champion.margin !== 2) errors.push("Campeón de eliminatorias inválido");
  if (data.phases.group.matchCount !== 72 || data.phases.group.predictionCount !== 1553) errors.push("Grupos inválidos");
  if (data.phases.knockout.matchCount !== 32 || data.phases.knockout.predictionCount !== 855) errors.push("Eliminatorias inválidas");
  if (data.phases.overall.matchCount !== 104 || data.phases.overall.predictionCount !== 2408) errors.push("Predicciones del total inválidas");
  if (data.phases.knockout.standings[1]?.rank !== 2 || data.phases.knockout.standings[2]?.rank !== 2 || data.phases.knockout.standings[3]?.rank !== 4) errors.push("Ranking deportivo inválido");
  if (data.worldCup.champion !== "España" || data.worldCup.final.regulation.join("-") !== "0-0" || data.worldCup.final.extraTime.join("-") !== "1-0") errors.push("Final inválida");
  const finalRace = data.knockoutRace.at(-1);
  if (data.knockoutRace.length !== 32) errors.push(`Carrera incompleta: ${data.knockoutRace.length}/32`);
  if (data.knockoutRace.some((checkpoint, index) => checkpoint.sequence !== index + 1) || new Set(data.knockoutRace.map((checkpoint) => checkpoint.match)).size !== data.knockoutRace.length) errors.push("Secuencia de carrera inválida");
  if (!finalRace || finalRace.scores.q !== 47 || finalRace.scores.sergio !== 44 || finalRace.scores.tesoro !== 43 || finalRace.scores.sofi !== 44 || finalRace.scores.boris !== 45 || finalRace.scores.quique !== 45) errors.push("Valores finales de carrera inválidos");
  if (data.knockoutRace.find((checkpoint) => checkpoint.match === 101)?.leaders.join("|") !== "Q|Sergio") errors.push("M101 inválido");
  if (data.knockoutRace.find((checkpoint) => checkpoint.match === 102)?.scores.q !== 47) errors.push("M102 inválido");
  if (data.knockoutRace.slice(-2).some((checkpoint) => checkpoint.leaders.join("|") !== "Q")) errors.push("M103/M104 deben mantener a Q líder");
  if (countLeaderChanges(data.knockoutRace) !== 14) errors.push("Cambios de líder inválidos");
  if (data.qPath.length !== 7 || data.qPath.at(-1)?.join("|") !== "102|Semifinal|Inglaterra|Argentina|1-2") errors.push("Ruta de Q inválida");
  if (data.awards.map((award) => award.join("|")).join(";") !== "Boris|Mayor puntaje acumulado|141 puntos;Sergio|Más exactos|15;Q|Mejor precisión|64.7%;Marianne|Mejor racha|11 seguidos;Sofi|Contra el consenso|13;Sofi|Empates pronosticados|29") errors.push("Reconocimientos inválidos");
  return errors;
}

const snapshotErrors = validateFinalDashboard(finalDashboard);
if (snapshotErrors.length) throw new Error(`Snapshot final inválido: ${snapshotErrors.join("; ")}`);
