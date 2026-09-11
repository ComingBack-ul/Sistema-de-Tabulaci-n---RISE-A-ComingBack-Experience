import React, { useState, useMemo, useEffect } from 'react';
import { AuthUser, Team, JudgeEvaluation, StationKey } from '../types';
import { validateJudgeEvaluation } from '../utils/validation';
import { subscribeToStorageUpdates } from '../utils/storage';
import { 
  isTeamAvailableForJudge, 
  getAvailableTeams, 
  getNextAvailableTeam, 
  getEvaluatedTeamsCount,
  getAssignedTeams,
  getTotalAssignedTeamsCount,
  isTeamAssignedToStation,
  getCurrentCrisisTeam,
  isCrisisTeamFullyEvaluated,
  isCrisisJudgeSubmittedForTeam
} from '../utils/auth';
import { 
  ClipboardCheck, 
  ListOrdered, 
  Trophy, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Save, 
  ArrowRight, 
  Lock, 
  Unlock, 
  FileText, 
  ChevronDown, 
  Key, 
  Shield, 
  Award, 
  Sparkles, 
  Filter, 
  Clock, 
  UserCheck,
  Plus,
  Minus
} from 'lucide-react';

interface JudgeDashboardProps {
  user: AuthUser;
  teams: Team[];
  onSaveEvaluation: (teamId: number, evaluation: JudgeEvaluation) => void;
  onOpenTeamDetail?: (team: Team) => void;
}

