const fs = require('fs');

let code = fs.readFileSync('src/utils/auth.ts', 'utf8');

code += `
export function isCrisisJudgeSubmittedForTeam(team: Team, judgeUsername: string | undefined): boolean {
  if (!team || !team.judgeEvaluations || !judgeUsername) return false;
  return Boolean(team.judgeEvaluations[judgeUsername]?.isSubmitted);
}

export function getAssignedTeams(teams: Team[], user: AuthUser | null | undefined): Team[] {
  if (!Array.isArray(teams) || !user) return [];
  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    return teams.filter(t => isTeamAssignedToStation(t.id, user.stationKey!)).sort((a, b) => a.id - b.id);
  }
  return teams.sort((a, b) => a.id - b.id);
}
`;

fs.writeFileSync('src/utils/auth.ts', code);
