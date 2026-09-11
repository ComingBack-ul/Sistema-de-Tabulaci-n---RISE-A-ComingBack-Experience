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

// Synchronize state with the shared Express server source of truth
export async function syncParticipantState(): Promise<void> {
  try {
    const res = await fetch('/api/participant-state');
    if (!res.ok) throw new Error('Failed to fetch from shared state');
    const data = await res.json();
    
    // Update local fallbacks
    if (data.content) {
      saveAllParticipantContent(data.content);
    }
    if (data.currentRotation) {
      setCurrentRotation(data.currentRotation as RotationId, false);
    }
  } catch (error) {
    console.warn('Could not sync with shared source of truth. Using localStorage fallback.', error);
  }
}

// Storage Operations (Fallback / Cache)
export function loadAllParticipantContent(): Record<RotationId, RotationAssignment> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTENT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load participant content from cache', error);
  }
  return {} as Record<RotationId, RotationAssignment>;
}

export function saveAllParticipantContent(data: Record<RotationId, RotationAssignment>) {
  try {
    localStorage.setItem(STORAGE_KEY_CONTENT, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save participant content cache', error);
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
    console.error('Failed to load event config from cache', error);
  }
  return 'rotation_1';
}

export function setCurrentRotation(rotation: RotationId, syncToServer = true) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    const config = raw ? JSON.parse(raw) : {};
    config.currentRotation = rotation;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    
    // If the admin changes this, push to server
    if (syncToServer) {
      fetch('/api/participant-state/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotation })
      }).catch(e => console.error('Failed to update global rotation on server', e));
    }
  } catch (error) {
    console.error('Failed to save event config cache', error);
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
