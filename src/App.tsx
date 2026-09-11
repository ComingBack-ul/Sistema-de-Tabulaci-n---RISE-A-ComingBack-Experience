import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Team, ViewMode, RoomId, AuthUser, JudgeEvaluation, AdminTab } from './types';
import { 
  loadTeamsFromStorage, 
  saveTeamsToStorage, 
  subscribeToStorageUpdates, 
  appendAuditLog, 
  exportToCSV,
  resetDatabase,
  getInitialTeams,
  computeRanksAndBreak
} from './utils/storage';
import { 
  getStoredUser, 
  storeUser, 
  clearStoredUser, 
  canEvaluateTeam, 
  canSubmitForStation, 
  isAdminUser,
  canResetDatabase,
  getAssignedStationForSalaA,
  getCurrentCrisisTeam
} from './utils/auth';
import { 
  validateJudgeEvaluation, 
  validateTeam,
  JUDGE_TO_STATION_MAP,
  ValidJudgeUsername
} from './utils/validation';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { JudgeDashboard } from './components/JudgeDashboard';
import { JudgeModule } from './components/JudgeModule';
import { AdminPanel } from './components/admin/AdminPanel';
import { TeamsManagement } from './components/TeamsManagement';
import { UsersManagement } from './components/UsersManagement';
import { AdminLiveTab } from './components/AdminLiveTab';
import { AdminSettings } from './components/admin/AdminSettings';
import { AuditoriumProjection } from './components/AuditoriumProjection';
import { DataManagementModal } from './components/DataManagementModal';
import { TeamDetailModal } from './components/TeamDetailModal';
import { ParticipantLogin } from './components/ParticipantLogin';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { Activity, Users, UserCheck, Settings, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      return loadTeamsFromStorage();
    } catch (e) {
      console.error('Failed to load initial teams from storage:', e);
      return getInitialTeams();
    }
  });
  const [currentView, setCurrentView] = useState<ViewMode>('admin');
  const [adminTab, setAdminTab] = useState<AdminTab>('live');
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<Team | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [isParticipantMode, setIsParticipantMode] = useState<boolean>(false);
  const [participantTeamId, setParticipantTeamId] = useState<number | null>(null);

  // Sync state with storage and other tabs
  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdates(() => {
      try {
        setTeams(loadTeamsFromStorage());
        setAppError(null);
      } catch (err: any) {
        setAppError(err.message || 'Error de sincronización con almacenamiento local.');
      }
    });

    const handleStorageAuthSync = () => {
      const validStored = getStoredUser();
      if (!validStored) {
        clearStoredUser();
        setCurrentUser(null);
      } else {
        setCurrentUser(validStored);
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageAuthSync);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageAuthSync);
    };
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    storeUser(user);
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin');
      setAdminTab('live');
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
  };

  // Save specific evaluation from Judge Dashboard (with Judge Data Isolation)
  const handleSaveJudgeEvaluation = useCallback(
    (teamId: number, rawEvaluation: JudgeEvaluation) => {
      if (!currentUser) {
        setAppError('Usuario no autenticado.');
        return;
      }

      // Authorization guards
      if (!canEvaluateTeam(currentUser, teamId, rawEvaluation.stationKey)) {
        setAppError('Acceso denegado: no tienes permisos para evaluar este equipo.');
        return;
      }

      if (!canSubmitForStation(currentUser, rawEvaluation.stationKey)) {
        setAppError(`Acceso denegado: no estás asignado a la estación ${rawEvaluation.stationKey}.`);
        return;
      }

      // Strict Schema Validation
      const validation = validateJudgeEvaluation(
        {
          ...rawEvaluation,
          judgeUsername: currentUser.username, // Force identity to match authenticated session
          stationKey: currentUser.role === 'judge' ? (currentUser.stationKey as any) : rawEvaluation.stationKey,
          timestamp: new Date().toISOString(),
        },
        currentUser
      );

      if (!validation.valid || !validation.data) {
        setAppError(`Error de validación de evaluación: ${validation.error}`);
        return;
      }

      const evaluation = validation.data;

      // Check for Debate Room Collision if submitted
      const targetTeam = teams.find((t) => t.id === teamId);
      if (!targetTeam) {
        setAppError(`Equipo #${teamId} no encontrado.`);
        return;
      }

      // Check for inactive status before saving evaluations
      if (targetTeam.status === 'inactive') {
        setAppError(`El Equipo #${teamId} está inactivo y no puede recibir nuevas evaluaciones.`);
        return;
      }
      if (evaluation.isSubmitted && (evaluation.stationKey === 'sala_a1' || evaluation.stationKey === 'sala_a2')) {
        const assignedStation = getAssignedStationForSalaA(teamId);
        if (assignedStation && assignedStation !== evaluation.stationKey) {
          const expectedJudgeLabel = assignedStation === 'sala_a1' ? 'Sala A1 (Juez A1)' : 'Sala A2 (Juez A2)';
          const actualJudgeLabel = evaluation.stationKey === 'sala_a1' ? 'Sala A1' : 'Sala A2';
          setAppError(
            `Error de asignación fija en Sala A: El equipo #${teamId} corresponde a la asignación de ${expectedJudgeLabel} y no puede ser evaluado por ${actualJudgeLabel}.`
          );
          return;
        }
      }

      // Check for Sala F (Crisis) Synchronized Evaluation
      if (evaluation.isSubmitted && (evaluation.stationKey === 'sala_f1' || evaluation.stationKey === 'sala_f2')) {
        const currentCrisisTeam = getCurrentCrisisTeam(teams);
        if (currentCrisisTeam && currentCrisisTeam.id !== teamId) {
          setAppError(
            `Error de sincronización en Sala F: Las evaluaciones de Crisis deben realizarse de forma sincronizada equipo por equipo. El equipo actual en exposición es el Equipo #${currentCrisisTeam.id} (${currentCrisisTeam.name}).`
          );
          return;
        }

        // Duplicate submission check for the same judge
        if (targetTeam.judgeEvaluations?.[evaluation.judgeUsername]?.isSubmitted) {
          setAppError(
            `Evaluación duplicada: Ya has enviado la calificación para el Equipo #${teamId}.`
          );
          return;
        }
      }

      if (evaluation.isSubmitted && ['sala_b', 'sala_c', 'sala_d', 'sala_e'].includes(evaluation.stationKey)) {
        const existingEvals = targetTeam.judgeEvaluations || {};
        const conflictingJudge = ['juez_sala_b', 'juez_sala_c', 'juez_sala_d', 'juez_sala_e'].find(
          (dj) => dj !== evaluation.judgeUsername && existingEvals[dj]?.isSubmitted
        );
        if (conflictingJudge) {
          const conflictingStation = existingEvals[conflictingJudge]!.stationKey.toUpperCase();
          setAppError(
            `Conflicto de debate en equipo #${teamId}: ya cuenta con una evaluación enviada en la estación ${conflictingStation}. No se permiten múltiples salas de debate para un mismo equipo.`
          );
          return;
        }
      }

      try {
        // 1. Construct candidate state
        const updatedTeams = teams.map((team) => {
          if (team.id !== teamId) return team;

          const updatedJudgeEvals = {
            ...(team.judgeEvaluations || {}),
            [evaluation.judgeUsername]: evaluation,
          };

          return {
            ...team,
            judgeEvaluations: updatedJudgeEvals,
            lastUpdated: new Date().toISOString(),
          };
        });

        // 2. Validate all teams in the candidate state
        for (const t of updatedTeams) {
          const v = validateTeam(t);
          if (!v.valid) {
            throw new Error(`Error de validación en equipo #${t.id}: ${v.error}`);
          }
        }

        // 3. Recalculate derived fields deterministically
        const recalculated = computeRanksAndBreak(updatedTeams);

        // 4. Persist to storage BEFORE updating React state
        saveTeamsToStorage(recalculated);

        // 5. ONLY AFTER successful persistence: update React state
        setTeams(recalculated);

        // 6. Append audit log
        appendAuditLog({
          teamId,
          room: `Estación ${evaluation.stationKey.toUpperCase()}`,
          action: `Juez [${evaluation.judgeUsername}] asignó ${evaluation.points} pts | Candado: ${evaluation.escapeChallenge ? 'SÍ' : 'NO'}`,
          judgeName: evaluation.judgeUsername,
        });

        setAppError(null);
      } catch (err: any) {
        setAppError(`Error al guardar la evaluación: ${err.message || 'Error desconocido'}`);
      }
    },
    [currentUser, teams]
  );

  // Administrative Scoring: Save structured JudgeEvaluation to eliminate source-of-truth divergence
  const handleSaveScore = useCallback(
    (
      teamId: number,
      room: RoomId,
      scoreData: {
        points: number;
        escapeChallenge: boolean;
        judgeName: string;
        notes: string;
        specificRoom?: 'B' | 'C' | 'D' | 'E';
      }
    ) => {
      if (!currentUser || !isAdminUser(currentUser)) {
        setAppError('Acceso denegado: solo directores administrativos pueden realizar asignaciones.');
        return;
      }

      const targetTeam = teams.find((t) => t.id === teamId);
      if (!targetTeam) {
        setAppError(`Equipo #${teamId} no encontrado.`);
        return;
      }

      // Check for inactive status before saving administrative scores
      if (targetTeam.status === 'inactive') {
        setAppError(`El Equipo #${teamId} está inactivo y no puede recibir nuevas puntuaciones.`);
        return;
      }
      const targetJudgeUsername: ValidJudgeUsername =
        room === 'sala_a'
          ? (getAssignedStationForSalaA(teamId) === 'sala_a1' ? 'juez_sala_a1' : 'juez_sala_a2')
          : room === 'sala_b_e'
          ? (`juez_sala_${(scoreData.specificRoom || 'b').toLowerCase()}` as ValidJudgeUsername)
          : 'juez_sala_f1';

      const targetStationKey = JUDGE_TO_STATION_MAP[targetJudgeUsername];

      // Check for Debate Room Conflict if saving a debate evaluation
      if (room === 'sala_b_e') {
        const existingEvals = targetTeam.judgeEvaluations || {};
        const conflictingJudge = (['juez_sala_b', 'juez_sala_c', 'juez_sala_d', 'juez_sala_e'] as const).find(
          (dj) => dj !== targetJudgeUsername && existingEvals[dj]?.isSubmitted
        );
        if (conflictingJudge) {
          const existingStation = existingEvals[conflictingJudge]!.stationKey;
          setAppError(
            `El equipo ${teamId} ya cuenta con una evaluación de Debate enviada en ${existingStation}. La operación administrativa para ${targetStationKey} fue rechazada para proteger la integridad de los datos.`
          );
          return;
        }
      }

      const evalPayload: JudgeEvaluation = {
        judgeUsername: targetJudgeUsername,
        stationKey: targetStationKey,
        points: scoreData.points,
        escapeChallenge: scoreData.escapeChallenge,
        notes: scoreData.notes
          ? `[Ajuste Admin: ${currentUser.name}] ${scoreData.notes}`
          : `[Ajuste Admin: ${currentUser.name}]`,
        timestamp: new Date().toISOString(),
        isSubmitted: true,
      };

      const valResult = validateJudgeEvaluation(evalPayload);
      if (!valResult.valid || !valResult.data) {
        setAppError(`Error al validar evaluación administrativa: ${valResult.error}`);
        return;
      }

      const validatedEval = valResult.data;

      try {
        // 1. Construct candidate state
        const updatedTeams = teams.map((team) => {
          if (team.id !== teamId) return team;

          const updatedJudgeEvals = {
            ...(team.judgeEvaluations || {}),
            [targetJudgeUsername]: validatedEval,
          };

          return {
            ...team,
            judgeEvaluations: updatedJudgeEvals,
            lastUpdated: new Date().toISOString(),
          };
        });

        // 2. Validate candidate state
        for (const t of updatedTeams) {
          const v = validateTeam(t);
          if (!v.valid) {
            throw new Error(`Error de validación en equipo #${t.id}: ${v.error}`);
          }
        }

        // 3. Recalculate derived fields deterministically
        const recalculated = computeRanksAndBreak(updatedTeams);

        // 4. Persist to storage BEFORE updating React state
        saveTeamsToStorage(recalculated);

        // 5. ONLY AFTER successful persistence: update React state
        setTeams(recalculated);

        // 6. Append audit log
        appendAuditLog({
          teamId,
          room:
            room === 'sala_a'
              ? 'Sala A (Oratoria)'
              : room === 'sala_b_e'
              ? `Sala B-E (Debate ${scoreData.specificRoom || ''})`
              : 'Sala F (Crisis)',
          action: `[Admin: ${currentUser.name}] Asignó ${scoreData.points} pts & Candado: ${scoreData.escapeChallenge ? 'SÍ' : 'NO'}`,
          judgeName: currentUser.name,
        });

        setAppError(null);
      } catch (err: any) {
        setAppError(`Error al guardar puntuación: ${err.message || 'Error desconocido'}`);
      }
    },
    [currentUser, teams]
  );

  const handleOpenJudgeForTeam = (teamId: number) => {
    if (currentUser?.role === 'admin') {
      setCurrentView('judge');
    }
  };

  const handleResetDatabase = () => {
    if (!currentUser || !canResetDatabase(currentUser)) {
      setAppError('Acceso denegado: solo directores pueden reiniciar la base de datos.');
      return;
    }
    try {
      setTeams(resetDatabase());
      setAppError(null);
    } catch (err: any) {
      setAppError(`Error al reiniciar la base de datos: ${err.message}`);
    }
  };

  // Count total evaluated teams
  const totalEvaluatedCount = useMemo(() => {
    return teams.filter(
      (t) =>
        t.scores.salaA.isSubmitted ||
        t.scores.salaBE.isSubmitted ||
        t.scores.salaF.isSubmitted
    ).length;
  }, [teams]);

  // Participant Mode Rendering
  if (isParticipantMode) {
    if (participantTeamId === null) {
      return (
        <ParticipantLogin 
          onLogin={setParticipantTeamId} 
          onBack={() => setIsParticipantMode(false)} 
        />
      );
    }
    return (
      <ParticipantDashboard 
        teamId={participantTeamId} 
        teams={teams} 
        onLogout={() => {
          setParticipantTeamId(null);
          setIsParticipantMode(false);
        }} 
      />
    );
  }

  // If not logged in, render Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onParticipantLogin={() => setIsParticipantMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        adminTab={adminTab}
        onSelectAdminTab={(tab) => {
          setAdminTab(tab);
          setCurrentView('admin');
        }}
        isOnline={isOnline}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        totalEvaluated={totalEvaluatedCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Global Application Alert Notification */}
      {appError && (
        <div className="bg-red-700 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md">
          <span>{appError}</span>
          <button 
            type="button"
            onClick={() => setAppError(null)} 
            className="text-white/80 hover:text-white font-bold ml-4 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-8">
        {/* Judge Role: Render Dedicated 3-Tab Judge Dashboard with Station Isolation */}
        {currentUser.role === 'judge' ? (
          <JudgeDashboard
            user={currentUser}
            teams={teams}
            onSaveEvaluation={handleSaveJudgeEvaluation}
            onOpenTeamDetail={(team) => setSelectedTeamDetail(team)}
          />
        ) : (
          /* Admin Role Views */
          <>
            {currentView === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                <AdminPanel
                  teams={teams}
                  currentUser={currentUser}
                  onTeamsUpdated={(newTeams) => setTeams(newTeams)}
                  onSelectTeamDetail={(team) => setSelectedTeamDetail(team)}
                  onExportCSV={() => exportToCSV(teams)}
                  onOpenJudgeForTeam={handleOpenJudgeForTeam}
                  activeTab={adminTab}
                  onTabChange={setAdminTab}
                >
                  {adminTab === 'live' && (
                    <AdminLiveTab
                      teams={teams}
                      onSelectTeamDetail={(team) => setSelectedTeamDetail(team)}
                      onExportCSV={() => exportToCSV(teams)}
                      onOpenJudgeForTeam={handleOpenJudgeForTeam}
                    />
                  )}

                  {adminTab === 'teams' && (
                    <TeamsManagement
                      teams={teams}
                      currentUser={currentUser}
                      onTeamsUpdated={(newTeams) => setTeams(newTeams)}
                      onOpenJudgeForTeam={handleOpenJudgeForTeam}
                    />
                  )}

                  {adminTab === 'users' && (
                    <UsersManagement
                      currentUser={currentUser}
                    />
                  )}

                  {adminTab === 'settings' && (
                    <AdminSettings
                      teams={teams}
                      currentUser={currentUser}
                      onDataUpdated={(newTeams) => setTeams(newTeams)}
                    />
                  )}
                </AdminPanel>
              </div>
            )}

            {currentView === 'judge' && (
              <JudgeModule teams={teams} currentUser={currentUser} onSaveScore={handleSaveScore} />
            )}

            {currentView === 'projection' && (
              <AuditoriumProjection teams={teams} />
            )}
          </>
        )}
      </main>

      {/* Team Detail Modal */}
      <TeamDetailModal
        team={selectedTeamDetail}
        onClose={() => setSelectedTeamDetail(null)}
        onOpenJudgeForTeam={handleOpenJudgeForTeam}
      />

      {/* Data Management Modal (Mesa Directiva) */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        teams={teams}
        onDataUpdated={(newTeams) => setTeams(newTeams)}
      />
    </div>
  );
}
