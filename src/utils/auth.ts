import { AuthUser, StationKey, Team, UserStatus } from '../types';
import { isValidStationKey, isValidStationType, STATION_SPEC_MAP } from './validation';
import { loadUsers, toAuthUser, normalizeUsername } from '../services/userService';

/**
 * CLIENT-SIDE AUTHENTICATION NOTICE:
 * This authentication system operates in a sandboxed, client-side browser environment
 * to distribute evaluation consoles across tournament judging stations.
 * It provides role differentiation, session consistency, station isolation, and input guards.
 * It is not a cryptographic identity provider or server-authoritative security boundary.
 */

export interface UserAccount {
  loginName: string; // The official evaluator's real name used for login
  internalUsername: string; // The internal station key identifier (e.g. juez_sala_a1)
  passwordHash: string; // Station password for tournament consoles
  user: AuthUser;
  status?: UserStatus;
}

export const PRESET_ACCOUNTS: Record<string, UserAccount> = {
  juez_sala_a1: {
    loginName: 'Samuel Jimenez',
    internalUsername: 'juez_sala_a1',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_a1',
      role: 'judge',
      name: 'Samuel Jimenez',
      stationKey: 'sala_a1',
      stationName: 'Sala A - Oratoria y Retórica (Mesa 1)',
      stationType: 'oratoria',
      maxPoints: 25,
      challengeName: 'Desafío Escape: Palabra Clave',
      challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    },
  },
  juez_sala_a2: {
    loginName: 'Javier Perez',
    internalUsername: 'juez_sala_a2',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_a2',
      role: 'judge',
      name: 'Javier Perez',
      stationKey: 'sala_a2',
      stationName: 'Sala A - Oratoria y Retórica (Mesa 2)',
      stationType: 'oratoria',
      maxPoints: 25,
      challengeName: 'Desafío Escape: Palabra Clave',
      challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    },
  },
  juez_sala_b: {
    loginName: 'José Ramón',
    internalUsername: 'juez_sala_b',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_b',
      role: 'judge',
      name: 'José Ramón',
      stationKey: 'sala_b',
      stationName: 'Sala B - Debate World Schools',
      stationType: 'debate',
      maxPoints: 50,
      challengeName: 'Desafío Escape: Código de Seguridad',
      challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    },
  },
  juez_sala_c: {
    loginName: 'Juan Luis',
    internalUsername: 'juez_sala_c',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_c',
      role: 'judge',
      name: 'Juan Luis',
      stationKey: 'sala_c',
      stationName: 'Sala C - Debate World Schools',
      stationType: 'debate',
      maxPoints: 50,
      challengeName: 'Desafío Escape: Código de Seguridad',
      challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    },
  },
  juez_sala_d: {
    loginName: 'José Tejera',
    internalUsername: 'juez_sala_d',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_d',
      role: 'judge',
      name: 'José Tejera',
      stationKey: 'sala_d',
      stationName: 'Sala D - Debate World Schools',
      stationType: 'debate',
      maxPoints: 50,
      challengeName: 'Desafío Escape: Código de Seguridad',
      challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    },
  },
  juez_sala_e: {
    loginName: 'Manuel Koolman',
    internalUsername: 'juez_sala_e',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_e',
      role: 'judge',
      name: 'Manuel Koolman',
      stationKey: 'sala_e',
      stationName: 'Sala E - Debate World Schools',
      stationType: 'debate',
      maxPoints: 50,
      challengeName: 'Desafío Escape: Código de Seguridad',
      challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    },
  },
  juez_sala_f1: {
    loginName: 'Jesus Corona',
    internalUsername: 'juez_sala_f1',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_f1',
      role: 'judge',
      name: 'Jesus Corona',
      stationKey: 'sala_f1',
      stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 1)',
      stationType: 'crisis',
      maxPoints: 25,
      challengeName: 'Desafío Escape: Sello Físico Oficial',
      challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    },
  },
  juez_sala_f2: {
    loginName: 'Luis Montoya',
    internalUsername: 'juez_sala_f2',
    passwordHash: '12345678',
    user: {
      username: 'juez_sala_f2',
      role: 'judge',
      name: 'Luis Montoya',
      stationKey: 'sala_f2',
      stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 2)',
      stationType: 'crisis',
      maxPoints: 25,
      challengeName: 'Desafío Escape: Sello Físico Oficial',
      challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    },
  },
  admin_tab: {
    loginName: 'Admin Tabulación',
    internalUsername: 'admin_tab',
    passwordHash: '12345678',
    user: {
      username: 'admin_tab',
      role: 'admin',
      name: 'Admin Tabulación & Mesa Directiva',
    },
  },
};

