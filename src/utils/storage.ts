import { Team, TeamScores, Wave, AuditLogEntry, JudgeEvaluation, StationKey } from '../types';
import { buildOfficialTeams } from '../data/officialTeams';
import { 
  validateTeam, 
  validateAuditLogEntry, 
  validateBroadcastMessage,
  StorageCorruptionError, 
  StorageQuotaExceededError, 
  StorageUnavailableError, 
  InvalidBackupError 
} from './validation';

const STORAGE_KEY = 'coming_back_rise_official_teams_v4';
const AUDIT_LOG_KEY = 'coming_back_rise_audit_log_v4';
const BROADCAST_CHANNEL_NAME = 'coming_back_live_tab_sync_channel';

// Clean legacy test and old 50-team mock storage keys if present
const LEGACY_STORAGE_KEYS = [
  'coming_back_aniversario_live_zero_state_v3',
  'coming_back_aniversario_audit_log_zero_state_v3',
  'coming_back_aniversario_live_official_zero_state',
  'coming_back_aniversario_audit_log_zero_state',
  'coming_back_aniversario_tournament_teams',
  'coming_back_aniversario_audit_log'
];

try {
  if (typeof localStorage !== 'undefined') {
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  }
} catch {}

/**
 * Checks if localStorage is available and functional in the current environment.
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__storage_test_key__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera la lista limpia de los 18 equipos oficiales con sus participantes
 */
export function getInitialTeams(): Team[] {
  return computeRanksAndBreak(buildOfficialTeams());
}

/**
 * Real-time tiebreaking algorithm:
 * 1º Total Score (descending)
 * 2º Sala B-E (Debate Points) (descending)
 * 3º Sala F (Crisis Points) (descending)
 * 4º Sala A (Oratoria Points) (descending)
 * 5º Locks count (descending)
 * 6º Team ID (ascending)
 */
