import { AuthUser, StationKey, Team, UserStatus } from '../types';
import { api } from '../services/apiClient';

export async function authenticate(
  usernameOrName: string, 
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await api.post<any>('/api/auth/login', { username: usernameOrName, password });
    if (res.success && res.user) {
      return { success: true, user: res.user };
    }
    return { success: false, error: 'Credenciales inválidas.' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error de conexión.' };
  }
}

export async function authenticateParticipant(
  teamNameOrId: string | number
): Promise<{ success: boolean; role?: string; teamId?: number; team?: any; error?: string }> {
  try {
    const payload = typeof teamNameOrId === 'number' ? { teamId: teamNameOrId } : { teamName: teamNameOrId };
    const res = await api.post<any>('/api/auth/login', payload);
    if (res.success && res.role === 'participant') {
      const resolvedId = res.team?.id || res.teamId;
      return { success: true, role: 'participant', teamId: resolvedId, team: res.team };
    }
    return { success: false, error: res.error || 'No autorizado.' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error de conexión.' };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await api.get<any>('/api/auth/me');
    if (user && user.role !== 'participant') {
      return user.user || user;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getCurrentParticipant(): Promise<{ role: string; teamId: number; team?: any } | null> {
  try {
    const res = await api.get<any>('/api/auth/me');
    if (res && res.role === 'participant') {
      return {
        role: 'participant',
        teamId: res.team?.id || res.teamId,
        team: res.team,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout', {});
  } catch (e) {}
}

export const DEBATE_JUDGE_USERNAMES = [
  'juez_sala_b',
  'juez_sala_c',
  'juez_sala_d',
  'juez_sala_e',
] as const;

export const CRISIS_JUDGE_USERNAMES = [
  'juez_sala_f1',
  'juez_sala_f2',
] as const;

export function isTeamAssignedToStation(teamId: number, stationKey: string): boolean {
  if (stationKey === 'sala_a1' || stationKey === 'sala_a2') {
    const positionInBlock = (teamId - 1) % 4;
    const expected = positionInBlock < 2 ? 'sala_a1' : 'sala_a2';
    return expected === stationKey;
  }
  return true;
}

export function isCrisisTeamFullyEvaluated(team: Team): boolean {
  if (!team || !team.judgeEvaluations) return false;
  const evals = team.judgeEvaluations;
  return Boolean(evals['juez_sala_f1']?.isSubmitted && evals['juez_sala_f2']?.isSubmitted);
}

export function getCurrentCrisisTeam(teams: Team[]): Team | null {
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const sorted = [...teams].filter((t) => t.status !== 'inactive').sort((a, b) => a.id - b.id);
  const current = sorted.find((team) => !isCrisisTeamFullyEvaluated(team));
  return current || null;
}

export function isTeamAvailableForJudge(team: Team, user: AuthUser | null | undefined, allTeams?: Team[]): boolean {
  if (!team || !team.id || !user) return false;
  if (team.status === 'inactive') return false;
  const evals = team.judgeEvaluations || {};

  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    if (!isTeamAssignedToStation(team.id, user.stationKey)) return false;
    if (user.username && evals[user.username]?.isSubmitted) return false;
    return true;
  }

  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') {
    if (user.username && evals[user.username]?.isSubmitted) return false;
    if (allTeams && Array.isArray(allTeams)) {
      const currentCrisis = getCurrentCrisisTeam(allTeams);
      if (!currentCrisis || currentCrisis.id !== team.id) return false;
    }
    return true;
  }

  if (user.stationType === 'debate') {
    const hasAnyDebateSubmitted = DEBATE_JUDGE_USERNAMES.some((username) => evals[username]?.isSubmitted);
    return !hasAnyDebateSubmitted;
  }

  if (user.username && evals[user.username]?.isSubmitted) return false;
  return true;
}

export function getAvailableTeams(teams: Team[], user: AuthUser | null | undefined): Team[] {
  if (!Array.isArray(teams) || !user) return [];
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') {
    const currentCrisis = getCurrentCrisisTeam(teams);
    if (!currentCrisis) return [];
    if (user.username && currentCrisis.judgeEvaluations?.[user.username]?.isSubmitted) return [];
    return [currentCrisis];
  }
  return teams.filter((team) => isTeamAvailableForJudge(team, user, teams)).sort((a, b) => a.id - b.id);
}

export function getNextAvailableTeam(teams: Team[], user: AuthUser | null | undefined, currentTeamId?: number): Team | null {
  if (!Array.isArray(teams) || !user) return null;
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') return getCurrentCrisisTeam(teams);
  const available = getAvailableTeams(teams, user);
  if (available.length === 0) return null;
  if (typeof currentTeamId === 'number') {
    const nextHigher = available.find((t) => t.id > currentTeamId);
    if (nextHigher) return nextHigher;
  }
  return available[0];
}

export function getEvaluatedTeamsCount(teams: Team[], user: AuthUser | null | undefined): number {
  if (!Array.isArray(teams) || !user) return 0;
  const activeTeams = teams.filter((t) => t.status !== 'inactive');
  
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2' || user.stationType === 'crisis') {
    return activeTeams.filter((t) => isCrisisTeamFullyEvaluated(t)).length;
  }
  
  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    return activeTeams.filter((t) => isTeamAssignedToStation(t.id, user.stationKey) && !!t.judgeEvaluations?.[user.username]?.isSubmitted).length;
  }
  
  if (user.stationType === 'debate') {
    return activeTeams.filter((t) => {
      const evals = t.judgeEvaluations || {};
      return DEBATE_JUDGE_USERNAMES.some((u) => evals[u]?.isSubmitted);
    }).length;
  }
  
  return activeTeams.filter((t) => !!t.judgeEvaluations?.[user.username]?.isSubmitted).length;
}

export function getTotalAssignedTeamsCount(user: AuthUser | null | undefined, teams?: Team[]): number {
  if (!user) return 18;
  if (teams && Array.isArray(teams)) {
    const activeTeams = teams.filter(t => t.status !== 'inactive');
    if (user.stationKey === 'sala_a1') return activeTeams.filter(t => isTeamAssignedToStation(t.id, 'sala_a1')).length;
    if (user.stationKey === 'sala_a2') return activeTeams.filter(t => isTeamAssignedToStation(t.id, 'sala_a2')).length;
    return activeTeams.length;
  }
  if (user.stationKey === 'sala_a1') return 9;
  if (user.stationKey === 'sala_a2') return 9;
  return 18;
}


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
