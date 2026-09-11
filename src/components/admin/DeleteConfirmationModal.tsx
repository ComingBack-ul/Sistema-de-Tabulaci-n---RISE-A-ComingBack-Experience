import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Ban, Power } from 'lucide-react';
import { Team, ManagedUser } from '../../types';
import { canDeleteTeam } from '../../services/teamService';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'team' | 'user';
  targetTeam?: Team | null;
  targetUser?: ManagedUser | null;
  onConfirmDelete: () => void;
  onDeactivateInstead?: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetTeam,
  targetUser,
  onConfirmDelete,
  onDeactivateInstead,
}) => {
  if (!isOpen) return null;

  // For teams, inspect evaluation history
  const teamCheck = targetTeam ? canDeleteTeam(targetTeam) : { canDelete: true, hasEvaluations: false };
  const hasHistory = targetTeam ? teamCheck.hasEvaluations : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          hasHistory ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasHistory ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>
              {hasHistory ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {targetType === 'team'
                  ? hasHistory
                    ? 'Equipo con Histórico'
                    : 'Eliminar Equipo'
                  : 'Eliminar Usuario'}
              </h3>
              <p className="text-xs text-slate-500">
                {targetType === 'team' ? `Equipo #${targetTeam?.id} - ${targetTeam?.name}` : `@${targetUser?.username}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {targetType === 'team' && targetTeam && (
            <>
              {hasHistory ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm leading-relaxed">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <Ban className="w-4 h-4 text-amber-600 shrink-0" />
                      Eliminación permanente bloqueada por auditoría
                    </p>
                    <p className="text-xs text-amber-800">
                      El equipo <strong>#{targetTeam.id} ({targetTeam.name})</strong> posee evaluaciones, puntuaciones registradas ({targetTeam.totalScore} pts) o candados aprobados en el torneo.
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Para proteger los registros oficiales y la consistencia de los rankings, este equipo <strong>no puede ser eliminado físicamente</strong>. En su lugar, desactívelo para ocultarlo de las consolas de evaluación conservando sus datos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">
                    ¿Está completamente seguro de eliminar permanentemente al equipo <strong>#{targetTeam.id} — {targetTeam.name}</strong>?
                  </p>
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                    Este equipo no registra evaluaciones en el sistema. Al eliminarlo, el ID quedará libre para registrar otra delegación.
                  </p>
                </div>
              )}
            </>
          )}

          {targetType === 'user' && targetUser && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                ¿Está seguro de eliminar al usuario <strong>@{targetUser.username} ({targetUser.name})</strong>?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <p><strong>Rol:</strong> {targetUser.role === 'admin' ? 'Administrador' : 'Juez de Sala'}</p>
                {targetUser.stationName && <p><strong>Estación:</strong> {targetUser.stationName}</p>}
                <p className="text-amber-700 font-medium pt-1">
                  El usuario perderá acceso inmediato a la plataforma.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            Cancelar
          </button>

          {targetType === 'team' && hasHistory ? (
            <button
              type="button"
              onClick={() => {
                if (onDeactivateInstead) onDeactivateInstead();
                onClose();
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow flex items-center gap-1.5"
            >
              <Power className="w-4 h-4" />
              Desactivar Equipo en su Lugar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete();
                onClose();
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {targetType === 'team' ? 'Eliminar Permanentemente' : 'Eliminar Usuario'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