const AUTH_STORAGE_KEY = 'coming_back_aniversario_auth_session_v1';

/**
 * Validates the structure, schema, and authenticity of an AuthUser object against managed users.
 * Fails closed and returns null if any field is invalid, tampered with, or if the account is deactivated.
 */
export function validateAuthUser(data: unknown): AuthUser | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const user = data as Partial<AuthUser>;

  if (typeof user.username !== 'string' || !user.username.trim()) {
    return null;
  }

  const cleanUsername = user.username.trim().toLowerCase();
  
  try {
    const managedUsers = loadUsers();
    const cleanUserNorm = normalizeUsername(cleanUsername);
    const managed = managedUsers.find((u) => normalizeUsername(u.username) === cleanUserNorm || u.username.toLowerCase() === cleanUsername);

    if (!managed) {
      // User does not exist or was deleted -> invalidate session
      return null;
    }

    // Inactive users cannot have valid sessions
    if (managed.status === 'inactive') {
      return null;
    }

    // Role must match
    if (user.role !== managed.role) {
      return null;
    }

    // If judge, stationKey must be a valid station
    if (managed.role === 'judge') {
      if (!managed.stationKey || !isValidStationKey(managed.stationKey)) {
        return null;
      }
    }

    return toAuthUser(managed);
  } catch (err) {
    console.warn('Error loading managed users for session validation:', err);
    return null;
  }
}

/**
 * Helper to normalize name strings for robust exact comparison (handles case, accents, and whitespace trim).
 */
function normalizeName(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Finds a configured user account by evaluator username or official name.
 * Searches authoritative managed users from userService.
 */
export function findAccountByLoginName(inputName: string): UserAccount | null {
  const cleanInput = inputName.trim();
  if (!cleanInput) return null;

  const normalizedInput = normalizeName(cleanInput);

  try {
    const managedUsers = loadUsers();
    const cleanUserNorm = normalizeUsername(cleanInput);
    
    // 1. Match by username (case-insensitive or normalized)
    const byUsername = managedUsers.find(
      (u) => normalizeUsername(u.username) === cleanUserNorm || u.username.toLowerCase() === cleanInput.toLowerCase()
    );
    if (byUsername) {
      return {
        loginName: byUsername.name,
        internalUsername: byUsername.username,
        passwordHash: byUsername.passwordHash,
        user: toAuthUser(byUsername),
        status: byUsername.status,
      };
    }

    // 2. Match by normalized official name
    const byName = managedUsers.find((u) => normalizeName(u.name) === normalizedInput);
    if (byName) {
      return {
        loginName: byName.name,
        internalUsername: byName.username,
        passwordHash: byName.passwordHash,
        user: toAuthUser(byName),
        status: byName.status,
      };
    }

    // 3. Match admin alias
    if (
      normalizedInput === 'admin_tab' || 
      normalizedInput === 'admintab' || 
      normalizedInput === 'admin' ||
      normalizedInput === 'administrador'
    ) {
      const admin = managedUsers.find((u) => u.role === 'admin' && u.status === 'active') ||
                    managedUsers.find((u) => u.role === 'admin');
      if (admin) {
        return {
          loginName: admin.name,
          internalUsername: admin.username,
          passwordHash: admin.passwordHash,
          user: toAuthUser(admin),
          status: admin.status,
        };
      }
    }
  } catch (err) {
    console.warn('Error querying managed users:', err);
  }

  return null;
}

/**
 * Authenticates user credentials against authoritative managed users or preset accounts.
 */
export function authenticate(
  usernameOrName: string, 
  password: string
): { success: boolean; user?: AuthUser; error?: string } {
  const account = findAccountByLoginName(usernameOrName);

  if (!account) {
    return { success: false, error: 'Usuario no reconocido. Ingrese su usuario o nombre oficial.' };
  }

  if (account.status === 'inactive') {
    return { success: false, error: 'Esta cuenta se encuentra desactivada. Contacte a la Mesa Directiva.' };
  }

  if (account.passwordHash !== password.trim()) {
    return { success: false, error: 'Contraseña incorrecta. Ingrese la clave asignada por la Mesa Directiva.' };
  }

  const validUser = validateAuthUser(account.user);
  if (!validUser) {
    return { success: false, error: 'Error de integridad en la configuración de la cuenta.' };
  }

  storeUser(validUser);

  return { success: true, user: validUser };
}

/**
 * Retrieves and strictly validates the currently stored user session.
 * Fails closed and clears corrupted session data.
 */
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      clearStoredUser();
      return null;
    }

    const validated = validateAuthUser(parsed);
    if (!validated) {
      clearStoredUser();
      return null;
    }

    return validated;
  } catch {
    return null;
  }
}

