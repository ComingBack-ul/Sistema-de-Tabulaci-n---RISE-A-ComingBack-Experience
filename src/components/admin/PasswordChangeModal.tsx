import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { ManagedUser } from '../../types';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ManagedUser | null;
  onSave: (username: string, newPassword: string) => { success: boolean; error?: string };
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = newPassword.trim();
    if (!clean) {
      setError('La nueva contraseña no puede estar vacía.');
      return;
    }

    if (clean.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (clean !== confirmPassword.trim()) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    const res = onSave(user.username, clean);
    if (!res.success) {
      setError(res.error || 'Error al actualizar la contraseña.');
      return;
    }

    // Reset and close
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700/80 border border-slate-600/60 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Cambiar Contraseña</h3>
              <p className="text-xs text-slate-300">
                @{user.username} — {user.name}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Por políticas de seguridad, las contraseñas nunca son grabadas en el registro de auditoría.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nueva Contraseña <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 pr-10 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                required
                autoFocus
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña <span className="text-red-600">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Reingrese la contraseña"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-600 focus:border-red-600"
              required
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Actualizar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
