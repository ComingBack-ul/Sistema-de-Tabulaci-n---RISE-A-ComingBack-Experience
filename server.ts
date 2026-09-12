import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { OFFICIAL_TEAMS_DATA, buildOfficialTeams } from './src/data/officialTeams';

const app = express();
const PORT = 3000;

// Enforce safe JWT secret handling: fail fast in production if JWT_SECRET is missing
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
  }
  return 'rise_dev_secure_jwt_fallback_secret_cb2026_aniversario';
})();

app.use(express.json());
app.use(cookieParser());

const DATA_FILE = path.join(process.cwd(), 'event_state.json');
const USERS_FILE = path.join(process.cwd(), 'users.json');
const TEAMS_FILE = path.join(process.cwd(), 'teams.json');

// Default initial state
let eventState = {
  currentRotation: 'rotation_1',
  officialPool: {
    phrases: [
      { id: 'A', text: "La estabilidad global no se impone desde afuera, se construye desde la autodeterminación." },
      { id: 'B', text: "La libertad sin garantías de seguridad es solo una ilusión pasajera." },
      { id: 'C', text: "El diálogo multilateral es la única frontera que protege la paz duradera." },
      { id: 'D', text: "El tiempo diplomático se agota cuando las mareas continúan subiendo." }
    ],
    riddles: [
      { 
        id: '1', 
        text: "En el tablero internacional, la fuerza sin diplomacia es un eco vacío, pero la diplomacia sin firmeza es una ilusión pacífica. Las naciones que prevalecen no son aquellas que alzan la voz con violencia, sino aquellas que articulan con precisión la razón de sus actos. Para abrir la bóveda de la cooperación, el líder debe encontrar la síntesis entre la soberanía inalienable y el compromiso multilateral. La primera llave del entendimiento no se fuerza: se pronuncia con claridad ante el foro de los pueblos.",
        solution: "SOBERANÍA-PAZ" 
      },
      { 
        id: '2', 
        text: "El progreso técnico no puede disociarse de la responsabilidad moral de quienes lo gobiernan. Cuando los algoritmos asumen la capacidad de decidir sobre la vida y la seguridad humana, la diplomacia se enfrenta a su frontera más crítica. La paz futura no dependerá únicamente de desarmar fronteras territoriales, sino de establecer límites éticos infranqueables al desarrollo de la tecnología. La verdadera fortaleza de una civilización reside en mantener el control humano sobre la razón del Estado.",
        solution: "ÉTICA" 
      },
      { 
        id: '3', 
        text: "Las crisis del siglo XXI no reconocen soberanías ni mapas políticos; la degradación ambiental afecta con mayor severidad a quienes menos han contribuido a su causa. Hablar de justicia global exige pasar de la retórica del compromiso a la acción financiera y operativa tangible. Los acuerdos que no contemplan la equidad no son soluciones, sino postergaciones del colapso. La última puerta de la diplomacia contemporánea se abre respondiendo al llamado de las comunidades más vulnerables.",
        solution: "EQUIDAD" 
      }
    ],
    motions: [
      { id: '1', text: "Esta Casa restringiría el derecho al veto de los miembros permanentes del Consejo de Seguridad de la ONU en situaciones de crisis humanitaria grave." },
      { id: '2', text: "Esta Casa prohibiría el desarrollo, despliegue y comercialización de sistemas de armas autónomas letales impulsadas por inteligencia artificial." },
      { id: '3', text: "Esta Casa establecería un mecanismo de compensación económica internacional obligatorio pagado por los países altamente industrializados por pérdidas y daños climáticos." }
    ],
    crises: [
      {
        id: 'A',
        title: "Colapso Energético Transfronterizo",
        scenario: "A las 04:00 horas, un ciberataque masivo sin atribuir desactivó los sistemas SCADA de la red eléctrica trilateral entre tres Estados limítrofes, dejando sin suministro al 60% de la población y paralizando puertos comerciales y centros de salud. Un grupo no estatal exige la suspensión de tratados mineros regionales en 24 horas a cambio de la clave de desbloqueo."
      },
      {
        id: 'B',
        title: "Bloqueo del Canal Marítimo Estratégico",
        scenario: "Alegando la detección de un contenedor con presunto material radioactivo no declarado, la marina de un Estado costero ha encallado dos embarcaciones militares bloqueando el paso por el estrecho marítimo internacional por donde transita el 20% del petróleo y grano global. Las bolsas internacionales caen un 8% y dos potencias han desplegado destructores a las entradas del canal."
      },
      {
        id: 'C',
        title: "Éxodo Humano por Desastre de Infraestructura",
        scenario: "Tras lluvias extremas, la falla estructural de una represa internacional ha inundado tres cuencas agrícolas, forzando el desplazamiento inmediato de 150,000 personas hacia la frontera de un país vecino. Dicho Estado ha militarizado sus pasos fronterizos declarando 'Estado de Excepción', generando enfrentamientos violentos en la línea divisoria."
      }
    ],
    rotationCodes: {
      'rotation_1': 'COD-ALPHA-2026',
      'rotation_2': 'COD-DELTA-3089',
      'rotation_3': 'COD-OMEGA-7712'
    }
  },
  assignments: {
    rotation_1: { rotationId: 'rotation_1', teamAssignments: {} },
    rotation_2: { rotationId: 'rotation_2', teamAssignments: {} },
    rotation_3: { rotationId: 'rotation_3', teamAssignments: {} }
  }
};