export function computeRanksAndBreak(teams: Team[]): Team[] {
  // Consolidate judge evaluations into room scores strictly from authoritative judgeEvaluations
  const computedTeams = teams.map((team) => {
    const evals = team.judgeEvaluations || {};

    // 1. Sala A: check juez_sala_a1 and juez_sala_a2
    const a1 = evals['juez_sala_a1'];
    const a2 = evals['juez_sala_a2'];
    let oratoriaPoints = 0;
    let keywordSolved = false;
    let isSubmittedA = false;
    let judgeNameA: string | undefined = undefined;
    let timestampA: string | undefined = undefined;
    let notesA: string | undefined = undefined;

    if (a1 && a1.isSubmitted && a2 && a2.isSubmitted) {
      oratoriaPoints = Math.round(((a1.points + a2.points) / 2) * 10) / 10;
      keywordSolved = Boolean(a1.escapeChallenge || a2.escapeChallenge);
      isSubmittedA = true;
      judgeNameA = 'Juez A1 & A2 (Promedio)';
      timestampA = a2.timestamp || a1.timestamp || undefined;
      notesA = [a1.notes, a2.notes].filter(Boolean).join(' | ') || undefined;
    } else if (a1 && a1.isSubmitted) {
      oratoriaPoints = a1.points;
      keywordSolved = Boolean(a1.escapeChallenge);
      isSubmittedA = true;
      judgeNameA = a1.judgeUsername;
      timestampA = a1.timestamp || undefined;
      notesA = a1.notes || undefined;
    } else if (a2 && a2.isSubmitted) {
      oratoriaPoints = a2.points;
      keywordSolved = Boolean(a2.escapeChallenge);
      isSubmittedA = true;
      judgeNameA = a2.judgeUsername;
      timestampA = a2.timestamp || undefined;
      notesA = a2.notes || undefined;
    }

    // 2. Sala B-E: check juez_sala_b, c, d, e
    const b = evals['juez_sala_b'];
    const c = evals['juez_sala_c'];
    const d = evals['juez_sala_d'];
    const e = evals['juez_sala_e'];
    let debatePoints = 0;
    let codeDelivered = false;
    let specificRoom: 'B' | 'C' | 'D' | 'E' | undefined = undefined;
    let isSubmittedBE = false;
    let judgeNameBE: string | undefined = undefined;
    let timestampBE: string | undefined = undefined;
    let notesBE: string | undefined = undefined;

    const submittedDebates = [b, c, d, e].filter((j): j is JudgeEvaluation => Boolean(j && j.isSubmitted));
    if (submittedDebates.length > 1) {
      const conflictingStations = submittedDebates.map((j) => j.stationKey.toUpperCase()).join(', ');
      throw new Error(`Conflicto de integridad en equipo #${team.id}: Múltiples salas de debate enviadas (${conflictingStations}). Un equipo solo puede tener una sala de debate activa.`);
    } else if (submittedDebates.length === 1) {
      const debateJudge = submittedDebates[0];
      debatePoints = debateJudge.points;
      codeDelivered = Boolean(debateJudge.escapeChallenge);
      isSubmittedBE = true;
      const roomLetter = debateJudge.stationKey.replace('sala_', '').toUpperCase() as 'B' | 'C' | 'D' | 'E';
      specificRoom = roomLetter;
      judgeNameBE = debateJudge.judgeUsername;
      timestampBE = debateJudge.timestamp || undefined;
      notesBE = debateJudge.notes || undefined;
    }

    // 3. Sala F: check juez_sala_f1 and juez_sala_f2
    const f1 = evals['juez_sala_f1'];
    const f2 = evals['juez_sala_f2'];
    let crisisPoints = 0;
    let stampAwarded = false;
    let isSubmittedF = false;
    let judgeNameF: string | undefined = undefined;
    let timestampF: string | undefined = undefined;
    let notesF: string | undefined = undefined;

    if (f1 && f1.isSubmitted && f2 && f2.isSubmitted) {
      crisisPoints = Math.round(((f1.points + f2.points) / 2) * 10) / 10;
      stampAwarded = Boolean(f1.escapeChallenge || f2.escapeChallenge);
      isSubmittedF = true;
      judgeNameF = 'Juez F1 & F2 (Promedio)';
      timestampF = f2.timestamp || f1.timestamp || undefined;
      notesF = [f1.notes, f2.notes].filter(Boolean).join(' | ') || undefined;
    } else if (f1 && f1.isSubmitted) {
      crisisPoints = f1.points;
      stampAwarded = Boolean(f1.escapeChallenge);
      isSubmittedF = true;
      judgeNameF = f1.judgeUsername;
      timestampF = f1.timestamp || undefined;
      notesF = f1.notes || undefined;
    } else if (f2 && f2.isSubmitted) {
      crisisPoints = f2.points;
      stampAwarded = Boolean(f2.escapeChallenge);
      isSubmittedF = true;
      judgeNameF = f2.judgeUsername;
      timestampF = f2.timestamp || undefined;
      notesF = f2.notes || undefined;
    }

    const consolidatedScores: TeamScores = {
      salaA: {
        oratoriaPoints,
        keywordSolved,
        judgeName: judgeNameA,
        timestamp: timestampA,
        notes: notesA,
        isSubmitted: isSubmittedA,
      },
      salaBE: {
        debatePoints,
        codeDelivered,
        specificRoom,
        judgeName: judgeNameBE,
        timestamp: timestampBE,
        notes: notesBE,
        isSubmitted: isSubmittedBE,
      },
      salaF: {
        crisisPoints,
        stampAwarded,
        judgeName: judgeNameF,
        timestamp: timestampF,
        notes: notesF,
        isSubmitted: isSubmittedF,
      },
    };

    const sA = isSubmittedA ? oratoriaPoints : 0;
    const sBE = isSubmittedBE ? debatePoints : 0;
    const sF = isSubmittedF ? crisisPoints : 0;
    const totalScore = Math.round((sA + sBE + sF) * 10) / 10;

    let locks = 0;
    if (keywordSolved) locks++;
    if (codeDelivered) locks++;
    if (stampAwarded) locks++;

    const allRoomsCompleted = isSubmittedA && isSubmittedBE && isSubmittedF;

    return {
      ...team,
      scores: consolidatedScores,
      judgeEvaluations: evals,
      totalScore,
      locksPassed: locks,
      allRoomsCompleted,
    };
  });

  // Sort comparison function
  const compareTeams = (a: Team, b: Team): number => {
    // 1. Total score
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 2. 1er Criterio Desempate: Sala B-E (Debate)
    const aDebate = a.scores.salaBE.isSubmitted ? a.scores.salaBE.debatePoints : 0;
    const bDebate = b.scores.salaBE.isSubmitted ? b.scores.salaBE.debatePoints : 0;
    if (bDebate !== aDebate) {
      return bDebate - aDebate;
    }
    // 3. 2do Criterio Desempate: Sala F (Crisis)
    const aCrisis = a.scores.salaF.isSubmitted ? a.scores.salaF.crisisPoints : 0;
    const bCrisis = b.scores.salaF.isSubmitted ? b.scores.salaF.crisisPoints : 0;
    if (bCrisis !== aCrisis) {
      return bCrisis - aCrisis;
    }
    // 4. Sala A (Oratoria)
    const aOratoria = a.scores.salaA.isSubmitted ? a.scores.salaA.oratoriaPoints : 0;
    const bOratoria = b.scores.salaA.isSubmitted ? b.scores.salaA.oratoriaPoints : 0;
    if (bOratoria !== aOratoria) {
      return bOratoria - aOratoria;
    }
    // 5. Candados / Desafíos escape room
    if (b.locksPassed !== a.locksPassed) {
      return b.locksPassed - a.locksPassed;
    }
    // 6. ID de Equipo
    return a.id - b.id;
  };

  // Global ranking
  const sortedGlobal = [...computedTeams].sort(compareTeams);
  sortedGlobal.forEach((team, index) => {
    team.rank = index + 1;
  });

  // Morning wave ranking & Break (Top 2 Morning - only active teams qualify)
  const morningTeams = sortedGlobal.filter((t) => t.wave === 'morning' && t.status !== 'inactive');
  morningTeams.forEach((team, index) => {
    team.waveRank = index + 1;
  });
  const top2MorningIds = new Set(morningTeams.slice(0, 2).map((t) => t.id));

  // Afternoon wave ranking & Break (Top 2 Afternoon - only active teams qualify)
  const afternoonTeams = sortedGlobal.filter((t) => t.wave === 'afternoon' && t.status !== 'inactive');
  afternoonTeams.forEach((team, index) => {
    team.waveRank = index + 1;
  });
  const top2AfternoonIds = new Set(afternoonTeams.slice(0, 2).map((t) => t.id));

  // Check if tournament has started receiving real scores
  const hasAnyEvaluations = sortedGlobal.some(
    (t) =>
      t.totalScore > 0 ||
      t.scores.salaA.isSubmitted ||
      t.scores.salaBE.isSubmitted ||
      t.scores.salaF.isSubmitted ||
      Object.values(t.judgeEvaluations || {}).some((e) => e.isSubmitted)
  );

  // Mark Break Qualifiers ONLY if real scores exist and team is active
  sortedGlobal.forEach((team) => {
    team.isBreakQualified =
      team.status !== 'inactive' &&
      hasAnyEvaluations &&
      ((team.wave === 'morning' && top2MorningIds.has(team.id)) ||
        (team.wave === 'afternoon' && top2AfternoonIds.has(team.id)));
  });

  return sortedGlobal.sort((a, b) => a.id - b.id);
}

