import { Team, AuthUser, CreateTeamDto, UpdateTeamDto, TeamStatus } from '../types';
import { computeRanksAndBreak, saveTeamsToStorage, appendAuditLog } from '../utils/storage';
import { validateTeam } from '../utils/validation';

/**
 * Evaluates whether a team has historical evaluations, scores, or lock achievements.
 */
export function hasTeamEvaluationHistory(team: Team): boolean {
  if (!team) return false;

  if (team.totalScore > 0 || team.locksPassed > 0) return true;

  if (
    team.scores?.salaA?.isSubmitted ||
    team.scores?.salaBE?.isSubmitted ||
    team.scores?.salaF?.isSubmitted ||
    (team.scores?.salaA?.oratoriaPoints ?? 0) > 0 ||
    (team.scores?.salaBE?.debatePoints ?? 0) > 0 ||
    (team.scores?.salaF?.crisisPoints ?? 0) > 0
  ) {
    return true;
  }

  const evals = Object.values(team.judgeEvaluations || {});
  return evals.some((ev) => ev && (ev.isSubmitted || (ev.points && ev.points > 0)));
}

/**
 * Checks if a team can be safely deleted or if it should only be deactivated.
 */
export function canDeleteTeam(team: Team): { canDelete: boolean; hasEvaluations: boolean; reason?: string } {
  const hasHistory = hasTeamEvaluationHistory(team);
  if (hasHistory) {
    return {
      canDelete: false,
      hasEvaluations: true,
      reason: `El equipo #${team.id} (${team.name}) cuenta con evaluaciones, puntuaciones o registros históricos en el sistema. Para preservar la integridad de la auditoría y tabulación, este equipo no puede eliminarse; debe desactivarse en su lugar.`,
    };
  }

  return {
    canDelete: true,
    hasEvaluations: false,
  };
}

/**
 * Validates team creation payload.
 */
export function validateCreateTeamPayload(
  dto: CreateTeamDto,
  existingTeams: Team[]
): { valid: boolean; error?: string } {
  if (typeof dto.id !== 'number' || !Number.isInteger(dto.id) || dto.id < 1) {
    return { valid: false, error: 'El ID del equipo debe ser un número entero positivo mayor a cero.' };
  }

  if (dto.id > 50) {
    return {
      valid: false,
      error: 'La arquitectura actual de salas y cuadrantes admite IDs de equipo entre 1 y 50.',
    };
  }

  const idCollision = existingTeams.some((t) => t.id === dto.id);
  if (idCollision) {
    return { valid: false, error: `Ya existe un equipo registrado con el ID #${dto.id}.` };
  }

  if (!dto.name || !dto.name.trim()) {
    return { valid: false, error: 'El nombre del equipo o delegación es obligatorio.' };
  }

  if (dto.wave !== 'morning' && dto.wave !== 'afternoon') {
    return { valid: false, error: 'Debe seleccionar una oleada válida ("morning" o "afternoon").' };
  }

  return { valid: true };
}

/**
 * Creates a new team and recalculates rankings.
 */
export function createTeam(
  dto: CreateTeamDto,
  currentTeams: Team[],
  currentAdmin: AuthUser
): { success: boolean; error?: string; updatedTeams?: Team[]; newTeam?: Team } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden registrar equipos.' };
  }

  const validation = validateCreateTeamPayload(dto, currentTeams);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const cleanMembers = (dto.members || [])
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  const newTeam: Team = {
    id: dto.id,
    name: dto.name.trim(),
    wave: dto.wave,
    members: cleanMembers.length > 0 ? cleanMembers : [`Delegado 1 - Equipo ${dto.id}`],
    status: dto.status || 'active',
    scores: {
      salaA: { oratoriaPoints: 0, keywordSolved: false, isSubmitted: false },
      salaBE: { debatePoints: 0, codeDelivered: false, isSubmitted: false },
      salaF: { crisisPoints: 0, stampAwarded: false, isSubmitted: false },
    },
    judgeEvaluations: {},
    totalScore: 0,
    locksPassed: 0,
    allRoomsCompleted: false,
    rank: currentTeams.length + 1,
    waveRank: 0,
    isBreakQualified: false,
    lastUpdated: new Date().toISOString(),
  };

  const candidateList = [...currentTeams, newTeam];

  // Validate team object
  const teamVal = validateTeam(newTeam);
  if (!teamVal.valid) {
    return { success: false, error: teamVal.error };
  }

  const recalculated = computeRanksAndBreak(candidateList);
  saveTeamsToStorage(recalculated);

  appendAuditLog({
    teamId: newTeam.id,
    room: 'Panel Administrativo',
    action: `Equipo creado [#${newTeam.id} - ${newTeam.name}] (Oleada: ${
      newTeam.wave === 'morning' ? 'Mañana' : 'Tarde'
    } | Estado: ${newTeam.status?.toUpperCase()})`,
    judgeName: currentAdmin.name,
  });

  return { success: true, updatedTeams: recalculated, newTeam };
}

/**
 * Updates an existing team while preserving evaluation history.
 */
