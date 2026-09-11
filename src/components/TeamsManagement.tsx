import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Power, 
  Trash2, 
  Users, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Award, 
  Lock, 
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  X
} from 'lucide-react';
import { Team, AuthUser, CreateTeamDto, UpdateTeamDto, Wave, TeamStatus, StationKey } from '../types';
import { 
  createTeam, 
  updateTeam, 
  toggleTeamStatus, 
  deleteTeam, 
  hasTeamEvaluationHistory 
} from '../services/teamService';
import { TeamFormModal } from './admin/TeamFormModal';
import { DeleteConfirmationModal } from './admin/DeleteConfirmationModal';
import { TeamDetailModal } from './TeamDetailModal';
import { STATION_DEFINITIONS } from '../utils/stationConstants';

interface TeamsManagementProps {
  teams: Team[];
  currentUser: AuthUser;
  onTeamsUpdated: (updatedTeams: Team[]) => void;
  onOpenJudgeForTeam?: (teamId: number) => void;
}

export const TeamsManagement: React.FC<TeamsManagementProps> = ({
  teams,
  currentUser,
  onTeamsUpdated,
  onOpenJudgeForTeam,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [waveFilter, setWaveFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [stationFilter, setStationFilter] = useState<'all' | 'none' | StationKey>('all');
  const [evalFilter, setEvalFilter] = useState<'all' | 'evaluated' | 'pending'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const [detailTeam, setDetailTeam] = useState<Team | null>(null);

  // Status feedback message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => t.status !== 'inactive').length;
    const inactive = teams.filter((t) => t.status === 'inactive').length;
    const morning = teams.filter((t) => t.wave === 'morning').length;
    const afternoon = teams.filter((t) => t.wave === 'afternoon').length;
    const evaluated = teams.filter((t) => hasTeamEvaluationHistory(t)).length;

    return { total, active, inactive, morning, afternoon, evaluated };
  }, [teams]);

  // Filtered & Searched teams list
  const filteredTeams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return teams
      .filter((team) => {
        // Status filter
        if (statusFilter === 'active' && team.status === 'inactive') return false;
        if (statusFilter === 'inactive' && team.status !== 'inactive') return false;

        // Wave filter
        if (waveFilter !== 'all' && team.wave !== waveFilter) return false;

        // Station filter
        if (stationFilter === 'none' && team.currentStationKey) return false;
        if (stationFilter !== 'all' && stationFilter !== 'none' && team.currentStationKey !== stationFilter) return false;

        // Evaluation state filter
        const hasHistory = hasTeamEvaluationHistory(team);
        if (evalFilter === 'evaluated' && !hasHistory) return false;
        if (evalFilter === 'pending' && hasHistory) return false;

        // Search match
        if (term) {
          const idMatch = team.id.toString() === term || `#${team.id}` === term;
          const nameMatch = team.name.toLowerCase().includes(term);
          const memberMatch = (team.members || []).some((m) => m.toLowerCase().includes(term));
          return idMatch || nameMatch || memberMatch;
        }

        return true;
      })
      .sort((a, b) => a.id - b.id);
  }, [teams, searchTerm, statusFilter, waveFilter, stationFilter, evalFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleSaveTeam = (payload: CreateTeamDto | { id: number; dto: UpdateTeamDto }) => {
    if ('dto' in payload) {
      // Edit
      const result = updateTeam(payload.id, payload.dto, teams, currentUser);
      if (result.success && result.updatedTeams) {
        onTeamsUpdated(result.updatedTeams);
        showNotice('success', `Equipo #${payload.id} actualizado exitosamente.`);
        return { success: true };
      }
      return { success: false, error: result.error || 'Error al actualizar equipo.' };
    } else {
      // Create
      const result = createTeam(payload, teams, currentUser);
      if (result.success && result.updatedTeams) {
        onTeamsUpdated(result.updatedTeams);
        showNotice('success', `Equipo #${payload.id} (${payload.name}) registrado correctamente.`);
        return { success: true };
      }
      return { success: false, error: result.error || 'Error al crear equipo.' };
    }
  };

  const handleToggleStatus = (team: Team) => {
    const result = toggleTeamStatus(team.id, teams, currentUser);
    if (result.success && result.updatedTeams) {
      onTeamsUpdated(result.updatedTeams);
      showNotice(
        'success',
        `Equipo #${team.id} (${team.name}) marcado como ${result.newStatus === 'active' ? 'ACTIVO' : 'INACTIVO'}.`
      );
    } else {
      showNotice('error', result.error || 'No se pudo cambiar el estado del equipo.');
    }
  };

  const handleQuickStationChange = (teamId: number, newStation: StationKey | null) => {
    const result = updateTeam(teamId, { currentStationKey: newStation }, teams, currentUser);
    if (result.success && result.updatedTeams) {
      onTeamsUpdated(result.updatedTeams);
      const stationLabel = newStation ? STATION_DEFINITIONS[newStation]?.label || newStation.toUpperCase() : 'Sin estación';
      showNotice('success', `Estación de #${teamId} cambiada a: ${stationLabel}`);
    } else {
      showNotice('error', result.error || 'Error al actualizar estación.');
    }
  };

  const handleOpenDelete = (team: Team) => {
    setDeletingTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingTeam) return;
    const result = deleteTeam(deletingTeam.id, teams, currentUser);
    if (result.success && result.updatedTeams) {
      onTeamsUpdated(result.updatedTeams);
      showNotice('success', `Equipo #${deletingTeam.id} (${deletingTeam.name}) eliminado permanentemente.`);
    } else {
      showNotice('error', result.error || 'No se pudo eliminar el equipo.');
    }
    setDeletingTeam(null);
  };

  const handleDeactivateInstead = () => {
    if (!deletingTeam) return;
    const result = toggleTeamStatus(deletingTeam.id, teams, currentUser);
    if (result.success && result.updatedTeams) {
      onTeamsUpdated(result.updatedTeams);
      showNotice('success', `Equipo #${deletingTeam.id} (${deletingTeam.name}) desactivado para proteger el historial.`);
    }
    setDeletingTeam(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 ml-3 text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Equipos</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total} <span className="text-xs font-normal text-slate-400">/ 50 máx</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Activos</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inactivos</p>
          <p className="text-xl font-bold text-slate-600 mt-0.5">{stats.inactive}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Oleada Mañana</p>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.morning}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Oleada Tarde</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">{stats.afternoon}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Con Evaluaciones</p>
          <p className="text-xl font-bold text-red-700 mt-0.5">{stats.evaluated}</p>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por #ID, delegación u orador..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Create Button */}
          <button
            type="button"
            id="btn-create-team"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Equipo</span>
          </button>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-red-600 cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>

          {/* Wave filter */}
          <select
            value={waveFilter}
            onChange={(e) => setWaveFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-red-600 cursor-pointer"
          >
            <option value="all">Todas las Oleadas</option>
            <option value="morning">Oleada Mañana</option>
            <option value="afternoon">Oleada Tarde</option>
          </select>

          {/* Station filter */}
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-red-600 cursor-pointer"
          >
            <option value="all">Todas las Estaciones</option>
            <option value="none">Sin estación asignada</option>
            <option value="sala_a1">Sala A1 (Oratoria M1)</option>
            <option value="sala_a2">Sala A2 (Oratoria M2)</option>
            <option value="sala_b">Sala B (Debate)</option>
            <option value="sala_c">Sala C (Debate)</option>
            <option value="sala_d">Sala D (Debate)</option>
            <option value="sala_e">Sala E (Debate)</option>
            <option value="sala_f1">Sala F1 (Crisis M1)</option>
            <option value="sala_f2">Sala F2 (Crisis M2)</option>
          </select>

          {/* Evaluation state */}
          <select
            value={evalFilter}
            onChange={(e) => setEvalFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-red-600 cursor-pointer"
          >
            <option value="all">Todas las Evaluaciones</option>
            <option value="evaluated">Con Evaluaciones</option>
            <option value="pending">Sin Evaluaciones (Pendientes)</option>
          </select>

          <span className="ml-auto text-slate-400 font-mono">
            Mostrando {filteredTeams.length} de {teams.length} equipos
          </span>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">ID</th>
                <th className="py-3 px-4">Nombre de la Delegación</th>
                <th className="py-3 px-4 w-28">Wave</th>
                <th className="py-3 px-4">Miembros</th>
                <th className="py-3 px-4 w-28 text-center">Estado</th>
                <th className="py-3 px-4 w-44">Estación Actual</th>
                <th className="py-3 px-4 w-24 text-right">Puntaje</th>
                <th className="py-3 px-4 w-40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No se encontraron equipos con los criterios seleccionados.</p>
                    <p className="text-xs mt-1">Pruebe ajustando el término de búsqueda o los filtros activos.</p>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const isActive = team.status !== 'inactive';
                  const hasHistory = hasTeamEvaluationHistory(team);
                  const isMorning = team.wave === 'morning';

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? 'bg-slate-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-mono font-bold text-xs text-slate-800 border border-slate-200">
                          #{team.id}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{team.name}</span>
                          {team.isBreakQualified && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              BREAK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wave */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isMorning
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isMorning ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-blue-600" />}
                          {isMorning ? 'Mañana' : 'Tarde'}
                        </span>
                      </td>

                      {/* Miembros */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-600 max-w-xs truncate" title={team.members?.join(', ')}>
                          {team.members && team.members.length > 0 ? (
                            <span className="font-medium">
                              {team.members.join(' • ')}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Sin miembros registrados</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Estación Actual: Quick Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={team.currentStationKey || ''}
                          onChange={(e) => {
                            const val = e.target.value as StationKey | '';
                            handleQuickStationChange(team.id, val ? val : null);
                          }}
                          className={`w-full text-xs font-semibold py-1 px-2 rounded-lg border transition cursor-pointer ${
                            team.currentStationKey
                              ? 'bg-slate-900 text-white border-slate-900 focus:ring-1 focus:ring-red-500'
                              : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100 focus:ring-1 focus:ring-slate-400'
                          }`}
                        >
                          <option value="" className="bg-white text-slate-700">Sin estación</option>
                          <option value="sala_a1" className="bg-white text-slate-900">sala_a1 — Oratoria M1</option>
                          <option value="sala_a2" className="bg-white text-slate-900">sala_a2 — Oratoria M2</option>
                          <option value="sala_b" className="bg-white text-slate-900">sala_b — Debate</option>
                          <option value="sala_c" className="bg-white text-slate-900">sala_c — Debate</option>
                          <option value="sala_d" className="bg-white text-slate-900">sala_d — Debate</option>
                          <option value="sala_e" className="bg-white text-slate-900">sala_e — Debate</option>
                          <option value="sala_f1" className="bg-white text-slate-900">sala_f1 — Crisis M1</option>
                          <option value="sala_f2" className="bg-white text-slate-900">sala_f2 — Crisis M2</option>
                        </select>
                      </td>

                      {/* Puntaje */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {team.totalScore.toFixed(1)} <span className="text-xs font-normal text-slate-400">pts</span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => setDetailTeam(team)}
                            title="Ver desglose y boletas"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(team)}
                            title="Editar información del equipo"
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(team)}
                            title={isActive ? 'Desactivar equipo (conserva historial)' : 'Reactivar equipo'}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              isActive
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(team)}
                            title={hasHistory ? 'Equipo con histórico (solo desactivación)' : 'Eliminar equipo'}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Form Modal */}
      {isFormOpen && (
        <TeamFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTeam(null);
          }}
          teamToEdit={editingTeam}
          existingTeams={teams}
          onSave={handleSaveTeam}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingTeam(null);
          }}
          targetType="team"
          targetTeam={deletingTeam}
          onConfirmDelete={handleConfirmDelete}
          onDeactivateInstead={handleDeactivateInstead}
        />
      )}

      {/* Team Detail Modal */}
      {detailTeam && (
        <TeamDetailModal
          team={detailTeam}
          onClose={() => setDetailTeam(null)}
          onOpenJudgeForTeam={(tId) => {
            setDetailTeam(null);
            if (onOpenJudgeForTeam) onOpenJudgeForTeam(tId);
          }}
        />
      )}
    </div>
  );
};

export default TeamsManagement;
