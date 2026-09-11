import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const data = await api\.get\('\/api\/admin\/teams'\);/g,
  `if (currentUser?.role === 'admin' || currentUser?.role === 'judge') {
          const data = await api.get('/api/teams');
          setTeams(data as any);
        }`
);

fs.writeFileSync('src/App.tsx', code);
