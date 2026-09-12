import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Hexagon, AlertCircle, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OFFICIAL_TEAMS_DATA } from '../data/officialTeams';
import { authenticateParticipant } from '../utils/auth';

interface Props {
  onLogin: (teamId: number) => void;
  onBack: () => void;
}

export const ParticipantLogin: React.FC<Props> = ({ onLogin, onBack }) => {
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedTeamName) {
      setErrorMessage('Selecciona tu equipo para continuar.');
      return;
    }

    const matchedTeam = OFFICIAL_TEAMS_DATA.find((t) => t.name === selectedTeamName);
    if (!matchedTeam) {
      setErrorMessage('Equipo no válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateParticipant(matchedTeam.name);
      if (res.success && res.teamId) {
        onLogin(res.teamId);
      } else {
        setErrorMessage(res.error || 'No fue posible iniciar la sesión. Inténtalo nuevamente.');
      }
    } catch {
      setErrorMessage('No fue posible iniciar la sesión. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTeam = OFFICIAL_TEAMS_DATA.find((t) => t.name === selectedTeamName);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="bg-[#991B1B] p-8 text-center text-white relative">
          <button 
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black font-['Cabinet_Grotesk'] tracking-tight">Portal Participante</h1>
          <p className="text-red-100/90 text-sm mt-1.5 font-medium">RISE — A ComingBack Experience</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label htmlFor="team-select" className="block text-sm font-bold text-slate-700 mb-2">
              Nombre del equipo *
            </label>
            <div className="relative">
              <select
                id="team-select"
                value={selectedTeamName}
                onChange={(e) => {
                  setSelectedTeamName(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={isLoading}
                className="w-full appearance-none bg-slate-50 border-2 border-slate-200 focus:border-[#991B1B] focus:bg-white focus:ring-4 focus:ring-red-100 rounded-2xl py-3.5 pl-4 pr-10 text-base font-semibold text-slate-800 transition-all outline-hidden cursor-pointer"
              >
                <option value="">Selecciona tu equipo...</option>
                {OFFICIAL_TEAMS_DATA.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Selecciona tu equipo por su nombre oficial registrado.
            </p>
          </div>

          {currentTeam && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2"
            >
              <div className="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#991B1B]" />
                  Integrantes Oficiales ({currentTeam.participants.length})
                </span>
                <span className="bg-red-100 text-[#991B1B] px-2 py-0.5 rounded-full font-bold">
                  {currentTeam.id <= 9 ? 'Mañana' : 'Tarde'}
                </span>
              </div>
              <ul className="space-y-1 text-slate-700 font-medium pl-1">
                {currentTeam.participants.map((participantName, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B]" />
                    <span>{participantName}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#991B1B] hover:bg-red-800 active:bg-red-900 disabled:opacity-50 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-red-950/20 transition-all cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
