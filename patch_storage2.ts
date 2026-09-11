import * as fs from 'fs';

const filePath = 'src/utils/storage.ts';
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(/Mañana \(1-25\)/g, 'Mañana (1-9)');
code = code.replace(/Tarde \(26-50\)/g, 'Tarde (10-18)');
code = code.replace(/50 equipos/g, '18 equipos');

fs.writeFileSync(filePath, code);
