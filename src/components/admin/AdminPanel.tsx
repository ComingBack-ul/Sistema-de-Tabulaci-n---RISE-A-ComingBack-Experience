import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  UserCheck, 
  Settings, 
  FileSpreadsheet, 
  Activity, 
  Award,
  Layers,
  Shield
} from 'lucide-react';
import { Team, AuthUser, AdminTab } from '../../types';
import { AdminLiveTab } from '../AdminLiveTab';
import { TeamsManagement } from './TeamsManagement';
import { UsersManagement } from './UsersManagement';
import { AdminSettings } from './AdminSettings';

interface AdminPanelProps {
  teams: Team[];
  currentUser: AuthUser;
  onTeamsUpdated: (updatedTeams: Team[]) => void;
  onSelectTeamDetail: (team: Team) => void;
  onOpenJudgeForTeam: (teamId: number) => void;
  onExportCSV: () => void;
  initialTab?: AdminTab;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  teams,
  currentUser,
  onTeamsUpdated,
  onSelectTeamDetail,
  onOpenJudgeForTeam,
  onExportCSV,
  initialTab = 'live',
  activeTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<AdminTab>(initialTab);
  const currentTab = activeTab !== undefined ? activeTab : internalTab;

  const handleTabSelect = (tab: AdminTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setInternalTab(tab);
  };

  const activeTeamsCount = teams.filter((t) => t.status !== 'inactive').length;
  const inactiveTeamsCount = teams.filter((t) => t.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-900 border border-red-200 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-red-700" />
              Mesa Directiva de Tabulación
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-medium">
              Conectado como: <strong>{currentUser.name}</strong> (@{currentUser.username})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-['Cabinet_Grotesk']">
            Panel de Control del Torneo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Supervisión en tiempo real de tabulación, delegaciones, jueces y parámetros oficiales.
          </p>
        </div>

        {/* Global summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
            <span className="font-bold text-slate-900">{teams.length}</span> Equipos ({activeTeamsCount} activos)
          </div>
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-xs flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Descargar CSV
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-1.5 flex flex-wrap gap-1.5">
        <button
          onClick={() => handleTabSelect('live')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            currentTab === 'live'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>Tabulación en Vivo</span>
        </button>

        <button
          onClick={() => handleTabSelect('teams')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            currentTab === 'teams'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Equipos</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentTab === 'teams' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {teams.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('users')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            currentTab === 'users'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Usuarios y Jueces</span>
        </button>

        <button
          onClick={() => handleTabSelect('settings')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-red-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Configuración y Datos</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-200">
        {currentTab === 'live' && (
          <AdminLiveTab
            teams={teams}
            onSelectTeamDetail={onSelectTeamDetail}
            onExportCSV={onExportCSV}
            onOpenJudgeForTeam={onOpenJudgeForTeam}
          />
        )}

        {currentTab === 'teams' && (
          <TeamsManagement
            teams={teams}
            currentUser={currentUser}
            onTeamsUpdated={onTeamsUpdated}
            onOpenJudgeForTeam={onOpenJudgeForTeam}
          />
        )}

        {currentTab === 'users' && (
          <UsersManagement currentUser={currentUser} />
        )}

        {currentTab === 'settings' && (
          <AdminSettings
            teams={teams}
            currentUser={currentUser}
            onDataUpdated={onTeamsUpdated}
          />
        )}
      </div>
    </div>
  );
};
