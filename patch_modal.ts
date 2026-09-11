import * as fs from 'fs';

const modalPath = 'src/components/DataManagementModal.tsx';
let modalCode = fs.readFileSync(modalPath, 'utf-8');

modalCode = modalCode.replace(/<div className="bg-amber-50[\s\S]*?Cargar Demo\s*<\/button>\s*<\/div>/, '');

fs.writeFileSync(modalPath, modalCode);