/**
 * Persists an authenticated user session to localStorage.
 */
export function storeUser(user: AuthUser): boolean {
  const validated = validateAuthUser(user);
  if (!validated) return false;

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch (e) {
    console.warn('Unable to save user session to localStorage', e);
    return false;
  }
}

/**
 * Clears the stored user session.
 */
export function clearStoredUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.warn('Unable to clear auth session', e);
  }
}

// ==========================================
// AUTHORIZATION GUARDS AND HELPERS
// ==========================================

/**
 * Checks if the user has the Administrator role.
 */
export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user && user.role === 'admin');
}

/**
 * Checks if the user has the Judge role.
 */
export function isJudgeUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user && user.role === 'judge' && user.stationKey && isValidStationKey(user.stationKey));
}

/**
 * Checks if the user is authorized to perform privileged data management tasks (CSV export, Backup, Demo, Reset).
 */
export function canManageData(user: AuthUser | null | undefined): boolean {
  return isAdminUser(user);
}

/**
 * Checks if the user is authorized to perform master database resets.
 */
export function canResetDatabase(user: AuthUser | null | undefined): boolean {
  return isAdminUser(user);
}

/**
 * Checks if the user is authorized to export data.
 */
export function canExportData(user: AuthUser | null | undefined): boolean {
  return isAdminUser(user);
}

/**
 * Checks if a judge is authorized to submit evaluations for a specific station key.
 */
export function canSubmitForStation(user: AuthUser | null | undefined, targetStationKey: StationKey): boolean {
  if (isAdminUser(user)) return true;
  if (!isJudgeUser(user)) return false;
  return user?.stationKey === targetStationKey;
}

/**
 * Checks if a user is authorized to evaluate a specific team.
 */
export function canEvaluateTeam(
  user: AuthUser | null | undefined, 
  teamId: number, 
  stationKey: StationKey
): boolean {
  if (typeof teamId !== 'number' || teamId < 1 || teamId > 50) return false;
  if (!canSubmitForStation(user, stationKey)) return false;
  if (stationKey === 'sala_a1' || stationKey === 'sala_a2') {
    return isTeamAssignedToStation(teamId, stationKey);
  }
  return true;
}

// =========================================================================
// SALA A DETERMINISTIC ASSIGNMENT & DYNAMIC ALLOCATION HELPERS
// =========================================================================

export const DEBATE_JUDGE_USERNAMES = [
  'juez_sala_b',
  'juez_sala_c',
  'juez_sala_d',
  'juez_sala_e',
] as const;

