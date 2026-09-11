import * as fs from 'fs';

const storagePath = 'src/utils/storage.ts';
let code = fs.readFileSync(storagePath, 'utf-8');

code = code.replace(/parsed\.length > 50/g, 'parsed.length > 18');
code = code.replace(/data\.teams\.length > 50/g, 'data.teams.length > 18');
code = code.replace(/El respaldo debe contener entre 1 y 50 equipos/g, 'El respaldo debe contener entre 1 y 18 equipos');

fs.writeFileSync(storagePath, code);