export const JudgeDashboard: React.FC<JudgeDashboardProps> = ({
  user,
  teams,
  onSaveEvaluation,
  onOpenTeamDetail,
}) => {
  // 3 Primary Judge Tabs
  const [activeTab, setActiveTab] = useState<'eval' | 'teams' | 'leaderboard'>('eval');

  const isSalaA = user.stationKey === 'sala_a1' || user.stationKey === 'sala_a2';
  const isCrisis = user.stationKey === 'sala_f1' || user.stationKey === 'sala_f2';

  // Authoritative Current Crisis Team for Sala F
  const currentCrisisTeam = useMemo(() => {
    return isCrisis ? getCurrentCrisisTeam(teams) : null;
  }, [teams, isCrisis]);

  const otherCrisisJudgeUsername = user.username === 'juez_sala_f1' ? 'juez_sala_f2' : 'juez_sala_f1';
  const otherCrisisJudgeLabel = user.username === 'juez_sala_f1' ? 'Juez F2' : 'Juez F1';

  const isCrisisSubmittedByMe = useMemo(() => {
    if (!isCrisis || !currentCrisisTeam) return false;
    return isCrisisJudgeSubmittedForTeam(currentCrisisTeam, user.username);
  }, [isCrisis, currentCrisisTeam, user.username]);

  const isCrisisSubmittedByOther = useMemo(() => {
    if (!isCrisis || !currentCrisisTeam) return false;
    return isCrisisJudgeSubmittedForTeam(currentCrisisTeam, otherCrisisJudgeUsername);
  }, [isCrisis, currentCrisisTeam, otherCrisisJudgeUsername]);

  // Authoritative Available Teams & Progress derived dynamically from team.judgeEvaluations & station assignment
  const availableTeams = useMemo(() => {
    return getAvailableTeams(teams, user);
  }, [teams, user]);

  const totalAssigned = useMemo(() => {
    return getTotalAssignedTeamsCount(user, teams);
  }, [user, teams]);

  const evaluatedCount = useMemo(() => {
    return getEvaluatedTeamsCount(teams, user);
  }, [teams, user]);

  const progressPercent = totalAssigned === 0 ? 0 : Math.min(100, Math.max(0, Math.round((evaluatedCount / totalAssigned) * 100)));

  // Evaluation Form State - Automatically defaults to first available team (or current crisis team)
  const [selectedTeamId, setSelectedTeamId] = useState<number>(() => {
    if (isCrisis) {
      const crisisTeam = getCurrentCrisisTeam(teams);
      return crisisTeam ? crisisTeam.id : 1;
    }
    const firstAvailable = getNextAvailableTeam(teams, user);
    return firstAvailable ? firstAvailable.id : (teams[0]?.id || 1);
  });

  const [points, setPoints] = useState<number>(0);
  const [escapeChallenge, setEscapeChallenge] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ show: boolean; msg: string; teamName: string } | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Teams Tab Filter
  const [teamListSearch, setTeamListSearch] = useState<string>('');
  const [teamListFilter, setTeamListFilter] = useState<'all' | 'morning' | 'afternoon' | 'pending' | 'completed'>('all');

  // Leaderboard Tab Filter
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'morning' | 'afternoon' | 'break'>('all');
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>('');

  const maxPoints = user.maxPoints || (user.stationType === 'debate' ? 50 : 25);
  const stationKey = (user.stationKey || 'sala_b') as StationKey;

  // Station Icon
  const StationIcon = useMemo(() => {
    if (user.stationType === 'oratoria') return Key;
    if (user.stationType === 'crisis') return Award;
    return Shield;
  }, [user.stationType]);

  // Current Team (For Crisis: strictly currentCrisisTeam; for others: selectedTeamId within available teams)
  const currentTeam = useMemo(() => {
    if (isCrisis) {
      return currentCrisisTeam || teams.find((t) => t.id === selectedTeamId) || teams[0];
    }
    if (availableTeams.length > 0) {
      const found = availableTeams.find((t) => t.id === selectedTeamId);
      return found || availableTeams[0];
    }
    return teams.find((t) => t.id === selectedTeamId) || teams[0];
  }, [isCrisis, currentCrisisTeam, teams, availableTeams, selectedTeamId]);

  // Existing evaluation strictly for THIS judge (Data Isolation)
  const existingJudgeEval = useMemo(() => {
    return currentTeam?.judgeEvaluations?.[user.username];
  }, [currentTeam, user.username]);

  // Defensive Check: check if team already has a submitted evaluation in a different debate station
  const conflictingDebateJudge = useMemo(() => {
    if (user.stationType !== 'debate') return null;
    const evals = currentTeam?.judgeEvaluations || {};
    const otherDebateUsername = ['juez_sala_b', 'juez_sala_c', 'juez_sala_d', 'juez_sala_e'].find(
      (dj) => dj !== user.username && evals[dj]?.isSubmitted
    );
    if (otherDebateUsername) {
      return evals[otherDebateUsername];
    }
    return null;
  }, [user.stationType, user.username, currentTeam]);

  // Invalidate and clear drafts when database is reset
  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdates((eventType) => {
      if (eventType === 'DATABASE_RESET') {
        setPoints(0);
        setEscapeChallenge(false);
        setNotes('');
        setValidationError(null);
        if (isCrisis) {
          const firstCrisis = getCurrentCrisisTeam(teams);
          setSelectedTeamId(firstCrisis ? firstCrisis.id : 1);
        } else {
          const firstAvailable = getNextAvailableTeam(teams, user);
          setSelectedTeamId(firstAvailable ? firstAvailable.id : 1);
        }
      }
    });
    return () => unsubscribe();
  }, [teams, user, isCrisis]);

  // Keep Sala F strictly locked to the current synchronized crisis team
  useEffect(() => {
    if (isCrisis) {
      if (currentCrisisTeam && selectedTeamId !== currentCrisisTeam.id) {
        setSelectedTeamId(currentCrisisTeam.id);
        setPoints(0);
        setEscapeChallenge(false);
        setNotes('');
        setValidationError(null);
      }
    }
  }, [isCrisis, currentCrisisTeam, selectedTeamId]);

  // Automatically validate and synchronize selection when teams update (multi-tab / concurrent submit for non-Crisis)
  useEffect(() => {
    if (isCrisis) return;

    if (availableTeams.length === 0) {
      return;
    }

    // Check if the current selected team is still in available teams
    const isCurrentAvailable = availableTeams.some((t) => t.id === selectedTeamId);
    if (!isCurrentAvailable) {
      // Current team became unavailable (e.g. submitted by another judge in debate or just saved)
      const nextAvailable = getNextAvailableTeam(teams, user, selectedTeamId);
      const newTeamId = nextAvailable ? nextAvailable.id : availableTeams[0].id;
      setSelectedTeamId(newTeamId);
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
      setValidationError(null);
    }
  }, [teams, user, selectedTeamId, availableTeams, isCrisis]);

  // Load existing values when team changes
  useEffect(() => {
    if (existingJudgeEval && existingJudgeEval.isSubmitted) {
      setPoints(existingJudgeEval.points);
      setEscapeChallenge(existingJudgeEval.escapeChallenge);
      setNotes(existingJudgeEval.notes || '');
    } else {
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
    }
    setValidationError(null);
  }, [selectedTeamId, existingJudgeEval]);

  // Filtered teams for autocomplete dropdown in Tab 1 - SHOWS ONLY AVAILABLE TEAMS
  const filteredTeamsDropdown = useMemo(() => {
    if (!teamSearchQuery.trim()) return availableTeams;
    const query = teamSearchQuery.toLowerCase();
    return availableTeams.filter(
      (t) =>
        t.id.toString().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.members.some((m) => m.toLowerCase().includes(query))
    );
  }, [availableTeams, teamSearchQuery]);

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
    } else if (num > maxPoints) {
      setPoints(maxPoints);
      setValidationError(`Puntuación máxima permitida para tu estación es de ${maxPoints} pts.`);
    } else {
      setPoints(Math.round(num * 10) / 10); // 1 decimal max
      setValidationError(null);
    }
  };

  // Submit evaluation form
  const handleSubmit = (e: React.FormEvent, autoAdvance = true) => {
    e.preventDefault();

    if (isCrisis) {
      if (!currentCrisisTeam) {
        setValidationError('Todas las delegaciones en Sala F han sido evaluadas.');
        return;
      }
      if (currentTeam.id !== currentCrisisTeam.id) {
        setSelectedTeamId(currentCrisisTeam.id);
        setValidationError(`La evaluación de Sala F es sincronizada. El equipo actual en exposición es el Equipo #${currentCrisisTeam.id}.`);
        return;
      }
      if (isCrisisSubmittedByMe) {
        setValidationError(`Ya has guardado tu evaluación para el Equipo #${currentCrisisTeam.id}. Esperando al otro juez.`);
        return;
      }
    } else if (!currentTeam || !isTeamAvailableForJudge(currentTeam, user)) {
      const next = getNextAvailableTeam(teams, user, selectedTeamId);
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
      setValidationError('Este equipo ya no está disponible para evaluar. Se ha seleccionado el siguiente equipo disponible.');
      if (next) setSelectedTeamId(next.id);
      return;
    }

    if (conflictingDebateJudge) {
      const next = getNextAvailableTeam(teams, user, selectedTeamId);
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
      setValidationError(
        `Conflicto de integridad: Este equipo ya cuenta con una evaluación de debate enviada en ${conflictingDebateJudge.stationKey.toUpperCase()} por ${conflictingDebateJudge.judgeUsername}. Avanzando al siguiente equipo disponible.`
      );
      if (next) setSelectedTeamId(next.id);
      return;
    }

    if (points < 0 || points > maxPoints) {
      setValidationError(`Ingresa un puntaje válido entre 0 y ${maxPoints}.`);
      return;
    }

    const evaluation: JudgeEvaluation = {
      judgeUsername: user.username,
      stationKey,
      points,
      escapeChallenge,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      isSubmitted: true,
    };

    const validation = validateJudgeEvaluation(evaluation, user);
    if (!validation.valid || !validation.data) {
      setValidationError(`Error de validación: ${validation.error}`);
      return;
    }

    const teamIdBeingSubmitted = currentTeam.id;
    const teamNameBeingSubmitted = currentTeam.name;

    try {
      onSaveEvaluation(teamIdBeingSubmitted, validation.data);

      setSuccessToast({
        show: true,
        msg: `¡Calificación de ${points}/${maxPoints} pts guardada con éxito para el Equipo #${teamIdBeingSubmitted}!`,
        teamName: teamNameBeingSubmitted,
      });

      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);

      // Reset local inputs
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
      setValidationError(null);

      if (!isCrisis) {
        // Determine next available team from remaining available teams
        const remainingAvailable = availableTeams.filter((t) => t.id !== teamIdBeingSubmitted);
        const nextHigher = remainingAvailable.find((t) => t.id > teamIdBeingSubmitted);
        const nextTeam = nextHigher || remainingAvailable[0] || null;

        if (nextTeam) {
          setSelectedTeamId(nextTeam.id);
        }
      }
    } catch (err: any) {
      const next = getNextAvailableTeam(teams, user, selectedTeamId);
      setPoints(0);
      setEscapeChallenge(false);
      setNotes('');
      setValidationError(err?.message || 'Error al guardar la evaluación. El equipo ya no está disponible.');
      if (next) setSelectedTeamId(next.id);
    }
  };

  // Teams tab filtered list
  const filteredTeamsList = useMemo(() => {
    const baseList = isSalaA ? getAssignedTeams(teams, user) : teams;
    return baseList.filter((team) => {
      const isEval = !!team.judgeEvaluations?.[user.username]?.isSubmitted;
      const isAvail = isTeamAvailableForJudge(team, user);

      // Filter by status/wave
      if (teamListFilter === 'morning' && team.wave !== 'morning') return false;
      if (teamListFilter === 'afternoon' && team.wave !== 'afternoon') return false;
      if (teamListFilter === 'pending' && !isAvail) return false;
      if (teamListFilter === 'completed' && !isEval) return false;

      // Filter by search
      if (teamListSearch.trim()) {
        const q = teamListSearch.toLowerCase();
        return (
          team.id.toString().includes(q) ||
          team.name.toLowerCase().includes(q) ||
          team.members.some((m) => m.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [teams, teamListFilter, teamListSearch, user, isSalaA]);

  // Leaderboard tab filtered list
  const filteredLeaderboard = useMemo(() => {
    let list = [...teams].sort((a, b) => a.rank - b.rank);

    if (leaderboardFilter === 'morning') {
      list = list.filter((t) => t.wave === 'morning');
    } else if (leaderboardFilter === 'afternoon') {
      list = list.filter((t) => t.wave === 'afternoon');
    } else if (leaderboardFilter === 'break') {
      list = list.filter((t) => t.isBreakQualified);
    }

    if (leaderboardSearch.trim()) {
      const q = leaderboardSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toString().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.members.some((m) => m.toLowerCase().includes(q))
      );
    }

    return list;
  }, [teams, leaderboardFilter, leaderboardSearch]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 font-['Plus_Jakarta_Sans']">
      {/* Success Toast */}
      {successToast && (
        <div
          id="judge-eval-toast"
          className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-white flex items-center gap-3 animate-fade-in"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <div>
            <p className="font-extrabold text-sm sm:text-base">{successToast.msg}</p>
            <p className="text-xs text-emerald-100">{successToast.teamName}</p>
          </div>
        </div>
      )}

      {/* Top Station Info Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-[#991B1B] rounded-xl border border-red-100 shrink-0">
            <StationIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Cabinet_Grotesk'] tracking-tight">
              {(user.stationName || user.name).replace(/\s*1v1\b/gi, '')}
            </h2>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:text-right min-w-[200px]">
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold text-slate-700">
            <span>{isSalaA ? 'Progreso Asignado:' : 'Progreso de Evaluación:'}</span>
            <span className="text-[#991B1B] font-mono text-sm">{evaluatedCount}/{totalAssigned} Equipos</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-[#991B1B] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Main Tabs Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300">
        <button
          type="button"
          id="judge-tab-eval"
          onClick={() => setActiveTab('eval')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'eval'
              ? 'bg-white text-[#991B1B] shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>1. Formulario de Evaluación</span>
        </button>

        <button
          type="button"
          id="judge-tab-teams"
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-white text-[#991B1B] shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>2. Equipos a Evaluar ({evaluatedCount}/{totalAssigned})</span>
        </button>

        <button
          type="button"
          id="judge-tab-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-white text-[#991B1B] shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>3. Tabla General & Top 4</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EVALUATION FORM */}
      {/* ========================================================================= */}
      {activeTab === 'eval' && (
        <div className="space-y-6">
          {isCrisis ? (
            /* SALA F (CRISIS) SYNCHRONIZED WORKFLOW */
            !currentCrisisTeam ? (
              /* All Crisis Teams Completed (50/50) */
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Cabinet_Grotesk'] tracking-tight">
                  ¡Evaluaciones de Crisis Completadas!
                </h3>
                <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mt-2">
                  Todas las 50 delegaciones han completado su exposición en Sala F y cuentan con la calificación de ambos jueces (Juez F1 y Juez F2).
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700">
                  <span>Progreso Sala F:</span>
                  <span className="text-[#991B1B] font-mono font-black">50/50 Equipos (100%)</span>
                </div>
              </div>
            ) : isCrisisSubmittedByMe ? (
              /* Waiting State for Completed Crisis Judge */
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 text-center shadow-xs space-y-6">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                    EVALUACIÓN REGISTRADA &bull; SALA F SINCRONIZADA
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Cabinet_Grotesk'] tracking-tight">
                    Esperando al otro juez para avanzar
                  </h3>
                  <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto">
                    Has calificado exitosamente al <strong className="text-slate-900">Equipo #{currentCrisisTeam.id} - {currentCrisisTeam.name}</strong> con <strong className="text-[#991B1B]">{currentCrisisTeam.judgeEvaluations?.[user.username]?.points} pts</strong>.
                  </p>
                </div>

                {/* Both Judges Status Cards */}
                <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-left">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tu Evaluación ({user.name.split(' ')[0]})</span>
                    </div>
                    <p className="text-xs text-emerald-700 mt-1.5 font-mono font-black">
                      {currentCrisisTeam.judgeEvaluations?.[user.username]?.points} / {maxPoints} pts &bull; Registrado
                    </p>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                      <span>{otherCrisisJudgeLabel}</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1.5 font-medium">
                      Evaluando exposición...
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-lg mx-auto text-left flex items-start gap-3">
                  <Award className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                  <span>
                    <strong>Reglamento de Sala F:</strong> Cada equipo realiza una única exposición observada en simultáneo por ambos jueces de Crisis. Una vez que el {otherCrisisJudgeLabel} envíe su calificación, la aplicación avanzará automáticamente al siguiente equipo.
                  </span>
                </div>
              </div>
            ) : (
              /* Active Synchronized Evaluation Form for Current Crisis Team */
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#991B1B] via-[#8B1818] to-[#7F1D1D] text-white p-4 sm:p-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-200 bg-black/20 px-2 py-0.5 rounded">
                      SALA F SINCRONIZADA &bull; EXPOSICIÓN EN CURSO
                    </span>
                    <h3 className="text-xl font-black font-['Cabinet_Grotesk'] tracking-tight mt-1">
                      Calificar Delegación: Equipo #{currentCrisisTeam.id} - {currentCrisisTeam.name}
                    </h3>
                    <p className="text-xs text-red-100 font-medium">
                      {currentCrisisTeam.wave === 'morning' ? 'Oleada Mañana (1-25)' : 'Oleada Tarde (26-50)'} &bull; Integrantes: {currentCrisisTeam.members.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Crisis Synchronization Info Banner */}
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Equipo Actual en Exposición (Turno #{currentCrisisTeam.id} de 50)
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Progreso: {evaluatedCount}/50 Completados
                    </span>
                  </div>

                  <div className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-full bg-[#991B1B] text-white text-xs flex items-center justify-center font-black shrink-0">
                        {currentCrisisTeam.id}
                      </span>
                      <span className="truncate">{currentCrisisTeam.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                        currentCrisisTeam.wave === 'morning' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {currentCrisisTeam.wave === 'morning' ? 'Mañana' : 'Tarde'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                      Exposición Compartida
                    </span>
                  </div>

                  {isCrisisSubmittedByOther && (
                    <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        El <strong>{otherCrisisJudgeLabel}</strong> ya registró su evaluación para esta exposición. Ingresa tu calificación para completar al Equipo #{currentCrisisTeam.id} y avanzar juntos.
                      </span>
                    </div>
                  )}
                </div>

                {/* Evaluation Form */}
                <form onSubmit={(e) => handleSubmit(e, true)} className="p-4 sm:p-6 space-y-5">
                  {/* Scoring Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Puntuación Otorgada
                      </span>

                      {/* Central Score Display & Controls */}
                      <div className="flex items-center justify-center gap-3 sm:gap-5 my-1 w-full max-w-sm">
                        <button
                          type="button"
                          id="btn-judge-decrement-points"
                          onClick={() => handlePointsChange(Math.max(0, points - 0.5))}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                          aria-label="Disminuir puntuación"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        <div className="flex flex-col items-center justify-center min-w-[140px] px-2 py-0.5">
                          <div className="flex items-center justify-center w-full">
                            <input
                              id="judge-points-input"
                              type="number"
                              min="0"
                              max={maxPoints}
                              step="0.1"
                              value={points || ''}
                              onChange={(e) => handlePointsChange(e.target.value)}
                              placeholder="0"
                              className="w-24 text-center text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 bg-transparent border-b-2 border-[#991B1B] focus:outline-hidden pb-1"
                            />
                            <span className="text-xl sm:text-2xl font-black text-slate-400 font-mono ml-2">
                              /{maxPoints}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                            Puntos de Crisis
                          </span>
                        </div>

                        <button
                          type="button"
                          id="btn-judge-increment-points"
                          onClick={() => handlePointsChange(Math.min(maxPoints, points + 0.5))}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                          aria-label="Aumentar puntuación"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Quick Point Step Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md">
                        {[0, 5, 10, 15, 20, 25].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handlePointsChange(preset)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              points === preset
                                ? 'bg-[#991B1B] text-white shadow-xs scale-105'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {preset} pts
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Escape Challenge Toggle */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        escapeChallenge ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {escapeChallenge ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Reto de Escape / Candado</h4>
                        <p className="text-xs text-slate-600">
                          {escapeChallenge ? 'Reto superado con éxito por la delegación' : 'Reto no superado'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-escape-challenge"
                      onClick={() => setEscapeChallenge(!escapeChallenge)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        escapeChallenge
                          ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {escapeChallenge ? 'Superado' : 'No Superado'}
                    </button>
                  </div>

                  {/* Feedback / Notes */}
                  <div>
                    <label htmlFor="judge-evaluation-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Retroalimentación & Observaciones
                    </label>
                    <textarea
                      id="judge-evaluation-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Escribe comentarios cualitativos, fortalezas y áreas de mejora..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#991B1B] focus:bg-white resize-none"
                    />
                  </div>

                  {/* Validation Error Message */}
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn-judge-submit-evaluation"
                      className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar y Enviar Evaluación</span>
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : availableTeams.length === 0 ? (
            /* Clean Empty / All Completed State for non-Crisis */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Cabinet_Grotesk'] tracking-tight">
                ¡Evaluaciones Completadas!
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mt-2">
                {isSalaA
                  ? 'Todos los equipos asignados a tu estación han sido calificados.'
                  : 'Todas las evaluaciones disponibles para tu estación han sido completadas.'}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700">
                <span>Progreso de Sala:</span>
                <span className="text-[#991B1B] font-mono font-black">{evaluatedCount}/{totalAssigned} Equipos (100%)</span>
              </div>
            </div>
          ) : (
            /* Standard Evaluation Form for Sala A and Debate */
            <>
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#991B1B] via-[#8B1818] to-[#7F1D1D] text-white p-4 sm:p-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-200 bg-black/20 px-2 py-0.5 rounded">
                      EVALUACIÓN EN CURSO
                    </span>
                    <h3 className="text-xl font-black font-['Cabinet_Grotesk'] tracking-tight mt-1">
                      Calificar Delegación: Equipo #{currentTeam.id} - {currentTeam.name}
                    </h3>
                    <p className="text-xs text-red-100 font-medium">
                      {currentTeam.wave === 'morning' ? 'Oleada Mañana (1-25)' : 'Oleada Tarde (26-50)'} &bull; Integrantes: {currentTeam.members.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Team Autocomplete Selector - SHOWS ONLY AVAILABLE TEAMS */}
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
                  <label htmlFor="select-team-trigger" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Equipos Disponibles para Evaluar ({availableTeams.length}) *
                  </label>
                  <div className="relative">
                    <div
                      id="select-team-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-white border border-slate-300 hover:border-[#991B1B] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 flex items-center justify-between cursor-pointer shadow-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
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

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#991B1B] rounded-xl shadow-xl z-50 max-h-72 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-slate-200 bg-slate-50">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              id="team-search-dropdown"
                              type="text"
                              autoFocus
                              value={teamSearchQuery}
                              onChange={(e) => setTeamSearchQuery(e.target.value)}
                              placeholder="Buscar en equipos disponibles..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
                            />
                          </div>
                        </div>

                        <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                          {filteredTeamsDropdown.map((team) => {
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
                                  team.id === currentTeam.id ? 'bg-red-100/70 font-black text-red-950' : 'text-slate-800'
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
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    Disponible
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={(e) => handleSubmit(e, true)} className="p-4 sm:p-6 space-y-5">
                  {conflictingDebateJudge && (
                    <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-black text-amber-950">Equipo ya evaluado en otra Sala de Debate</strong>
                        <span>
                          Este equipo ya cuenta con una evaluación de debate enviada en la estación{' '}
                          <strong>{conflictingDebateJudge.stationKey.toUpperCase()}</strong> ({conflictingDebateJudge.judgeUsername}).
                          Por reglamento, cada equipo solo puede tener una sala de debate activa.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scoring Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Puntuación Otorgada
                      </span>

                      {/* Central Score Display & Controls */}
                      <div className="flex items-center justify-center gap-3 sm:gap-5 my-1 w-full max-w-sm">
                        <button
                          type="button"
                          id="btn-judge-decrement-points"
                          onClick={() => handlePointsChange(Math.max(0, points - 0.5))}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                          aria-label="Disminuir puntuación"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        <div className="flex flex-col items-center justify-center min-w-[140px] px-2 py-0.5">
                          <div className="flex items-center justify-center w-full">
                            <input
                              id="judge-points-input"
                              type="number"
                              min="0"
                              max={maxPoints}
                              step="0.1"
                              value={points || ''}
                              onChange={(e) => handlePointsChange(e.target.value)}
                              placeholder="0"
                              className="w-24 text-center text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 bg-transparent border-b-2 border-[#991B1B] focus:outline-hidden pb-1"
                            />
                            <span className="text-xl sm:text-2xl font-black text-slate-400 font-mono ml-2">
                              /{maxPoints}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                            Puntos de Estación
                          </span>
                        </div>

                        <button
                          type="button"
                          id="btn-judge-increment-points"
                          onClick={() => handlePointsChange(Math.min(maxPoints, points + 0.5))}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 font-bold transition-all flex items-center justify-center shadow-2xs shrink-0 cursor-pointer select-none"
                          aria-label="Aumentar puntuación"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Quick Point Step Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md">
                        {(maxPoints === 50 ? [0, 10, 20, 30, 40, 50] : [0, 5, 10, 15, 20, 25]).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handlePointsChange(preset)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              points === preset
                                ? 'bg-[#991B1B] text-white shadow-xs scale-105'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {preset} pts
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Escape Challenge Toggle */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        escapeChallenge ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {escapeChallenge ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Reto de Escape / Candado</h4>
                        <p className="text-xs text-slate-600">
                          {escapeChallenge ? 'Reto superado con éxito por la delegación' : 'Reto no superado'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-toggle-escape-challenge"
                      onClick={() => setEscapeChallenge(!escapeChallenge)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        escapeChallenge
                          ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {escapeChallenge ? 'Superado' : 'No Superado'}
                    </button>
                  </div>

                  {/* Feedback / Notes */}
                  <div>
                    <label htmlFor="judge-evaluation-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Retroalimentación & Observaciones
                    </label>
                    <textarea
                      id="judge-evaluation-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Escribe comentarios cualitativos, fortalezas y áreas de mejora..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#991B1B] focus:bg-white resize-none"
                    />
                  </div>

                  {/* Validation Error Message */}
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn-judge-submit-evaluation"
                      className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar y Enviar Evaluación</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Available Teams Grid for standard rooms */}
              {!isCrisis && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isSalaA ? 'Tus Equipos Asignados Pendientes' : 'Equipos Disponibles para tu Estación'} ({availableTeams.length})
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Seleccionado: <strong className="text-[#991B1B]">Equipo #{currentTeam.id}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                    {availableTeams.map((t) => {
                      const isSelected = t.id === currentTeam.id;

                      return (
                        <button
                          key={t.id}
                          type="button"
                          id={`grid-team-btn-${t.id}`}
                          onClick={() => {
                            setSelectedTeamId(t.id);
                            setValidationError(null);
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center border cursor-pointer ${
                            isSelected
                              ? 'bg-[#991B1B] text-white border-[#7F1D1D] shadow-xs scale-105'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-[#991B1B]/40 hover:bg-slate-50'
                          }`}
                          title={`${t.name} (${t.wave === 'morning' ? 'Mañana' : 'Tarde'})`}
                        >
                          <span>#{t.id}</span>
                          <span className="text-[9px] font-semibold opacity-75">
                            {t.wave === 'morning' ? 'M' : 'T'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EQUIPOS A EVALUAR */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                id="team-list-search-input"
                value={teamListSearch}
                onChange={(e) => setTeamListSearch(e.target.value)}
                placeholder="Buscar por número o nombre de equipo..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B] focus:bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: isSalaA ? `Mis Asignados (${totalAssigned})` : 'Todos (50)' },
                { id: 'pending', label: `Pendientes (${availableTeams.length})` },
                { id: 'completed', label: `Calificados (${evaluatedCount})` },
                { id: 'morning', label: isSalaA ? (user.stationKey === 'sala_a1' ? 'Mañana (13)' : 'Mañana (12)') : 'Mañana (1-25)' },
                { id: 'afternoon', label: isSalaA ? (user.stationKey === 'sala_a1' ? 'Tarde (13)' : 'Tarde (12)') : 'Tarde (26-50)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  id={`filter-teams-${f.id}`}
                  onClick={() => setTeamListFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    teamListFilter === f.id
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teams Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTeamsList.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No se encontraron equipos con el filtro seleccionado.
              </div>
            ) : (
              filteredTeamsList.map((team) => {
                const evalData = team.judgeEvaluations?.[user.username];
                const isEval = !!evalData?.isSubmitted;
                const isAvail = isTeamAvailableForJudge(team, user);

                // Sala F specific statuses
                const isCrisisComplete = isCrisis && isCrisisTeamFullyEvaluated(team);
                const isCrisisCurrent = isCrisis && currentCrisisTeam?.id === team.id;
                const otherEval = isCrisis ? team.judgeEvaluations?.[otherCrisisJudgeUsername] : null;

                return (
                  <div
                    key={team.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                      isCrisisComplete
                        ? 'border-emerald-200 hover:border-emerald-400'
                        : isCrisisCurrent
                        ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                        : isEval 
                        ? 'border-emerald-200 hover:border-emerald-400' 
                        : isAvail 
                        ? 'border-slate-200 hover:border-[#991B1B]/40'
                        : 'border-slate-200 bg-slate-50/70 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                            #{team.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              team.wave === 'morning' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {team.wave === 'morning' ? 'Mañana' : 'Tarde'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCrisis ? (
                          isCrisisComplete ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ambos Jueces (100%)
                            </span>
                          ) : isCrisisCurrent ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En Exposición Actual
                            </span>
                          ) : isEval ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {evalData.points} / {maxPoints} pts
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                              Turno #{team.id}
                            </span>
                          )
                        ) : isEval ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {evalData.points} / {maxPoints} pts
                          </span>
                        ) : isAvail ? (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            Disponible
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                            Evaluado en otra sala
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 mt-2 font-['Cabinet_Grotesk'] leading-tight">
                        {team.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {team.members && team.members.length > 0 ? team.members.join(', ') : 'Sin integrantes asignados'}
                      </p>

                      {/* Crisis details */}
                      {isCrisis ? (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                          <div className="flex items-center justify-between">
                            <span>Tu Evaluación:</span>
                            <span className="font-bold">
                              {evalData?.isSubmitted ? `✅ ${evalData.points} pts` : '⏳ Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{otherCrisisJudgeLabel}:</span>
                            <span className="font-bold">
                              {otherEval?.isSubmitted ? `✅ ${otherEval.points} pts` : '⏳ Pendiente'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        isEval && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                            <span>Candado: {evalData.escapeChallenge ? '🔓 Superado' : '🔒 No superado'}</span>
                            <span className="text-slate-400">{evalData.timestamp}</span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-3 pt-2">
                      {isCrisis ? (
                        isCrisisCurrent ? (
                          isEval ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab('eval')}
                              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Esperando a {otherCrisisJudgeLabel}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              id={`btn-eval-team-${team.id}`}
                              onClick={() => {
                                setSelectedTeamId(team.id);
                                setActiveTab('eval');
                              }}
                              className="w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-xs"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Calificar Exposición Actual</span>
                            </button>
                          )
                        ) : isCrisisComplete ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completado</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <span>Turno en Espera</span>
                          </button>
                        )
                      ) : isAvail ? (
                        <button
                          type="button"
                          id={`btn-eval-team-${team.id}`}
                          onClick={() => {
                            setSelectedTeamId(team.id);
                            setActiveTab('eval');
                          }}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Calificar Equipo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Evaluado</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TABLA GENERAL & TOP 4 */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 font-['Cabinet_Grotesk']">
                Tabla General Acumulada (Live Tab)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Puntajes globales consolidados y ranking oficial del torneo.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'Global (50)' },
                { id: 'break', label: '⭐ TOP 4 BREAK' },
                { id: 'morning', label: 'Oleada Mañana (1-25)' },
                { id: 'afternoon', label: 'Oleada Tarde (26-50)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  id={`filter-lead-${f.id}`}
                  onClick={() => setLeaderboardFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    leaderboardFilter === f.id
                      ? 'bg-[#991B1B] text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3">Pos.</th>
                    <th className="py-3 px-3">Equipo</th>
                    <th className="py-3 px-3">Oleada</th>
                    <th className="py-3 px-3 text-center">Sala A (25p)</th>
                    <th className="py-3 px-3 text-center">Salas B-E (50p)</th>
                    <th className="py-3 px-3 text-center">Sala F (25p)</th>
                    <th className="py-3 px-3 text-center">Candados</th>
                    <th className="py-3 px-3 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLeaderboard.map((team) => {
                    const isBreak = team.isBreakQualified;
                    return (
                      <tr
                        key={team.id}
                        onClick={() => onOpenTeamDetail && onOpenTeamDetail(team)}
                        className={`hover:bg-red-50/50 transition-colors cursor-pointer ${
                          isBreak ? 'bg-amber-50/60 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span
                            className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                              isBreak ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            #{team.rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{team.name}</span>
                            {isBreak && (
                              <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                                BREAK
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">#{team.id}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              team.wave === 'morning' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {team.wave === 'morning' ? 'Mañana' : 'Tarde'} (#{team.waveRank})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {team.scores.salaA.isSubmitted ? team.scores.salaA.oratoriaPoints : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {team.scores.salaBE.isSubmitted ? team.scores.salaBE.debatePoints : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {team.scores.salaF.isSubmitted ? team.scores.salaF.crisisPoints : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold font-mono text-slate-700">
                            {team.locksPassed}/3
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-sm font-black font-mono text-[#991B1B]">
                            {team.totalScore}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono"> / 100</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
