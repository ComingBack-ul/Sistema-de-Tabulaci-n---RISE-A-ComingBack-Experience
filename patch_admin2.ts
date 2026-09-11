import * as fs from 'fs';

const adminPath = 'src/components/admin/AdminSettings.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf-8');

adminCode = adminCode.replace(/<div className="p-3\.5 bg-amber-50\/60[\s\S]*?Cargar Demo\s*<\/button>\s*<\/div>/, '');

fs.writeFileSync(adminPath, adminCode);
