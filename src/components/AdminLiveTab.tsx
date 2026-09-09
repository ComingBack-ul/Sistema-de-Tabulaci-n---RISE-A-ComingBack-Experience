import React, { useState, useMemo } from 'react';
import { Team } from '../types';
import { 
  Trophy, 
  Search, 
  Filter, 
  Key, 
  Shield, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Eye, 
  FileSpreadsheet, 
  Layers, 
  ArrowUpDown,
  Lock,
  Unlock,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';

interface AdminLiveTabProps {
  teams: Team[];
  onSelectTeamDetail: (team: Team) => void;
  onExportCSV: () => void;
  onOpenJudgeForTeam: (teamId: number) => void;
  onResetDatabase?: () => void;
}

type TabFilter = 'all' | 'morning' | 'afternoon' | 'break' | 'completed' | 'pending';

export const AdminLiveTab: React.FC<AdminLiveTabProps> = ({
  teams,
  onSelectTeamDetail,
  onExportCSV,
  onOpenJudgeForTeam,
  onResetDatabase
}) => {
  const [filter, setFilter] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'teamId' | 'salaA' | 'salaBE' | 'salaF' | 'locks'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);

  // Computed summary metrics
  const stats = useMemo(() => {
    let totalScoreSum = 0;
    let completedTeams = 0;
    let totalLocksSum = 0;
    let evaluatedRoomsCount = 0;

    teams.forEach((t) => {
      totalScoreSum += t.totalScore;
      totalLocksSum += t.locksPassed;
      if (t.allRoomsCompleted) completedTeams++;
      if (t.scores.salaA.isSubmitted) evaluatedRoomsCount++;
      if (t.scores.salaBE.isSubmitted) evaluatedRoomsCount++;
      if (t.scores.salaF.isSubmitted) evaluatedRoomsCount++;
    });

    const averageScore = teams.length > 0 ? (totalScoreSum / teams.length).toFixed(1) : '0';
    const progressPercent = Math.round((evaluatedRoomsCount / (50 * 3)) * 100);

    return {
      averageScore,
      completedTeams,
      totalLocksSum,
      evaluatedRoomsCount,
      progressPercent
    };
  }, [teams]);

  // Filtered & Sorted teams
  const displayTeams = useMemo(() => {
    let list = [...teams];

    // Filter by category
    if (filter === 'morning') {
      list = list.filter((t) => t.wave === 'morning');
    } else if (filter === 'afternoon') {
      list = list.filter((t) => t.wave === 'afternoon');
    } else if (filter === 'break') {
      list = list.filter((t) => t.isBreakQualified);
    } else if (filter === 'completed') {
      list = list.filter((t) => t.allRoomsCompleted);
    } else if (filter === 'pending') {
      list = list.filter((t) => !t.allRoomsCompleted);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toString().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.members.some((m) => m.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'rank') {
        comparison = a.rank - b.rank;
      } else if (sortBy === 'teamId') {
        comparison = a.id - b.id;
      } else if (sortBy === 'salaA') {
        comparison = (b.scores.salaA.oratoriaPoints || 0) - (a.scores.salaA.oratoriaPoints || 0);
      } else if (sortBy === 'salaBE') {
        comparison = (b.scores.salaBE.debatePoints || 0) - (a.scores.salaBE.debatePoints || 0);
      } else if (sortBy === 'salaF') {
        comparison = (b.scores.salaF.crisisPoints || 0) - (a.scores.salaF.crisisPoints || 0);
      } else if (sortBy === 'locks') {
        comparison = b.locksPassed - a.locksPassed;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [teams, filter, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: 'rank' | 'teamId' | 'salaA' | 'salaBE' | 'salaF' | 'locks') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Top 2 of morning and Top 2 of afternoon for quick preview
  const topMorning = useMemo(() => {
    return teams
      .filter((t) => t.wave === 'morning')
      .sort((a, b) => a.waveRank - b.waveRank)
      .slice(0, 2);
  }, [teams]);

  const topAfternoon = useMemo(() => {
    return teams
      .filter((t) => t.wave === 'afternoon')
      .sort((a, b) => a.waveRank - b.waveRank)
      .slice(0, 2);
  }, [teams]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Top Banner / Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Progreso Global</span>
            <Flame className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {stats.progressPercent}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.evaluatedRoomsCount}/150 salas)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#991B1B] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Puntaje Promedio</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#991B1B] font-mono">
              {stats.averageScore}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100 pts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Escala total acumulada</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Equipos 3/3 Listos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {stats.completedTeams}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 50 equipos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Con las 3 salas tabuladas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Candados Escape Room</span>
            <Key className="w-4 h-4 text-[#991B1B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {stats.totalLocksSum}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 150 candados</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Claves, códigos y sellos</p>
        </div>
      </div>

      {/* TOP 4 - CLASIFICADOS AL BREAK BANNER */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white rounded-xl p-4 sm:p-5 shadow-sm border border-red-900 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FCD34D] text-[#7F1D1D] rounded-lg shadow-xs">
              <Trophy className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase font-['Cabinet_Grotesk']">
                  CUADRO PROVISIONAL DE BREAK (TOP 4)
                </h3>
                <span className="bg-[#FCD34D] text-[#7F1D1D] text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  2:25 PM REVEAL
                </span>
              </div>
              <p className="text-xs text-red-100">
                Clasifican los <strong>2 Mejores de la Mañana (#1-25)</strong> y los <strong>2 Mejores de la Tarde (#26-50)</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-filter-break-shortcut"
            onClick={() => setFilter('break')}
            className="px-3 py-1.5 bg-white text-[#991B1B] rounded-lg text-xs font-extrabold hover:bg-red-50 transition-colors shadow-xs cursor-pointer"
          >
            Filtrar Solo Top 4
          </button>
        </div>

        {stats.evaluatedRoomsCount === 0 ? (
          <div className="bg-black/30 border border-white/15 rounded-lg p-4 text-center">
            <p className="text-xs sm:text-sm font-bold text-amber-300">
              ⚡ Torneo en Estado Inicial Cero (0 Calificaciones Registradas)
            </p>
            <p className="text-[11px] text-red-200 mt-1">
              Las 4 delegaciones clasificatorias al Break se tabularán en tiempo real automáticamente conforme los 8 jueces envíen sus evaluaciones oficiales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Morning Wave Top 2 */}
            <div className="bg-black/25 border border-white/15 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 border-b border-white/10 pb-1.5">
                <span>🌅 OLEADA MAÑANA (Equipos 1-25)</span>
                <span className="text-[10px] uppercase bg-amber-400/20 px-2 py-0.5 rounded">Top 2 Clasificados</span>
              </div>
              {topMorning.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTeamDetail(t)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-[#FCD34D] text-[#7F1D1D]' : 'bg-slate-200 text-slate-900'
                    }`}>
                      {t.waveRank}º
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-xs sm:text-sm text-white truncate">
                        #{t.id} {t.name}
                      </p>
                      <p className="text-[10px] text-red-200">
                        Debate: {t.scores.salaBE.debatePoints}p | Crisis: {t.scores.salaF.crisisPoints}p
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                      {t.totalScore} pts
                    </span>
                    <span className="block text-[9px] text-emerald-300 font-bold">
                      {t.locksPassed}/3 Candados
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Afternoon Wave Top 2 */}
            <div className="bg-black/25 border border-white/15 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-300 border-b border-white/10 pb-1.5">
                <span>🌇 OLEADA TARDE (Equipos 26-50)</span>
                <span className="text-[10px] uppercase bg-blue-400/20 px-2 py-0.5 rounded">Top 2 Clasificados</span>
              </div>
              {topAfternoon.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTeamDetail(t)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-[#FCD34D] text-[#7F1D1D]' : 'bg-slate-200 text-slate-900'
                    }`}>
                      {t.waveRank}º
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-xs sm:text-sm text-white truncate">
                        #{t.id} {t.name}
                      </p>
                      <p className="text-[10px] text-red-200">
                        Debate: {t.scores.salaBE.debatePoints}p | Crisis: {t.scores.salaF.crisisPoints}p
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black text-blue-300 font-mono">
                      {t.totalScore} pts
                    </span>
                    <span className="block text-[9px] text-emerald-300 font-bold">
                      {t.locksPassed}/3 Candados
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters, Search, Export */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Filter Buttons / Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="filter-btn-all"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#991B1B] text-white border border-[#991B1B] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos (1-50)
            </button>

            <button
              type="button"
              id="filter-btn-morning"
              onClick={() => setFilter('morning')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'morning'
                  ? 'bg-[#991B1B] text-white border border-[#991B1B] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🌅 Mañana (1-25)
            </button>

            <button
              type="button"
              id="filter-btn-afternoon"
              onClick={() => setFilter('afternoon')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'afternoon'
                  ? 'bg-[#991B1B] text-white border border-[#991B1B] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              🌇 Tarde (26-50)
            </button>

            <button
              type="button"
              id="filter-btn-break"
              onClick={() => setFilter('break')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'break'
                  ? 'bg-[#991B1B] text-white border-2 border-[#FCD34D] shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>TOP 4 (BREAK)</span>
            </button>

            <button
              type="button"
              id="filter-btn-completed"
              onClick={() => setFilter('completed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-emerald-700 text-white border border-emerald-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              3/3 Listos
            </button>
          </div>

          {/* Export to CSV and Master Reset Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-csv-table"
              onClick={onExportCSV}
              className="bg-white border-1.5 border-[#991B1B] text-[#991B1B] hover:bg-red-50 active:bg-red-100 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#991B1B]" />
              <span>Exportar CSV</span>
            </button>

            {onResetDatabase && (
              <button
                type="button"
                id="btn-admin-master-reset"
                onClick={() => {
                  setShowResetModal(true);
                  setResetConfirmText('');
                }}
                className="bg-red-50 hover:bg-red-100 active:bg-red-200 border-1.5 border-red-300 text-red-800 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Purgar puntuaciones y reiniciar el torneo al Estado Cero"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-700" />
                <span>Reiniciar Base de Datos del Evento</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="admin-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número (#1-50), nombre de delegación o integrante..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]/20 outline-hidden font-medium"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-[#991B1B]">{displayTeams.length}</strong> de 50 equipos
          </div>
        </div>
      </div>

      {/* Main Tabulation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F1F5F9] text-slate-900 font-extrabold uppercase text-[11px] tracking-wider border-b-2 border-[#991B1B]">
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>RANK</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('teamId')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>EQUIPO</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 hidden md:table-cell">
                  OLEADA
                </th>
                <th
                  onClick={() => handleSort('salaA')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1" title="Sala A: Oratoria (Máx 25 pts)">
                    <span>SALA A (25)</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salaBE')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1" title="Salas B-E: Debate (Máx 50 pts) - 1er Desempate">
                    <span>SALA B-E (50)</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salaF')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1" title="Sala F: Crisis (Máx 25 pts) - 2do Desempate">
                    <span>SALA F (25)</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('locks')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center justify-center gap-1" title="Candados Escape Room Superados (0 a 3)">
                    <span>LOGROS / CANDADOS</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3 px-3 sm:px-4 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1 text-[#991B1B]">
                    <span>TOTAL (100)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#991B1B]" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTeams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No se encontraron equipos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                displayTeams.map((team) => {
                  const isTop4 = team.isBreakQualified;
                  const isMorning = team.wave === 'morning';

                  return (
                    <tr
                      key={team.id}
                      id={`team-row-${team.id}`}
                      className={`transition-colors hover:bg-[#FFF5F5] ${
                        isTop4 ? 'bg-red-50/50 font-medium' : 'bg-white'
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          {isTop4 ? (
                            <span className="badge-break-polish text-xs font-black rounded-full px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                              {team.rank}º
                            </span>
                          ) : (
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                team.rank <= 3
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {team.rank}º
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team ID and Name */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#991B1B]">
                              #{team.id}
                            </span>
                            <span className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
                              {team.name}
                            </span>
                          </div>
                          {team.members && team.members.length > 0 && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[220px] hidden sm:block">
                              {team.members.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wave */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isMorning ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {isMorning ? 'Mañana' : 'Tarde'}
                        </span>
                      </td>

                      {/* Sala A (Oratoria) */}
                      <td className="py-3 px-3 text-center font-mono">
                        {team.scores.salaA.isSubmitted ? (
                          <span className="font-bold text-slate-800">
                            {team.scores.salaA.oratoriaPoints}
                          </span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>

                      {/* Sala B-E (Debate) - 1st Tiebreaker */}
                      <td className="py-3 px-3 text-center font-mono">
                        {team.scores.salaBE.isSubmitted ? (
                          <span className="font-bold text-[#991B1B]">
                            {team.scores.salaBE.debatePoints}
                          </span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>

                      {/* Sala F (Crisis) - 2nd Tiebreaker */}
                      <td className="py-3 px-3 text-center font-mono">
                        {team.scores.salaF.isSubmitted ? (
                          <span className="font-bold text-slate-800">
                            {team.scores.salaF.crisisPoints}
                          </span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>

                      {/* Locks Count / Achievement Badges */}
                      <td className="py-3 px-3 text-center hidden sm:table-cell">
                        <div className="inline-flex items-center gap-1 font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold ${
                              team.scores.salaA.keywordSolved
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : 'bg-[#FEE2E2] text-[#991B1B]'
                            }`}
                            title={team.scores.salaA.keywordSolved ? 'Voz / Clave Superada' : 'No superado'}
                          >
                            VOZ
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold ${
                              team.scores.salaBE.codeDelivered
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : 'bg-[#FEE2E2] text-[#991B1B]'
                            }`}
                            title={team.scores.salaBE.codeDelivered ? 'Código de Seguridad Superado' : 'No superado'}
                          >
                            KEY
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold ${
                              team.scores.salaF.stampAwarded
                                ? 'bg-[#DCFCE7] text-[#166534]'
                                : 'bg-[#FEE2E2] text-[#991B1B]'
                            }`}
                            title={team.scores.salaF.stampAwarded ? 'Sello de Crisis Otorgado' : 'No superado'}
                          >
                            SELLO
                          </span>
                        </div>
                      </td>

                      {/* TOTAL SCORE */}
                      <td className="py-3 px-3 sm:px-4 text-right font-mono">
                        <span className="text-base sm:text-lg font-black text-[#991B1B]">
                          {team.totalScore}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            id={`btn-view-team-${team.id}`}
                            onClick={() => onSelectTeamDetail(team)}
                            title="Ver desglose y detalles del equipo"
                            className="p-1.5 text-slate-600 hover:text-[#991B1B] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Master Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-red-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#991B1B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base font-['Cabinet_Grotesk'] tracking-wide">
                    Confirmar Reinicio Maestro del Evento
                  </h3>
                  <p className="text-[11px] text-red-200">
                    Purga y vaciado de datos para Estado Cero (Zero State)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 space-y-1">
                  <p className="font-extrabold text-sm text-[#991B1B]">
                    ¿Estás seguro de borrar todas las puntuaciones reales?
                  </p>
                  <p>
                    Esta acción ejecutará una <strong>limpieza completa e irreversible</strong> de todas las calificaciones ingresadas:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-800">
                    <li>Todos los 50 equipos volverán a <strong>0.0 puntos acumulados</strong>.</li>
                    <li>Todos los 8 jueces volverán al estado <strong>"Pendiente de Calificar"</strong>.</li>
                    <li>Se borrarán notas, candados superados y registros de auditoría anteriores.</li>
                    <li>Las <strong>credenciales de acceso</strong> y la <strong>lista de 50 equipos</strong> se mantendrán 100% intactas.</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Para confirmar, escribe <span className="font-mono text-[#991B1B] font-black">REINICIAR</span> en el campo inferior:
                </label>
                <input
                  type="text"
                  id="input-reset-confirm-text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Escribe REINICIAR"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] font-mono outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-reset"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-master-reset"
                  disabled={resetConfirmText !== 'REINICIAR'}
                  onClick={() => {
                    if (onResetDatabase) {
                      onResetDatabase();
                    }
                    setShowResetModal(false);
                    setResetSuccessToast(true);
                    setTimeout(() => setResetSuccessToast(false), 4000);
                  }}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                    resetConfirmText === 'REINICIAR'
                      ? 'bg-[#991B1B] text-white hover:bg-[#7F1D1D] shadow-md cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sí, Purgar y Reiniciar Base de Datos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {resetSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <div>
            <p className="font-extrabold text-xs">¡Base de Datos Reiniciada!</p>
            <p className="text-[11px] text-emerald-100">El torneo está en Estado Cero listo para calificaciones en vivo.</p>
          </div>
        </div>
      )}
    </div>
  );
};
