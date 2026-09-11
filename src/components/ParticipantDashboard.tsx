import React, { useMemo, useEffect, useState } from 'react';
import { LogOut, AlertCircle, Compass, FileText, Globe, Key, MapPin, Search } from 'lucide-react';
import { Team, RotationId } from '../types';
import { getCurrentRotationAsync, getSafeParticipantAssignmentAsync } from '../services/participantContentService';

interface Props {
  teamId: number;
  teams: Team[];
  onLogout: () => void;
}

export const ParticipantDashboard: React.FC<Props> = ({ teamId, teams, onLogout }) => {
  const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);
  
  const [loading, setLoading] = useState(true);
  const [currentRotation, setCurrentRotation] = useState<RotationId>('rotation_1');
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!team || team.status === 'inactive') {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        const rot = await getCurrentRotationAsync();
        if (!isMounted) return;
        setCurrentRotation(rot);
        
        const assign = await getSafeParticipantAssignmentAsync(team, rot);
        if (!isMounted) return;
        setAssignment(assign);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    // Poll the shared truth source every 5 seconds without blocking UI
    const interval = setInterval(fetchData, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [team]);

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Equipo no encontrado</h2>
        <button onClick={onLogout} className="text-[#991B1B] font-bold underline">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans'] pb-12">
      {/* Header */}
      <header className="bg-[#991B1B] text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-red-200 font-bold tracking-wider uppercase">Experiencia Participante</span>
          <h1 className="text-lg font-black font-['Cabinet_Grotesk'] leading-tight">Equipo #{team.id}</h1>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Progress Indicators */}
      <div className="bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="flex justify-between max-w-sm mx-auto">
          {['rotation_1', 'rotation_2', 'rotation_3'].map((rot, i) => {
            const isActive = currentRotation === rot;
            const isPast = parseInt(currentRotation.split('_')[1]) > i + 1;
            return (
              <div key={rot} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                  isActive ? 'bg-[#991B1B] text-white ring-4 ring-red-100' :
                  isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#991B1B]' : 'text-slate-400'}`}>Rot {i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full mt-4">
        {team.status === 'inactive' ? (
          <div className="bg-white rounded-3xl p-8 border border-red-100 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Acceso Suspendido</h3>
            <p className="text-slate-500 text-sm font-medium">Este equipo se encuentra actualmente inactivo y no puede recibir nuevas asignaciones.</p>
          </div>
        ) : loading && !assignment ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#991B1B]"></div>
          </div>
        ) : !assignment ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Información no disponible</h3>
            <p className="text-slate-500 text-sm">Aún no hay contenido disponible para tu equipo en esta rotación.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assignment Header */}
            <div className="bg-[#1e293b] rounded-3xl p-6 shadow-lg text-white">
              <div className="flex items-center gap-2 mb-1 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Estación Actual</span>
              </div>
              <h3 className="text-2xl font-black font-['Cabinet_Grotesk'] leading-tight mb-4">
                {assignment.title}
              </h3>

              {/* SALA A - ORATORY */}
              {assignment.room === 'sala_a' && assignment.oratory && (
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tu Organismo</span>
                    <span className="block text-2xl font-black text-amber-400">{assignment.oratory.organization}</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tu Postura</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{assignment.oratory.position}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fragmento Obligatorio</span>
                    <p className="text-emerald-300 text-sm font-semibold leading-relaxed border-l-2 border-emerald-500 pl-3">
                      {assignment.oratory.requiredSpeechFragment}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fragmento Diplomático</span>
                    <p className="text-sky-300 text-sm font-semibold leading-relaxed border-l-2 border-sky-500 pl-3">
                      {assignment.oratory.diplomaticFragment}
                    </p>
                  </div>

                  <div className="bg-[#991B1B]/40 rounded-2xl p-5 border border-red-500/30">
                    <span className="flex items-center gap-2 text-xs font-bold text-red-200 uppercase tracking-wider mb-3">
                      <Search className="w-4 h-4" /> Pistas para Reto
                    </span>
                    <ul className="space-y-2">
                      {assignment.oratory.clues.map((clue, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-white">
                          <span className="text-red-400 font-bold">{idx + 1}.</span>
                          <span>{clue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-slate-400 leading-relaxed"><span className="font-bold text-white">Instrucciones:</span> {assignment.oratory.participantInstructions}</p>
                  </div>
                </div>
              )}

              {/* SALA B-E - DEBATE */}
              {assignment.room === 'sala_b_e' && assignment.debate && (
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Moción</span>
                    <span className="block text-xl font-black text-white leading-tight">{assignment.debate.motion}</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tu Lado</span>
                    <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider ${
                      assignment.debate.participantSide === 'Proposición' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {assignment.debate.participantSide}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instrucciones</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{assignment.debate.instructions}</p>
                  </div>

                  {assignment.debate.preparationNotes && (
                    <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                      <span className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Notas de Preparación</span>
                      <p className="text-amber-100 text-sm leading-relaxed">{assignment.debate.preparationNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SALA F - CRISIS */}
              {assignment.room === 'sala_f' && assignment.crisis && (
                <div className="space-y-6">
                  <div className="bg-rose-500/20 rounded-2xl p-5 border border-rose-500/30 text-center">
                    <span className="block text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Situación de Crisis</span>
                    <span className="block text-xl font-black text-white">{assignment.crisis.crisisTitle}</span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Escenario</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{assignment.crisis.scenario}</p>
                  </div>

                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                    <span className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Objetivo Diplomático</span>
                    <p className="text-amber-100 text-sm font-semibold leading-relaxed">{assignment.crisis.diplomaticObjective}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contexto Relevante</span>
                    <p className="text-slate-300 text-sm leading-relaxed italic">{assignment.crisis.relevantContext}</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-slate-400 leading-relaxed"><span className="font-bold text-white">Instrucciones:</span> {assignment.crisis.instructions}</p>
                    {assignment.crisis.requiredOutcome && (
                      <p className="text-xs text-emerald-400 mt-2 font-bold leading-relaxed">
                        Requisito de Salida: {assignment.crisis.requiredOutcome}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
