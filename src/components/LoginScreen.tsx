import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AuthUser } from '../types';
import { authenticate } from '../utils/auth';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  onParticipantLogin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onParticipantLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const shouldReduceMotion = useReducedMotion();

  // Auto transition after simple welcome fade (~800ms fade-in + 750ms hold)
  useEffect(() => {
    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 400);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = authenticate(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A1313] via-[#610E0E] to-[#450A0A] text-white flex flex-col justify-between font-['Plus_Jakarta_Sans'] relative overflow-hidden select-none">
      {/* Background subtle lighting accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* Minimal Welcome Animation Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-gradient-to-b from-[#7A1313] via-[#5C0D0D] to-[#3D0808] flex items-center justify-center px-4 cursor-pointer"
            onClick={() => setShowWelcome(false)}
            aria-label="Pantalla de bienvenida - Haz clic para continuar"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-wide font-['Cabinet_Grotesk'] text-white select-none text-center"
            >
              Coming Back
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Branding */}
      <header className="relative z-10 py-4 px-6 sm:px-8 border-b border-red-500/20 bg-black/15 backdrop-blur-xs flex items-center">
        <h1 className="text-lg sm:text-xl font-black tracking-tight font-['Cabinet_Grotesk'] text-white">
          Coming Back
        </h1>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: showWelcome ? 0.2 : 0, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#1F0707]/95 border border-red-500/30 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden"
        >
          {/* Card Header */}
          <div className="p-6 sm:p-8 border-b border-red-500/20 bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="text-2xl sm:text-3xl font-black font-['Cabinet_Grotesk'] tracking-tight text-white">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm text-red-200/80 mt-1.5 leading-relaxed font-normal">
              Ingresa con tu cuenta de Juez de Sala o Administrador de Tabulación
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-950/90 border border-red-500/60 text-red-100 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <div>
              <label 
                htmlFor="login-username"
                className="block text-xs font-bold text-red-200 uppercase tracking-wider mb-2"
              >
                Usuario Oficial *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. Samuel Jimenez"
                  required
                  className="w-full bg-[#2C0C0C] border border-red-500/35 focus:border-red-400 focus:bg-[#380E0E] focus:ring-2 focus:ring-red-400/30 rounded-xl px-3.5 py-3 pl-10 text-sm font-medium text-white placeholder-red-300/40 shadow-inner outline-hidden transition-all"
                />
                <User className="w-4 h-4 text-red-300/60 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label 
                htmlFor="login-password"
                className="block text-xs font-bold text-red-200 uppercase tracking-wider mb-2"
              >
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#2C0C0C] border border-red-500/35 focus:border-red-400 focus:bg-[#380E0E] focus:ring-2 focus:ring-red-400/30 rounded-xl px-3.5 py-3 pl-10 text-sm font-medium text-white placeholder-red-300/40 shadow-inner outline-hidden transition-all"
                />
                <Lock className="w-4 h-4 text-red-300/60 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full mt-2 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-red-950/60 border border-red-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide"
            >
              <span>INGRESAR AL SISTEMA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {onParticipantLogin && (
            <div className="px-6 sm:px-8 pb-8">
              <div className="relative flex items-center py-2 mb-4">
                <div className="flex-grow border-t border-red-500/30"></div>
                <span className="flex-shrink-0 mx-4 text-red-200/50 text-xs font-bold uppercase tracking-widest">o</span>
                <div className="flex-grow border-t border-red-500/30"></div>
              </div>
              <button
                type="button"
                onClick={onParticipantLogin}
                className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-red-100 font-bold py-3.5 px-4 rounded-xl border border-red-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide"
              >
                <span>INGRESAR COMO PARTICIPANTE</span>
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-red-200/70 font-medium tracking-wide border-t border-red-500/20 bg-black/15 backdrop-blur-xs">
        Rise - ComingBack
      </footer>
    </div>
  );
};