/**
 * Deterministically returns the assigned Sala A station ('sala_a1' or 'sala_a2') for a given teamId (1-50).
 *
 * Operational rule (Fixed block of four):
 * - Block 1 (Teams 1-4):   Teams 1, 2 -> sala_a1 | Teams 3, 4 -> sala_a2
 * - Block 2 (Teams 5-8):   Teams 5, 6 -> sala_a1 | Teams 7, 8 -> sala_a2
 * - Block 3 (Teams 9-12):  Teams 9, 10 -> sala_a1 | Teams 11, 12 -> sala_a2
 * - Block 4 (Teams 13-16): Teams 13, 14 -> sala_a1 | Teams 15, 16 -> sala_a2
 * ...
 * - Block 13 (Teams 49-50): Teams 49, 50 -> sala_a1 (sala_a2 has no teams in this final block)
 *
 * Formula: ((teamId - 1) % 4) < 2 => 'sala_a1' else 'sala_a2'
 */
export function getAssignedStationForSalaA(teamId: number): 'sala_a1' | 'sala_a2' | null {
  if (typeof teamId !== 'number' || !Number.isInteger(teamId) || teamId < 1 || teamId > 50) {
    return null;
  }
  const positionInBlock = (teamId - 1) % 4; // 0, 1 => A1 (first two); 2, 3 => A2 (last two)
  return positionInBlock < 2 ? 'sala_a1' : 'sala_a2';
}

/**
 * Checks whether a specific team (1-50) is assigned to the given stationKey.
 * For Sala A1/A2, applies the deterministic block-of-four rule.
 * For other stations (Debate B/C/D/E, Crisis F1/F2), returns true for all tournament teams (1-50).
 */
export function isTeamAssignedToStation(
  teamId: number, 
  stationKey: StationKey | string | undefined
): boolean {
  if (typeof teamId !== 'number' || !Number.isInteger(teamId) || teamId < 1 || teamId > 50) {
    return false;
  }
  if (stationKey === 'sala_a1') {
    return getAssignedStationForSalaA(teamId) === 'sala_a1';
  }
  if (stationKey === 'sala_a2') {
    return getAssignedStationForSalaA(teamId) === 'sala_a2';
  }
  return true;
}

/**
 * Checks if a team is assigned to the authenticated judge.
 */
export function isTeamAssignedToJudge(
  teamOrId: Team | number, 
  user: AuthUser | null | undefined
): boolean {
  if (!user) return false;
  const teamId = typeof teamOrId === 'number' ? teamOrId : teamOrId?.id;
  if (typeof teamId !== 'number' || teamId < 1 || teamId > 50) return false;

  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    return isTeamAssignedToStation(teamId, user.stationKey);
  }
  return true;
}

/**
 * Returns all assigned teams for the judge (independent of evaluated status).
 * - For sala_a1: 26 teams (1, 2, 5, 6, 9, 10, ...)
 * - For sala_a2: 24 teams (3, 4, 7, 8, 11, 12, ...)
 * - For others: all 50 teams
 */
export function getAssignedTeams(teams: Team[], user: AuthUser | null | undefined): Team[] {
  if (!Array.isArray(teams) || !user) return [];
  const activeTeams = teams.filter((t) => t.status !== 'inactive');
  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    return activeTeams
      .filter((t) => isTeamAssignedToStation(t.id, user.stationKey))
      .sort((a, b) => a.id - b.id);
  }
  return [...activeTeams].sort((a, b) => a.id - b.id);
}

/**
 * Returns the total number of assigned active teams for a judge.
 * - sala_a1: Count of active teams where isTeamAssignedToStation(team.id, 'sala_a1')
 * - sala_a2: Count of active teams where isTeamAssignedToStation(team.id, 'sala_a2')
 * - others: Count of all active teams
 * 
 * Falls back to hardcoded numbers (26, 24, 50) if teams are not provided.
 */
