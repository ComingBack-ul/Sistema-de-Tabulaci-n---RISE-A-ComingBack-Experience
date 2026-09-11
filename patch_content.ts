import fs from 'fs';

let code = fs.readFileSync('src/services/participantContentService.ts', 'utf8');

code = code.replace(
  /export async function getParticipantAssignmentAsync[\s\S]*?\} catch \(e\) \{/m,
  `import { api } from './apiClient';

export async function getParticipantAssignmentAsync(team: Team, rotation: RotationId): Promise<ParticipantContent | null> {
  try {
    const res = await api.get<ParticipantContent>(\`/api/participant/assignment/\${rotation}\`);
    return res;
  } catch (e: any) {
    if (e.status === 404) return null;`
);

code = code.replace(
  /export async function getCurrentRotationAsync\(\): Promise<RotationId> \{\n\s*try \{\n\s*const res = await fetch\('\/api\/participant-config'\);\n\s*if \(res\.ok\) \{\n\s*const data = await res\.json\(\);\n\s*return data\.currentRotation;/m,
  `export async function getCurrentRotationAsync(): Promise<RotationId> {
  try {
    const data = await api.get<any>('/api/participant/config');
    return data.currentRotation;`
);

code = code.replace(
  /export async function setCurrentRotationAsync\(rotation: RotationId\): Promise<boolean> \{\n\s*try \{\n\s*const res = await fetch\('\/api\/participant-config', \{\n\s*method: 'PUT',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(\{ currentRotation: rotation \}\)\n\s*\}\);\n\s*return res\.ok;/m,
  `export async function setCurrentRotationAsync(rotation: RotationId): Promise<boolean> {
  try {
    await api.put('/api/admin/config', { currentRotation: rotation });
    return true;`
);

fs.writeFileSync('src/services/participantContentService.ts', code);
