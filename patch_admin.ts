import * as fs from 'fs';

const adminPath = 'src/components/admin/AdminSettings.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf-8');

adminCode = adminCode.replace(/generateDemoData,\s*/g, '');
adminCode = adminCode.replace(/const handleLoadDemo = \(\) => \{[\s\S]*?\};\n/g, '');
adminCode = adminCode.replace(/<div className="bg-amber-50[\s\S]*?Cargar Demo\s*<\/button>\s*<\/div>/, '');

fs.writeFileSync(adminPath, adminCode);