export function getTotalAssignedTeamsCount(user: AuthUser | null | undefined, teams?: Team[]): number {
  if (!user) return 50;
  
  if (teams && Array.isArray(teams)) {
    const activeTeams = teams.filter(t => t.status !== 'inactive');
    
    if (user.stationKey === 'sala_a1') {
      return activeTeams.filter(t => isTeamAssignedToStation(t.id, 'sala_a1')).length;
    }
    
    if (user.stationKey === 'sala_a2') {
      return activeTeams.filter(t => isTeamAssignedToStation(t.id, 'sala_a2')).length;
    }
    
    return activeTeams.length;
  }

  // Fallback
  if (user.stationKey === 'sala_a1') return 26;
  if (user.stationKey === 'sala_a2') return 24;
  return 50;
}

// =========================================================================
// SALA F (CRISIS) SYNCHRONIZED TWO-JUDGE ALLOCATION HELPERS
// =========================================================================

export const CRISIS_JUDGE_USERNAMES = [
  'juez_sala_f1',
  'juez_sala_f2',
] as const;

/**
 * Checks whether a team has completed all required evaluations in Sala F (Crisis).
 * Sala F requires BOTH juez_sala_f1 and juez_sala_f2 to evaluate the same exposition.
 */
export function isCrisisTeamFullyEvaluated(team: Team): boolean {
  if (!team || !team.judgeEvaluations) return false;
  const evals = team.judgeEvaluations;
  return Boolean(evals['juez_sala_f1']?.isSubmitted && evals['juez_sala_f2']?.isSubmitted);
}

/**
 * Deterministically returns the current shared team for Sala F (Crisis) in ascending order (1-50).
 * Sala F is a synchronized two-judge station: both judges evaluate the SAME team at the SAME time.
 * Returns the lowest-numbered team for which F1 evaluation is missing OR F2 evaluation is missing.
 * Returns null if all 50 teams have been fully evaluated by both judges.
 */
export function getCurrentCrisisTeam(teams: Team[]): Team | null {
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const sorted = [...teams].filter((t) => t.status !== 'inactive').sort((a, b) => a.id - b.id);
  const current = sorted.find((team) => !isCrisisTeamFullyEvaluated(team));
  return current || null;
}

/**
 * Checks if a specific judge in Sala F has submitted their evaluation for the current crisis team.
 */
export function isCrisisJudgeSubmittedForTeam(
  team: Team, 
  judgeUsername: string | undefined
): boolean {
  if (!team || !team.judgeEvaluations || !judgeUsername) return false;
  return Boolean(team.judgeEvaluations[judgeUsername]?.isSubmitted);
}

/**
 * Determines whether a given team is currently available to be evaluated by the specified judge.
 * Authoritative single source of truth: team.judgeEvaluations + station allocation model.
 *
 * Rules:
 * - Sala A (sala_a1, sala_a2): Available if and only if the team belongs to this judge's fixed
 *   assignment (A1: 1,2,5,6... / A2: 3,4,7,8...) AND has NOT yet been submitted by this judge.
 * - Debate judges (sala_b, sala_c, sala_d, sala_e): Available if and only if NO debate station (B/C/D/E)
 *   has submitted an evaluation for this team.
 * - Crisis judges (sala_f1, sala_f2): Synchronized station. Available if this team is the CURRENT
 *   crisis team AND this judge has not yet submitted an evaluation.
 */
