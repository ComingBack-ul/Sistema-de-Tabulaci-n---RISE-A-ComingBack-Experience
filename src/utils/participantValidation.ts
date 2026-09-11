import { Team, RotationId, ParticipantContent } from '../types';
import { loadAllParticipantContent, getSafeParticipantAssignment } from '../services/participantContentService';

export interface ContentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAllContentStructure(teams: Team[]): ContentValidationResult {
  const errors: string[] = [];
  const content = loadAllParticipantContent();
  const definedRotations = Object.keys(content) as RotationId[];

  if (definedRotations.length === 0) {
    errors.push("No hay rotaciones definidas.");
    return { valid: false, errors };
  }

  definedRotations.forEach(rotation => {
    const rotationData = content[rotation];
    
    if (!rotationData) {
      errors.push(`Rotación inexistente: ${rotation}`);
      return;
    }

    const teamAssignments = rotationData.teamAssignments;

    teams.forEach(team => {
      const assignment = teamAssignments[team.id];
      if (!assignment) {
        errors.push(`Equipo ${team.id} no tiene asignación en la ${rotation}.`);
        return;
      }

      // Check incomplete content based on room
      if (assignment.room === 'sala_a' && !assignment.oratory) {
        errors.push(`Equipo ${team.id} asignado a Sala A en ${rotation} pero falta 'oratory'.`);
      }
      if (assignment.room === 'sala_b_e' && !assignment.debate) {
        errors.push(`Equipo ${team.id} asignado a Sala B-E en ${rotation} pero falta 'debate'.`);
      }
      if (assignment.room === 'sala_f' && !assignment.crisis) {
        errors.push(`Equipo ${team.id} asignado a Sala F en ${rotation} pero falta 'crisis'.`);
      }
    });

    // Check duplicated organizations in Sala A groups (Groups of 4 teams: 1-4, 5-8, etc.)
    for (let groupStart = 1; groupStart <= 48; groupStart += 4) {
      const seenOrgs = new Set<string>();
      for (let i = 0; i < 4; i++) {
        const teamId = groupStart + i;
        const assignment = teamAssignments[teamId];
        if (assignment && assignment.room === 'sala_a' && assignment.oratory) {
          const org = assignment.oratory.organization;
          if (seenOrgs.has(org)) {
            errors.push(`Organismo duplicado '${org}' en el grupo de Sala A (equipos ${groupStart}-${groupStart+3}) durante ${rotation}.`);
          }
          seenOrgs.add(org);
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateSafeAssignment(team: Team, rotation: RotationId): ContentValidationResult {
  const errors: string[] = [];
  const safeContent = getSafeParticipantAssignment(team, rotation);
  
  if (!safeContent) {
    errors.push(`No se pudo cargar el contenido seguro para el equipo ${team.id} en ${rotation}.`);
    return { valid: false, errors };
  }

  // Check that keyword is NOT exposed
  const serialized = JSON.stringify(safeContent);
  if (serialized.includes('keyword') && (safeContent as any).oratory?.keyword !== undefined) {
    errors.push("ALERTA DE SEGURIDAD: La palabra clave (keyword) está expuesta en la asignación segura.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
