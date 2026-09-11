import * as fs from 'fs';

const filePath = 'src/utils/storage.ts';
let code = fs.readFileSync(filePath, 'utf-8');

const OFFICIAL_TEAMS = [
  "Los Scooby Doo",
  "Las tortugas ninja",
  "Eclipse",
  "Invernalia",
  "Los 4 fantásticos",
  "El cuarto poder",
  "4 cerebros, 0 ideas",
  "Los fénix azules",
  "Los Pilares Del Silencio",
  "Los 4 elementos",
  "El Equipito",
  "NEXO",
  "Scooby-Doo",
  "Club mapache (GARIMAJU)",
  "Los mofios",
  "Los 4 en oferta",
  "Águila americana",
  "Mentes bonitas"
];

const replacement = `export function getInitialTeams(): Team[] {
  const teams: Team[] = [];
  const officialNames = ${JSON.stringify(OFFICIAL_TEAMS)};
  
  officialNames.forEach((name, idx) => {
    const i = idx + 1;
    const wave: Wave = i <= 9 ? 'morning' : 'afternoon';
    teams.push({
      id: i,
      name: name,
      wave,
      members: [], // Sin integrantes ficticios, listos para ingresar lista definitiva
      status: 'active',
      currentStationKey: null,
      scores: {
        salaA: { oratoriaPoints: 0, keywordSolved: false, isSubmitted: false },
        salaBE: { debatePoints: 0, codeDelivered: false, isSubmitted: false },
        salaF: { crisisPoints: 0, stampAwarded: false, isSubmitted: false },
      },
      judgeEvaluations: {},
      totalScore: 0,
      locksPassed: 0,
      allRoomsCompleted: false,
      rank: i,
      waveRank: wave === 'morning' ? i : i - 9,
      isBreakQualified: false,
      lastUpdated: new Date().toISOString()
    });
  });
  return computeRanksAndBreak(teams);
}`;

code = code.replace(/export function getInitialTeams\(\): Team\[\] \{[\s\S]*?return computeRanksAndBreak\(teams\);\n\}/, replacement);

fs.writeFileSync(filePath, code);
