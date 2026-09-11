import * as fs from 'fs';
import * as path from 'path';

const content = `import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-jwt-key-2026';

app.use(express.json());
app.use(cookieParser());

const DATA_FILE = path.join(process.cwd(), 'event_state.json');
const USERS_FILE = path.join(process.cwd(), 'users.json');
const TEAMS_FILE = path.join(process.cwd(), 'teams.json');

// The single source of truth structure
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

function loadState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      eventState = JSON.parse(data);
    } catch (e) {
      console.error('Failed to read event_state.json', e);
    }
  }
  
  if (fs.existsSync(USERS_FILE)) {
    try { usersState = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (e) {}
  }
  if (usersState.length === 0) {
    // We will initialize them when called or leave empty and let frontend seed
  }

  if (fs.existsSync(TEAMS_FILE)) {
    try { teamsState = JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf-8')); } catch (e) {}
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
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

const requireRole = (role: string) => (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
  }
  next();
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
  const { username, password, teamId } = req.body;
  
  if (teamId) {
    // Participant login
    const id = parseInt(teamId);
    if (isNaN(id) || id < 1 || id > 18) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }
    const token = jwt.sign({ role: 'participant', teamId: id }, JWT_SECRET, { expiresIn: '12h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ success: true, role: 'participant', teamId: id });
  }
  
  // Judge or Admin login
  if (!username || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }
  
  // Try to find user
  const user = usersState.find(u => (u.username.toLowerCase() === username.toLowerCase() || u.internalUsername === username.toLowerCase()) && u.status !== 'inactive');
  
  if (user && user.passwordHash === password) {
    const token = jwt.sign({ role: user.role, username: user.username, stationKey: user.stationKey }, JWT_SECRET, { expiresIn: '12h' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ success: true, user: { ...user, passwordHash: undefined } });
  }
  
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  if (req.user.role === 'participant') {
    res.json({ role: 'participant', teamId: req.user.teamId });
  } else {
    const user = usersState.find(u => u.username === req.user.username);
    if (user) {
      res.json({ ...user, passwordHash: undefined });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

// --- PARTICIPANT ENDPOINTS ---
app.get('/api/participant/config', authenticateToken, requireRole('participant'), (req, res) => {
  res.json({ currentRotation: eventState.currentRotation });
});

app.get('/api/participant/content', authenticateToken, requireRole('participant'), (req, res) => {
  const safeState = JSON.parse(JSON.stringify(eventState));
  if (safeState.officialPool) {
    if (safeState.officialPool.riddles) safeState.officialPool.riddles.forEach((r: any) => delete r.solution);
    delete safeState.officialPool.rotationCodes;
  }
  res.json(safeState);
});

app.get('/api/participant/assignment/:rotationId', authenticateToken, requireRole('participant'), (req: any, res) => {
  const { rotationId } = req.params;
  const teamId = req.user.teamId; // Validated securely from token
  const rotationData = eventState.assignments[rotationId];
  if (rotationData && rotationData.teamAssignments[teamId]) {
    const assignment = JSON.parse(JSON.stringify(rotationData.teamAssignments[teamId]));
    if (assignment.oratory) delete assignment.oratory.keyword;
    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;
    res.json(assignment);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// --- JUDGE ENDPOINTS ---
app.get('/api/judge/teams', authenticateToken, requireRole('judge'), (req, res) => {
  res.json(teamsState);
});

app.put('/api/judge/evaluation', authenticateToken, requireRole('judge'), (req: any, res) => {
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
app.get('/api/admin/state', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(eventState);
});

app.put('/api/admin/config', authenticateToken, requireRole('admin'), (req, res) => {
  if (req.body.currentRotation) eventState.currentRotation = req.body.currentRotation;
  if (req.body.assignments) eventState.assignments = req.body.assignments;
  saveState();
  res.json({ success: true, eventState });
});

app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(usersState);
});
app.post('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  usersState = req.body;
  saveUsers();
  res.json({ success: true });
});

app.get('/api/admin/teams', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(teamsState);
});
app.post('/api/admin/teams', authenticateToken, requireRole('admin'), (req, res) => {
  teamsState = req.body;
  saveTeams();
  res.json({ success: true });
});

// --- BACKWARDS COMPATIBILITY (Temporary, to prevent breaks while migrating UI) ---
app.get('/api/participant-config', (req, res) => res.json({ currentRotation: eventState.currentRotation }));
app.get('/api/participant-content', (req, res) => {
  const safeState = JSON.parse(JSON.stringify(eventState));
  if (safeState.officialPool) {
    if (safeState.officialPool.riddles) safeState.officialPool.riddles.forEach((r: any) => delete r.solution);
    delete safeState.officialPool.rotationCodes;
  }
  res.json(safeState);
});
app.get('/api/participant-assignment/:teamId/:rotationId', (req, res) => {
  const { teamId, rotationId } = req.params;
  const rotationData = eventState.assignments[rotationId as keyof typeof eventState.assignments];
  if (rotationData && rotationData.teamAssignments[teamId as any]) {
    const assignment = JSON.parse(JSON.stringify(rotationData.teamAssignments[teamId as any]));
    if (assignment.oratory) delete assignment.oratory.keyword;
    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;
    res.json(assignment);
  } else {
    res.status(404).json({ error: 'Not found' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', content);
