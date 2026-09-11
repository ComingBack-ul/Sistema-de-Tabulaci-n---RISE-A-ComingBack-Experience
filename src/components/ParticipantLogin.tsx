import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Hexagon } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onLogin: (teamId: number) => void;
  onBack: () => void;
}

export const ParticipantLogin: React.FC<Props> = ({ onLogin, onBack }) => {
  const [teamNumber, setTeamNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(teamNumber);
    if (!isNaN(id) && id >= 1 && id <= 18) {
      const { authenticateParticipant } = await import('../utils/auth');
      const res = await authenticateParticipant(id);
      if (res.success) {
        onLogin(id);
      } else {
        alert(res.error || 'No autorizado');
      }
    } else {
      alert('Número de equipo inválido. Ingrese un valor entre 1 y 18.');
    }
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
              Número de Equipo
            </label>
            <input
              type="number"
              min="1"
              max="18"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              className="w-full text-center text-4xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 focus:border-[#991B1B] focus:ring-4 focus:ring-red-100 transition-all outline-none"
              placeholder="#"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#991B1B] hover:bg-red-800 text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
