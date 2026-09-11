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

function getOrganizationForTeam(teamId: number): OratoryOrganization {
  // A1: 1, 2, 5, 6, 9, 10
  // A2: 3, 4, 7, 8, 11, 12
  // We need to map every group of 4 teams to the 4 organizations uniquely.
  // 1 -> org 0, 2 -> org 1, 3 -> org 2, 4 -> org 3
  const index = (teamId - 1) % 4;
  return ORGANIZATIONS[index];
}

function generateSeedContent(): Record<RotationId, RotationAssignment> {
  const rotations: RotationId[] = ['rotation_1', 'rotation_2', 'rotation_3'];
  const data: Record<RotationId, RotationAssignment> = {} as any;

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
        title: `Rotación ${rIndex + 1} - Asignación`,
      };

      if (roomTypeMod === 0) {
        room = 'sala_a';
        const org = getOrganizationForTeam(teamId);
        content.room = room;
        content.title = `Sala A - Oratoria (Rotación ${rIndex + 1})`;
        content.oratory = {
          organization: org,
          position: `Postura oficial de ${org} frente a los nuevos desafíos globales.`,
          requiredSpeechFragment: `[Fragmento obligatorio de Oratoria R${rIndex + 1}] "En vista de la creciente inestabilidad..."`,
          diplomaticFragment: `[Fragmento Diplomático R${rIndex + 1}] "La cooperación mutua es imperativa."`,
          clues: [
            `Pista 1 para R${rIndex + 1}: Busca alianzas tempranas.`,
            `Pista 2 para R${rIndex + 1}: Evalúa las sanciones.`
          ],
          keyword: `KEY_A_${rIndex + 1}_${teamId}`,
          participantInstructions: `Debes integrar el fragmento obligatorio durante tus 3 minutos de intervención principal. Representas a ${org}.`
        };
      } else if (roomTypeMod === 1) {
        room = 'sala_b_e';
        content.room = room;
        content.title = `Salas B-E - Debate (Rotación ${rIndex + 1})`;
        content.debate = {
          motion: `EC cree que la tecnología de Rotación ${rIndex + 1} resolverá el conflicto.`,
          participantSide: teamId % 2 === 0 ? 'Proposición' : 'Oposición',
          instructions: 'Prepara tu línea argumental en 15 minutos. El debate usará formato parlamentario.',
          preparationNotes: 'Céntrate en impactos a corto plazo.'
        };
      } else {
        room = 'sala_f';
        content.room = room;
        content.title = `Sala F - Crisis (Rotación ${rIndex + 1})`;
        content.crisis = {
          crisisTitle: `Evento Crítico ${rIndex + 1}: Colapso del mercado global`,
          scenario: `Las bolsas globales acaban de caer un ${(rIndex + 1) * 10}% en 24 horas.`,
          diplomaticObjective: 'Estabilizar las rutas comerciales prioritarias antes de que finalice la sesión.',
          instructions: 'Redacta una directiva de emergencia de máximo 2 páginas.',
          relevantContext: 'Las reservas energéticas mundiales también están comprometidas.',
          requiredOutcome: 'Firma un tratado comercial trilateral.'
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

