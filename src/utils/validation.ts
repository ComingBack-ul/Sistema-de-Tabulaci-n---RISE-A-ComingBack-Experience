import { 
  Team, 
  TeamScores, 
  JudgeEvaluation, 
  StationKey, 
  StationType, 
  AuthUser, 
  AuditLogEntry,
  TeamStatus
} from '../types';
import { loadUsers } from '../services/userService';

/**
 * Custom Error hierarchy for storage, validation and authorization failure cases.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageCorruptionError extends Error {
  public rawData: string | null;
  public backupKey: string | null;

  constructor(message: string, rawData: string | null = null, backupKey: string | null = null) {
    super(message);
    this.name = 'StorageCorruptionError';
    this.rawData = rawData;
    this.backupKey = backupKey;
  }
}

export class StorageUnavailableError extends Error {
  constructor(message: string = 'LocalStorage is unavailable or restricted in this environment.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

export class StorageQuotaExceededError extends Error {
  constructor(message: string = 'LocalStorage storage quota exceeded.') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

export class InvalidBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackupError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Valid station keys allowed by the tournament structure.
 */
export const VALID_STATION_KEYS: StationKey[] = [
  'sala_a1',
  'sala_a2',
  'sala_b',
  'sala_c',
  'sala_d',
  'sala_e',
  'sala_f1',
  'sala_f2',
];

/**
 * Valid preset judge usernames.
 */
export const VALID_JUDGE_USERNAMES = [
  'juez_sala_a1',
  'juez_sala_a2',
  'juez_sala_b',
  'juez_sala_c',
  'juez_sala_d',
  'juez_sala_e',
  'juez_sala_f1',
  'juez_sala_f2',
] as const;

export type ValidJudgeUsername = typeof VALID_JUDGE_USERNAMES[number];

/**
 * Direct mapping between judge username and designated station key.
 */
export const JUDGE_TO_STATION_MAP: Record<ValidJudgeUsername, StationKey> = {
  juez_sala_a1: 'sala_a1',
  juez_sala_a2: 'sala_a2',
  juez_sala_b: 'sala_b',
  juez_sala_c: 'sala_c',
  juez_sala_d: 'sala_d',
  juez_sala_e: 'sala_e',
  juez_sala_f1: 'sala_f1',
  juez_sala_f2: 'sala_f2',
};

/**
 * Valid station types.
 */
export const VALID_STATION_TYPES: StationType[] = ['oratoria', 'debate', 'crisis'];

/**
 * Mapping between station keys, their category type, and maximum score.
 */
export const STATION_SPEC_MAP: Record<StationKey, { type: StationType; maxPoints: number; name: string }> = {
  sala_a1: { type: 'oratoria', maxPoints: 25, name: 'Sala A1 (Oratoria)' },
  sala_a2: { type: 'oratoria', maxPoints: 25, name: 'Sala A2 (Oratoria)' },
  sala_b: { type: 'debate', maxPoints: 50, name: 'Sala B (Debate)' },
  sala_c: { type: 'debate', maxPoints: 50, name: 'Sala C (Debate)' },
  sala_d: { type: 'debate', maxPoints: 50, name: 'Sala D (Debate)' },
  sala_e: { type: 'debate', maxPoints: 50, name: 'Sala E (Debate)' },
  sala_f1: { type: 'crisis', maxPoints: 25, name: 'Sala F1 (Crisis)' },
  sala_f2: { type: 'crisis', maxPoints: 25, name: 'Sala F2 (Crisis)' },
};

/**
 * Validates whether a value is a valid StationKey.
 */
export function isValidStationKey(key: unknown): key is StationKey {
  return typeof key === 'string' && VALID_STATION_KEYS.includes(key as StationKey);
}

/**
 * Validates whether a value is a valid Judge username (preset or managed dynamic user).
 */
export function isValidJudgeUsername(username: unknown): boolean {
  if (typeof username !== 'string' || !username.trim()) return false;
  const clean = username.trim().toLowerCase();
  if (VALID_JUDGE_USERNAMES.includes(clean as ValidJudgeUsername)) return true;
  // Check dynamically managed users
  try {
    const users = loadUsers();
    const found = users.find(u => u.username.toLowerCase() === clean);
    return Boolean(found && found.role === 'judge');
  } catch {
    return false;
  }
}

