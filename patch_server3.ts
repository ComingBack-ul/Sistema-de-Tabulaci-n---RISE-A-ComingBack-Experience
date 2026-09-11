import * as fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/if \(assignment\.oratory\) delete assignment\.oratory\.keyword;/g, 'if (assignment.oratory) delete assignment.oratory.keyword;\n    if (assignment.keywordChallenge) delete assignment.keywordChallenge.keyword;');
fs.writeFileSync('server.ts', code);
