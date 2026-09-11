import fs from 'fs';
let code = fs.readFileSync('src/utils/auth.ts', 'utf8');
code = code.replace(/export function authenticate/g, 'export async function authenticate');
code = code.replace(/export function logout/g, 'export async function logout');
fs.writeFileSync('src/utils/auth.ts', code);
