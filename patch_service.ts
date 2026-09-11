import * as fs from 'fs';

const filePath = 'src/services/participantContentService.ts';
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(/if \(safeContent\.keywordChallenge\)\s*\{\s*delete safeContent\.keywordChallenge\.keyword;\s*\}/g, '');
code = code.replace(/if \(safeContent\.keywordChallenge\)\s*delete safeContent\.keywordChallenge\.keyword;/g, '');

fs.writeFileSync(filePath, code);
