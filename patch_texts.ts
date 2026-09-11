import * as fs from 'fs';

const liveTabPath = 'src/components/AdminLiveTab.tsx';
let liveTabCode = fs.readFileSync(liveTabPath, 'utf-8');
liveTabCode = liveTabCode.replace(/50 equipos/g, '18 equipos');
fs.writeFileSync(liveTabPath, liveTabCode);

const judgeDashboardPath = 'src/components/JudgeDashboard.tsx';
let judgeCode = fs.readFileSync(judgeDashboardPath, 'utf-8');
judgeCode = judgeCode.replace(/50\/50 Equipos/g, '18/18 Equipos');
fs.writeFileSync(judgeDashboardPath, judgeCode);