/**
 * Validates whether a value is a valid StationType.
 */
export function isValidStationType(type: unknown): type is StationType {
  return typeof type === 'string' && VALID_STATION_TYPES.includes(type as StationType);
}

/**
 * Validates a numeric score within the allowed range for a specific station type.
 * STRICT RULE: Maximum ONE decimal place (e.g., 23, 23.5, 23.0 are valid; 23.55, 23.555 are INVALID).
 * Ensures scores are not NaN, negative, or beyond station maxPoints.
 */
export function validateScoreRange(points: unknown, type: StationType | 'oratoria' | 'debate' | 'crisis'): boolean {
  if (typeof points !== 'number' || Number.isNaN(points) || !Number.isFinite(points)) {
    return false;
  }
  const max = type === 'debate' ? 50 : 25;
  if (points < 0 || points > max) {
    return false;
  }
  // Max 1 decimal place strictly allowed
  const str = points.toString();
  if (str.includes('.')) {
    const decimalPart = str.split('.')[1];
    if (decimalPart && decimalPart.length > 1) {
      return false;
    }
  }
  // Arithmetic precision check
  if (Math.round(points * 10) / 10 !== points) {
    return false;
  }
  return true;
}

/**
 * Clamps and rounds a numeric score cleanly to 1 decimal place (for UI convenience).
 */
export function sanitizeScore(points: number, max: number): number {
  if (typeof points !== 'number' || Number.isNaN(points) || !Number.isFinite(points)) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(points, max));
  return Math.round(clamped * 10) / 10;
}

/**
 * Validates an incoming JudgeEvaluation object thoroughly.
 * Strictly validates judge identity against preset judge usernames and station mapping.
 */
export function validateJudgeEvaluation(
  evaluation: unknown,
  expectedJudge?: AuthUser | null
): { valid: boolean; error?: string; data?: JudgeEvaluation } {
  if (!evaluation || typeof evaluation !== 'object') {
    return { valid: false, error: 'Evaluación inválida: formato de objeto requerido.' };
  }

  const evalObj = evaluation as Partial<JudgeEvaluation>;

  // 1. Judge Username validation against official judge accounts
  if (typeof evalObj.judgeUsername !== 'string' || !evalObj.judgeUsername.trim()) {
    return { valid: false, error: 'Nombre de usuario de juez requerido.' };
  }
  const cleanJudgeUsername = evalObj.judgeUsername.trim();
  if (!isValidJudgeUsername(cleanJudgeUsername)) {
    return { valid: false, error: `Usuario de juez no reconocido: '${evalObj.judgeUsername}'.` };
  }

  // 2. Station Key validation
  if (!isValidStationKey(evalObj.stationKey)) {
    return { valid: false, error: `Clave de sala de evaluación no reconocida: '${evalObj.stationKey}'.` };
  }

  // 3. Station key must match the designated station for this judge username
  let expectedStationKey: StationKey | undefined = JUDGE_TO_STATION_MAP[cleanJudgeUsername as ValidJudgeUsername];
  if (!expectedStationKey) {
    try {
      const users = loadUsers();
      const found = users.find(u => u.username.toLowerCase() === cleanJudgeUsername.toLowerCase());
      if (found && found.stationKey) {
        expectedStationKey = found.stationKey;
      }
    } catch {}
  }

  if (expectedStationKey && evalObj.stationKey !== expectedStationKey) {
    return {
      valid: false,
      error: `La estación '${evalObj.stationKey}' no corresponde al juez '${cleanJudgeUsername}' (se esperaba '${expectedStationKey}').`,
    };
  }

  const spec = STATION_SPEC_MAP[evalObj.stationKey];

  // 4. Points validation (strict range and max 1 decimal)
  if (!validateScoreRange(evalObj.points, spec.type)) {
    return { valid: false, error: `Puntuación fuera de rango o con decimales inválidos (0-${spec.maxPoints} pts con máx. 1 decimal).` };
  }

  // 5. Escape room challenge flag
  if (typeof evalObj.escapeChallenge !== 'boolean') {
    return { valid: false, error: 'El estado del candado/reto debe ser booleano.' };
  }

  // 6. Submitted flag
  if (typeof evalObj.isSubmitted !== 'boolean') {
    return { valid: false, error: 'El estado de envío debe ser booleano.' };
  }

  // 7. If expectedJudge provided, verify identity match
  if (expectedJudge) {
    if (expectedJudge.role === 'judge') {
      if (cleanJudgeUsername !== expectedJudge.username) {
        return { valid: false, error: 'Identidad del juez no coincide con la sesión activa.' };
      }
      if (evalObj.stationKey !== expectedJudge.stationKey) {
        return { valid: false, error: 'El juez no está autorizado para evaluar esta sala.' };
      }
    }
  }

  // 8. Sanitized result object
  const cleanData: JudgeEvaluation = {
    stationKey: evalObj.stationKey,
    points: evalObj.points,
    escapeChallenge: evalObj.escapeChallenge,
    notes: typeof evalObj.notes === 'string' ? evalObj.notes.slice(0, 1000) : '',
    judgeUsername: cleanJudgeUsername,
    isSubmitted: evalObj.isSubmitted,
    timestamp: typeof evalObj.timestamp === 'string' ? evalObj.timestamp.slice(0, 50) : new Date().toISOString(),
  };

  return { valid: true, data: cleanData };
}

