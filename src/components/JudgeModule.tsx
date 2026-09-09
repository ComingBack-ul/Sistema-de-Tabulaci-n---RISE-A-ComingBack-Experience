import React, { useState, useEffect, useMemo } from 'react';
import { Team, RoomId, AuthUser } from '../types';
import { validateScoreRange } from '../utils/validation';
import { 
  Key, 
  Shield, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Search, 
  UserCheck, 
  Save, 
  ArrowRight, 
  RotateCcw, 
  Lock, 
  Unlock, 
  FileText, 
  Flame, 
  Info,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';

interface JudgeModuleProps {
  teams: Team[];
  currentUser?: AuthUser | null;
  onSaveScore: (
    teamId: number,
    room: RoomId,
    scoreData: {
      points: number;
      escapeChallenge: boolean;
      judgeName: string;
      notes: string;
      specificRoom?: 'B' | 'C' | 'D' | 'E';
    }
  ) => void;
}

export const JudgeModule: React.FC<JudgeModuleProps> = ({ teams, currentUser, onSaveScore }) => {
  // State
  const [selectedRoom, setSelectedRoom] = useState<RoomId>('sala_a');
  const [selectedSpecificRoomBE, setSelectedSpecificRoomBE] = useState<'B' | 'C' | 'D' | 'E'>('B');
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Form Fields
  const [judgeName, setJudgeName] = useState<string>(() => {
    return currentUser?.name || currentUser?.username || '';
  });
  const [points, setPoints] = useState<number>(0);
  const [escapeChallenge, setEscapeChallenge] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ show: boolean; msg: string; teamName: string } | null>(null);

  // Room Configurations
  const roomConfig = useMemo(() => {
    switch (selectedRoom) {
      case 'sala_a':
        return {
          title: 'Sala A: "El Poder de mi Voz"',
          subtitle: 'Oratoria & Descifrado',
          maxPoints: 25,
          colorTheme: 'from-red-700 to-red-800',
          badgeText: '0 a 25 Pts',
          challengeName: 'Palabra Clave Descifrada',
          challengeDescription: 'El equipo descifró exitosamente la clave oculta del atril.',
          icon: Key,
          pinDefault: '1001'
        };
      case 'sala_b_e':
        return {
          title: 'Salas B, C, D, E: "Intereses y la Pared"',
          subtitle: 'Debate World Schools 1v1',
          maxPoints: 50,
          colorTheme: 'from-red-800 to-rose-900',
          badgeText: '0 a 50 Pts',
          challengeName: 'Código de Alta Seguridad Entregado',
          challengeDescription: 'El equipo obtuvo y entregó el código de seguridad de la sala.',
          icon: Shield,
          pinDefault: '2002'
        };
      case 'sala_f':
        return {
          title: 'Sala F: "Un Líder de Velda\'"',
          subtitle: 'Crisis Internacional & Diplomacia',
          maxPoints: 25,
          colorTheme: 'from-red-900 to-red-950',
          badgeText: '0 a 25 Pts',
          challengeName: 'Sello Físico Otorgado',
          challengeDescription: 'El equipo resolvió el dilema de crisis y recibió el sello oficial.',
          icon: Award,
          pinDefault: '3003'
        };
    }
  }, [selectedRoom]);

  // Current Team
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Load existing values when team or room changes
  useEffect(() => {
    if (!currentTeam) return;

    if (selectedRoom === 'sala_a') {
      const existing = currentTeam.scores.salaA;
      setPoints(existing.isSubmitted ? existing.oratoriaPoints : 0);
      setEscapeChallenge(existing.keywordSolved);
      setNotes(existing.notes || '');
      if (existing.judgeName && !judgeName) setJudgeName(existing.judgeName);
    } else if (selectedRoom === 'sala_b_e') {
      const existing = currentTeam.scores.salaBE;
      setPoints(existing.isSubmitted ? existing.debatePoints : 0);
      setEscapeChallenge(existing.codeDelivered);
      setNotes(existing.notes || '');
      if (existing.specificRoom) setSelectedSpecificRoomBE(existing.specificRoom);
      if (existing.judgeName && !judgeName) setJudgeName(existing.judgeName);
    } else if (selectedRoom === 'sala_f') {
      const existing = currentTeam.scores.salaF;
      setPoints(existing.isSubmitted ? existing.crisisPoints : 0);
      setEscapeChallenge(existing.stampAwarded);
      setNotes(existing.notes || '');
      if (existing.judgeName && !judgeName) setJudgeName(existing.judgeName);
    }
    setValidationError(null);
  }, [selectedTeamId, selectedRoom, currentTeam]);

  const handleJudgeNameChange = (name: string) => {
    setJudgeName(name);
  };

  // Filtered teams for autocomplete dropdown
  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    const query = teamSearchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.id.toString().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.members.some((m) => m.toLowerCase().includes(query)) ||
        (t.wave === 'morning' && 'mañana'.includes(query)) ||
        (t.wave === 'afternoon' && 'tarde'.includes(query))
    );
  }, [teams, teamSearchQuery]);

  // Points handler with strict boundary clamp
  const handlePointsChange = (rawVal: string | number) => {
    const num = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
    if (isNaN(num)) {
      setPoints(0);
      setValidationError(null);
      return;
    }
    if (num < 0) {
      setPoints(0);
      setValidationError('La puntuación no puede ser menor a 0.');
    } else if (num > roomConfig.maxPoints) {
      setPoints(roomConfig.maxPoints);
      setValidationError(`Puntuación máxima para esta sala es de ${roomConfig.maxPoints} pts.`);
    } else {
      setPoints(Math.round(num * 10) / 10); // 1 decimal max
      setValidationError(null);
    }
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent, autoAdvance = false) => {
    e.preventDefault();

    // Validation
    if (points < 0 || points > roomConfig.maxPoints) {
      setValidationError(`Por favor ingresa un puntaje válido entre 0 y ${roomConfig.maxPoints}.`);
      return;
    }

    if (!judgeName.trim()) {
      setValidationError('Por favor ingresa tu Nombre o PIN de Juez para registrar la evaluación.');
      return;
    }

    onSaveScore(selectedTeamId, selectedRoom, {
      points,
      escapeChallenge,
      judgeName: judgeName.trim(),
      notes: notes.trim(),
      specificRoom: selectedRoom === 'sala_b_e' ? selectedSpecificRoomBE : undefined
    });

    // Toast notification
    setSuccessToast({
      show: true,
      msg: `¡Puntaje de ${points} pts guardado exitosamente para el Equipo ${selectedTeamId}!`,
      teamName: currentTeam.name
    });

    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);

    if (autoAdvance) {
      const nextId = selectedTeamId >= 50 ? 1 : selectedTeamId + 1;
      setSelectedTeamId(nextId);
    }
  };

  const isCurrentRoomSubmitted = useMemo(() => {
    if (!currentTeam) return false;
    if (selectedRoom === 'sala_a') return currentTeam.scores.salaA.isSubmitted;
    if (selectedRoom === 'sala_b_e') return currentTeam.scores.salaBE.isSubmitted;
    if (selectedRoom === 'sala_f') return currentTeam.scores.salaF.isSubmitted;
    return false;
  }, [currentTeam, selectedRoom]);

  const RoomIcon = roomConfig.icon;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Success Toast */}
      {successToast && (
        <div 
          id="judge-success-toast"
          className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-white flex items-center gap-3 animate-bounce"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <div>
            <p className="font-extrabold text-sm sm:text-base">{successToast.msg}</p>
            <p className="text-xs text-emerald-100">{successToast.teamName}</p>
          </div>
        </div>
      )}

      {/* Hero card for Judge Station */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#991B1B] via-[#8B1818] to-[#7F1D1D] text-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <RoomIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-100 bg-black/20 px-2 py-0.5 rounded-full">
                  Módulo de Evaluación
                </span>
                <h2 className="text-lg sm:text-2xl font-black font-['Cabinet_Grotesk'] tracking-tight mt-1">
                  {roomConfig.title}
                </h2>
                <p className="text-xs sm:text-sm text-red-100 font-medium">
                  {roomConfig.subtitle} &bull; <strong className="text-white">Máximo: {roomConfig.maxPoints} pts</strong>
                </p>
              </div>
            </div>

            {/* Room Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/15">
              <button
                type="button"
                id="btn-select-sala-a"
                onClick={() => setSelectedRoom('sala_a')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoom === 'sala_a'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Sala A (25p)</span>
              </button>

              <button
                type="button"
                id="btn-select-sala-be"
                onClick={() => setSelectedRoom('sala_b_e')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoom === 'sala_b_e'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Salas B-E (50p)</span>
              </button>

              <button
                type="button"
                id="btn-select-sala-f"
                onClick={() => setSelectedRoom('sala_f')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRoom === 'sala_f'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Sala F (25p)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-selector for specific B, C, D, E rooms if applicable */}
        {selectedRoom === 'sala_b_e' && (
          <div className="bg-red-50/70 border-b border-red-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#991B1B] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#991B1B]" />
              Sub-Sala de Debate:
            </span>
            <div className="flex gap-1.5">
              {(['B', 'C', 'D', 'E'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  id={`btn-subroom-${r}`}
                  onClick={() => setSelectedSpecificRoomBE(r)}
                  className={`px-3 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                    selectedSpecificRoomBE === r
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'bg-white text-[#991B1B] border border-red-200 hover:bg-red-50'
                  }`}
                >
                  Sala {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Judge Identification Bar */}
        <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="judge-name-input" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nombre del Juez / Código PIN *
              </label>
              <div className="relative">
                <input
                  id="judge-name-input"
                  type="text"
                  value={judgeName}
                  onChange={(e) => handleJudgeNameChange(e.target.value)}
                  placeholder="Ej. Juez Principal Martínez / PIN"
                  className="w-full bg-white border border-slate-300 focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]/20 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs outline-hidden"
                  required
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Se guarda automáticamente en tu navegador para no tener que reescribirlo.
              </p>
            </div>

            {/* Team Autocomplete Selector */}
            <div className="relative">
              <label htmlFor="team-search-input" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Seleccionar Equipo (1 al 50) *
              </label>
              
              <div className="relative">
                <div
                  id="team-selector-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-white border border-slate-300 hover:border-[#991B1B] rounded-lg px-3.5 py-2 text-sm font-bold text-slate-900 flex items-center justify-between cursor-pointer shadow-xs transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded-full bg-[#991B1B] text-white text-xs flex items-center justify-center font-black shrink-0">
                      {currentTeam.id}
                    </span>
                    <span className="truncate">{currentTeam.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      currentTeam.wave === 'morning' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {currentTeam.wave === 'morning' ? 'Mañana' : 'Tarde'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#991B1B] shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu with Search */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#991B1B] rounded-xl shadow-xl z-50 max-h-72 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-200 bg-slate-50">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          id="team-search-input"
                          type="text"
                          autoFocus
                          value={teamSearchQuery}
                          onChange={(e) => setTeamSearchQuery(e.target.value)}
                          placeholder="Buscar por número (1-50) o nombre..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                      {filteredTeams.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No se encontraron equipos para "{teamSearchQuery}"
                        </div>
                      ) : (
                        filteredTeams.map((team) => {
                          const isEvaluatedInRoom =
                            selectedRoom === 'sala_a'
                              ? team.scores.salaA.isSubmitted
                              : selectedRoom === 'sala_b_e'
                              ? team.scores.salaBE.isSubmitted
                              : team.scores.salaF.isSubmitted;

                          return (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => {
                                setSelectedTeamId(team.id);
                                setIsDropdownOpen(false);
                                setTeamSearchQuery('');
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-red-50 transition-colors ${
                                team.id === selectedTeamId ? 'bg-red-100/70 font-black text-red-950' : 'text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[11px] flex items-center justify-center text-slate-800 shrink-0">
                                  {team.id}
                                </span>
                                <span className="truncate">{team.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                  team.wave === 'morning' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {team.wave === 'morning' ? 'M' : 'T'}
                                </span>
                                {isEvaluatedInRoom ? (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Listo
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Integrantes: {currentTeam.members.slice(0, 2).join(', ')}...</span>
                {isCurrentRoomSubmitted && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Evaluado previamente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Form Body */}
        <form onSubmit={(e) => handleSubmit(e, true)} className="p-4 sm:p-6 space-y-5">
          {/* Main Score Area */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Puntuación de la Sala
              </span>

              {/* Central Score Display & Controls */}
              <div className="flex items-center justify-center gap-3 sm:gap-5 my-1 w-full max-w-sm">
                <button
                  type="button"
                  id="btn-admin-decrement-points"
                  onClick={() => handlePointsChange(Math.max(0, points - 0.5))}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                  aria-label="Disminuir puntuación"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex flex-col items-center justify-center min-w-[140px] px-2 py-0.5">
                  <div className="flex items-center justify-center w-full">
                    <input
                      id="points-number-input"
                      type="number"
                      min="0"
                      max={roomConfig.maxPoints}
                      step="0.5"
                      value={points}
                      onChange={(e) => handlePointsChange(e.target.value)}
                      className="w-full text-center text-4xl sm:text-5xl font-black text-slate-900 tracking-tight bg-transparent border-none outline-hidden p-0 m-0 tabular-nums focus:ring-0"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5 select-none">
                    / {roomConfig.maxPoints} PTS
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-admin-increment-points"
                  onClick={() => handlePointsChange(Math.min(roomConfig.maxPoints, points + 0.5))}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                  aria-label="Aumentar puntuación"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Tactile Range Slider */}
              <div className="w-full max-w-md mt-4">
                <input
                  id="points-slider-input"
                  type="range"
                  min="0"
                  max={roomConfig.maxPoints}
                  step="0.5"
                  value={points}
                  onChange={(e) => handlePointsChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#991B1B]"
                />
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5 px-0.5 tabular-nums">
                  <span>0 pts</span>
                  <span>{roomConfig.maxPoints / 2} pts</span>
                  <span>{roomConfig.maxPoints} pts</span>
                </div>
              </div>
            </div>

            {validationError && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#991B1B] bg-red-50 p-2.5 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#991B1B]" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Escape Room Challenge Switch / Box */}
          <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
            escapeChallenge 
              ? 'bg-emerald-50 border-emerald-400 shadow-xs' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg mt-0.5 ${
                  escapeChallenge ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {escapeChallenge ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {roomConfig.challengeName}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      escapeChallenge ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {escapeChallenge ? 'Superado' : 'No Superado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {roomConfig.challengeDescription}
                  </p>
                </div>
              </div>

              {/* Large tactile Toggle Switch */}
              <button
                type="button"
                id="btn-toggle-escape-challenge"
                onClick={() => setEscapeChallenge(!escapeChallenge)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  escapeChallenge ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    escapeChallenge ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Feedback & Notes */}
          <div>
            <label htmlFor="judge-notes-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              OBSERVACIONES
            </label>
            <textarea
              id="judge-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios sobre argumentación, uso de evidencias, refutación o escape room..."
              className="w-full bg-white border border-slate-300 focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]/20 rounded-xl p-3 text-xs sm:text-sm text-slate-800 shadow-xs outline-hidden"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              id="btn-save-and-next"
              className="w-full sm:w-auto bg-[#991B1B] hover:bg-[#7F1D1D] active:bg-[#6b1414] text-white font-bold text-sm py-3 px-8 rounded-xl shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer ml-auto"
            >
              <span>Guardar y Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Quick Navigation Cards: Wave Teams */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Acceso Rápido por Número de Equipo ({currentTeam.wave === 'morning' ? 'Oleada Mañana 1-25' : 'Oleada Tarde 26-50'})
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Seleccionado: <strong className="text-[#991B1B]">Equipo #{selectedTeamId}</strong>
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-25 gap-1.5">
          {teams.map((t) => {
            const isEvaluated =
              selectedRoom === 'sala_a'
                ? t.scores.salaA.isSubmitted
                : selectedRoom === 'sala_b_e'
                ? t.scores.salaBE.isSubmitted
                : t.scores.salaF.isSubmitted;

            const isSelected = t.id === selectedTeamId;

            return (
              <button
                key={t.id}
                type="button"
                id={`quick-team-btn-${t.id}`}
                onClick={() => setSelectedTeamId(t.id)}
                className={`py-1.5 rounded-lg text-xs font-black transition-all flex flex-col items-center justify-center border cursor-pointer ${
                  isSelected
                    ? 'bg-[#991B1B] text-white border-[#7F1D1D] shadow-xs scale-105'
                    : isEvaluated
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title={`${t.name} (${t.wave === 'morning' ? 'Mañana' : 'Tarde'})`}
              >
                <span>{t.id}</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  isEvaluated ? 'bg-emerald-500' : 'bg-transparent'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
