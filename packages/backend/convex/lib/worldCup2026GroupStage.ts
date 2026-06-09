type SeededTeam = {
  code: string;
  name: string;
  flagEmoji?: string;
  groupCode: string;
  worldRanking?: number;
  isHost?: boolean;
};

type SeededMatchSource = {
  groupCode: string;
  matchNumber: number;
  homeTeamCode: string;
  awayTeamCode: string;
  localDate: string;
  localTime: string;
  utcOffsetHours: number;
  venue: string;
};

export type SeededGroupStageMatch = SeededMatchSource & {
  kickoffAt: number;
  stageLabel: string;
  status: "scheduled";
};

export function toKickoffEpochMs(args: {
  localDate: string;
  localTime: string;
  utcOffsetHours: number;
}) {
  const [year, month, day] = args.localDate.split("-").map(Number);
  const [hour, minute] = args.localTime.split(":").map(Number);

  return Date.UTC(year, month - 1, day, hour - args.utcOffsetHours, minute);
}

export const seededGroupStageTeams: SeededTeam[] = [
  { code: "MEX", name: "México", flagEmoji: "🇲🇽", groupCode: "A", worldRanking: 15, isHost: true },
  { code: "RSA", name: "Sudáfrica", flagEmoji: "🇿🇦", groupCode: "A", worldRanking: 61 },
  { code: "KOR", name: "Corea del Sur", flagEmoji: "🇰🇷", groupCode: "A", worldRanking: 22 },
  { code: "CZE", name: "República Checa", flagEmoji: "🇨🇿", groupCode: "A" },
  { code: "CAN", name: "Canadá", flagEmoji: "🇨🇦", groupCode: "B", worldRanking: 27, isHost: true },
  { code: "BIH", name: "Bosnia y Herzegovina", flagEmoji: "🇧🇦", groupCode: "B" },
  { code: "QAT", name: "Catar", flagEmoji: "🇶🇦", groupCode: "B", worldRanking: 51 },
  { code: "SUI", name: "Suiza", flagEmoji: "🇨🇭", groupCode: "B", worldRanking: 17 },
  { code: "BRA", name: "Brasil", flagEmoji: "🇧🇷", groupCode: "C", worldRanking: 5 },
  { code: "MAR", name: "Marruecos", flagEmoji: "🇲🇦", groupCode: "C", worldRanking: 11 },
  { code: "HAI", name: "Haití", flagEmoji: "🇭🇹", groupCode: "C", worldRanking: 84 },
  { code: "SCO", name: "Escocia", groupCode: "C", worldRanking: 36 },
  { code: "USA", name: "Estados Unidos", flagEmoji: "🇺🇸", groupCode: "D", worldRanking: 14, isHost: true },
  { code: "PAR", name: "Paraguay", flagEmoji: "🇵🇾", groupCode: "D", worldRanking: 39 },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", groupCode: "D", worldRanking: 26 },
  { code: "TUR", name: "Turquía", flagEmoji: "🇹🇷", groupCode: "D" },
  { code: "GER", name: "Alemania", flagEmoji: "🇩🇪", groupCode: "E", worldRanking: 9 },
  { code: "CUW", name: "Curaçao", flagEmoji: "🇨🇼", groupCode: "E", worldRanking: 82 },
  { code: "CIV", name: "Costa de Marfil", flagEmoji: "🇨🇮", groupCode: "E", worldRanking: 42 },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", groupCode: "E", worldRanking: 23 },
  { code: "NED", name: "Países Bajos", flagEmoji: "🇳🇱", groupCode: "F", worldRanking: 7 },
  { code: "JPN", name: "Japón", flagEmoji: "🇯🇵", groupCode: "F", worldRanking: 18 },
  { code: "SWE", name: "Suecia", flagEmoji: "🇸🇪", groupCode: "F" },
  { code: "TUN", name: "Túnez", flagEmoji: "🇹🇳", groupCode: "F", worldRanking: 40 },
  { code: "BEL", name: "Bélgica", flagEmoji: "🇧🇪", groupCode: "G", worldRanking: 8 },
  { code: "EGY", name: "Egipto", flagEmoji: "🇪🇬", groupCode: "G", worldRanking: 34 },
  { code: "IRN", name: "Irán", flagEmoji: "🇮🇷", groupCode: "G", worldRanking: 20 },
  { code: "NZL", name: "Nueva Zelanda", flagEmoji: "🇳🇿", groupCode: "G", worldRanking: 86 },
  { code: "ESP", name: "España", flagEmoji: "🇪🇸", groupCode: "H", worldRanking: 1 },
  { code: "CPV", name: "Cabo Verde", flagEmoji: "🇨🇻", groupCode: "H", worldRanking: 68 },
  { code: "KSA", name: "Arabia Saudita", flagEmoji: "🇸🇦", groupCode: "H", worldRanking: 60 },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", groupCode: "H", worldRanking: 16 },
  { code: "FRA", name: "Francia", flagEmoji: "🇫🇷", groupCode: "I", worldRanking: 3 },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", groupCode: "I", worldRanking: 19 },
  { code: "IRQ", name: "Irak", flagEmoji: "🇮🇶", groupCode: "I" },
  { code: "NOR", name: "Noruega", flagEmoji: "🇳🇴", groupCode: "I", worldRanking: 29 },
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", groupCode: "J", worldRanking: 2 },
  { code: "ALG", name: "Argelia", flagEmoji: "🇩🇿", groupCode: "J", worldRanking: 35 },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", groupCode: "J", worldRanking: 24 },
  { code: "JOR", name: "Jordania", flagEmoji: "🇯🇴", groupCode: "J", worldRanking: 66 },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", groupCode: "K", worldRanking: 6 },
  { code: "COD", name: "DR Congo", flagEmoji: "🇨🇩", groupCode: "K" },
  { code: "UZB", name: "Uzbekistán", flagEmoji: "🇺🇿", groupCode: "K", worldRanking: 50 },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", groupCode: "K", worldRanking: 13 },
  { code: "ENG", name: "Inglaterra", groupCode: "L", worldRanking: 4 },
  { code: "CRO", name: "Croacia", flagEmoji: "🇭🇷", groupCode: "L", worldRanking: 10 },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", groupCode: "L", worldRanking: 72 },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", groupCode: "L", worldRanking: 30 },
];

