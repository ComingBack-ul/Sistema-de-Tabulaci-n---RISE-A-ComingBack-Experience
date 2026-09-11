const fs = require('fs');
let code = fs.readFileSync('src/components/ParticipantDashboard.tsx', 'utf8');

const progressWidget = `
        {/* Progreso del Equipo */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Progreso</span>
            <span className="text-xs font-black text-[#991B1B]">{currentRotation.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="flex gap-2">
            {['rotation_1', 'rotation_2', 'rotation_3'].map((rot) => {
              const isCurrent = rot === currentRotation;
              const isPast = rot < currentRotation;
              return (
                <div 
                  key={rot} 
                  className={\`h-2 flex-1 rounded-full \${isCurrent ? 'bg-[#991B1B]' : isPast ? 'bg-emerald-500' : 'bg-slate-200'}\`} 
                  title={rot}
                />
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Inicio</span>
            <span>Fin</span>
          </div>
        </div>
`;

code = code.replace('{/* Identidad / Estado */}', progressWidget + '\n        {/* Identidad / Estado */}');

fs.writeFileSync('src/components/ParticipantDashboard.tsx', code);
