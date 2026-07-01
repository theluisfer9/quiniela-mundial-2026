export const NEUTRAL_TEAM_COLOR = "#5f5a50";

// Home-kit / flag-primary approximations for teams currently represented in the app.
const TEAM_PRIMARY_COLORS: Record<string, string> = {
  ALG: "#006233",
  ARG: "#75AADB",
  AUS: "#FFCD00",
  AUT: "#ED2939",
  BEL: "#EF3340",
  BIH: "#002395",
  BRA: "#FFDF00",
  CAN: "#FF0000",
  CIV: "#F77F00",
  COD: "#007FFF",
  COL: "#FCD116",
  CPV: "#003893",
  CRO: "#F40000",
  ECU: "#FFD100",
  EGY: "#CE1126",
  ENG: "#FFFFFF",
  ESP: "#AA151B",
  FRA: "#1E3A8A",
  GER: "#FFFFFF",
  GHA: "#FCD116",
  JPN: "#FFFFFF",
  MAR: "#C1272D",
  MEX: "#006341",
  NED: "#FF4F00",
  NOR: "#BA0C2F",
  PAR: "#D52B1E",
  POR: "#006600",
  RSA: "#FFB612",
  SEN: "#00853F",
  SUI: "#DA291C",
  SWE: "#FFCD00",
  USA: "#3C3B6E",
};

export function getTeamPrimaryColor(teamCode: string | undefined) {
  return teamCode ? (TEAM_PRIMARY_COLORS[teamCode] ?? NEUTRAL_TEAM_COLOR) : NEUTRAL_TEAM_COLOR;
}
