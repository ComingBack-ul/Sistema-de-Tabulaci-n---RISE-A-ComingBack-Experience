import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

const app = express();
const PORT = 3000;
app.use(express.json());

// Persistent shared state file
const DATA_FILE = path.join(process.cwd(), 'event_state.json');

// The single source of truth structure
let eventState = {
  currentRotation: 'rotation_1',
  content: null as any
};

// Load or generate initial state
function loadState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      eventState = JSON.parse(data);
      return;
    } catch (e) {
      console.error('Failed to read event_state.json, regenerating...', e);
    }
  }
  
  // If no file exists or it's invalid, generate seed state exactly ONCE.
  const ORGANIZATIONS = [
    'Unión Europea',
    'Estados Unidos',
    'República Popular China',
    'AOSIS'
  ];

  function generateTeamOrganizations(maxTeams: number) {
    const mapping: Record<number, string> = {};
    for (let groupStart = 1; groupStart <= maxTeams; groupStart += 4) {
      const shuffledOrgs = [...ORGANIZATIONS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 4; i++) {
        if (groupStart + i <= maxTeams) {
          mapping[groupStart + i] = shuffledOrgs[i];
        }
      }
    }
    return mapping;
  }

  const rotations = ['rotation_1', 'rotation_2', 'rotation_3'];
  const data: any = {};
  const teamOrgs = generateTeamOrganizations(50);

  rotations.forEach((rotation, rIndex) => {
    const teamAssignments: any = {};
    for (let teamId = 1; teamId <= 50; teamId++) {
      const roomTypeMod = (teamId + rIndex) % 3;
      let room = 'sala_a';
      let content: any = {
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

  eventState.content = data;
  saveState();
}

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(eventState, null, 2), 'utf-8');
}

// Load state initially
loadState();

// API Endpoints
app.get('/api/participant-config', (req, res) => {
  res.json({ currentRotation: eventState.currentRotation });
});

app.put('/api/participant-config', (req, res) => {
  const { currentRotation } = req.body;
  if (currentRotation) {
    eventState.currentRotation = currentRotation;
    saveState();
  }
  res.json({ currentRotation: eventState.currentRotation });
});

app.get('/api/participant-content', (req, res) => {
  res.json(eventState.content);
});

app.get('/api/participant-assignment/:teamId/:rotationId', (req, res) => {
  const { teamId, rotationId } = req.params;
  const rotationData = eventState.content[rotationId];
  if (rotationData && rotationData.teamAssignments[teamId]) {
    res.json(rotationData.teamAssignments[teamId]);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
