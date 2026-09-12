import React from 'react';
import { ViewMode, AuthUser, AdminTab } from '../types';
import { 
  ClipboardCheck, 
  Tv, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  User,
  Activity,
  Users,
  UserCheck,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  adminTab?: AdminTab;
  onSelectAdminTab?: (tab: AdminTab) => void;
  isOnline: boolean;
  onOpenDataModal: () => void;
  totalEvaluated: number;
  totalTeams?: number;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  adminTab = 'live',
  onSelectAdminTab,
  onOpenDataModal,
  totalEvaluated,
  totalTeams = 18,
  currentUser,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const handleAdminNavClick = (tab: AdminTab) => {
    if (onSelectAdminTab) {
      onSelectAdminTab(tab);
    }
    onSelectView('admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#991B1B] text-white shadow-md border-b border-[#7F1D1D] font-['Plus_Jakarta_Sans']">
      {/* Top micro-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs border-b border-white/15">
        <div className="flex items-center gap-2 font-medium tracking-wide text-red-100">
          <span className="font-extrabold tracking-tight text-white">COMING BACK ANIVERSARIO</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress badge */}
          <div className="flex items-center gap-1.5 bg-[#7F1D1D]/80 px-2.5 py-0.5 rounded-full border border-red-400/30 text-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-mono text-[11px] font-bold">{totalEvaluated}/{totalTeams} Evaluados</span>
          </div>
        </div>
      </div>

      {/* Main navigation toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white font-['Cabinet_Grotesk']">
              Coming Back
            </h1>
            <p className="text-[11px] text-red-100 font-medium leading-none mt-1 hidden xs:block">
              {isAdmin ? 'Panel General de Mesa Directiva' : (currentUser?.stationName || currentUser?.name || 'Consola de Evaluación')}
            </p>
          </div>
        </div>

        {/* User Role Bar + Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Navigation Tabs */}
          {isAdmin && (
            <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#7F1D1D]/70 p-1 rounded-xl border border-red-700/60 shadow-inner flex-wrap">
              {/* 1. Live */}
              <button
                id="nav-btn-admin-live"
                onClick={() => handleAdminNavClick('live')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'admin' && adminTab === 'live'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 text-amber-500" />
                <span>Live</span>
              </button>

              {/* 2. Equipos */}
              <button
                id="nav-btn-admin-teams"
                onClick={() => handleAdminNavClick('teams')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'admin' && adminTab === 'teams'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Equipos</span>
              </button>

              {/* 3. Usuarios */}
              <button
                id="nav-btn-admin-users"
                onClick={() => handleAdminNavClick('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'admin' && adminTab === 'users'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Usuarios</span>
              </button>

              {/* 4. Configuración */}
              <button
                id="nav-btn-admin-settings"
                onClick={() => handleAdminNavClick('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'admin' && adminTab === 'settings'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Configuración</span>
              </button>

              <div className="w-[1px] h-5 bg-white/20 mx-0.5 hidden md:block" />

              {/* Auxiliary views */}
              <button
                id="nav-btn-judge"
                onClick={() => onSelectView('judge')}
                title="Consola de Jueces para pruebas o re-calificación"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'judge'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Consola Jueces</span>
              </button>

              <button
                id="nav-btn-projection"
                onClick={() => onSelectView('projection')}
                title="Proyección en auditorio para Break"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'projection'
                    ? 'bg-white text-[#991B1B] shadow-sm font-black ring-2 ring-[#FCD34D]'
                    : 'text-red-100 hover:bg-[#991B1B]/80 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Break</span>
              </button>

              <button
                id="nav-btn-management"
                onClick={onOpenDataModal}
                title="Mesa Directiva (Exportar CSV, Reiniciar)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Opciones</span>
              </button>
            </nav>
          )}

          {/* User badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-xl border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> : <User className="w-3.5 h-3.5 text-red-200" />}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white tracking-tight block leading-tight">
                    {isAdmin ? 'Administrador' : currentUser.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-logout"
                onClick={onLogout}
                title="Cerrar Sesión"
                className="ml-1.5 p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 hover:text-white border border-red-500/30 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
