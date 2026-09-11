import * as fs from 'fs';

const filePath = 'server.ts';
let code = fs.readFileSync(filePath, 'utf-8');

const replacement = `
app.get('/api/participant-content', (req, res) => {
  // Strip private info before sending to the client
  const safeState = JSON.parse(JSON.stringify(eventState));
  
  if (safeState.officialPool) {
    // Strip solutions from riddles
    if (safeState.officialPool.riddles) {
      safeState.officialPool.riddles.forEach((r: any) => {
        delete r.solution;
      });
    }
    // Strip rotation codes
    delete safeState.officialPool.rotationCodes;
  }
  
  res.json(safeState);
});

app.get('/api/participant-assignment/:teamId/:rotationId', (req, res) => {
  const { teamId, rotationId } = req.params;
  const rotationData = eventState.assignments[rotationId as keyof typeof eventState.assignments];
  if (rotationData && rotationData.teamAssignments[teamId as any]) {
    const assignment = JSON.parse(JSON.stringify(rotationData.teamAssignments[teamId as any]));
    
    // Legacy support removal
    if (assignment.oratory) delete assignment.oratory.keyword;
    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;

    res.json(assignment);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});
`;

code = code.replace(/app\.get\('\/api\/participant-content'[\s\S]*?res\.status\(404\)\.json\(\{ error: 'Not found' \}\);\n  \}\n\}\);/, replacement.trim());

fs.writeFileSync(filePath, code);
