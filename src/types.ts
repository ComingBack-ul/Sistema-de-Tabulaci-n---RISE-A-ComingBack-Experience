export type Wave = 'morning' | 'afternoon';

export type StationKey = 
  | 'sala_a1' 
  | 'sala_a2' 
  | 'sala_b' 
  | 'sala_c' 
  | 'sala_d' 
  | 'sala_e' 
  | 'sala_f1' 
  | 'sala_f2';

export type StationType = 'oratoria' | 'debate' | 'crisis';

export type Role = 'participant' | 'judge' | 'admin' | 'operator';
export type UserRole = Role;
export type UserStatus = 'active' | 'inactive';
export type TeamStatus = 'active' | 'inactive';

export interface Participant {
  id: string;
  name: string;
  teamId: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash?: string;
  role: Role;
  active: boolean;
  name?: string;
  stationKey?: StationKey;
  stationName?: string;
  stationType?: StationType;
  maxPoints?: number;
  challengeName?: string;
  challengeDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  userId?: string;
  username?: string;
  name?: string;
  role: Role;
  teamId?: number;
  team?: {
    id: number;
    name: string;
    participants?: Participant[];
  };
  stationKey?: StationKey;
  issuedAt?: number;
  expiresAt?: number;
}

export interface StationDefinition {
  key: StationKey;
  label: string;
  name: string;
  type: StationType;
  maxPoints: number;
  challengeName: string;
  challengeDescription: string;
}

