import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ShieldAlert,
  Sparkles,
  Search,
  Lock
} from 'lucide-react';
import { Team, AuditLogEntry, AuthUser } from '../../types';
import { 
  exportToCSV, 
  generateDemoData, 
  resetDatabase, 
  exportBackupJSON, 
  importBackupJSON, 
  loadAuditLog 
} from '../../utils/storage';
import { formatDisplayTimestamp } from '../../utils/validation';

interface AdminSettingsProps {
  teams: Team[];
  currentUser: AuthUser;
  onDataUpdated: (newTeams: Team[]) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  teams,
  currentUser,
  onDataUpdated,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [logSearch, setLogSearch] = useState('');

  let auditLogs: AuditLogEntry[] = [];
  try {
    auditLogs = loadAuditLog();
  } catch (err: any) {
    console.warn('Error loading audit log:', err);
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(teams);
      setFeedbackMsg({ text: 'Archivo CSV de tabulación descargado exitosamente.', type: 'success' });
    } catch (e) {
      setFeedbackMsg({ text: 'Error al generar el archivo CSV.', type: 'error' });
    }
  };

  const handleBackupDownload = () => {
    try {
      exportBackupJSON(teams);
      setFeedbackMsg({ text: 'Copia de respaldo JSON descargada con integridad verificada.', type: 'success' });
    } catch (e) {
      setFeedbackMsg({ text: 'Error al descargar respaldo de seguridad.', type: 'error' });
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const restored = importBackupJSON(content);
        onDataUpdated(restored);
        setFeedbackMsg({ text: '¡Respaldo JSON restaurado exitosamente!', type: 'success' });
      } catch (err: any) {
        setFeedbackMsg({ text: 'Error al restaurar: ' + (err.message || 'Archivo inválido'), type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemo = () => {
    const newTeams = generateDemoData();
    onDataUpdated(newTeams);
    setFeedbackMsg({ text: 'Datos de prueba y puntuaciones de simulación cargados con éxito.', type: 'success' });
  };

  const handleConfirmReset = () => {
    if (resetCodeInput !== 'REINICIAR') {
      setFeedbackMsg({ text: 'Debe escribir exactamente la palabra "REINICIAR" para confirmar.', type: 'error' });
      return;
    }
    const cleanTeams = resetDatabase();
    onDataUpdated(cleanTeams);
    setShowResetConfirm(false);
    setResetCodeInput('');
    setFeedbackMsg({ text: 'Base de datos del torneo reiniciada a ceros.', type: 'success' });
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!logSearch.trim()) return true;
    const term = logSearch.toLowerCase();
    const teamMatch = log.teamId ? log.teamId.toString() === term || `#${log.teamId}` === term : false;
    const actionMatch = log.action.toLowerCase().includes(term);
    const roomMatch = log.room.toLowerCase().includes(term);
    const judgeMatch = log.judgeName.toLowerCase().includes(term);
    return teamMatch || actionMatch || roomMatch || judgeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Feedback notice */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid of Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Backup & Export */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Download className="w-5 h-5 text-red-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Exportación y Respaldos
              </h3>
              <p className="text-xs text-slate-500">Descarga oficial de datos y resguardos de contingencia</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Exportar Tabulación a CSV</p>
                <p className="text-[11px] text-slate-500">Hoja de cálculo compatible con Excel y Google Sheets</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Descargar CSV
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Copia de Seguridad JSON</p>
                <p className="text-[11px] text-slate-500">Respaldo completo con estructura, firmas y timestamps</p>
              </div>
              <button
                onClick={handleBackupDownload}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Descargar JSON
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Restaurar desde Respaldo JSON</p>
                <p className="text-[11px] text-slate-500">Valida la integridad y recupera el estado del torneo</p>
              </div>
              <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                Cargar Archivo
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Contingency & Simulation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Contingencia y Pruebas
              </h3>
              <p className="text-xs text-slate-500">Simulación y restablecimiento del torneo</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-amber-900">Cargar Datos de Demostración</p>
                <p className="text-[11px] text-amber-700">Llena los 50 equipos con puntuaciones para ensayos</p>
              </div>
              <button
                onClick={handleLoadDemo}
                className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Cargar Demo
              </button>
            </div>

            {/* Reset Database */}
            <div className="p-3.5 bg-red-50/60 rounded-lg border border-red-200 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-red-900">Reiniciar Torneo a Ceros</p>
                  <p className="text-[11px] text-red-700">Borra todas las evaluaciones y restablece equipos iniciales</p>
                </div>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1.5 bg-red-700 text-white hover:bg-red-800 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar
                  </button>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {showResetConfirm && (
                <div className="pt-2 border-t border-red-200 mt-2 space-y-2 animate-fade-in">
                  <p className="text-xs text-red-800 font-semibold">
                    Escriba "REINICIAR" para confirmar el restablecimiento de tabulación:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      placeholder="REINICIAR"
                      className="px-3 py-1 text-xs border border-red-300 rounded font-mono uppercase font-bold flex-1 bg-white"
                    />
                    <button
                      onClick={handleConfirmReset}
                      className="px-3 py-1 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Audit Log History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Historial de Auditoría en Tiempo Real
              </h3>
              <p className="text-xs text-slate-500">
                Registro inmutable de cambios de puntuación y acciones administrativas
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Buscar en auditoría..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-red-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] font-bold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-36">Fecha / Hora</th>
                <th className="py-2.5 px-3 w-20 text-center">Equipo</th>
                <th className="py-2.5 px-3 w-32">Módulo / Sala</th>
                <th className="py-2.5 px-3">Acción Registrada</th>
                <th className="py-2.5 px-3 w-40">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No se registran eventos de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDisplayTimestamp(entry.timestamp)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                      {entry.teamId ? `#${entry.teamId}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {entry.room}
                    </td>
                    <td className="py-2 px-3 text-slate-800 font-medium">
                      {entry.action}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-semibold whitespace-nowrap">
                      {entry.judgeName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