let usersState: any[] = [];
let teamsState: any[] = [];

// Seed default preset users with bcrypt hash
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('12345678', 10);

const INITIAL_USERS_SEED = [
  {
    username: 'juez_sala_a1',
    name: 'Samuel Jimenez',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_a1',
    stationName: 'Sala A - Oratoria y Retórica (Mesa 1)',
    stationType: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_a2',
    name: 'Javier Perez',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_a2',
    stationName: 'Sala A - Oratoria y Retórica (Mesa 2)',
    stationType: 'oratoria',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Palabra Clave',
    challengeDescription: 'Verificar si el orador principal incorporó y defendió la palabra clave asignada en su discurso.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_b',
    name: 'José Ramón',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_b',
    stationName: 'Sala B - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_c',
    name: 'Juan Luis',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_c',
    stationName: 'Sala C - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_d',
    name: 'José Tejera',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_d',
    stationName: 'Sala D - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_e',
    name: 'Manuel Koolman',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_e',
    stationName: 'Sala E - Debate World Schools',
    stationType: 'debate',
    maxPoints: 50,
    challengeName: 'Desafío Escape: Código de Seguridad',
    challengeDescription: 'Validar si la bancada descifró y entregó el código numérico de alta seguridad tras la ronda de refutación.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_f1',
    name: 'Jesus Corona',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_f1',
    stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 1)',
    stationType: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'juez_sala_f2',
    name: 'Luis Montoya',
    role: 'judge',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    stationKey: 'sala_f2',
    stationName: 'Sala F - Resolución de Crisis & Diplomacia (Mesa 2)',
    stationType: 'crisis',
    maxPoints: 25,
    challengeName: 'Desafío Escape: Sello Físico Oficial',
    challengeDescription: 'Comprobar el sello físico consular obtenido mediante resolución pacífica de la crisis.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'admin_tab',
    name: 'Admin Tabulación & Mesa Directiva',
    role: 'admin',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    username: 'operador_general',
    name: 'Operador de Logística y Salas',
    role: 'operator',
    passwordHash: DEFAULT_PASSWORD_HASH,
    status: 'active',
    createdAt: '2026-09-01T08:00:00.000Z',
  }
];

function sanitizeUser(user: any) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.passwordHash;
  delete copy.password;
  return copy;
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return await bcrypt.compare(plain, hash);
  }
  // Legacy plaintext fallback
  return plain === hash;
}

function loadState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      eventState = JSON.parse(data);
    } catch (e) {
      console.error('Failed to read event_state.json', e);
    }
  }
  
  // Load or seed users
  if (fs.existsSync(USERS_FILE)) {
    try { 
      usersState = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); 
    } catch (e) {
      console.error('Failed to parse users.json', e);
    }
  }
  if (!Array.isArray(usersState) || usersState.length === 0) {
    usersState = JSON.parse(JSON.stringify(INITIAL_USERS_SEED));
    saveUsers();
  } else {
    // Migration check: ensure all users have bcrypt hash
    let needsSave = false;
    for (const u of usersState) {
      if (u.passwordHash && !u.passwordHash.startsWith('$2')) {
        u.passwordHash = bcrypt.hashSync(u.passwordHash, 10);
        needsSave = true;
      }
    }
    if (needsSave) saveUsers();
  }

  // Load or seed teams
  if (fs.existsSync(TEAMS_FILE)) {
    try { 
      teamsState = JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf-8')); 
    } catch (e) {
      console.error('Failed to parse teams.json', e);
    }
  }
  if (!Array.isArray(teamsState) || teamsState.length !== 18) {
    teamsState = buildOfficialTeams();
    saveTeams();
  }
}

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(eventState, null, 2), 'utf-8');
}
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersState, null, 2), 'utf-8');
}
function saveTeams() {
  fs.writeFileSync(TEAMS_FILE, JSON.stringify(teamsState, null, 2), 'utf-8');
}

loadState();

// --- AUTH MIDDLEWARES ---
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'No autorizado. Sesión no encontrada.' });
  
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Token inválido o sesión expirada' });
    req.user = decoded;
    next();
  });
};

