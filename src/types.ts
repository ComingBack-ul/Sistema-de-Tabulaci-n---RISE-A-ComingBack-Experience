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

export type UserRole = 'judge' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type TeamStatus = 'active' | 'inactive';

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
}

export interface UpdateTeamDto {
  id?: number;
  name?: string;
  wave?: Wave;
  members?: string[];
  status?: TeamStatus;
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
  id: number; // 1 to 50
  name: string;
  wave: Wave;
  members: string[];
  status?: TeamStatus;
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
