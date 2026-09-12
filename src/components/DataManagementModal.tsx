import React, { useState } from 'react';
import { Team, AuditLogEntry } from '../types';
import { 
  FileSpreadsheet, 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  exportToCSV, 
  resetDatabase, 
  exportBackupJSON, 
  importBackupJSON, 
  loadAuditLog 
} from '../utils/storage';
import { formatDisplayTimestamp } from '../utils/validation';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onDataUpdated: (newTeams: Team[]) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  teams,
  onDataUpdated
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetCodeInput, setResetCodeInput] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'actions' | 'logs'>('actions');

  if (!isOpen) return null;

  let auditLogs: AuditLogEntry[] = [];
  let auditLogLoadError: string | null = null;
  try {
    auditLogs = loadAuditLog();
  } catch (err: any) {
    auditLogLoadError = err.message || 'Error al cargar registros de auditoría.';
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(teams);
      setFeedbackMsg({ text: 'Archivo CSV descargado con éxito.', type: 'success' });
    } catch (e) {
      setFeedbackMsg({ text: 'Error al exportar CSV.', type: 'error' });
    }
  };

  
  const handleBackupDownload = () => {
    try {
      exportBackupJSON(teams);
      setFeedbackMsg({ text: 'Copia de respaldo JSON descargada.', type: 'success' });
    } catch (e) {
      setFeedbackMsg({ text: 'Error al descargar respaldo.', type: 'error' });
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
        setFeedbackMsg({ text: '¡Respaldo restaurado con éxito!', type: 'success' });
      } catch (err: any) {
        setFeedbackMsg({ text: 'Error al restaurar: ' + (err.message || 'Archivo inválido'), type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    if (resetCodeInput !== 'REINICIAR') {
      setFeedbackMsg({ text: 'Debes escribir "REINICIAR" para confirmar.', type: 'error' });
      return;
    }
    const cleanTeams = resetDatabase();
    onDataUpdated(cleanTeams);
    setShowResetConfirm(false);
    setResetCodeInput('');
    setFeedbackMsg({ text: 'Base de datos reiniciada a ceros.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#991B1B] via-[#8B1818] to-[#7F1D1D] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg font-['Cabinet_Grotesk'] tracking-tight">
                Mesa Directiva &bull; Gestión de Datos
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Herramientas de respaldo, pruebas y contingencia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'actions'
                ? 'border-[#991B1B] text-[#991B1B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Acciones Principales
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-[#991B1B] text-[#991B1B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Auditoría ({auditLogs.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-red-50 text-[#991B1B] border border-red-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'actions' ? (
            <>
              {/* Action 1: Export CSV */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Exportar Datos a CSV (Excel / Google Sheets)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Descarga la matriz con todas las notas, desempates y candados con formato UTF-8 oficial.
                  </p>
                </div>
                <button
                  type="button"
                  id="modal-btn-export-csv"
                  onClick={handleExportCSV}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Descargar CSV
                </button>
              </div>

              

              {/* Action 3: Backup & Restore JSON */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    Copia de Respaldo & Restauración JSON
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guarda o recupera el estado exacto de la base de datos en un archivo JSON seguro.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBackupDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Descargar Respaldo JSON
                  </button>
                  <label className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restaurar Archivo JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Action 4: Reset Database */}
              <div className="bg-red-50/70 p-4 rounded-xl border border-red-200">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-extrabold text-sm text-[#991B1B]">
                      Reiniciar Base de Datos (Zona de Peligro)
                    </h4>
                    <p className="text-xs text-red-800 mt-0.5">
                      Borra todas las evaluaciones y restablece las notas de los 18 equipos oficiales a cero.
                    </p>

                    {!showResetConfirm ? (
                      <button
                        type="button"
                        id="modal-btn-trigger-reset"
                        onClick={() => setShowResetConfirm(true)}
                        className="mt-3 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Reiniciar Base de Datos...
                      </button>
                    ) : (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-red-300 space-y-2 animate-fade-in">
                        <p className="text-xs font-bold text-[#991B1B]">
                          Escribe <span className="font-mono text-[#991B1B] bg-red-100 px-1 py-0.5 rounded font-black">REINICIAR</span> para confirmar:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={resetCodeInput}
                            onChange={(e) => setResetCodeInput(e.target.value)}
                            placeholder="Escribe REINICIAR"
                            className="text-xs px-3 py-1.5 border border-red-300 rounded font-mono uppercase focus:ring-1 focus:ring-[#991B1B] outline-hidden flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmReset}
                            className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs px-3 py-1.5 rounded cursor-pointer"
                          >
                            Confirmar Borrado
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowResetConfirm(false);
                              setResetCodeInput('');
                            }}
                            className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Registro inmutable de cambios y envíos realizados en esta estación:
              </p>
              {auditLogLoadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#991B1B] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{auditLogLoadError}</span>
                </div>
              )}
              {auditLogs.length === 0 && !auditLogLoadError ? (
                <p className="text-xs text-slate-400 py-6 text-center">No hay registros de auditoría aún.</p>
              ) : null}
              {auditLogs.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-[#991B1B]">
                          {log.teamId > 0 ? `Equipo #${log.teamId} (${log.room})` : log.room}:
                        </span>{' '}
                        <span className="text-slate-800">{log.action}</span>
                        <p className="text-[10px] text-slate-400">Juez / Autor: {log.judgeName}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">{formatDisplayTimestamp(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
