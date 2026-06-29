import type { AppLocale } from "@/lib/i18n";

const englishTeamNamesByCode = new Map([
  ["ALG", "Algeria"],
  ["ARG", "Argentina"],
  ["AUS", "Australia"],
  ["AUT", "Austria"],
  ["BEL", "Belgium"],
  ["BIH", "Bosnia and Herzegovina"],
  ["BRA", "Brazil"],
  ["CAN", "Canada"],
  ["CIV", "Ivory Coast"],
  ["COD", "DR Congo"],
  ["COL", "Colombia"],
  ["CPV", "Cape Verde"],
  ["CRO", "Croatia"],
  ["CUW", "Curacao"],
  ["CZE", "Czech Republic"],
  ["ECU", "Ecuador"],
  ["EGY", "Egypt"],
  ["ENG", "England"],
  ["ESP", "Spain"],
  ["FRA", "France"],
  ["GER", "Germany"],
  ["GHA", "Ghana"],
  ["HAI", "Haiti"],
  ["IRN", "Iran"],
  ["IRQ", "Iraq"],
  ["JOR", "Jordan"],
  ["JPN", "Japan"],
  ["KOR", "South Korea"],
  ["KSA", "Saudi Arabia"],
  ["MAR", "Morocco"],
  ["MEX", "Mexico"],
  ["NED", "Netherlands"],
  ["NOR", "Norway"],
  ["NZL", "New Zealand"],
  ["PAN", "Panama"],
  ["PAR", "Paraguay"],
  ["POR", "Portugal"],
  ["QAT", "Qatar"],
  ["RSA", "South Africa"],
  ["SCO", "Scotland"],
  ["SEN", "Senegal"],
  ["SUI", "Switzerland"],
  ["SWE", "Sweden"],
  ["TUN", "Tunisia"],
  ["TUR", "Turkey"],
  ["URU", "Uruguay"],
  ["USA", "United States"],
  ["UZB", "Uzbekistan"],
]);

const englishTeamNamesBySpanishName = new Map([
  ["Argelia", "Algeria"],
  ["Australia", "Australia"],
  ["Austria", "Austria"],
  ["Bélgica", "Belgium"],
  ["Bosnia y Herzegovina", "Bosnia and Herzegovina"],
  ["Brasil", "Brazil"],
  ["Canadá", "Canada"],
  ["Costa de Marfil", "Ivory Coast"],
  ["RD Congo", "DR Congo"],
  ["Colombia", "Colombia"],
  ["Cabo Verde", "Cape Verde"],
  ["Croacia", "Croatia"],
  ["Curazao", "Curacao"],
  ["República Checa", "Czech Republic"],
  ["Ecuador", "Ecuador"],
  ["Egipto", "Egypt"],
  ["Inglaterra", "England"],
  ["España", "Spain"],
  ["Francia", "France"],
  ["Alemania", "Germany"],
  ["Ghana", "Ghana"],
  ["Haití", "Haiti"],
  ["Irán", "Iran"],
  ["Irak", "Iraq"],
  ["Jordania", "Jordan"],
  ["Japón", "Japan"],
  ["Corea del Sur", "South Korea"],
  ["Arabia Saudita", "Saudi Arabia"],
  ["Marruecos", "Morocco"],
  ["México", "Mexico"],
  ["Países Bajos", "Netherlands"],
  ["Noruega", "Norway"],
  ["Nueva Zelanda", "New Zealand"],
  ["Panamá", "Panama"],
  ["Paraguay", "Paraguay"],
  ["Portugal", "Portugal"],
  ["Catar", "Qatar"],
  ["Sudáfrica", "South Africa"],
  ["Escocia", "Scotland"],
  ["Senegal", "Senegal"],
  ["Suiza", "Switzerland"],
  ["Suecia", "Sweden"],
  ["Túnez", "Tunisia"],
  ["Turquía", "Turkey"],
  ["Uruguay", "Uruguay"],
  ["Estados Unidos", "United States"],
  ["Uzbekistán", "Uzbekistan"],
]);

export function localizeTeamName({
  code,
  locale,
  name,
}: {
  code?: string;
  locale: AppLocale;
  name: string;
}) {
  if (locale === "es") {
    return name;
  }

  if (code) {
    return englishTeamNamesByCode.get(code) ?? name;
  }

  return englishTeamNamesBySpanishName.get(name) ?? name;
}

export function localizeStageLabel(stageLabel: string, locale: AppLocale) {
  if (locale === "es") {
    return stageLabel;
  }

  return stageLabel
    .replace(/^Grupo\s+([A-Z])$/, "Group $1")
    .replace(/^16avos$/, "Round of 32");
}