// Storage Manager
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

/**
 * Loads and validates teams from localStorage.
 * Detects corruption without silently wiping real tournament progress.
 */
export function loadTeamsFromStorage(): Team[] {
  if (!isStorageAvailable()) {
    return getInitialTeams();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = getInitialTeams();
    saveTeamsToStorage(initial, false);
    return initial;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Quarantine corrupted data
    const backupKey = `coming_back_corrupted_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {}
    console.warn('Error de sintaxis JSON al leer almacenamiento local. Autorreparando con los 18 equipos oficiales.');
    const initial = getInitialTeams();
    saveTeamsToStorage(initial, false);
    return initial;
  }

  // If parsed data does not contain exactly 18 teams (e.g. legacy 50-team mock datasets or partial lists)
  if (!Array.isArray(parsed) || parsed.length !== 18) {
    const backupKey = `coming_back_corrupted_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {}
    console.warn(
      `Estructura de datos no coincide con los 18 equipos oficiales (encontrados ${
        Array.isArray(parsed) ? parsed.length : 'no-array'
      }). Se ha creado copia de seguridad y autorreparado con los 18 equipos oficiales.`
    );

    // Build the official clean 18 teams
    const initial = getInitialTeams();

    // Preserve any existing evaluations or scores that belonged to official teams 1-18
    if (Array.isArray(parsed)) {
      parsed.forEach((oldTeam: any) => {
        if (oldTeam && typeof oldTeam.id === 'number' && oldTeam.id >= 1 && oldTeam.id <= 18) {
          const match = initial.find((t) => t.id === oldTeam.id);
          if (match) {
            if (oldTeam.judgeEvaluations && typeof oldTeam.judgeEvaluations === 'object') {
              match.judgeEvaluations = { ...match.judgeEvaluations, ...oldTeam.judgeEvaluations };
            }
            if (oldTeam.scores && typeof oldTeam.scores === 'object') {
              match.scores = { ...match.scores, ...oldTeam.scores };
            }
          }
        }
      });
    }

    const migrated = computeRanksAndBreak(initial);
    saveTeamsToStorage(migrated, false);
    return migrated;
  }

  const validatedTeams: Team[] = [];
  let hadInvalid = false;
  for (let i = 0; i < parsed.length; i++) {
    const res = validateTeam(parsed[i]);
    if (!res.valid || !res.data) {
      hadInvalid = true;
      const officialFallback = buildOfficialTeams()[i] || getInitialTeams()[0];
      validatedTeams.push(officialFallback);
    } else {
      validatedTeams.push(res.data);
    }
  }

  if (hadInvalid) {
    const backupKey = `coming_back_corrupted_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {}
    saveTeamsToStorage(validatedTeams, false);
  }

  return computeRanksAndBreak(validatedTeams);
}

/**
 * Saves and validates teams to localStorage with broadcast synchronization.
 */
export function saveTeamsToStorage(teams: Team[], broadcast: boolean = true): boolean {
  if (!isStorageAvailable()) {
    throw new StorageUnavailableError();
  }

  const recalculated = computeRanksAndBreak(teams);

  // Validate all teams before serializing
  for (const t of recalculated) {
    const val = validateTeam(t);
    if (!val.valid) {
      throw new Error(`Error de validación al intentar guardar el equipo #${t.id}: ${val.error}`);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recalculated));
    if (broadcast && broadcastChannel) {
      broadcastChannel.postMessage({ type: 'TEAMS_UPDATED', timestamp: Date.now() });
    }
    return true;
  } catch (error: any) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      throw new StorageQuotaExceededError('Capacidad de almacenamiento local excedida.');
    }
    throw error;
  }
}

