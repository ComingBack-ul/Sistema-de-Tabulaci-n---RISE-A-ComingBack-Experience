const fs = require('fs');

const code = `import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Hexagon, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { authenticateParticipant } from '../utils/auth';

interface Props {
  onLogin: (teamId: number) => void;
  onBack: () => void;
}

const OFFICIAL_TEAMS = [
  { id: 1, name: "Los Scooby Doo" },
  { id: 2, name: "Las tortugas ninja" },
  { id: 3, name: "Eclipse" },
  { id: 4, name: "Invernalia" },
  { id: 5, name: "Los 4 fantásticos" },
  { id: 6, name: "El cuarto poder" },
  { id: 7, name: "4 cerebros, 0 ideas" },
  { id: 8, name: "Los fénix azules" },
  { id: 9, name: "Los Pilares Del Silencio" },
  { id: 10, name: "Los 4 elementos" },
  { id: 11, name: "El Equipito" },
  { id: 12, name: "NEXO" },
  { id: 13, name: "Scooby-Doo" },
  { id: 14, name: "Club mapache (GARIMAJU)" },
  { id: 15, name: "Los mofios" },
  { id: 16, name: "Los 4 en oferta" },
  { id: 17, name: "Águila americana" },
  { id: 18, name: "Mentes bonitas" }
];

export const ParticipantLogin: React.FC<Props> = ({ onLogin, onBack }) => {
  const [teamNumber, setTeamNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNumber) {
      setErrorMsg('Seleccione un equipo');
      return;
    }
    
    setErrorMsg(null);
    setLoading(true);
    const id = parseInt(teamNumber);
    
    if (!isNaN(id) && id >= 1 && id <= 18) {
      const res = await authenticateParticipant(id);
      if (res.success) {
        onLogin(id);
      } else {
        setErrorMsg(res.error || 'No autorizado');
      }
    } else {
      setErrorMsg('Equipo inválido.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="bg-[#991B1B] p-8 text-center text-white relative">
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black font-['Cabinet_Grotesk'] tracking-tight">Portal Participante</h1>
          <p className="text-red-100/80 text-sm mt-2 font-medium">RISE — A ComingBack Experience</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 text-center">
              Nombre del equipo
            </label>
            <div className="relative">
              <select
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                className="w-full text-center text-lg font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 px-4 appearance-none focus:border-[#991B1B] focus:ring-4 focus:ring-red-100 transition-all outline-none"
                required
              >
                <option value="" disabled>Selecciona tu equipo</option>
                {OFFICIAL_TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            {errorMsg && (
              <p className="text-red-500 text-sm font-bold text-center mt-3">{errorMsg}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#991B1B] hover:bg-red-800 disabled:bg-slate-300 text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            <span>{loading ? 'Verificando...' : 'Ingresar'}</span>
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/ParticipantLogin.tsx', code);
