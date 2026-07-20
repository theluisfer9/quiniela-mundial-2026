import { describe, expect, it } from "bun:test";
import * as dashboardData from "./final-dashboard-data";

import {
  createDashboardViewModel,
  createPosterModel,
  finalDashboard,
  formatFinalNumber,
  leaderRaceSummary,
  rankCompetition,
  scorePrediction,
  validateFinalDashboard,
} from "./final-dashboard-data";
import { getMobileStandingsRows, mobileNav, nextTabIndex, standingsDisclosureLabel } from "./final-dashboard-ui";

describe("final dashboard snapshot", () => {
  it("keeps the approved public invariants", () => {
    expect(validateFinalDashboard(finalDashboard)).toEqual([]);
    expect(finalDashboard.phases.group.standings).toHaveLength(29);
    expect(finalDashboard.phases.knockout.standings).toHaveLength(29);
    expect(finalDashboard.phases.overall.standings).toHaveLength(29);
    expect(finalDashboard.phases.group.champion).toEqual({ name: "Otto", points: 98, margin: 2 });
    expect(finalDashboard.phases.knockout.champion).toEqual({ name: "Q", points: 47, margin: 2 });
    expect(finalDashboard.worldCup.final.regulation).toEqual([0, 0]);
    expect(finalDashboard.worldCup.final.extraTime).toEqual([1, 0]);
  });

  it("rejects an invalid snapshot with precise failures", () => {
    const invalid = structuredClone(finalDashboard);
    invalid.meta.participants = 28;
    invalid.phases.knockout.champion = { name: "Q", points: 46, margin: 2 };
    expect(validateFinalDashboard(invalid)).toContain("Participantes: se esperaban 29 y llegaron 28");
    expect(validateFinalDashboard(invalid)).toContain("Campeón de eliminatorias inválido");
  });

  it("transcribes the 32 real leader-race checkpoints", () => {
    const race = finalDashboard.knockoutRace;
    expect(race).toHaveLength(32);
    expect(race[0]?.match).toBe(73);
    expect(race.at(-1)?.scores).toEqual({ q: 47, sergio: 44, tesoro: 43, sofi: 44, boris: 45, quique: 45 });
    expect(race.find((checkpoint) => checkpoint.match === 101)?.leaders).toEqual(["Q", "Sergio"]);
    expect(race.find((checkpoint) => checkpoint.match === 102)?.scores.q).toBe(47);
    expect(race.slice(-2).map((checkpoint) => checkpoint.leaders)).toEqual([["Q"], ["Q"]]);
    expect(race.filter((checkpoint, index) => index > 0 && checkpoint.leaders.join("|") !== race[index - 1]?.leaders.join("|")).length).toBe(14);
  });

  it("muestra todos los fixtures de la carrera en español", () => {
    const visibleFixtures = finalDashboard.knockoutRace.map((checkpoint) => checkpoint.fixture).join(" ");
    for (const englishName of ["South Africa", "France", "England", "Spain", "Germany", "Switzerland"]) {
      expect(visibleFixtures).not.toContain(englishName);
    }
    expect(visibleFixtures).toContain("Sudáfrica vs Canadá");
    expect(visibleFixtures).toContain("Inglaterra vs Argentina");
  });

  it("mantiene los seis hitos en la alternativa textual de carrera", () => {
    for (const milestone of ["M73", "M88", "M98", "M100", "M101", "M102"]) expect(leaderRaceSummary).toContain(milestone);
  });

  it("formatea el detalle accesible de cada checkpoint desde el dataset", () => {
    const formatRaceCheckpoint = Reflect.get(dashboardData, "formatRaceCheckpoint") as ((checkpoint: (typeof finalDashboard.knockoutRace)[number]) => { title: string; description: string; ariaLabel: string });
    expect(formatRaceCheckpoint).toBeFunction();
    const detail = formatRaceCheckpoint(finalDashboard.knockoutRace.find((checkpoint) => checkpoint.match === 101)!);
    expect(detail.title).toBe("M101 · Francia vs España");
    expect(detail.description).toBe("Marcador: 0-2. Líderes: Q y Sergio. Puntos del líder: 44.");
    expect(detail.ariaLabel).toBe("M101, Francia vs España, marcador 0-2. Lideran Q y Sergio con 44 puntos.");
    expect(formatRaceCheckpoint(finalDashboard.knockoutRace[0]!).ariaLabel).toContain("Mildred, Q y Sofi");
  });

  it("derives the poster from the same snapshot", () => {
    const poster = createPosterModel(finalDashboard);
    expect(poster.knockoutChampion.points).toBe(finalDashboard.phases.knockout.champion?.points);
    expect(poster.groupChampion.points).toBe(finalDashboard.phases.group.champion?.points);
    expect(poster.finalScore).toBe("0-0");
    expect(poster.extraTimeScore).toBe("1-0");
    expect(poster.moments).toHaveLength(3);
    expect(poster.meta.predictions).toBe(finalDashboard.meta.predictions);
    expect(poster.signature).toBe("Quiniela Mundial 2026 · Archivo familiar · 19 de julio de 2026");
  });

  it("derives every critical dashboard number from a mutable snapshot fixture", () => {
    const fixture = structuredClone(finalDashboard);
    fixture.phases.group.champion = { name: "Cambio campeón grupos", points: 99, margin: 3 };
    fixture.phases.group.standings[1]!.name = "Cambio grupos";
    fixture.phases.group.standings[1]!.points = 95;
    fixture.phases.knockout.champion = { name: "Cambio campeón eliminatorias", points: 49, margin: 4 };
    fixture.phases.knockout.standings[0]!.points = 48;
    fixture.phases.knockout.standings[0]!.exacts = 8;
    fixture.phases.knockout.standings[0]!.hits = 21;
    fixture.phases.knockout.standings[0]!.predictions = 30;
    fixture.phases.knockout.standings[0]!.precision = 70;
    fixture.phases.knockout.standings[1]!.name = "Cambio subcampeón uno";
    fixture.phases.knockout.standings[1]!.points = 46;
    fixture.phases.knockout.standings[2]!.name = "Cambio subcampeón dos";
    fixture.phases.knockout.standings[2]!.points = 46;
    fixture.awards[0] = ["Cambio premio", "Mayor puntaje acumulado", "142 puntos"];
    fixture.awards[1] = ["Cambio premio dos", "Más exactos", "16"];
    fixture.awards[2] = ["Cambio premio tres", "Mejor precisión", "65.7%"];
    fixture.awards[3] = ["Cambio premio cuatro", "Mejor racha", "12 seguidos"];
    fixture.awards[4] = ["Cambio premio cinco", "Contra el consenso", "14"];
    fixture.awards[5] = ["Cambio premio seis", "Empates pronosticados", "30"];
    fixture.worldCup.final = { regulation: [2, 2], extraTime: [3, 2], predictions: 22, distribution: [7, 6, 9], exacts: 1, drawHits: 6 };
    fixture.meta.participants = 30;
    fixture.meta.matches = 105;
    fixture.meta.predictions = 2409;
    fixture.meta.participation = 82.5;

    const viewModel = createDashboardViewModel(fixture);

    expect(viewModel.groupChampion).toEqual({ name: "Cambio campeón grupos", points: 99, margin: 3 });
    expect(viewModel.groupRunnerUp).toEqual({ name: "Cambio grupos", points: 95 });
    expect(viewModel.knockoutChampion).toEqual({ name: "Cambio campeón eliminatorias", points: 49, margin: 4 });
    expect(viewModel.knockoutRunnerUps).toEqual([{ name: "Cambio subcampeón uno", points: 46 }, { name: "Cambio subcampeón dos", points: 46 }]);
    expect(viewModel.qSummary).toEqual({ points: 48, exacts: 8, hits: 21, predictions: 30, precision: 70 });
    expect(viewModel.awards[0]).toEqual(["Cambio premio", "Mayor puntaje acumulado", "142 puntos"]);
    expect(viewModel.awards).toEqual([
      ["Cambio premio", "Mayor puntaje acumulado", "142 puntos"],
      ["Cambio premio dos", "Más exactos", "16"],
      ["Cambio premio tres", "Mejor precisión", "65.7%"],
      ["Cambio premio cuatro", "Mejor racha", "12 seguidos"],
      ["Cambio premio cinco", "Contra el consenso", "14"],
      ["Cambio premio seis", "Empates pronosticados", "30"],
    ]);
    expect(viewModel.final).toEqual({ score: "2-2", extraTimeScore: "3-2", predictions: 22, exacts: 1, drawHits: 6, distribution: [7, 6, 9] });
    expect(viewModel.meta).toMatchObject({ participants: 30, matches: 105, predictions: 2409, participation: 82.5 });
    expect(viewModel.leaderChanges).toBe(14);
    fixture.knockoutRace[6]!.leaders = ["Líder sintético"];
    expect(createDashboardViewModel(fixture).leaderChanges).toBe(15);
  });

  it("selects six mobile standings rows until disclosure expands", () => {
    const rows = finalDashboard.phases.group.standings;
    expect(getMobileStandingsRows(rows, false)).toHaveLength(6);
    expect(getMobileStandingsRows(rows, true)).toHaveLength(29);
    expect(standingsDisclosureLabel(false, rows.length)).toBe("Ver los 29 participantes");
    expect(standingsDisclosureLabel(true, rows.length)).toBe("Mostrar solo los primeros 6");
  });

  it("mantiene 2,408 con el separador editorial aprobado", () => {
    expect(formatFinalNumber(finalDashboard.meta.predictions)).toBe("2,408");
  });

  it("rechaza tipos, secretos, fases y checkpoints inválidos antes de renderizar", () => {
    const invalid = structuredClone(finalDashboard);
    invalid.phases.overall.predictionCount = 2407;
    invalid.knockoutRace[0]!.sequence = 2;
    Object.assign(invalid, { pinHash: "prohibido" });
    const errors = validateFinalDashboard(invalid);
    expect(errors).toContain("Predicciones del total inválidas");
    expect(errors).toContain("Secuencia de carrera inválida");
    expect(errors).toContain("Campo prohibido: pinHash");
  });

  it("rechaza tipos inválidos con un error de estructura", () => {
    const invalid = structuredClone(finalDashboard);
    Object.assign(invalid.meta, { participants: "veintinueve" });
    expect(validateFinalDashboard(invalid)).toContain("Estructura inválida: meta.participants");
  });

  it("scores only the regulation result", () => {
    expect(scorePrediction([0, 0], [0, 0])).toBe(3);
    expect(scorePrediction([2, 1], [2, 0])).toBe(2);
    expect(scorePrediction([2, 1], [3, 2])).toBe(1);
    expect(scorePrediction([2, 1], [0, 0])).toBe(0);
  });

  it("uses competition ranks and preserves ties", () => {
    expect(rankCompetition([10, 8, 8, 4])).toEqual([1, 2, 2, 4]);
  });

  it("moves final-standings tabs with arrow keys", () => {
    expect(nextTabIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextTabIndex(2, "Home", 3)).toBe(0);
    expect(mobileNav.map((item) => item.href)).toEqual(["#historia", "#campeones", "#momentos", "#tabla-final"]);
  });

  it("declares Spanish and an essential no-JavaScript summary", async () => {
    const html = await Bun.file(new URL("../../../index.html", import.meta.url)).text();
    expect(html).toContain('<html lang="es">');
    expect(html).toContain("<noscript>");
    for (const value of ["Q ganó", "47", "Otto", "98", "España", "29", "104", "2,408", "0-0", "3 puntos"]) expect(html).toContain(value);
  });

  it("declares the six responsive editorial illustrations with the required loading policy", async () => {
    const source = await Bun.file(new URL("./final-dashboard.tsx", import.meta.url)).text();
    const illustrations = [
      ["01-tres-coronas", "Ilustración con una copa azul para Otto, una copa roja para Q con siete marcadores y una copa mundial abstracta junto a la bandera de España."],
      ["02-carrera-catorce-cambios", "Pistas de colores se cruzan catorce veces hasta que la línea roja de Q termina al frente."],
      ["03-siete-exactos", "Siete boletos de marcador forman un camino ascendente y el último se convierte en la copa roja de Q."],
      ["04-alegria-y-golpe", "A un lado, dieciocho fichas celebran un acierto colectivo; al otro, veinte flechas fallan y una ficha acierta."],
      ["05-salon-de-estilos", "Seis objetos deportivos representan el puntaje, los exactos, la precisión, la racha, los aciertos contra el consenso y los empates."],
      ["06-final-nadie-clavo", "Un tablero marca una final sin goles, veintiuna fichas se dividen en grupos de ocho, cinco y ocho, y España aparece campeona."],
    ];

    expect(source).toContain("<picture");
    expect(source).toContain('<source media="(max-width: 767px)" srcSet={mobile}/>');
    expect(source).toContain('src={desktop}');
    expect(source).toContain("width={width}");
    expect(source).toContain("height={height}");
    for (const [name, alt] of illustrations) {
      expect(source).toContain(`/illustrations/${name}-desktop.webp`);
      expect(source).toContain(`/illustrations/${name}-mobile.webp`);
      expect(source).toContain(alt);
    }
    expect(source).toContain('fetchPriority={priority ? "high" : undefined}');
    expect(source).toContain('loading={priority ? "eager" : "lazy"}');
    expect(source).toContain('decoding={priority ? "auto" : "async"}');
    expect(source.match(/priority width=/g)).toHaveLength(1);
  });
});
