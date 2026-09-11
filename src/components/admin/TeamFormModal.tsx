import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Team, CreateTeamDto, UpdateTeamDto, Wave, TeamStatus } from '../../types';
import { hasTeamEvaluationHistory } from '../../services/teamService';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: Team | null;
  existingTeams: Team[];
  onSave: (payload: CreateTeamDto | { id: number; dto: UpdateTeamDto }) => { success: boolean; error?: string };
}

export const TeamFormModal: React.FC<TeamFormModalProps> = ({
  isOpen,
  onClose,
  teamToEdit,
  existingTeams,
  onSave,
}) => {
  const isEditing = Boolean(teamToEdit);
  const hasHistory = teamToEdit ? hasTeamEvaluationHistory(teamToEdit) : false;

  const [id, setId] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [wave, setWave] = useState<Wave>('morning');
  const [status, setStatus] = useState<TeamStatus>('active');
  const [members, setMembers] = useState<string[]>(['']);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (teamToEdit) {
      setId(teamToEdit.id);
      setName(teamToEdit.name);
      setWave(teamToEdit.wave);
      setStatus(teamToEdit.status || 'active');
      setMembers(
        Array.isArray(teamToEdit.members) && teamToEdit.members.length > 0
          ? [...teamToEdit.members]
          : [`Delegado 1`]
      );
    } else {
      // Find first available ID between 1 and 50
      const existingIds = new Set(existingTeams.map((t) => t.id));
      let nextAvailableId = 1;
      while (existingIds.has(nextAvailableId) && nextAvailableId <= 50) {
        nextAvailableId++;
      }
      setId(nextAvailableId <= 50 ? nextAvailableId : 1);
      setName('');
      setWave('morning');
      setStatus('active');
      setMembers(['Delegado 1', 'Delegado 2', 'Delegado 3']);
    }
    setFormError(null);
  }, [teamToEdit, existingTeams, isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (members.length >= 10) return;
    setMembers([...members, `Delegado ${members.length + 1}`]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, val: string) => {
    const updated = [...members];
    updated[index] = val;
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!Number.isInteger(id) || id < 1 || id > 50) {
      setFormError('El ID del equipo debe ser un número entero entre 1 y 50.');
      return;
    }

    if (!name.trim()) {
      setFormError('El nombre del equipo o delegación es requerido.');
      return;
    }

    const cleanMembers = members
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (cleanMembers.length === 0) {
      setFormError('Debe registrar al menos un integrante o delegado en el equipo.');
      return;
    }

    // Check duplicate ID if not editing or changing ID
    if (!isEditing || (teamToEdit && id !== teamToEdit.id)) {
      const isTaken = existingTeams.some((t) => t.id === id);
      if (isTaken) {
        setFormError(`El ID #${id} ya pertenece a otro equipo registrado.`);
        return;
      }
    }

    if (isEditing && teamToEdit) {
      const res = onSave({
        id: teamToEdit.id,
        dto: {
          id: hasHistory ? teamToEdit.id : id,
          name: name.trim(),
          wave,
          status,
          members: cleanMembers,
        },
      });

      if (!res.success) {
        setFormError(res.error || 'Error al actualizar el equipo.');
        return;
      }
    } else {
      const res = onSave({
        id,
        name: name.trim(),
        wave,
        status,
        members: cleanMembers,
      });

      if (!res.success) {
        setFormError(res.error || 'Error al registrar el equipo.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-950 to-red-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-800/80 border border-red-700/60 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEditing ? `Editar Equipo #${teamToEdit?.id}` : 'Registrar Nuevo Equipo'}
              </h3>
              <p className="text-xs text-red-200">
                {isEditing ? 'Actualizar detalles de la delegación' : 'Añadir equipo a la tabulación oficial'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-200 hover:text-white hover:bg-red-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {isEditing && hasHistory && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Historial de Evaluaciones Activo:</strong> El ID #{teamToEdit?.id} se mantiene bloqueado para preservar las puntuaciones registradas en Sala A, B-E y F.
              </div>
            </div>
          )}

          {/* ID & Wave row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID del Equipo (1–50) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={id}
                onChange={(e) => setId(parseInt(e.target.value, 10) || 1)}
                disabled={isEditing && hasHistory}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:bg-slate-100 disabled:text-slate-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Cuadrantes asignados según rango oficial 1 a 50.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Oleada de Participación <span className="text-red-600">*</span>
              </label>
              <select
                value={wave}
                onChange={(e) => setWave(e.target.value as Wave)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              >
                <option value="morning">Oleada Mañana (Morning)</option>
                <option value="afternoon">Oleada Tarde (Afternoon)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Determina el grupo de clasificación al Break.
              </p>
            </div>
          </div>

          {/* Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Delegación / Equipo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Colegio San Ignacio A"
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado <span className="text-red-600">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Integrantes / Oradores ({members.length})
              </label>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={members.length >= 8}
                className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Integrante
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleMemberChange(idx, e.target.value)}
                    placeholder={`Nombre del orador/delegado ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:ring-1 focus:ring-red-600 focus:border-red-600"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                      title="Eliminar orador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Guardar Cambios' : 'Registrar Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
