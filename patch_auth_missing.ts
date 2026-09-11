import fs from 'fs';

let code = fs.readFileSync('src/utils/auth.ts', 'utf8');

code += `
export function getStoredUser(): AuthUser | null {
  try {
    const data = localStorage.getItem('coming_back_aniversario_auth_v1');
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  try {
    localStorage.setItem('coming_back_aniversario_auth_v1', JSON.stringify(user));
  } catch (e) {}
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem('coming_back_aniversario_auth_v1');
  } catch (e) {}
}

export function canEvaluateTeam(user: AuthUser | null, teamId: number, teams: Team[]): boolean {
  if (!user || user.role !== 'judge') return false;
  const team = teams.find(t => t.id === teamId);
  if (!team) return false;
  return isTeamAvailableForJudge(team, user, teams);
}

export function canSubmitForStation(user: AuthUser | null, stationKey: StationKey): boolean {
  if (!user || user.role !== 'judge') return false;
  return user.stationKey === stationKey;
}

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function canResetDatabase(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function getAssignedStationForSalaA(teamId: number): 'sala_a1' | 'sala_a2' | null {
  if (teamId < 1 || teamId > 18) return null;
  const positionInBlock = (teamId - 1) % 4;
  return positionInBlock < 2 ? 'sala_a1' : 'sala_a2';
}
`;

fs.writeFileSync('src/utils/auth.ts', code);