export function isTeamAvailableForJudge(
  team: Team, 
  user: AuthUser | null | undefined,
  allTeams?: Team[]
): boolean {
  if (!team || !team.id || !user) return false;
  if (team.status === 'inactive') return false;

  const evals = team.judgeEvaluations || {};

  // Sala A Fixed Block Allocation Model
  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    // 1. Must strictly belong to this judge's assigned group of four
    if (!isTeamAssignedToStation(team.id, user.stationKey)) {
      return false;
    }
    // 2. Must not be already submitted by this judge
    if (user.username && evals[user.username]?.isSubmitted) {
      return false;
    }
    return true;
  }

  // Sala F Synchronized Two-Judge Model
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') {
    // Check if this judge has already submitted
    if (user.username && evals[user.username]?.isSubmitted) {
      return false;
    }
    // If full team list is provided, must strictly be the current synchronized crisis team
    if (allTeams && Array.isArray(allTeams)) {
      const currentCrisis = getCurrentCrisisTeam(allTeams);
      if (!currentCrisis || currentCrisis.id !== team.id) {
        return false;
      }
    }
    return true;
  }

  // Debate Dynamic Availability Model (shared single slot across B, C, D, E)
  if (user.stationType === 'debate') {
    const hasAnyDebateSubmitted = DEBATE_JUDGE_USERNAMES.some(
      (username) => evals[username]?.isSubmitted
    );
    return !hasAnyDebateSubmitted;
  }

  // Other stations: available if NOT yet submitted by this judge
  if (user.username && evals[user.username]?.isSubmitted) {
    return false;
  }

  return true;
}

/**
 * Returns all teams that are currently available for the specified judge, in ascending team ID order.
 */
export function getAvailableTeams(teams: Team[], user: AuthUser | null | undefined): Team[] {
  if (!Array.isArray(teams) || !user) return [];

  // Sala F: only the current synchronized crisis team is available (if this judge hasn't submitted yet)
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') {
    const currentCrisis = getCurrentCrisisTeam(teams);
    if (!currentCrisis) return [];
    if (user.username && currentCrisis.judgeEvaluations?.[user.username]?.isSubmitted) {
      return []; // In waiting state for the other judge
    }
    return [currentCrisis];
  }

  return teams
    .filter((team) => isTeamAvailableForJudge(team, user, teams))
    .sort((a, b) => a.id - b.id);
}

/**
 * Identifies the next available team for a judge in deterministic ascending order.
 * If currentTeamId is supplied, searches for the next available team with id > currentTeamId;
 * if none found, wraps around to the first available team.
 * If no teams are available, returns null.
 */
export function getNextAvailableTeam(
  teams: Team[],
  user: AuthUser | null | undefined,
  currentTeamId?: number
): Team | null {
  if (!Array.isArray(teams) || !user) return null;

  // Sala F: always targets the current synchronized crisis team
  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2') {
    return getCurrentCrisisTeam(teams);
  }

  const available = getAvailableTeams(teams, user);
  if (available.length === 0) return null;

  if (typeof currentTeamId === 'number') {
    const nextHigher = available.find((t) => t.id > currentTeamId);
    if (nextHigher) return nextHigher;
  }

  return available[0];
}

/**
 * Returns the count of teams evaluated for the judge's station category from authoritative evaluations.
 * - For Sala A1/A2: Counts teams that belong to this judge's assignment AND have been submitted by this judge.
 * - For Sala F (Crisis): Counts teams fully evaluated by BOTH F1 and F2 judges.
 * - For Debate: Counts teams that have a submitted evaluation in any Debate station (B/C/D/E).
 * - For others: Counts teams that have a submitted evaluation for this judge's station.
 */
export function getEvaluatedTeamsCount(teams: Team[], user: AuthUser | null | undefined): number {
  if (!Array.isArray(teams) || !user) return 0;

  const activeTeams = teams.filter((t) => t.status !== 'inactive');

  if (user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2' || user.stationType === 'crisis') {
    return activeTeams.filter((t) => isCrisisTeamFullyEvaluated(t)).length;
  }

  if (user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2') {
    return activeTeams.filter(
      (t) => isTeamAssignedToStation(t.id, user.stationKey) && !!t.judgeEvaluations?.[user.username]?.isSubmitted
    ).length;
  }

  if (user.stationType === 'debate') {
    return activeTeams.filter((t) => {
      const evals = t.judgeEvaluations || {};
      return DEBATE_JUDGE_USERNAMES.some((u) => evals[u]?.isSubmitted);
    }).length;
  }

  return activeTeams.filter((t) => !!t.judgeEvaluations?.[user.username]?.isSubmitted).length;
}