const seededGroupStageMatchSources: SeededMatchSource[] = [
  { groupCode: "A", matchNumber: 1, homeTeamCode: "MEX", awayTeamCode: "RSA", localDate: "2026-06-11", localTime: "13:00", utcOffsetHours: -6, venue: "Estadio Azteca, Mexico City" },
  { groupCode: "A", matchNumber: 2, homeTeamCode: "KOR", awayTeamCode: "CZE", localDate: "2026-06-11", localTime: "20:00", utcOffsetHours: -6, venue: "Estadio Akron, Zapopan" },
  { groupCode: "A", matchNumber: 25, homeTeamCode: "CZE", awayTeamCode: "RSA", localDate: "2026-06-18", localTime: "12:00", utcOffsetHours: -4, venue: "Mercedes-Benz Stadium, Atlanta" },
  { groupCode: "A", matchNumber: 28, homeTeamCode: "MEX", awayTeamCode: "KOR", localDate: "2026-06-18", localTime: "19:00", utcOffsetHours: -6, venue: "Estadio Akron, Zapopan" },
  { groupCode: "A", matchNumber: 53, homeTeamCode: "CZE", awayTeamCode: "MEX", localDate: "2026-06-24", localTime: "19:00", utcOffsetHours: -6, venue: "Estadio Azteca, Mexico City" },
  { groupCode: "A", matchNumber: 54, homeTeamCode: "RSA", awayTeamCode: "KOR", localDate: "2026-06-24", localTime: "19:00", utcOffsetHours: -6, venue: "Estadio BBVA, Guadalupe" },
  { groupCode: "B", matchNumber: 3, homeTeamCode: "CAN", awayTeamCode: "BIH", localDate: "2026-06-12", localTime: "15:00", utcOffsetHours: -4, venue: "BMO Field, Toronto" },
  { groupCode: "B", matchNumber: 8, homeTeamCode: "QAT", awayTeamCode: "SUI", localDate: "2026-06-13", localTime: "12:00", utcOffsetHours: -7, venue: "Levi's Stadium, Santa Clara" },
  { groupCode: "B", matchNumber: 26, homeTeamCode: "SUI", awayTeamCode: "BIH", localDate: "2026-06-18", localTime: "12:00", utcOffsetHours: -7, venue: "SoFi Stadium, Inglewood" },
  { groupCode: "B", matchNumber: 27, homeTeamCode: "CAN", awayTeamCode: "QAT", localDate: "2026-06-18", localTime: "15:00", utcOffsetHours: -7, venue: "BC Place, Vancouver" },
  { groupCode: "B", matchNumber: 51, homeTeamCode: "SUI", awayTeamCode: "CAN", localDate: "2026-06-24", localTime: "12:00", utcOffsetHours: -7, venue: "BC Place, Vancouver" },
  { groupCode: "B", matchNumber: 52, homeTeamCode: "BIH", awayTeamCode: "QAT", localDate: "2026-06-24", localTime: "12:00", utcOffsetHours: -7, venue: "Lumen Field, Seattle" },
  { groupCode: "C", matchNumber: 7, homeTeamCode: "BRA", awayTeamCode: "MAR", localDate: "2026-06-13", localTime: "18:00", utcOffsetHours: -4, venue: "MetLife Stadium, East Rutherford" },
  { groupCode: "C", matchNumber: 5, homeTeamCode: "HAI", awayTeamCode: "SCO", localDate: "2026-06-13", localTime: "21:00", utcOffsetHours: -4, venue: "Gillette Stadium, Foxborough" },
  { groupCode: "C", matchNumber: 30, homeTeamCode: "SCO", awayTeamCode: "MAR", localDate: "2026-06-19", localTime: "18:00", utcOffsetHours: -4, venue: "Gillette Stadium, Foxborough" },
  { groupCode: "C", matchNumber: 29, homeTeamCode: "BRA", awayTeamCode: "HAI", localDate: "2026-06-19", localTime: "20:30", utcOffsetHours: -4, venue: "Lincoln Financial Field, Philadelphia" },
  { groupCode: "C", matchNumber: 49, homeTeamCode: "SCO", awayTeamCode: "BRA", localDate: "2026-06-24", localTime: "18:00", utcOffsetHours: -4, venue: "Hard Rock Stadium, Miami Gardens" },
  { groupCode: "C", matchNumber: 50, homeTeamCode: "MAR", awayTeamCode: "HAI", localDate: "2026-06-24", localTime: "18:00", utcOffsetHours: -4, venue: "Mercedes-Benz Stadium, Atlanta" },
  { groupCode: "D", matchNumber: 4, homeTeamCode: "USA", awayTeamCode: "PAR", localDate: "2026-06-12", localTime: "18:00", utcOffsetHours: -7, venue: "SoFi Stadium, Inglewood" },
  { groupCode: "D", matchNumber: 6, homeTeamCode: "AUS", awayTeamCode: "TUR", localDate: "2026-06-13", localTime: "21:00", utcOffsetHours: -7, venue: "BC Place, Vancouver" },
  { groupCode: "D", matchNumber: 32, homeTeamCode: "USA", awayTeamCode: "AUS", localDate: "2026-06-19", localTime: "12:00", utcOffsetHours: -7, venue: "Lumen Field, Seattle" },
  { groupCode: "D", matchNumber: 31, homeTeamCode: "TUR", awayTeamCode: "PAR", localDate: "2026-06-19", localTime: "20:00", utcOffsetHours: -7, venue: "Levi's Stadium, Santa Clara" },
  { groupCode: "D", matchNumber: 59, homeTeamCode: "TUR", awayTeamCode: "USA", localDate: "2026-06-25", localTime: "19:00", utcOffsetHours: -7, venue: "SoFi Stadium, Inglewood" },
  { groupCode: "D", matchNumber: 60, homeTeamCode: "PAR", awayTeamCode: "AUS", localDate: "2026-06-25", localTime: "19:00", utcOffsetHours: -7, venue: "Levi's Stadium, Santa Clara" },
  { groupCode: "E", matchNumber: 10, homeTeamCode: "GER", awayTeamCode: "CUW", localDate: "2026-06-14", localTime: "12:00", utcOffsetHours: -5, venue: "NRG Stadium, Houston" },
  { groupCode: "E", matchNumber: 9, homeTeamCode: "CIV", awayTeamCode: "ECU", localDate: "2026-06-14", localTime: "19:00", utcOffsetHours: -4, venue: "Lincoln Financial Field, Philadelphia" },
  { groupCode: "E", matchNumber: 33, homeTeamCode: "GER", awayTeamCode: "CIV", localDate: "2026-06-20", localTime: "16:00", utcOffsetHours: -4, venue: "BMO Field, Toronto" },
  { groupCode: "E", matchNumber: 34, homeTeamCode: "ECU", awayTeamCode: "CUW", localDate: "2026-06-20", localTime: "19:00", utcOffsetHours: -5, venue: "Arrowhead Stadium, Kansas City" },
  { groupCode: "E", matchNumber: 55, homeTeamCode: "CUW", awayTeamCode: "CIV", localDate: "2026-06-25", localTime: "16:00", utcOffsetHours: -4, venue: "Lincoln Financial Field, Philadelphia" },
  { groupCode: "E", matchNumber: 56, homeTeamCode: "ECU", awayTeamCode: "GER", localDate: "2026-06-25", localTime: "16:00", utcOffsetHours: -4, venue: "MetLife Stadium, East Rutherford" },
  { groupCode: "F", matchNumber: 11, homeTeamCode: "NED", awayTeamCode: "JPN", localDate: "2026-06-14", localTime: "15:00", utcOffsetHours: -5, venue: "AT&T Stadium, Arlington" },
  { groupCode: "F", matchNumber: 12, homeTeamCode: "SWE", awayTeamCode: "TUN", localDate: "2026-06-14", localTime: "20:00", utcOffsetHours: -6, venue: "Estadio BBVA, Guadalupe" },
  { groupCode: "F", matchNumber: 35, homeTeamCode: "NED", awayTeamCode: "SWE", localDate: "2026-06-20", localTime: "12:00", utcOffsetHours: -5, venue: "NRG Stadium, Houston" },
  { groupCode: "F", matchNumber: 36, homeTeamCode: "TUN", awayTeamCode: "JPN", localDate: "2026-06-20", localTime: "10:00", utcOffsetHours: -6, venue: "Estadio BBVA, Guadalupe" },
  { groupCode: "F", matchNumber: 57, homeTeamCode: "JPN", awayTeamCode: "SWE", localDate: "2026-06-25", localTime: "18:00", utcOffsetHours: -5, venue: "AT&T Stadium, Arlington" },
  { groupCode: "F", matchNumber: 58, homeTeamCode: "TUN", awayTeamCode: "NED", localDate: "2026-06-25", localTime: "18:00", utcOffsetHours: -5, venue: "Arrowhead Stadium, Kansas City" },
  { groupCode: "G", matchNumber: 16, homeTeamCode: "BEL", awayTeamCode: "EGY", localDate: "2026-06-15", localTime: "12:00", utcOffsetHours: -7, venue: "Lumen Field, Seattle" },
  { groupCode: "G", matchNumber: 15, homeTeamCode: "IRN", awayTeamCode: "NZL", localDate: "2026-06-15", localTime: "18:00", utcOffsetHours: -7, venue: "SoFi Stadium, Inglewood" },
  { groupCode: "G", matchNumber: 39, homeTeamCode: "BEL", awayTeamCode: "IRN", localDate: "2026-06-21", localTime: "12:00", utcOffsetHours: -7, venue: "SoFi Stadium, Inglewood" },
  { groupCode: "G", matchNumber: 40, homeTeamCode: "NZL", awayTeamCode: "EGY", localDate: "2026-06-21", localTime: "18:00", utcOffsetHours: -7, venue: "BC Place, Vancouver" },
  { groupCode: "G", matchNumber: 63, homeTeamCode: "EGY", awayTeamCode: "IRN", localDate: "2026-06-26", localTime: "20:00", utcOffsetHours: -7, venue: "Lumen Field, Seattle" },
  { groupCode: "G", matchNumber: 64, homeTeamCode: "NZL", awayTeamCode: "BEL", localDate: "2026-06-26", localTime: "20:00", utcOffsetHours: -7, venue: "BC Place, Vancouver" },
  { groupCode: "H", matchNumber: 14, homeTeamCode: "ESP", awayTeamCode: "CPV", localDate: "2026-06-15", localTime: "12:00", utcOffsetHours: -4, venue: "Mercedes-Benz Stadium, Atlanta" },
  { groupCode: "H", matchNumber: 13, homeTeamCode: "KSA", awayTeamCode: "URU", localDate: "2026-06-15", localTime: "18:00", utcOffsetHours: -4, venue: "Hard Rock Stadium, Miami Gardens" },
  { groupCode: "H", matchNumber: 38, homeTeamCode: "ESP", awayTeamCode: "KSA", localDate: "2026-06-21", localTime: "12:00", utcOffsetHours: -4, venue: "Mercedes-Benz Stadium, Atlanta" },
  { groupCode: "H", matchNumber: 37, homeTeamCode: "URU", awayTeamCode: "CPV", localDate: "2026-06-21", localTime: "18:00", utcOffsetHours: -4, venue: "Hard Rock Stadium, Miami Gardens" },
  { groupCode: "H", matchNumber: 65, homeTeamCode: "CPV", awayTeamCode: "KSA", localDate: "2026-06-26", localTime: "19:00", utcOffsetHours: -5, venue: "NRG Stadium, Houston" },
  { groupCode: "H", matchNumber: 66, homeTeamCode: "URU", awayTeamCode: "ESP", localDate: "2026-06-26", localTime: "18:00", utcOffsetHours: -6, venue: "Estadio Akron, Zapopan" },
  { groupCode: "I", matchNumber: 17, homeTeamCode: "FRA", awayTeamCode: "SEN", localDate: "2026-06-16", localTime: "15:00", utcOffsetHours: -4, venue: "MetLife Stadium, East Rutherford" },
  { groupCode: "I", matchNumber: 18, homeTeamCode: "IRQ", awayTeamCode: "NOR", localDate: "2026-06-16", localTime: "18:00", utcOffsetHours: -4, venue: "Gillette Stadium, Foxborough" },
  { groupCode: "I", matchNumber: 42, homeTeamCode: "FRA", awayTeamCode: "IRQ", localDate: "2026-06-22", localTime: "17:00", utcOffsetHours: -4, venue: "Lincoln Financial Field, Philadelphia" },
  { groupCode: "I", matchNumber: 41, homeTeamCode: "NOR", awayTeamCode: "SEN", localDate: "2026-06-22", localTime: "20:00", utcOffsetHours: -4, venue: "MetLife Stadium, East Rutherford" },
  { groupCode: "I", matchNumber: 61, homeTeamCode: "NOR", awayTeamCode: "FRA", localDate: "2026-06-26", localTime: "15:00", utcOffsetHours: -4, venue: "Gillette Stadium, Foxborough" },
  { groupCode: "I", matchNumber: 62, homeTeamCode: "SEN", awayTeamCode: "IRQ", localDate: "2026-06-26", localTime: "15:00", utcOffsetHours: -4, venue: "BMO Field, Toronto" },
  { groupCode: "J", matchNumber: 19, homeTeamCode: "ARG", awayTeamCode: "ALG", localDate: "2026-06-16", localTime: "20:00", utcOffsetHours: -5, venue: "Arrowhead Stadium, Kansas City" },
  { groupCode: "J", matchNumber: 20, homeTeamCode: "AUT", awayTeamCode: "JOR", localDate: "2026-06-16", localTime: "21:00", utcOffsetHours: -7, venue: "Levi's Stadium, Santa Clara" },
  { groupCode: "J", matchNumber: 43, homeTeamCode: "ARG", awayTeamCode: "AUT", localDate: "2026-06-22", localTime: "12:00", utcOffsetHours: -5, venue: "AT&T Stadium, Arlington" },
  { groupCode: "J", matchNumber: 44, homeTeamCode: "JOR", awayTeamCode: "ALG", localDate: "2026-06-22", localTime: "20:00", utcOffsetHours: -7, venue: "Levi's Stadium, Santa Clara" },
  { groupCode: "J", matchNumber: 69, homeTeamCode: "ALG", awayTeamCode: "AUT", localDate: "2026-06-27", localTime: "21:00", utcOffsetHours: -5, venue: "Arrowhead Stadium, Kansas City" },
  { groupCode: "J", matchNumber: 70, homeTeamCode: "JOR", awayTeamCode: "ARG", localDate: "2026-06-27", localTime: "21:00", utcOffsetHours: -5, venue: "AT&T Stadium, Arlington" },
  { groupCode: "K", matchNumber: 23, homeTeamCode: "POR", awayTeamCode: "COD", localDate: "2026-06-17", localTime: "12:00", utcOffsetHours: -5, venue: "NRG Stadium, Houston" },
  { groupCode: "K", matchNumber: 24, homeTeamCode: "UZB", awayTeamCode: "COL", localDate: "2026-06-17", localTime: "20:00", utcOffsetHours: -6, venue: "Estadio Azteca, Mexico City" },
  { groupCode: "K", matchNumber: 47, homeTeamCode: "POR", awayTeamCode: "UZB", localDate: "2026-06-23", localTime: "12:00", utcOffsetHours: -5, venue: "NRG Stadium, Houston" },
  { groupCode: "K", matchNumber: 48, homeTeamCode: "COL", awayTeamCode: "COD", localDate: "2026-06-23", localTime: "20:00", utcOffsetHours: -6, venue: "Estadio Akron, Zapopan" },
  { groupCode: "K", matchNumber: 71, homeTeamCode: "COL", awayTeamCode: "POR", localDate: "2026-06-27", localTime: "19:30", utcOffsetHours: -4, venue: "Hard Rock Stadium, Miami Gardens" },
  { groupCode: "K", matchNumber: 72, homeTeamCode: "COD", awayTeamCode: "UZB", localDate: "2026-06-27", localTime: "19:30", utcOffsetHours: -4, venue: "Mercedes-Benz Stadium, Atlanta" },
  { groupCode: "L", matchNumber: 22, homeTeamCode: "ENG", awayTeamCode: "CRO", localDate: "2026-06-17", localTime: "15:00", utcOffsetHours: -5, venue: "AT&T Stadium, Arlington" },
  { groupCode: "L", matchNumber: 21, homeTeamCode: "GHA", awayTeamCode: "PAN", localDate: "2026-06-17", localTime: "19:00", utcOffsetHours: -4, venue: "BMO Field, Toronto" },
  { groupCode: "L", matchNumber: 45, homeTeamCode: "ENG", awayTeamCode: "GHA", localDate: "2026-06-23", localTime: "16:00", utcOffsetHours: -4, venue: "Gillette Stadium, Foxborough" },
  { groupCode: "L", matchNumber: 46, homeTeamCode: "PAN", awayTeamCode: "CRO", localDate: "2026-06-23", localTime: "19:00", utcOffsetHours: -4, venue: "BMO Field, Toronto" },
  { groupCode: "L", matchNumber: 67, homeTeamCode: "PAN", awayTeamCode: "ENG", localDate: "2026-06-27", localTime: "17:00", utcOffsetHours: -4, venue: "MetLife Stadium, East Rutherford" },
  { groupCode: "L", matchNumber: 68, homeTeamCode: "CRO", awayTeamCode: "GHA", localDate: "2026-06-27", localTime: "17:00", utcOffsetHours: -4, venue: "Lincoln Financial Field, Philadelphia" },
];

export function buildSeededGroupStageMatches(): SeededGroupStageMatch[] {
  return seededGroupStageMatchSources.map((match) => ({
    ...match,
    kickoffAt: toKickoffEpochMs(match),
    stageLabel: `Grupo ${match.groupCode}`,
    status: "scheduled",
  }));
}