/**
 * Validates the TeamScores object structure.
 */
export function validateTeamScores(scores: unknown): { valid: boolean; error?: string; data?: TeamScores } {
  if (!scores || typeof scores !== 'object') {
    return { valid: false, error: 'Estructura de puntuaciones de equipo inválida.' };
  }

  const s = scores as Partial<TeamScores>;

  if (!s.salaA || typeof s.salaA !== 'object' ||
      !s.salaBE || typeof s.salaBE !== 'object' ||
      !s.salaF || typeof s.salaF !== 'object') {
    return { valid: false, error: 'Faltan salas obligatorias (salaA, salaBE, salaF).' };
  }

  // Check Sala A
  if (!validateScoreRange(s.salaA.oratoriaPoints, 'oratoria') ||
      typeof s.salaA.keywordSolved !== 'boolean' ||
      typeof s.salaA.isSubmitted !== 'boolean') {
    return { valid: false, error: 'Datos inválidos en Sala A (Oratoria).' };
  }

  // Check Sala BE
  if (!validateScoreRange(s.salaBE.debatePoints, 'debate') ||
      typeof s.salaBE.codeDelivered !== 'boolean' ||
      typeof s.salaBE.isSubmitted !== 'boolean') {
    return { valid: false, error: 'Datos inválidos en Sala B-E (Debate).' };
  }

  // Check Sala F
  if (!validateScoreRange(s.salaF.crisisPoints, 'crisis') ||
      typeof s.salaF.stampAwarded !== 'boolean' ||
      typeof s.salaF.isSubmitted !== 'boolean') {
    return { valid: false, error: 'Datos inválidos en Sala F (Crisis).' };
  }

  const cleanData: TeamScores = {
    salaA: {
      oratoriaPoints: s.salaA.oratoriaPoints,
      keywordSolved: s.salaA.keywordSolved,
      judgeName: typeof s.salaA.judgeName === 'string' ? s.salaA.judgeName.slice(0, 100) : undefined,
      timestamp: typeof s.salaA.timestamp === 'string' ? s.salaA.timestamp.slice(0, 50) : undefined,
      notes: typeof s.salaA.notes === 'string' ? s.salaA.notes.slice(0, 1000) : undefined,
      isSubmitted: s.salaA.isSubmitted,
    },
    salaBE: {
      debatePoints: s.salaBE.debatePoints,
      codeDelivered: s.salaBE.codeDelivered,
      specificRoom: s.salaBE.specificRoom,
      judgeName: typeof s.salaBE.judgeName === 'string' ? s.salaBE.judgeName.slice(0, 100) : undefined,
      timestamp: typeof s.salaBE.timestamp === 'string' ? s.salaBE.timestamp.slice(0, 50) : undefined,
      notes: typeof s.salaBE.notes === 'string' ? s.salaBE.notes.slice(0, 1000) : undefined,
      isSubmitted: s.salaBE.isSubmitted,
    },
    salaF: {
      crisisPoints: s.salaF.crisisPoints,
      stampAwarded: s.salaF.stampAwarded,
      judgeName: typeof s.salaF.judgeName === 'string' ? s.salaF.judgeName.slice(0, 100) : undefined,
      timestamp: typeof s.salaF.timestamp === 'string' ? s.salaF.timestamp.slice(0, 50) : undefined,
      notes: typeof s.salaF.notes === 'string' ? s.salaF.notes.slice(0, 1000) : undefined,
      isSubmitted: s.salaF.isSubmitted,
    },
  };

  return { valid: true, data: cleanData };
}

