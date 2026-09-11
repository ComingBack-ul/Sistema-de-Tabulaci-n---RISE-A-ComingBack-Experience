import { 
  RotationId, 
  ParticipantContent, 
  RotationAssignment, 
  RoomId, 
  Team,
  OratoryOrganization,
  OratoryAssignment,
  KeywordChallenge
} from '../types';

const STORAGE_KEY_CONTENT = 'rise_participant_content_v1';
const STORAGE_KEY_CONFIG = 'rise_event_config_v1';

// Seed Generation Helpers
const ORGANIZATIONS: OratoryOrganization[] = [
  'Unión Europea',
  'Estados Unidos',
  'República Popular China',
  'AOSIS'
];

function generateTeamOrganizations(maxTeams: number): Record<number, OratoryOrganization> {
  const mapping: Record<number, OratoryOrganization> = {};
  for (let groupStart = 1; groupStart <= maxTeams; groupStart += 4) {
    // Shuffle the 4 organizations randomly for this group of 4 teams
    const shuffledOrgs = [...ORGANIZATIONS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
      if (groupStart + i <= maxTeams) {
        mapping[groupStart + i] = shuffledOrgs[i];
      }
    }
  }
  return mapping;
}

function generateSeedContent(): Record<RotationId, RotationAssignment> {
  const rotations: RotationId[] = ['rotation_1', 'rotation_2', 'rotation_3'];
  const data: Record<RotationId, RotationAssignment> = {} as any;
  
  // Generate stable random organizations for all 50 teams first
  const teamOrgs = generateTeamOrganizations(50);

  rotations.forEach((rotation, rIndex) => {
    const teamAssignments: Record<number, ParticipantContent> = {};
    
    // Generate for 50 teams
    for (let teamId = 1; teamId <= 50; teamId++) {
      // Mock room assignment pattern (in real life, teams rotate across rooms)
      // For seed demo, we just assign different content types based on rotation and team modulo
      const roomTypeMod = (teamId + rIndex) % 3;
      let room: RoomId;
      let content: ParticipantContent = {
        rotationId: rotation,
        room: 'sala_a',
        title: `[DEMO] Rotación ${rIndex + 1} - Asignación`,
      };

      if (roomTypeMod === 0) {
        room = 'sala_a';
        const org = teamOrgs[teamId];
        content.room = room;
        content.title = `[DEMO] Sala A - Oratoria (Rotación ${rIndex + 1})`;
        content.oratory = {
          organization: org,
          position: `[DEMO] Postura oficial de ${org} frente a los nuevos desafíos globales.`,
          requiredSpeechFragment: `[DEMO] Fragmento obligatorio R${rIndex + 1}`,
          diplomaticFragment: `[DEMO] Fragmento Diplomático R${rIndex + 1}`,
          clues: [
            `[DEMO] Pista 1 para R${rIndex + 1}`,
            `[DEMO] Pista 2 para R${rIndex + 1}`
          ],
          keyword: `KEY_A_${rIndex + 1}_${teamId}`,
          participantInstructions: `[DEMO] Instrucciones: Representas a ${org}. Debes integrar el fragmento obligatorio.`
        };
      } else if (roomTypeMod === 1) {
        room = 'sala_b_e';
        content.room = room;
        content.title = `[DEMO] Salas B-E - Debate (Rotación ${rIndex + 1})`;
        content.debate = {
          motion: `[DEMO] EC cree que la tecnología de Rotación ${rIndex + 1} resolverá el conflicto.`,
          participantSide: teamId % 2 === 0 ? 'Proposición' : 'Oposición',
          instructions: '[DEMO] Prepara tu línea argumental en 15 minutos.',
          preparationNotes: '[DEMO] Notas de contexto a considerar.'
        };
      } else {
        room = 'sala_f';
        content.room = room;
        content.title = `[DEMO] Sala F - Crisis (Rotación ${rIndex + 1})`;
        content.crisis = {
          crisisTitle: `[DEMO] Evento Crítico R${rIndex + 1}`,
          scenario: `[DEMO] Escenario de crisis simulado para R${rIndex + 1}.`,
          diplomaticObjective: '[DEMO] Objetivo diplomático oficial de la sesión.',
          instructions: '[DEMO] Redacta una directiva de emergencia.',
          relevantContext: '[DEMO] Contexto de trasfondo.',
          requiredOutcome: '[DEMO] Requisito de salida esperado.'
        };
      }
      
      teamAssignments[teamId] = content;
    }
    
    data[rotation] = {
      rotationId: rotation,
      teamAssignments
    };
  });

  return data;
}

// Storage Operations
export function loadAllParticipantContent(): Record<RotationId, RotationAssignment> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTENT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load participant content', error);
  }
  
  // Fallback to seed
  const seed = generateSeedContent();
  saveAllParticipantContent(seed);
  return seed;
}

export function saveAllParticipantContent(data: Record<RotationId, RotationAssignment>) {
  try {
    localStorage.setItem(STORAGE_KEY_CONTENT, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save participant content', error);
  }
}

// Global Config (Current Rotation)
export function getCurrentRotation(): RotationId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const config = JSON.parse(raw);
      if (config.currentRotation) {
        return config.currentRotation;
      }
    }
  } catch (error) {
    console.error('Failed to load event config', error);
  }
  return 'rotation_1';
}

export function setCurrentRotation(rotation: RotationId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    const config = raw ? JSON.parse(raw) : {};
    config.currentRotation = rotation;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save event config', error);
  }
}

// Core Accessor for the application
export function getParticipantAssignment(team: Team, rotation: RotationId): ParticipantContent | null {
  const allContent = loadAllParticipantContent();
  const rotationData = allContent[rotation];
  
  if (!rotationData) return null;
  
  return rotationData.teamAssignments[team.id] || null;
}

// UI-Safe Accessor (Strips Keywords and sensitive admin data)
export function getSafeParticipantAssignment(team: Team, rotation: RotationId): Omit<ParticipantContent, 'oratory' | 'keywordChallenge'> & { 
  oratory?: Omit<OratoryAssignment, 'keyword'>; 
  keywordChallenge?: Omit<KeywordChallenge, 'keyword'>;
} | null {
  const content = getParticipantAssignment(team, rotation);
  if (!content) return null;

  // Deep clone to safely remove properties
  const safeContent = JSON.parse(JSON.stringify(content));
  
  if (safeContent.oratory) {
    delete safeContent.oratory.keyword;
  }
  
  if (safeContent.keywordChallenge) {
    delete safeContent.keywordChallenge.keyword;
  }
  
  return safeContent;
}

