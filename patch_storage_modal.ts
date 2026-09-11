import * as fs from 'fs';

// 1. storage.ts
let storagePath = 'src/utils/storage.ts';
let storageCode = fs.readFileSync(storagePath, 'utf-8');
storageCode = storageCode.replace(/export function generateDemoData\(\): Team\[\] \{[\s\S]*?return processed;\n\}/, '');
fs.writeFileSync(storagePath, storageCode);

// 2. DataManagementModal.tsx
let modalPath = 'src/components/DataManagementModal.tsx';
let modalCode = fs.readFileSync(modalPath, 'utf-8');
modalCode = modalCode.replace(/generateDemoData,\s*/g, '');
modalCode = modalCode.replace(/const handleLoadDemo = \(\) => \{[\s\S]*?\};\n/g, '');
modalCode = modalCode.replace(/<div className="bg-indigo-50 \/.*?>[\s\S]*?<button[\s\S]*?onClick=\{handleLoadDemo\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/, ''); // Rough guess, maybe better to just use sed or AST, but let's see what's actually there.
fs.writeFileSync(modalPath, modalCode);
