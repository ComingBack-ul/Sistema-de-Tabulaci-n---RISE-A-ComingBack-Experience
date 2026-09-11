import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  KeyRound, 
  Power, 
  Trash2, 
  Shield, 
  Award, 
  UserCheck, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ManagedUser, AuthUser, CreateUserDto, UpdateUserDto, UserRole, UserStatus } from '../../types';
import { 
  loadUsers, 
  createUser, 
  updateUser, 
  changeUserPassword, 
  toggleUserStatus, 
  deleteUser 
} from '../../services/userService';
import { STATION_SPECS } from '../../utils/stationConstants';
import { UserFormModal } from './UserFormModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface UsersManagementProps {
  currentUser: AuthUser;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<ManagedUser[]>(() => loadUsers());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'judge' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState<ManagedUser | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  // Notice banners
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const reloadUsers = () => {
    setUsers(loadUsers());
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const judges = users.filter((u) => u.role === 'judge' && u.status === 'active').length;
    const admins = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;

    return { total, active, judges, admins, inactive };
  }, [users]);

  // Station coverage map
  const stationCoverage = useMemo(() => {
    return STATION_SPECS.map((spec) => {
      const assignedJudge = users.find(
        (u) => u.role === 'judge' && u.status === 'active' && u.stationKey === spec.key
      );
      return {
        spec,
        assignedJudge,
        isCovered: Boolean(assignedJudge),
      };
    });
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (term) {
        const usernameMatch = u.username.toLowerCase().includes(term);
        const nameMatch = u.name.toLowerCase().includes(term);
        const stationMatch = u.stationName?.toLowerCase().includes(term);
        return usernameMatch || nameMatch || Boolean(stationMatch);
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = (payload: {
    isEdit: boolean;
    createDto?: CreateUserDto;
    updateDto?: { username: string; dto: UpdateUserDto };
  }) => {
    if (payload.isEdit && payload.updateDto) {
      const res = updateUser(payload.updateDto.username, payload.updateDto.dto, currentUser);
      if (res.success) {
        reloadUsers();
        showNotice('success', `Usuario @${payload.updateDto.username} actualizado exitosamente.`);
        return { success: true };
      }
      return { success: false, error: res.error };
    } else if (payload.createDto) {
      const res = createUser(payload.createDto, currentUser);
      if (res.success) {
        reloadUsers();
        showNotice('success', `Usuario @${payload.createDto.username} registrado correctamente.`);
        return { success: true };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'Datos inválidos.' };
  };

  const handleOpenPasswordChange = (user: ManagedUser) => {
    setTargetPasswordUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = (username: string, newPass: string) => {
    const res = changeUserPassword(username, newPass, currentUser);
    if (res.success) {
      reloadUsers();
      showNotice('success', `Contraseña de @${username} actualizada con éxito.`);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleToggleStatus = (user: ManagedUser) => {
    const res = toggleUserStatus(user.username, currentUser);
    if (res.success) {
      reloadUsers();
      showNotice(
        'success',
        `Usuario @${user.username} marcado como ${res.newStatus === 'active' ? 'ACTIVO' : 'INACTIVO'}.`
      );
    } else {
      showNotice('error', res.error || 'No se pudo cambiar el estado del usuario.');
    }
  };

  const handleOpenDelete = (user: ManagedUser) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.username, currentUser);
    if (res.success) {
      reloadUsers();
      showNotice('success', `Usuario @${deletingUser.username} eliminado correctamente.`);
    } else {
      showNotice('error', res.error || 'No se pudo eliminar al usuario.');
    }
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
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
            className="text-slate-400 hover:text-slate-700 ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Cuentas</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Activos</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Jueces Activos</p>
          <p className="text-xl font-bold text-red-700 mt-0.5">{stats.judges} <span className="text-xs font-normal text-slate-400">/ 8 salas</span></p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Mesa Directiva</p>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.admins}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inactivos</p>
          <p className="text-xl font-bold text-slate-600 mt-0.5">{stats.inactive}</p>
        </div>
      </div>

      {/* Station Coverage Matrix */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-red-700" />
            Cobertura de Estaciones de Evaluación (8 Salas)
          </h4>
          <span className="text-[11px] text-slate-500">
            Regla: 1 juez activo por estación obligatoriamente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {stationCoverage.map(({ spec, assignedJudge, isCovered }) => (
            <div
              key={spec.key}
              className={`p-2.5 rounded-lg border text-xs transition ${
                isCovered
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] uppercase truncate">{spec.name.split(' - ')[0]}</span>
                {isCovered ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate">{spec.type.toUpperCase()} • {spec.maxPoints} pts</p>
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 truncate font-semibold text-[11px]">
                {assignedJudge ? (
                  <span title={`${assignedJudge.name} (@${assignedJudge.username})`} className="truncate block">
                    {assignedJudge.name}
                  </span>
                ) : (
                  <span className="text-amber-700 italic">Vacante</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, nombre oficial o sala..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* New User button */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition shadow flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Usuario / Juez
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1 mr-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filtros:</span>
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Todos los Roles</option>
            <option value="judge">Solo Jueces de Sala</option>
            <option value="admin">Solo Administradores</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>

          <span className="ml-auto text-slate-400 font-mono">
            Mostrando {filteredUsers.length} de {users.length} cuentas
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre Oficial Evaluador</th>
                <th className="py-3 px-4 w-32">Rol</th>
                <th className="py-3 px-4">Estación Asignada</th>
                <th className="py-3 px-4 w-28 text-center">Estado</th>
                <th className="py-3 px-4 w-44 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No se encontraron usuarios coincidentes.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.status === 'active';
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr
                      key={u.username}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? 'bg-slate-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                        @{u.username}
                      </td>

                      {/* Evaluator name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {u.createdAt ? `Creado: ${new Date(u.createdAt).toLocaleDateString()}` : 'Cuenta Preestablecida'}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdmin
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-red-50 text-red-900 border border-red-200'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-3 h-3 text-amber-600" /> : <Award className="w-3 h-3 text-red-600" />}
                          {isAdmin ? 'Mesa Directiva' : 'Juez de Sala'}
                        </span>
                      </td>

                      {/* Station */}
                      <td className="py-3 px-4 text-xs">
                        {u.role === 'judge' ? (
                          <div>
                            <span className="font-semibold text-slate-800">{u.stationName}</span>
                            <div className="text-[11px] text-slate-400">
                              {u.challengeName || 'Sin desafío asignado'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Acceso Total (Mesa de Tabulación)</span>
                        )}
                      </td>

                      {/* Status */}
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

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Editar usuario"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Password Reset */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordChange(u)}
                            title="Cambiar contraseña de acceso"
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            title={isActive ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                            className={`p-1.5 rounded-md transition ${
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
                            onClick={() => handleOpenDelete(u)}
                            title="Eliminar usuario"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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

      {/* User Form Modal */}
      {isFormOpen && (
        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          userToEdit={editingUser}
          existingUsers={users}
          onSave={handleSaveUser}
        />
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && targetPasswordUser && (
        <PasswordChangeModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setTargetPasswordUser(null);
          }}
          user={targetPasswordUser}
          onSave={handleSavePassword}
        />
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && deletingUser && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingUser(null);
          }}
          targetType="user"
          targetUser={deletingUser}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};