const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
  }
  next();
};

const requireAdmin = requireRole('admin');
const requireJudge = requireRole('judge', 'admin');
const requireParticipant = requireRole('participant');
const requireOperator = requireRole('operator', 'admin');

// --- PUBLIC TEAMS CATALOG (For Participant Login Selection) ---
app.get('/api/teams/catalog', (_req, res) => {
  const catalog = OFFICIAL_TEAMS_DATA.map(t => ({
    id: t.id,
    name: t.name,
    participants: t.participants
  }));
  res.json(catalog);
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password, teamName, teamId } = req.body;
  
  // 1. Participant Login: Match strictly against the official 18 teams
  if (teamName || typeof teamId !== 'undefined') {
    let matchedTeam = null;
    
    if (teamName) {
      const normalizedQuery = String(teamName).trim().toLowerCase();
      matchedTeam = teamsState.find(t => t.name.trim().toLowerCase() === normalizedQuery);
      if (!matchedTeam) {
        matchedTeam = OFFICIAL_TEAMS_DATA.find(t => t.name.trim().toLowerCase() === normalizedQuery);
        if (matchedTeam) {
          const found = teamsState.find(t => t.id === matchedTeam!.id);
          matchedTeam = found || matchedTeam;
        }
      }
    } else if (teamId) {
      const id = parseInt(teamId, 10);
      if (!isNaN(id) && id >= 1 && id <= 18) {
        matchedTeam = teamsState.find(t => t.id === id);
      }
    }

    if (!matchedTeam) {
      return res.status(400).json({ error: 'Equipo oficial no encontrado en el registro' });
    }

    if (matchedTeam.status === 'inactive') {
      return res.status(403).json({ error: 'El equipo se encuentra inactivo. Contacte al comité organizador.' });
    }

    // Resolve authoritative teamId & teamName on server
    const token = jwt.sign(
      { 
        role: 'participant', 
        teamId: matchedTeam.id, 
        teamName: matchedTeam.name 
      }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 3600 * 1000
    });

    return res.json({ 
      success: true, 
      role: 'participant', 
      teamId: matchedTeam.id,
      team: {
        id: matchedTeam.id,
        name: matchedTeam.name,
        participants: matchedTeam.participants || matchedTeam.members || []
      }
    });
  }
  
  // 2. Internal User Login (Judge, Admin, Operator)
  if (!username || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }
  
  const normalizedUser = String(username).trim().toLowerCase().replace(/\s+/g, '_');
  const user = usersState.find(u => 
    (u.username.toLowerCase() === normalizedUser || 
     u.name.toLowerCase() === username.trim().toLowerCase())
  );
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Usuario inactivo. Contacte a la mesa directiva.' });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Automatic hash migration if legacy plain text
  if (!user.passwordHash.startsWith('$2')) {
    user.passwordHash = await bcrypt.hash(password, 10);
    saveUsers();
  }

  const token = jwt.sign(
    { 
      userId: user.id || user.username,
      username: user.username, 
      role: user.role, 
      stationKey: user.stationKey 
    }, 
    JWT_SECRET, 
    { expiresIn: '12h' }
  );

  res.cookie('token', token, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 3600 * 1000
  });

  return res.json({ 
    success: true, 
    role: user.role, 
    user: sanitizeUser(user) 
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  if (req.user.role === 'participant') {
    const team = teamsState.find(t => t.id === req.user.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    return res.json({ 
      authenticated: true,
      role: 'participant', 
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        participants: team.participants || team.members || []
      }
    });
  } else {
    const user = usersState.find(u => u.username === req.user.username);
    if (user) {
      if (user.status === 'inactive') {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }
      res.json({ 
        authenticated: true,
        role: user.role,
        user: sanitizeUser(user) 
      });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  }
});

// --- PARTICIPANT ENDPOINTS ---
app.get('/api/participant/config', authenticateToken, (req, res) => {
  res.json({ currentRotation: eventState.currentRotation });
});

app.get('/api/participant/content', authenticateToken, requireParticipant, (_req, res) => {
  const safeState = JSON.parse(JSON.stringify(eventState));
  if (safeState.officialPool) {
    if (safeState.officialPool.riddles) safeState.officialPool.riddles.forEach((r: any) => delete r.solution);
    delete safeState.officialPool.rotationCodes;
  }
  res.json(safeState);
});

// Secure participant assignment endpoint: teamId is determined server-authoritatively from the token
app.get('/api/participant/assignment/:rotationId', authenticateToken, requireParticipant, (req: any, res) => {
  const { rotationId } = req.params;
  const teamId = req.user.teamId;
  const rotationData = eventState.assignments[rotationId as keyof typeof eventState.assignments];
  
  if (rotationData && rotationData.teamAssignments[teamId as any]) {
    const assignment = JSON.parse(JSON.stringify(rotationData.teamAssignments[teamId as any]));
    if (assignment.oratory) delete assignment.oratory.keyword;
    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;
    res.json(assignment);
  } else {
    res.status(404).json({ error: 'Asignación no encontrada para este equipo' });
  }
});

// Legacy assignment endpoint with cross-team protection
app.get('/api/participant-assignment/:teamId/:rotationId', authenticateToken, (req: any, res) => {
  const { teamId, rotationId } = req.params;
  const parsedId = parseInt(teamId, 10);

  // Participants cannot inspect other teams' data
  if (req.user.role === 'participant' && req.user.teamId !== parsedId) {
    return res.status(403).json({ error: 'Acceso denegado: no puedes acceder a datos de otro equipo' });
  }

  const rotationData = eventState.assignments[rotationId as keyof typeof eventState.assignments];
  if (rotationData && rotationData.teamAssignments[parsedId as any]) {
    const assignment = JSON.parse(JSON.stringify(rotationData.teamAssignments[parsedId as any]));
    if (assignment.oratory) delete assignment.oratory.keyword;
    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;
    res.json(assignment);
  } else {
    res.status(404).json({ error: 'Asignación no encontrada' });
  }
});

app.get('/api/participant-config', (_req, res) => {
  res.json({ currentRotation: eventState.currentRotation });
});

app.put('/api/participant-config', authenticateToken, requireAdmin, (req, res) => {
  if (req.body.currentRotation) {
    eventState.currentRotation = req.body.currentRotation;
    saveState();
  }
  res.json({ success: true, currentRotation: eventState.currentRotation });
});

app.get('/api/participant-content', authenticateToken, requireParticipant, (_req, res) => {
  const safeState = JSON.parse(JSON.stringify(eventState));
  if (safeState.officialPool) {
    if (safeState.officialPool.riddles) safeState.officialPool.riddles.forEach((r: any) => delete r.solution);
    delete safeState.officialPool.rotationCodes;
  }
  res.json(safeState);
});

// --- JUDGE ENDPOINTS ---
app.put('/api/judge/evaluation', authenticateToken, requireJudge, (req: any, res) => {
  const { teamId, evaluation } = req.body;
  const team = teamsState.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  
  if (!team.judgeEvaluations) team.judgeEvaluations = {};
  team.judgeEvaluations[req.user.username] = {
    ...evaluation,
    judgeUsername: req.user.username,
    stationKey: req.user.stationKey,
    timestamp: new Date().toISOString()
  };
  team.lastUpdated = new Date().toISOString();
  saveTeams();
  res.json({ success: true, team });
});

// --- ADMIN ENDPOINTS ---
app.get('/api/admin/state', authenticateToken, requireAdmin, (_req, res) => {
  res.json(eventState);
});

app.put('/api/admin/config', authenticateToken, requireAdmin, (req, res) => {
  if (req.body.currentRotation) eventState.currentRotation = req.body.currentRotation;
  if (req.body.assignments) eventState.assignments = req.body.assignments;
  saveState();
  res.json({ success: true, eventState });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (_req, res) => {
  res.json(usersState.map(sanitizeUser));
});

app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    // Ensure all passwords are safe bcrypt hashes
    const processed = await Promise.all(incoming.map(async (u: any) => {
      const existing = usersState.find(old => old.username === u.username);
      let hash = u.passwordHash;
      if (u.password && !u.password.startsWith('$2')) {
        hash = await bcrypt.hash(u.password, 10);
      } else if (!hash && existing) {
        hash = existing.passwordHash;
      } else if (!hash) {
        hash = DEFAULT_PASSWORD_HASH;
      }
      return {
        ...u,
        passwordHash: hash
      };
    }));
    usersState = processed;
    saveUsers();
    return res.json({ success: true, count: usersState.length });
  }
  res.status(400).json({ error: 'Formato de usuarios no válido' });
});

// --- TEAMS DATA ACCESS BY ROLE ---
app.get('/api/teams', authenticateToken, (req: any, res: any) => {
  // Participants can only access safe details of their own team
  if (req.user.role === 'participant') {
    const myTeam = teamsState.find(t => t.id === req.user.teamId);
    if (!myTeam) return res.status(404).json({ error: 'Equipo no encontrado' });
    return res.json([{
      id: myTeam.id,
      name: myTeam.name,
      participants: myTeam.participants || myTeam.members || [],
      status: myTeam.status
    }]);
  }
  
  // Judges & Admins can access all teams
  res.json(teamsState);
});

app.post('/api/admin/teams', authenticateToken, requireAdmin, (req, res) => {
  if (Array.isArray(req.body) && req.body.length === 18) {
    teamsState = req.body;
    saveTeams();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'La lista de equipos debe contener exactamente los 18 equipos oficiales.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