export function updateTeam(
  teamId: number,
  dto: UpdateTeamDto,
  currentTeams: Team[],
  currentAdmin: AuthUser
): { success: boolean; error?: string; updatedTeams?: Team[]; updatedTeam?: Team } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden modificar equipos.' };
  }

  const existingTeam = currentTeams.find((t) => t.id === teamId);
  if (!existingTeam) {
    return { success: false, error: `Equipo #${teamId} no encontrado.` };
  }

  // Check if ID is being changed
  const targetId = dto.id !== undefined ? dto.id : existingTeam.id;
  if (targetId !== existingTeam.id) {
    if (typeof targetId !== 'number' || !Number.isInteger(targetId) || targetId < 1 || targetId > 50) {
      return { valid: false, error: 'El nuevo ID del equipo debe estar entre 1 y 50.' };
    }

    if (hasTeamEvaluationHistory(existingTeam)) {
      return {
        success: false,
        error: `No es posible modificar el ID del equipo #${existingTeam.id} porque ya contiene evaluaciones y registros históricos vinculados.`,
      };
    }

    const collision = currentTeams.some((t) => t.id === targetId && t.id !== teamId);
    if (collision) {
      return { success: false, error: `Ya existe un equipo registrado con el ID #${targetId}.` };
    }
  }

  if (dto.name !== undefined && (!dto.name.trim() || dto.name.trim().length === 0)) {
    return { success: false, error: 'El nombre del equipo no puede estar vacío.' };
  }

  const cleanMembers =
    dto.members !== undefined
      ? dto.members.map((m) => m.trim()).filter((m) => m.length > 0)
      : existingTeam.members;

  // Preserve all scores and evaluations intact!
  const updatedTeamObj: Team = {
    ...existingTeam,
    id: targetId,
    name: dto.name !== undefined ? dto.name.trim() : existingTeam.name,
    wave: dto.wave !== undefined ? dto.wave : existingTeam.wave,
    status: dto.status !== undefined ? dto.status : (existingTeam.status || 'active'),
    members: cleanMembers.length > 0 ? cleanMembers : existingTeam.members,
    lastUpdated: new Date().toISOString(),
  };

  const teamVal = validateTeam(updatedTeamObj);
  if (!teamVal.valid) {
    return { success: false, error: teamVal.error };
  }

  const candidateList = currentTeams.map((t) => (t.id === teamId ? updatedTeamObj : t));
  const recalculated = computeRanksAndBreak(candidateList);
  saveTeamsToStorage(recalculated);

  appendAuditLog({
    teamId: updatedTeamObj.id,
    room: 'Panel Administrativo',
    action: `Equipo actualizado [#${updatedTeamObj.id} - ${updatedTeamObj.name}] (Oleada: ${
      updatedTeamObj.wave === 'morning' ? 'Mañana' : 'Tarde'
    } | Estado: ${updatedTeamObj.status?.toUpperCase()})`,
    judgeName: currentAdmin.name,
  });

  return { success: true, updatedTeams: recalculated, updatedTeam: updatedTeamObj };
}

/**
 * Toggles a team's active/inactive status.
 */
export function toggleTeamStatus(
  teamId: number,
  currentTeams: Team[],
  currentAdmin: AuthUser
): { success: boolean; error?: string; updatedTeams?: Team[]; newStatus?: TeamStatus } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden cambiar el estado de equipos.' };
  }

  const team = currentTeams.find((t) => t.id === teamId);
  if (!team) {
    return { success: false, error: `Equipo #${teamId} no encontrado.` };
  }

  const targetStatus: TeamStatus = (team.status || 'active') === 'active' ? 'inactive' : 'active';

  const updatedTeam: Team = {
    ...team,
    status: targetStatus,
    lastUpdated: new Date().toISOString(),
  };

  const candidateList = currentTeams.map((t) => (t.id === teamId ? updatedTeam : t));
  const recalculated = computeRanksAndBreak(candidateList);
  saveTeamsToStorage(recalculated);

  appendAuditLog({
    teamId: team.id,
    room: 'Panel Administrativo',
    action: `Estado de equipo modificado: [#${team.id} - ${team.name}] marcado como ${targetStatus.toUpperCase()}`,
    judgeName: currentAdmin.name,
  });

  return { success: true, updatedTeams: recalculated, newStatus: targetStatus };
}

/**
 * Safely deletes a team if it has no evaluation history.
 */
export function deleteTeam(
  teamId: number,
  currentTeams: Team[],
  currentAdmin: AuthUser
): { success: boolean; error?: string; updatedTeams?: Team[] } {
  if (currentAdmin.role !== 'admin') {
    return { success: false, error: 'Acceso denegado: solo administradores pueden eliminar equipos.' };
  }

  const team = currentTeams.find((t) => t.id === teamId);
  if (!team) {
    return { success: false, error: `Equipo #${teamId} no encontrado.` };
  }

  const deleteCheck = canDeleteTeam(team);
  if (!deleteCheck.canDelete) {
    return { success: false, error: deleteCheck.reason };
  }

  const candidateList = currentTeams.filter((t) => t.id !== teamId);
  const recalculated = computeRanksAndBreak(candidateList);
  saveTeamsToStorage(recalculated);

  appendAuditLog({
    teamId: team.id,
    room: 'Panel Administrativo',
    action: `Equipo eliminado permanentemente [#${team.id} - ${team.name}]`,
    judgeName: currentAdmin.name,
  });

  return { success: true, updatedTeams: recalculated };
}
