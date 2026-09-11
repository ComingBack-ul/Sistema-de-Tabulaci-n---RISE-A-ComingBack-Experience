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

// Synchronize state with the shared Express server source of truth (Admin/Initialization use)
export async function syncParticipantState(): Promise<void> {
  try {
    const [configRes, contentRes] = await Promise.all([
      fetch('/api/participant-config'),
      fetch('/api/participant-content')
    ]);
    
    if (configRes.ok) {
      const config = await configRes.json();
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ currentRotation: config.currentRotation }));
      } catch (e) {}
    }
    
    if (contentRes.ok) {
      const content = await contentRes.json();
      saveAllParticipantContent(content);
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

// ASYNC Config & Data Fetchers (Source of Truth = Server)
export async function getCurrentRotationAsync(): Promise<RotationId> {
  try {
    const res = await fetch('/api/participant-config');
    if (res.ok) {
      const data = await res.json();
      const rot = data.currentRotation as RotationId;
      // Update cache
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ currentRotation: rot }));
      return rot;
    }
  } catch (e) {
    console.warn('Server unreachable for config, trying cache.', e);
  }

  // Fallback
  return getCurrentRotation();
}

export async function getParticipantAssignmentAsync(team: Team, rotation: RotationId): Promise<ParticipantContent | null> {
  try {
    const res = await fetch(`/api/participant-assignment/${team.id}/${rotation}`);
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return null;
    }
  } catch (e) {
    console.warn('Server unreachable for assignment, trying cache.', e);
  }

  // Fallback
  return getParticipantAssignment(team, rotation);
}

export async function getSafeParticipantAssignmentAsync(team: Team, rotation: RotationId) {
  const content = await getParticipantAssignmentAsync(team, rotation);
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

export async function setCurrentRotationAsync(rotation: RotationId): Promise<boolean> {
  try {
    const res = await fetch('/api/participant-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentRotation: rotation })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ currentRotation: data.currentRotation }));
      return true;
    }
  } catch (error) {
    console.error('Failed to update global rotation on server', error);
  }
  return false;
}

// Sync/Legacy Methods (Used internally for cache fallback or existing sync Admin features)
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
  if (syncToServer) {
    setCurrentRotationAsync(rotation);
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      const config = raw ? JSON.parse(raw) : {};
      config.currentRotation = rotation;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (error) {}
  }
}

export function getParticipantAssignment(team: Team, rotation: RotationId): ParticipantContent | null {
  const allContent = loadAllParticipantContent();
  const rotationData = allContent[rotation];
  
  if (!rotationData) return null;
  
  return rotationData.teamAssignments[team.id] || null;
}

export function getSafeParticipantAssignment(team: Team, rotation: RotationId) {
  const content = getParticipantAssignment(team, rotation);
  if (!content) return null;

  const safeContent = JSON.parse(JSON.stringify(content));
  if (safeContent.oratory) delete safeContent.oratory.keyword;
  if (safeContent.keywordChallenge) delete safeContent.keywordChallenge.keyword;
  
  return safeContent;
}
