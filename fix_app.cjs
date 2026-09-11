const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(currentUser\?\.role === 'admin' \|\| currentUser\?\.role === 'judge'\) \{\n\s*const data = await api\.get\('\/api\/teams'\);\n\s*setTeams\(data as any\);\n\s*\} \/\/ We'll just make \/api\/teams public or role-based later\.\n\s*setTeams\(data as any\);/,
  `if (currentUser?.role === 'admin' || currentUser?.role === 'judge') {
          const data = await api.get('/api/teams');
          setTeams(data as any);
        }`
);

fs.writeFileSync('src/App.tsx', code);