/**
 * Subscribes to cross-tab storage updates using StorageEvent and BroadcastChannel.
 */
export function subscribeToStorageUpdates(callback: (eventType?: 'TEAMS_UPDATED' | 'DATABASE_RESET') => void): () => void {
  const storageListener = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback('TEAMS_UPDATED');
    }
  };

  const channelListener = (event: MessageEvent) => {
    const validated = validateBroadcastMessage(event.data);
    if (validated) {
      callback(validated.type as 'TEAMS_UPDATED' | 'DATABASE_RESET');
    }
  };

  window.addEventListener('storage', storageListener);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', channelListener);
  }

  return () => {
    window.removeEventListener('storage', storageListener);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', channelListener);
    }
  };
}

/**
 * Loads audit log entries from storage with strict entry-level validation.
 * Never silently turns corrupted audit logs into an empty array.
 * Creates a quarantine backup and throws StorageCorruptionError if corrupted.
 */
export function loadAuditLog(): AuditLogEntry[] {
  if (!isStorageAvailable()) {
    return [];
  }

  const raw = localStorage.getItem(AUDIT_LOG_KEY);
  if (raw === null || raw === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const backupKey = `coming_back_corrupted_audit_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {}
    throw new StorageCorruptionError(
      'Error de sintaxis JSON al leer los registros de auditoría. Se ha creado una copia de cuarentena.',
      raw,
      backupKey
    );
  }

  if (!Array.isArray(parsed)) {
    const backupKey = `coming_back_corrupted_audit_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {}
    throw new StorageCorruptionError(
      'Estructura de registro de auditoría corrupta (se esperaba un array). Se ha creado una copia de cuarentena.',
      raw,
      backupKey
    );
  }

  const validatedLogs: AuditLogEntry[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const validated = validateAuditLogEntry(parsed[i]);
    if (!validated) {
      const backupKey = `coming_back_corrupted_audit_backup_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, raw);
      } catch {}
      throw new StorageCorruptionError(
        `Entrada de auditoría corrupta o inválida en el registro #${i + 1}. Se ha creado una copia de cuarentena.`,
        raw,
        backupKey
      );
    }
    validatedLogs.push(validated);
  }

  return validatedLogs;
}