export interface ManagedUser {
  username: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  status: UserStatus;
  stationKey?: StationKey;
  stationName?: string;
  stationType?: StationType;
  maxPoints?: number;
  challengeName?: string;
  challengeDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerUser {
  id?: string;
  username: string;
  name: string;
  role: Role;
  passwordHash: string;
  status: UserStatus;
  stationKey?: StationKey;
  stationName?: string;
  stationType?: StationType;
  maxPoints?: number;
  challengeName?: string;
  challengeDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JwtAuthPayload {
  role: Role;
  userId?: string;
  username?: string;
  teamId?: number;
  teamName?: string;
  stationKey?: StationKey;
}

export interface CreateUserDto {
  username: string;
  name: string;
  role: UserRole;
  password: string;
  status?: UserStatus;
  stationKey?: StationKey;
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  stationKey?: StationKey;
}

export interface CreateTeamDto {
  id: number;
  name: string;
  wave: Wave;
  members: string[];
  status?: TeamStatus;
  currentStationKey?: StationKey | null;
}

export interface UpdateTeamDto {
  id?: number;
  name?: string;
  wave?: Wave;
  members?: string[];
  status?: TeamStatus;
  currentStationKey?: StationKey | null;
}

export type AdminTab = 'live' | 'teams' | 'users' | 'settings';

export interface AuthUser {
  username: string;
  role: UserRole;
  name: string;
  status?: UserStatus;
  stationKey?: StationKey;
  stationName?: string;
  stationType?: StationType;
  maxPoints?: number;
  challengeName?: string;
  challengeDescription?: string;
}

export interface JudgeEvaluation {
  judgeUsername: string;
  stationKey: StationKey;
  points: number; // 0-25 for A/F, 0-50 for B/C/D/E
  escapeChallenge: boolean;
  notes?: string;
  timestamp?: string;
  isSubmitted: boolean;
}

export interface RoomAScore {
  oratoriaPoints: number; // 0 to 25
  keywordSolved: boolean; // Palabra Clave Descifrada
  judgeName?: string;
  timestamp?: string;
  notes?: string;
  isSubmitted: boolean;
}

export interface RoomBEScore {
  debatePoints: number; // 0 to 50
  codeDelivered: boolean; // Código de Alta Seguridad Entregado
  specificRoom?: 'B' | 'C' | 'D' | 'E';
  judgeName?: string;
  timestamp?: string;
  notes?: string;
  isSubmitted: boolean;
}

export interface RoomFScore {
  crisisPoints: number; // 0 to 25
  stampAwarded: boolean; // Sello Físico Otorgado
  judgeName?: string;
  timestamp?: string;
  notes?: string;
  isSubmitted: boolean;
}

export interface TeamScores {
  salaA: RoomAScore;
  salaBE: RoomBEScore;
  salaF: RoomFScore;
}

export interface Team {
  id: number; // 1 to 18
  name: string;
  participants: Participant[];
  members: string[];
  wave: Wave;
  status?: TeamStatus;
  currentStationKey?: StationKey | null;
  scores: TeamScores;
  // Individual judge evaluations by username
  judgeEvaluations: {
    juez_sala_a1?: JudgeEvaluation;
    juez_sala_a2?: JudgeEvaluation;
    juez_sala_b?: JudgeEvaluation;
    juez_sala_c?: JudgeEvaluation;
    juez_sala_d?: JudgeEvaluation;
    juez_sala_e?: JudgeEvaluation;
    juez_sala_f1?: JudgeEvaluation;
    juez_sala_f2?: JudgeEvaluation;
    [key: string]: JudgeEvaluation | undefined;
  };
  totalScore: number; // 0 to 100
  locksPassed: number; // 0 to 3
  allRoomsCompleted: boolean;
  rank: number;
  waveRank: number;
  isBreakQualified: boolean; // Top 2 of wave
  lastUpdated?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  teamId: number;
  room: string;
  action: string;
  previousValue?: any;
  newValue?: any;
  judgeName: string;
}

export type RoomId = 'sala_a' | 'sala_b_e' | 'sala_f';

export type ViewMode = 'admin' | 'judge' | 'projection';

// =========================================================================
// OFFICIAL CONTENT POOLS & ASSIGNMENT MODELS (PHASE 3)
// =========================================================================
export type RotationId = 'rotation_1' | 'rotation_2' | 'rotation_3';
export type OratoryOrganization = 'Unión Europea' | 'Estados Unidos' | 'República Popular China' | 'AOSIS';

export interface OfficialPhrase {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface OfficialRiddle {
  id: string;
  text: string;
  solution: string; // PRIVATE
}

export interface OfficialMotion {
  id: string;
  text: string;
}

export interface OfficialCrisis {
  id: 'A' | 'B' | 'C';
  title: string;
  scenario: string;
  diplomaticObjective?: string;
  instructions?: string;
  relevantContext?: string;
  requiredOutcome?: string;
}

export interface OfficialContentPool {
  phrases: OfficialPhrase[];
  riddles: OfficialRiddle[];
  motions: OfficialMotion[];
  crises: OfficialCrisis[];
  rotationCodes: Partial<Record<RotationId, string>>; // PRIVATE
}

export interface OratoryAssignment {
  organization: OratoryOrganization;
  phraseId?: 'A' | 'B' | 'C' | 'D';
  riddleId?: string;
  // Fallbacks for UI backwards compatibility if needed
  position?: string;
  requiredSpeechFragment?: string;
  diplomaticFragment?: string;
  clues?: string[];
  participantInstructions?: string;
}

export interface DebateAssignment {
  motionId?: string;
  participantSide?: 'Proposición' | 'Oposición';
  instructions?: string;
  preparationNotes?: string;
  motion?: string;
}

export interface CrisisAssignment {
  crisisId?: 'A' | 'B' | 'C';
  crisisTitle?: string;
  scenario?: string;
  diplomaticObjective?: string;
  instructions?: string;
  relevantContext?: string;
  requiredOutcome?: string;
}

export interface ParticipantContent {
  rotationId: RotationId;
  room: RoomId;
  title: string;
  oratory?: OratoryAssignment;
  debate?: DebateAssignment;
  crisis?: CrisisAssignment;
}

export interface RotationAssignment {
  rotationId: RotationId;
  teamAssignments: Record<number, ParticipantContent>;
}

export interface EventState {
  currentRotation: RotationId;
  officialPool: OfficialContentPool;
  assignments: Record<RotationId, RotationAssignment>;
}
