export type RaceScores = { q: number; sergio: number; tesoro: number; sofi: number; boris: number; quique: number };
export type RaceCheckpoint = { sequence: number; match: number; date: string; fixture: string; score: string; scores: RaceScores; leaders: readonly string[]; leaderPoints: number };

const checkpoints = `1|73|2026-06-28|Sudáfrica vs Canadá|0-1|3,2,2,3,1,1|Mildred,Q,Sofi|3
2|76|2026-06-29|Brasil vs Japón|2-1|6,5,5,4,4,4|Q|6
3|74|2026-06-29|Alemania vs Paraguay|1-1|6,6,5,4,5,4|Q,Sergio|6
4|75|2026-06-29|Países Bajos vs Marruecos|1-1|7,7,8,5,6,5|Tesoro|8
5|78|2026-06-30|Costa de Marfil vs Noruega|1-2|10,10,11,7,9,8|Tesoro|11
6|77|2026-06-30|Francia vs Suecia|3-0|12,12,12,10,11,9|Q,Sergio,Tesoro|12
7|79|2026-06-30|México vs Ecuador|2-0|14,14,14,12,13,11|Q,Sergio,Tesoro|14
8|80|2026-07-01|Inglaterra vs R. D. del Congo|2-1|16,17,17,14,15,14|Sergio,Tesoro|17
9|82|2026-07-01|Bélgica vs Senegal|2-2|17,18,18,15,16,14|Sergio,Tesoro|18
10|81|2026-07-01|Estados Unidos vs Bosnia y Herzegovina|2-0|20,19,20,17,19,16|Q,Tesoro|20
11|84|2026-07-02|España vs Austria|3-0|22,22,21,20,21,17|Q,Sergio|22
12|83|2026-07-02|Portugal vs Croacia|2-1|25,25,24,23,24,18|Q,Sergio|25
13|85|2026-07-02|Suiza vs Argelia|2-0|27,27,24,25,26,21|Q,Sergio|27
14|88|2026-07-03|Australia vs Egipto|1-1|28,30,25,28,27,22|Sergio|30
15|86|2026-07-03|Argentina vs Cabo Verde|1-1|28,30,28,29,27,22|Sergio|30
16|87|2026-07-03|Colombia vs Ghana|1-0|29,31,29,30,28,23|Sergio|31
17|90|2026-07-04|Canadá vs Marruecos|0-3|30,32,30,30,29,25|Sergio|32
18|89|2026-07-04|Paraguay vs Francia|0-1|32,34,32,31,31,27|Sergio|34
19|91|2026-07-05|Brasil vs Noruega|1-2|32,34,32,31,31,28|Sergio|34
20|92|2026-07-05|México vs Inglaterra|2-3|32,35,33,31,32,29|Sergio|35
21|93|2026-07-06|Portugal vs España|0-1|33,36,34,32,32,31|Sergio|36
22|94|2026-07-06|Estados Unidos vs Bélgica|1-4|33,36,36,34,34,31|Sergio,Tesoro|36
23|95|2026-07-07|Argentina vs Egipto|3-2|34,38,36,36,35,32|Sergio|38
24|96|2026-07-07|Suiza vs Colombia|0-0|35,38,36,37,35,33|Sergio|38
25|97|2026-07-09|Francia vs Marruecos|2-0|37,40,37,39,37,34|Sergio|40
26|98|2026-07-10|España vs Bélgica|2-1|39,42,40,42,39,37|Sergio,Sofi|42
27|99|2026-07-11|Noruega vs Inglaterra|1-1|42,43,41,43,40,40|Sergio,Sofi|43
28|100|2026-07-11|Argentina vs Suiza|1-1|42,44,42,43,41,41|Sergio|44
29|101|2026-07-14|Francia vs España|0-2|44,44,42,43,41,42|Q,Sergio|44
30|102|2026-07-15|Inglaterra vs Argentina|1-2|47,44,42,44,44,45|Q|47
31|103|2026-07-18|Francia vs Inglaterra|4-6|47,44,42,44,45,45|Q|47
32|104|2026-07-19|España vs Argentina|0-0|47,44,43,44,45,45|Q|47`;

export const knockoutRace: readonly RaceCheckpoint[] = checkpoints.split("\n").map((line) => {
  const [sequence, match, date, fixture, score, points, leaders, leaderPoints] = line.split("|");
  const [q, sergio, tesoro, sofi, boris, quique] = points!.split(",").map(Number);
  return { sequence: Number(sequence), match: Number(match), date: date!, fixture: fixture!, score: score!, scores: { q: q!, sergio: sergio!, tesoro: tesoro!, sofi: sofi!, boris: boris!, quique: quique! }, leaders: leaders!.split(","), leaderPoints: Number(leaderPoints) };
});
