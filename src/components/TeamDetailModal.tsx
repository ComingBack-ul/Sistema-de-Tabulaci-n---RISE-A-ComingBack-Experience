import React from 'react';
import { Team } from '../types';
import { formatDisplayTimestamp } from '../utils/validation';
import { 
  X, 
  Trophy, 
  Key, 
  Shield, 
  Award, 
  Unlock, 
  Lock, 
  UserCheck, 
  Clock, 
  FileText, 
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface TeamDetailModalProps {
  team: Team | null;
  onClose: () => void;
  onOpenJudgeForTeam: (teamId: number) => void;
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
  team,
  onClose,
  onOpenJudgeForTeam
}) => {
  if (!team) return null;

  const isMorning = team.wave === 'morning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#991B1B] via-[#8B1818] to-[#7F1D1D] text-white p-4 sm:p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white text-[#991B1B] font-black text-xs flex items-center justify-center shadow-xs">
                #{team.id}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                isMorning ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
              }`}>
                {isMorning ? 'Oleada Mañana (1-25)' : 'Oleada Tarde (26-50)'}
              </span>
              {team.currentStationKey && (
                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-black uppercase shadow-xs">
                  📍 Destino: {team.currentStationKey.toUpperCase()}
                </span>
              )}
              {team.isBreakQualified && (
                <span className="text-[10px] bg-yellow-400 text-red-950 px-2 py-0.5 rounded font-black uppercase shadow-xs">
                  ⭐ BREAK CLASIFICADO
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Cabinet_Grotesk'] tracking-tight mt-1">
              {team.name}
            </h3>
            <p className="text-xs text-red-100 mt-0.5 font-medium">
              Integrantes: {team.members && team.members.length > 0 ? team.members.join(' • ') : 'Pendientes de registrar'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scorecard Overview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase block">Puesto Global</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#991B1B]">
                #{team.rank}
              </span>
              <span className="text-[10px] text-slate-500 block">de 50 equipos</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase block">Puesto Oleada</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-800">
                #{team.waveRank}
              </span>
              <span className="text-[10px] text-slate-500 block">de 25 equipos</span>
            </div>
            <div className="bg-white rounded-lg p-2 border border-red-200 shadow-xs">
              <span className="text-[11px] text-[#991B1B] font-black uppercase block">PUNTAJE TOTAL</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#991B1B]">
                {team.totalScore}
              </span>
              <span className="text-[10px] text-red-600 font-bold block">/ 100 Pts Máx</span>
            </div>
          </div>

          {/* Rooms Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Desglose Oficial de Estaciones / Salas
            </h4>

            {/* Sala A */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#991B1B]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-[#991B1B] rounded-lg border border-red-100">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      Sala A: "El Poder de mi Voz" (Oratoria)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Juez: {team.scores.salaA.judgeName || 'Sin asignar'} {team.scores.salaA.timestamp && `&bull; ${formatDisplayTimestamp(team.scores.salaA.timestamp)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#991B1B]">
                    {team.scores.salaA.isSubmitted ? team.scores.salaA.oratoriaPoints : 0}
                  </span>
                  <span className="text-xs text-slate-400 font-mono"> / 25 pts</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {team.scores.salaA.keywordSolved ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Palabra Clave Descifrada
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Palabra Clave No Descifrada
                    </span>
                  )}
                </div>
                {team.scores.salaA.notes && (
                  <p className="text-[11px] text-slate-600 italic">
                    "{team.scores.salaA.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Sala B-E */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#991B1B]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-[#991B1B] rounded-lg border border-red-100">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      Salas B-E: "Intereses y la Pared" (Debate 1v1)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {team.scores.salaBE.specificRoom && `Sub-Sala ${team.scores.salaBE.specificRoom} &bull; `}
                      Juez: {team.scores.salaBE.judgeName || 'Sin asignar'} {team.scores.salaBE.timestamp && `&bull; ${formatDisplayTimestamp(team.scores.salaBE.timestamp)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#991B1B]">
                    {team.scores.salaBE.isSubmitted ? team.scores.salaBE.debatePoints : 0}
                  </span>
                  <span className="text-xs text-slate-400 font-mono"> / 50 pts</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {team.scores.salaBE.codeDelivered ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Código de Alta Seguridad Entregado
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Código No Entregado
                    </span>
                  )}
                </div>
                {team.scores.salaBE.notes && (
                  <p className="text-[11px] text-slate-600 italic">
                    "{team.scores.salaBE.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Sala F */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#991B1B]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-[#991B1B] rounded-lg border border-red-100">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      Sala F: "Un Líder de Velda'" (Crisis Internacional)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Juez: {team.scores.salaF.judgeName || 'Sin asignar'} {team.scores.salaF.timestamp && `&bull; ${formatDisplayTimestamp(team.scores.salaF.timestamp)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#991B1B]">
                    {team.scores.salaF.isSubmitted ? team.scores.salaF.crisisPoints : 0}
                  </span>
                  <span className="text-xs text-slate-400 font-mono"> / 25 pts</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {team.scores.salaF.stampAwarded ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Sello Físico Otorgado
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Sello Físico No Otorgado
                    </span>
                  )}
                </div>
                {team.scores.salaF.notes && (
                  <p className="text-[11px] text-slate-600 italic">
                    "{team.scores.salaF.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tiebreaker Breakdown Note */}
          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-200">
            <span className="font-bold text-slate-800">Desempate Oficial Aplicado:</span>{' '}
            1º Puntos Debate B-E ({team.scores.salaBE.debatePoints} pts) &bull; 2º Puntos Crisis F ({team.scores.salaF.crisisPoints} pts) &bull; 3º Oratoria A ({team.scores.salaA.oratoriaPoints} pts).
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              onOpenJudgeForTeam(team.id);
              onClose();
            }}
            className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar / Cargar Puntuación</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