/**
 * Validates an individual Team entity.
 * Fails completely if any team field or judge evaluation is invalid.
 * NEVER silently discards invalid judge evaluations.
 */
export function validateTeam(team: unknown): { valid: boolean; error?: string; data?: Team } {
  if (!team || typeof team !== 'object') {
    return { valid: false, error: 'Formato de equipo inválido.' };
  }

  const t = team as Partial<Team>;

  if (typeof t.id !== 'number' || !Number.isInteger(t.id) || t.id < 1 || t.id > 50) {
    return { valid: false, error: `ID de equipo inválido: ${t.id}` };
  }

  if (typeof t.name !== 'string' || !t.name.trim()) {
    return { valid: false, error: `Nombre de equipo inválido para el equipo #${t.id}` };
  }

  if (t.wave !== 'morning' && t.wave !== 'afternoon') {
    return { valid: false, error: `Oleada inválida para el equipo #${t.id} (debe ser 'morning' o 'afternoon')` };
  }

  // scores is a derived structure. If provided and valid, retain it temporarily;
  // otherwise initialize a clean zero scores structure that will be recalculated by computeRanksAndBreak.
  let cleanScores: TeamScores;
  const scoresValidation = validateTeamScores(t.scores);
  if (scoresValidation.valid && scoresValidation.data) {
    cleanScores = scoresValidation.data;
  } else {
    cleanScores = {
      salaA: { oratoriaPoints: 0, keywordSolved: false, isSubmitted: false },
      salaBE: { debatePoints: 0, codeDelivered: false, isSubmitted: false },
      salaF: { crisisPoints: 0, stampAwarded: false, isSubmitted: false },
    };
  }

  // Validate judge evaluations if present - STRICT (no silent drops)
  const cleanJudgeEvaluations: Record<string, JudgeEvaluation> = {};
  if (t.judgeEvaluations !== undefined && t.judgeEvaluations !== null) {
    if (typeof t.judgeEvaluations !== 'object' || Array.isArray(t.judgeEvaluations)) {
      return { valid: false, error: `Estructura de evaluaciones de jueces inválida en el equipo #${t.id} (debe ser un objeto).` };
    }

    for (const [key, evalData] of Object.entries(t.judgeEvaluations)) {
      // 1. Strict key check: Key must be one of the known judge usernames
      if (!isValidJudgeUsername(key)) {
        return {
          valid: false,
          error: `Clave de evaluación desconocida '${key}' en equipo #${t.id}. Debe ser una de las 8 cuentas oficiales de jueces.`,
        };
      }

      // 2. Validate evaluation content
      const evalValidation = validateJudgeEvaluation(evalData);
      if (!evalValidation.valid || !evalValidation.data) {
        return {
          valid: false,
          error: `Evaluación inválida para juez '${key}' en equipo #${t.id}: ${evalValidation.error || 'datos corruptos'}`,
        };
      }

      // 3. Strict match between object key and evaluation's judgeUsername
      if (evalValidation.data.judgeUsername !== key) {
        return {
          valid: false,
          error: `Inconsistencia de clave: el registro '${key}' contiene judgeUsername '${evalValidation.data.judgeUsername}' en equipo #${t.id}.`,
        };
      }

      cleanJudgeEvaluations[key] = evalValidation.data;
    }

    // 4. Debate Room Collision Check (Strict: Max ONE submitted debate room)
    const submittedDebates = ['juez_sala_b', 'juez_sala_c', 'juez_sala_d', 'juez_sala_e'].filter(
      (k) => cleanJudgeEvaluations[k]?.isSubmitted
    );
    if (submittedDebates.length > 1) {
      const conflictingStations = submittedDebates
        .map((k) => cleanJudgeEvaluations[k].stationKey.toUpperCase())
        .join(', ');
      return {
        valid: false,
        error: `Conflicto de integridad en equipo #${t.id}: Múltiples salas de debate enviadas (${conflictingStations}). Un equipo solo puede tener una sala de debate activa.`,
      };
    }

    // 5. Sala A Fixed Block Assignment Check (Strict: A1 evaluates first 2 of 4; A2 evaluates last 2 of 4)
    if (typeof t.id === 'number') {
      const posInBlock = (t.id - 1) % 4;
      if (cleanJudgeEvaluations['juez_sala_a1']?.isSubmitted && posInBlock >= 2) {
        return {
          valid: false,
          error: `Inconsistencia de asignación en equipo #${t.id}: Este equipo corresponde a la asignación fija de Sala A2, no puede ser evaluado por Sala A1.`,
        };
      }
      if (cleanJudgeEvaluations['juez_sala_a2']?.isSubmitted && posInBlock < 2) {
        return {
          valid: false,
          error: `Inconsistencia de asignación en equipo #${t.id}: Este equipo corresponde a la asignación fija de Sala A1, no puede ser evaluado por Sala A2.`,
        };
      }
    }
  }

  // Validate current destination station if provided
  let currentStationKey: StationKey | null = null;
  if (t.currentStationKey !== undefined && t.currentStationKey !== null) {
    if (isValidStationKey(t.currentStationKey)) {
      currentStationKey = t.currentStationKey;
    } else {
      return {
        valid: false,
        error: `Estación actual asignada inválida para el equipo #${t.id}: '${t.currentStationKey}'.`,
      };
    }
  }

  const cleanTeam: Team = {
    id: t.id,
    name: t.name.trim().slice(0, 100),
    wave: t.wave,
    status: (t.status === 'inactive' ? 'inactive' : 'active') as TeamStatus,
    currentStationKey,
    members: Array.isArray(t.members) 
      ? t.members.map((m) => (typeof m === 'string' ? m.trim().slice(0, 100) : '')).filter(Boolean)
      : [],
    scores: cleanScores,
    totalScore: 0, // Will be computed by computeRanksAndBreak
    locksPassed: 0,
    allRoomsCompleted: false,
    rank: 0,
    waveRank: 0,
    isBreakQualified: false,
    judgeEvaluations: cleanJudgeEvaluations,
    lastUpdated: t.lastUpdated,
  };

  return { valid: true, data: cleanTeam };
}