/**
 * Appends a verified entry to the local audit log.
 * Propagates StorageCorruptionError if the existing audit log is corrupted,
 * ensuring corrupted state is quarantined by loadAuditLog() and not silently overwritten.
 */
export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  if (!isStorageAvailable()) {
    throw new StorageUnavailableError();
  }

  const logs = loadAuditLog();

  const newEntry: AuditLogEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    teamId: typeof entry.teamId === 'number' ? entry.teamId : 0,
    room: typeof entry.room === 'string' ? entry.room.slice(0, 100) : '',
    action: typeof entry.action === 'string' ? entry.action.slice(0, 300) : '',
    judgeName: typeof entry.judgeName === 'string' ? entry.judgeName.slice(0, 100) : 'Sistema',
  };

  const validated = validateAuditLogEntry(newEntry);
  if (!validated) {
    throw new Error('Entrada de auditoría inválida.');
  }

  logs.unshift(validated);
  const trimmed = logs.slice(0, 200);

  try {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } catch (error: any) {
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      throw new StorageQuotaExceededError('Capacidad de almacenamiento local excedida al guardar registro de auditoría.');
    }
    throw error;
  }
}

/**
 * Populates realistic scores for each judge account.
 */


/**
 * Reset Database to clean state
 */
export function resetDatabase(): Team[] {
  const initial = getInitialTeams();
  saveTeamsToStorage(initial, false);
  try {
    localStorage.removeItem(AUDIT_LOG_KEY);
  } catch (e) {}

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'DATABASE_RESET', timestamp: Date.now() });
    } catch {}
  }

  appendAuditLog({
    teamId: 0,
    room: 'SISTEMA',
    action: 'Reinicio de base de datos a estado inicial cero',
    judgeName: 'Mesa Directiva',
  });
  return initial;
}

/**
 * Export data as formatted CSV for Excel / Google Sheets with 8 judges breakdown
 */
