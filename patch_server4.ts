import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.get\('\/api\/admin\/teams',[\s\S]*?\);/, `app.get('/api/teams', authenticateToken, (req: any, res: any) => {
  if (req.user.role === 'participant') return res.status(403).json({ error: 'Acceso denegado' });
  res.json(teamsState);
});`);

code = code.replace(/app\.get\('\/api\/judge\/teams',[\s\S]*?\);/, '');

fs.writeFileSync('server.ts', code);