/**
 * Formats an ISO timestamp or time string into a clean user-friendly presentation time.
 */
export function formatDisplayTimestamp(val?: string): string {
  if (!val) return '';
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  } catch {}
  return val;
}

/**
 * Validates an audit log entry.
 */
export function validateAuditLogEntry(entry: unknown): AuditLogEntry | null {
  if (!entry || typeof entry !== 'object') return null;

  const e = entry as Partial<AuditLogEntry>;

  if (typeof e.id !== 'string' || !e.id.trim()) return null;
  if (typeof e.timestamp !== 'string' || !e.timestamp.trim()) return null;
  if (typeof e.teamId !== 'number' || !Number.isInteger(e.teamId) || e.teamId < 0 || e.teamId > 50) return null;
  if (typeof e.room !== 'string') return null;
  if (typeof e.action !== 'string') return null;
  if (typeof e.judgeName !== 'string') return null;

  return {
    id: e.id.slice(0, 80),
    timestamp: e.timestamp.slice(0, 50),
    teamId: e.teamId,
    room: e.room.slice(0, 100),
    action: e.action.slice(0, 300),
    judgeName: e.judgeName.slice(0, 100),
  };
}

/**
 * Validates a cross-tab BroadcastChannel message.
 */
export function validateBroadcastMessage(msg: unknown): { type: string; timestamp: number } | null {
  if (!msg || typeof msg !== 'object') return null;
  const m = msg as { type?: unknown; timestamp?: unknown };
  if (typeof m.type !== 'string' || (m.type !== 'TEAMS_UPDATED' && m.type !== 'DATABASE_RESET')) return null;
  if (typeof m.timestamp !== 'number' || Number.isNaN(m.timestamp)) return null;
  return { type: m.type, timestamp: m.timestamp };
}
