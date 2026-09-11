import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Award, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { ManagedUser, CreateUserDto, UpdateUserDto, UserRole, UserStatus, StationKey } from '../../types';
import { STATION_SPECS } from '../../utils/stationConstants';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: ManagedUser | null;
  existingUsers: ManagedUser[];
  onSave: (payload: { isEdit: boolean; createDto?: CreateUserDto; updateDto?: { username: string; dto: UpdateUserDto } }) => { success: boolean; error?: string };
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  existingUsers,
  onSave,
}) => {
  const isEditing = Boolean(userToEdit);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('judge');
  const [password, setPassword] = useState('');
  const [stationKey, setStationKey] = useState<StationKey>('sala_a1');
  const [status, setStatus] = useState<UserStatus>('active');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setName(userToEdit.name);
      setRole(userToEdit.role);
      setStationKey(userToEdit.stationKey || 'sala_a1');
      setStatus(userToEdit.status || 'active');
      setPassword('');
    } else {
      setUsername('');
      setName('');
      setRole('judge');
      setStationKey('sala_a1');
      setStatus('active');
      setPassword('');
    }
    setFormError(null);
    setShowPassword(false);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  // Station collision check: is this station currently occupied by another active judge?
  const conflictingActiveJudge =
    role === 'judge' && status === 'active'
      ? existingUsers.find(
          (u) =>
            u.role === 'judge' &&
            u.status === 'active' &&
            u.stationKey === stationKey &&
            (!isEditing || u.username.toLowerCase() !== userToEdit?.username.toLowerCase())
        )
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanUsername) {
      setFormError('El nombre de usuario es requerido.');
      return;
    }

    if (cleanUsername.length < 3) {
      setFormError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!cleanName) {
      setFormError('El nombre oficial del evaluador o directivo es requerido.');
      return;
    }

    if (!isEditing) {
      if (!password.trim()) {
        setFormError('La contraseña inicial es requerida para nuevos usuarios.');
        return;
      }
      if (password.trim().length < 4) {
        setFormError('La contraseña debe tener al menos 4 caracteres.');
        return;
      }

      // Check unique username
      const exists = existingUsers.some((u) => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        setFormError(`El nombre de usuario "@${cleanUsername}" ya se encuentra registrado.`);
        return;
      }
    }

    // Role-station validation
    if (role === 'judge' && !stationKey) {
      setFormError('Debe asignar una sala/estación obligatoria para el juez.');
      return;
    }

    // Check active judge station conflict
    if (role === 'judge' && status === 'active' && conflictingActiveJudge) {
      setFormError(
        `Conflicto de estación: La estación ya está asignada al juez activo "${conflictingActiveJudge.name}" (@${conflictingActiveJudge.username}). No puede haber dos jueces activos en la misma sala.`
      );
      return;
    }

    if (isEditing && userToEdit) {
      const updatePayload: UpdateUserDto = {
        name: cleanName,
        role,
        stationKey: role === 'judge' ? stationKey : undefined,
        status,
      };

      const res = onSave({
        isEdit: true,
        updateDto: {
          username: userToEdit.username,
          dto: updatePayload,
        },
      });

      if (!res.success) {
        setFormError(res.error || 'Error al actualizar usuario.');
        return;
      }
    } else {
      const createPayload: CreateUserDto = {
        username: cleanUsername,
        name: cleanName,
        role,
        password: password.trim(),
        stationKey: role === 'judge' ? stationKey : undefined,
        status,
      };

      const res = onSave({
        isEdit: false,
        createDto: createPayload,
      });

      if (!res.success) {
        setFormError(res.error || 'Error al crear usuario.');
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
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700/80 border border-slate-600/60 flex items-center justify-center">
              {role === 'admin' ? <Shield className="w-5 h-5 text-amber-400" /> : <Award className="w-5 h-5 text-red-400" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEditing ? `Editar Usuario @${userToEdit?.username}` : 'Registrar Nuevo Usuario / Juez'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? 'Actualizar perfil y permisos de acceso' : 'Crear credencial para evaluador o mesa directiva'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {conflictingActiveJudge && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso de Asignación:</strong> La estación seleccionada ya está asignada al juez activo <strong>{conflictingActiveJudge.name}</strong> (@{conflictingActiveJudge.username}). Para continuar, desactive o reasigne primero a ese juez.
              </div>
            </div>
          )}

          {/* Username & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de Usuario <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                disabled={isEditing}
                placeholder="ej. juez_sala_a1"
                maxLength={40}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:bg-slate-100 disabled:text-slate-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Identificador único del sistema.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre Oficial del Evaluador <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Lic. Roberto Gómez"
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Visible en boletas de evaluación.</p>
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rol en el Torneo <span className="text-red-600">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="judge">Juez Evaluador de Sala</option>
                <option value="admin">Administrador (Mesa Directiva)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado de la Cuenta <span className="text-red-600">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="active">Activo (Acceso Habilitado)</option>
                <option value="inactive">Inactivo (Acceso Suspendido)</option>
              </select>
            </div>
          </div>

          {/* Station selector (only for judge role) */}
          {role === 'judge' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Estación Asignada <span className="text-red-600">*</span>
              </label>
              <select
                value={stationKey}
                onChange={(e) => setStationKey(e.target.value as StationKey)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium bg-white focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
              >
                {STATION_SPECS.map((spec) => (
                  <option key={spec.key} value={spec.key}>
                    {spec.name} ({spec.type.toUpperCase()} • Máx {spec.maxPoints} pts)
                  </option>
                ))}
              </select>

              {STATION_SPECS.find((s) => s.key === stationKey) && (
                <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <p>
                    <strong>Desafío de Escape:</strong>{' '}
                    {STATION_SPECS.find((s) => s.key === stationKey)?.challengeName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {STATION_SPECS.find((s) => s.key === stationKey)?.challengeDescription}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Password field - Only during creation */}
          {!isEditing ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contraseña de Acceso <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 pr-10 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Clave inicial que el evaluador o directivo ingresará para autenticarse.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                La contraseña se administra de forma independiente. Para restablecer o cambiar la contraseña de <strong>@{userToEdit?.username}</strong>, utilice el botón con ícono de llave en la tabla de usuarios.
              </span>
            </div>
          )}

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
              disabled={Boolean(conflictingActiveJudge)}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
