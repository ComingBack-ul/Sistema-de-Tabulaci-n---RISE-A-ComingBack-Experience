const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/\/\/ --- JUDGE ENDPOINTS ---\n\}\);/g, '// --- JUDGE ENDPOINTS ---');
code = code.replace(/res\.json\(teamsState\);\n\}\);\n\}\);/g, 'res.json(teamsState);\n});');
fs.writeFileSync('server.ts', code);