export function exportToCSV(teams: Team[]): void {
  const sorted = [...teams].sort((a, b) => a.rank - b.rank);

  const headers = [
    'Posición Global',
    'Posición Oleada',
    'Estado Break',
    'Número Equipo',
    'Nombre Equipo',
    'Oleada',
    'Integrantes',
    'Juez A1 (Oratoria)',
    'Candado A1',
    'Juez A2 (Oratoria)',
    'Candado A2',
    'Oficial Sala A (0-25)',
    'Juez Sala B (Debate)',
    'Juez Sala C (Debate)',
    'Juez Sala D (Debate)',
    'Juez Sala E (Debate)',
    'Oficial Sala B-E (0-50)',
    'Candado B-E',
    'Juez F1 (Crisis)',
    'Candado F1',
    'Juez F2 (Crisis)',
    'Candado F2',
    'Oficial Sala F (0-25)',
    'PUNTAJE TOTAL (0-100)',
    'Candados Superados (0-3)',
    'Salas Completadas',
  ];

  const escapeCSV = (str: string | number | boolean | undefined) => {
    if (str === undefined || str === null) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = sorted.map((t) => {
    const ev = t.judgeEvaluations || {};
    const a1 = ev['juez_sala_a1']?.isSubmitted ? ev['juez_sala_a1']?.points : '-';
    const a1Lock = ev['juez_sala_a1']?.isSubmitted ? (ev['juez_sala_a1']?.escapeChallenge ? 'SÍ' : 'NO') : '-';
    const a2 = ev['juez_sala_a2']?.isSubmitted ? ev['juez_sala_a2']?.points : '-';
    const a2Lock = ev['juez_sala_a2']?.isSubmitted ? (ev['juez_sala_a2']?.escapeChallenge ? 'SÍ' : 'NO') : '-';

    const b = ev['juez_sala_b']?.isSubmitted ? ev['juez_sala_b']?.points : '-';
    const c = ev['juez_sala_c']?.isSubmitted ? ev['juez_sala_c']?.points : '-';
    const d = ev['juez_sala_d']?.isSubmitted ? ev['juez_sala_d']?.points : '-';
    const e = ev['juez_sala_e']?.isSubmitted ? ev['juez_sala_e']?.points : '-';

    const f1 = ev['juez_sala_f1']?.isSubmitted ? ev['juez_sala_f1']?.points : '-';
    const f1Lock = ev['juez_sala_f1']?.isSubmitted ? (ev['juez_sala_f1']?.escapeChallenge ? 'SÍ' : 'NO') : '-';
    const f2 = ev['juez_sala_f2']?.isSubmitted ? ev['juez_sala_f2']?.points : '-';
    const f2Lock = ev['juez_sala_f2']?.isSubmitted ? (ev['juez_sala_f2']?.escapeChallenge ? 'SÍ' : 'NO') : '-';

    return [
      t.rank,
      t.waveRank,
      t.isBreakQualified ? 'CLASIFICADO TOP 4' : 'Fase Regular',
      t.id,
      escapeCSV(t.name),
      t.wave === 'morning' ? 'Mañana (1-9)' : 'Tarde (10-18)',
      escapeCSV(t.members.join(' | ')),
      a1,
      a1Lock,
      a2,
      a2Lock,
      t.scores.salaA.isSubmitted ? t.scores.salaA.oratoriaPoints : 0,
      b,
      c,
      d,
      e,
      t.scores.salaBE.isSubmitted ? t.scores.salaBE.debatePoints : 0,
      t.scores.salaBE.codeDelivered ? 'SÍ' : 'NO',
      f1,
      f1Lock,
      f2,
      f2Lock,
      t.scores.salaF.isSubmitted ? t.scores.salaF.crisisPoints : 0,
      t.totalScore,
      t.locksPassed,
      t.allRoomsCompleted ? '3/3' : 'Incompleto',
    ];
  });

  const csvContent =
    '\uFEFF' +
    headers.join(',') +
    '\n' +
    rows.map((row) => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('href', url);
  link.setAttribute('download', `Coming_Back_Aniversario_LiveTab_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Backup JSON export
 */
export function exportBackupJSON(teams: Team[]): void {
  // If audit log is corrupted or has storage failure, loadAuditLog() will throw StorageCorruptionError.
  // Never silently replace corrupted audit logs with [] to prevent generating misleading backups.
  const logs = loadAuditLog();

  const data = {
    version: '2.0',
    eventName: 'Coming Back Aniversario',
    exportedAt: new Date().toISOString(),
    teams: teams,
    auditLogs: logs,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('href', url);
  link.setAttribute('download', `Coming_Back_Backup_${timestamp}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import and strictly validate JSON backup.
 * Recalculates all derived metrics to avoid trusting exported summary fields.
 */
export function importBackupJSON(jsonString: string): Team[] {
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new InvalidBackupError('El archivo seleccionado no es un JSON válido.');
  }

  if (!data || typeof data !== 'object') {
    throw new InvalidBackupError('Estructura de respaldo vacía o corrupta.');
  }

  if (!data.teams || !Array.isArray(data.teams)) {
    throw new InvalidBackupError('El archivo no contiene la matriz de equipos requerida.');
  }

  if (data.teams.length < 1 || data.teams.length > 18) {
    throw new InvalidBackupError(`El respaldo debe contener entre 1 y 18 equipos (encontrados: ${data.teams.length}).`);
  }

  const seenIds = new Set<number>();
  const validatedTeams: Team[] = [];

  for (let i = 0; i < data.teams.length; i++) {
    const rawTeam = data.teams[i];
    const validation = validateTeam(rawTeam);
    if (!validation.valid || !validation.data) {
      throw new InvalidBackupError(`Datos inválidos en el equipo del índice ${i}: ${validation.error}`);
    }

    if (seenIds.has(validation.data.id)) {
      throw new InvalidBackupError(`ID de equipo duplicado detectado (#${validation.data.id}).`);
    }
    seenIds.add(validation.data.id);
    validatedTeams.push(validation.data);
  }

  // Validate and parse audit logs if present BEFORE any storage mutation - STRICT
  let validLogsToPersist: AuditLogEntry[] | null = null;
  if (data.auditLogs !== undefined && data.auditLogs !== null) {
    if (!Array.isArray(data.auditLogs)) {
      throw new InvalidBackupError('El campo auditLogs del archivo de respaldo debe ser un array.');
    }
    const validLogs: AuditLogEntry[] = [];
    for (let i = 0; i < data.auditLogs.length; i++) {
      const entry = data.auditLogs[i];
      const validated = validateAuditLogEntry(entry);
      if (!validated) {
        throw new InvalidBackupError(`Entrada de registro de auditoría inválida en el índice ${i} del archivo de respaldo.`);
      }
      validLogs.push(validated);
    }
    validLogsToPersist = validLogs.slice(0, 200);
  }

  // Recalculate deterministic derived values (ranks, waveRanks, totalScores, breaks)
  const processed = computeRanksAndBreak(validatedTeams);

  // Capture exact previous raw storage values as rollback snapshots BEFORE any mutation
  const previousTeamsRaw = localStorage.getItem(STORAGE_KEY);
  const hadPreviousTeams = previousTeamsRaw !== null;
  const previousAuditRaw = localStorage.getItem(AUDIT_LOG_KEY);
  const hadPreviousAudit = previousAuditRaw !== null;

  const performRollback = (originalError: unknown): never => {
    let rollbackError: Error | null = null;

    try {
      if (hadPreviousTeams && previousTeamsRaw !== null) {
        localStorage.setItem(STORAGE_KEY, previousTeamsRaw);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err: any) {
      rollbackError = new Error(
        `Fallo crítico de recuperación: no se pudo revertir la clave de equipos (${err?.message || err}). Se requiere verificación manual del almacenamiento.`
      );
    }

    try {
      if (hadPreviousAudit && previousAuditRaw !== null) {
        localStorage.setItem(AUDIT_LOG_KEY, previousAuditRaw);
      } else {
        localStorage.removeItem(AUDIT_LOG_KEY);
      }
    } catch (err: any) {
      rollbackError = new Error(
        `Fallo crítico de recuperación: no se pudo revertir la clave de registros de auditoría (${err?.message || err}). Se requiere verificación manual del almacenamiento.`
      );
    }

    if (rollbackError) {
      throw rollbackError;
    }

    if (originalError instanceof Error) {
      throw originalError;
    }
    throw new Error(String(originalError));
  };

  try {
    // 1. Persist teams
    saveTeamsToStorage(processed);

    // 2. Persist audit logs if present
    if (validLogsToPersist !== null) {
      try {
        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(validLogsToPersist));
      } catch (err: any) {
        if (err?.name === 'QuotaExceededError' || err?.code === 22) {
          throw new StorageQuotaExceededError('Capacidad de almacenamiento local excedida al guardar registro de auditoría del respaldo.');
        }
        throw err;
      }
    }

    // 3. Append restoration audit event ONLY AFTER complete successful persistence
    appendAuditLog({
      teamId: 0,
      room: 'SISTEMA',
      action: 'Restauración de respaldo JSON validado (18 equipos)',
      judgeName: 'Mesa Directiva',
    });
  } catch (err) {
    performRollback(err);
  }

  return processed;
}
