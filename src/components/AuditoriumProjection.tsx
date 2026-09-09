import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Flame, 
  Crown, 
  Play, 
  RotateCcw, 
  Shield, 
  Key, 
  Award,
  ChevronRight,
  Eye
} from 'lucide-react';

interface AuditoriumProjectionProps {
  teams: Team[];
}

export const AuditoriumProjection: React.FC<AuditoriumProjectionProps> = ({ teams }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'burgundy' | 'pristine_white'>('burgundy');
  const [revealStep, setRevealStep] = useState<number>(0); 
  // 0: Standby / Countdown to 2:25 PM
  // 1: Reveal Mañana #1
  // 2: Reveal Mañana #2
  // 3: Reveal Tarde #1
  // 4: Reveal Tarde #2
  // 5: Grand Top 4 Showcase

  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Top 2 of Morning Wave and Top 2 of Afternoon Wave
  const morningTop2 = teams
    .filter((t) => t.wave === 'morning')
    .sort((a, b) => a.waveRank - b.waveRank)
    .slice(0, 2);

  const afternoonTop2 = teams
    .filter((t) => t.wave === 'afternoon')
    .sort((a, b) => a.waveRank - b.waveRank)
    .slice(0, 2);

  const top4List = [...morningTop2, ...afternoonTop2];

  // Trigger confetti when grand reveal occurs
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#dc2626', '#b91c1c', '#fbbf24', '#ffffff']
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ef4444', '#f59e0b', '#ffffff']
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ef4444', '#f59e0b', '#ffffff']
        });
      }, 300);
    } catch (e) {
      console.warn('Confetti error', e);
    }
  };

  const handleNextStep = () => {
    const next = revealStep + 1;
    setRevealStep(next);
    if (next === 5 || next === 1 || next === 2 || next === 3 || next === 4) {
      triggerCelebration();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const isBurgundy = themeMode === 'burgundy';

  return (
    <div
      className={`min-h-screen transition-colors duration-500 flex flex-col justify-between ${
        isBurgundy
          ? 'bg-gradient-to-b from-red-950 via-red-900 to-black text-white'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Projection Top Toolbar (Discreet for Presenter) */}
      <div
        className={`px-6 py-3 flex items-center justify-between border-b ${
          isBurgundy
            ? 'bg-red-950/80 border-red-800 text-red-100'
            : 'bg-white border-red-200 text-slate-700 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center font-black">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide uppercase font-['Cabinet_Grotesk']">
              COMING BACK ANIVERSARIO &bull; BREAK REVEAL
            </h1>
            <p className="text-[10px] opacity-80">
              Ceremonia Oficial de Clasificación a Semifinales
            </p>
          </div>
        </div>

        {/* Presenter Controls */}
        <div className="flex items-center gap-2">
          {/* Step Indicator */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
              isBurgundy ? 'bg-red-900 border border-red-700 text-yellow-300' : 'bg-red-100 text-red-900'
            }`}
          >
            Fase: {revealStep === 0 ? 'Espera (2:25 PM)' : `Paso ${revealStep}/5`}
          </div>

          {/* Next Reveal Button */}
          {revealStep < 5 ? (
            <button
              type="button"
              id="btn-reveal-next-step"
              onClick={handleNextStep}
              className="bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              <Play className="w-3.5 h-3.5 fill-red-950" />
              <span>{revealStep === 0 ? 'Iniciar Revelación' : 'Revelar Siguiente'}</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-reveal-reset"
              onClick={() => setRevealStep(0)}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar Ceremonia</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setThemeMode(isBurgundy ? 'pristine_white' : 'burgundy')}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
              isBurgundy
                ? 'border-red-700 bg-red-900/60 hover:bg-red-800 text-red-200'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Cambiar Contraste Proyector (Oscuro / Claro)"
          >
            {isBurgundy ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
              isBurgundy
                ? 'border-red-700 bg-red-900/60 hover:bg-red-800 text-red-200'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Projection Canvas */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 text-center max-w-6xl mx-auto w-full">
        {/* VIEW STAGE 0: Pre-Reveal Standby */}
        {revealStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-200 text-sm font-extrabold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Ceremonia Oficial de Resultados
            </div>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight font-['Cabinet_Grotesk'] drop-shadow-lg">
              ANUNCIO DEL BREAK
            </h2>
            <p className="text-lg sm:text-2xl font-medium max-w-2xl mx-auto opacity-90">
              Clasificación oficial a Semifinales del Torneo de Debate & Escape Room{' '}
              <strong className="text-yellow-400">Coming Back Aniversario</strong>.
            </p>

            {/* Target 2:25 PM Notice & Clock */}
            <div
              className={`p-6 rounded-3xl max-w-md mx-auto border-2 shadow-2xl ${
                isBurgundy
                  ? 'bg-red-900/60 border-red-600 text-white backdrop-blur-md'
                  : 'bg-white border-red-300 text-slate-900 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2">
                <Clock className="w-4 h-4" />
                <span>Hora Oficial de Revelación: 2:25 PM</span>
              </div>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-red-500 py-1">
                {currentTime}
              </div>
              <p className="text-xs opacity-75 mt-2">
                50 Equipos &bull; 150 Salas Evaluadas &bull; 4 Pases a Semifinales
              </p>
            </div>

            <button
              type="button"
              id="btn-start-ceremony-hero"
              onClick={handleNextStep}
              className="mt-4 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-red-950 font-black text-lg sm:text-xl rounded-2xl shadow-2xl transition-all cursor-pointer flex items-center gap-3 mx-auto border-2 border-white"
            >
              <Crown className="w-6 h-6" />
              <span>COMENZAR REVELACIÓN DE CLASIFICADOS</span>
            </button>
          </div>
        )}

        {/* VIEW STAGE 1: Reveal Morning #1 */}
        {revealStep === 1 && morningTop2[0] && (
          <div className="space-y-6 animate-fade-in w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 text-sm font-extrabold uppercase tracking-widest">
              🌅 OLEADA MAÑANA &bull; 1er CLASIFICADO
            </div>

            <div
              className={`p-8 sm:p-12 rounded-3xl border-4 shadow-2xl transform transition-all scale-105 ${
                isBurgundy
                  ? 'bg-gradient-to-b from-red-800 to-red-950 border-amber-400 text-white'
                  : 'bg-white border-red-700 text-slate-900'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-amber-400 text-red-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg mb-4">
                #1
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 block">
                Equipo #{morningTop2[0].id}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black font-['Cabinet_Grotesk'] tracking-tight text-yellow-300 my-2">
                {morningTop2[0].name}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-red-200 mt-2">
                Integrantes: {morningTop2[0].members.join(' &bull; ')}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/20">
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Debate B-E</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {morningTop2[0].scores.salaBE.debatePoints} pts
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Crisis F</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {morningTop2[0].scores.salaF.crisisPoints} pts
                  </span>
                </div>
                <div className="bg-amber-400/20 border border-amber-400/50 p-3 rounded-xl">
                  <span className="text-[11px] text-amber-300 font-bold block">Puntaje Total</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                    {morningTop2[0].totalScore} pts
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-white text-red-900 font-black rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Revelar 2do Clasificado de la Mañana</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* VIEW STAGE 2: Reveal Morning #2 */}
        {revealStep === 2 && morningTop2[1] && (
          <div className="space-y-6 animate-fade-in w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 text-sm font-extrabold uppercase tracking-widest">
              🌅 OLEADA MAÑANA &bull; 2do CLASIFICADO
            </div>

            <div
              className={`p-8 sm:p-12 rounded-3xl border-4 shadow-2xl transform transition-all scale-105 ${
                isBurgundy
                  ? 'bg-gradient-to-b from-red-800 to-red-950 border-amber-400 text-white'
                  : 'bg-white border-red-700 text-slate-900'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-slate-200 text-red-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg mb-4">
                #2
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 block">
                Equipo #{morningTop2[1].id}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black font-['Cabinet_Grotesk'] tracking-tight text-yellow-300 my-2">
                {morningTop2[1].name}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-red-200 mt-2">
                Integrantes: {morningTop2[1].members.join(' &bull; ')}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/20">
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Debate B-E</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {morningTop2[1].scores.salaBE.debatePoints} pts
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Crisis F</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {morningTop2[1].scores.salaF.crisisPoints} pts
                  </span>
                </div>
                <div className="bg-amber-400/20 border border-amber-400/50 p-3 rounded-xl">
                  <span className="text-[11px] text-amber-300 font-bold block">Puntaje Total</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                    {morningTop2[1].totalScore} pts
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-white text-red-900 font-black rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Continuar con Clasificados de la Tarde</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* VIEW STAGE 3: Reveal Afternoon #1 */}
        {revealStep === 3 && afternoonTop2[0] && (
          <div className="space-y-6 animate-fade-in w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/30 border border-blue-400 text-blue-300 text-sm font-extrabold uppercase tracking-widest">
              🌇 OLEADA TARDE &bull; 1er CLASIFICADO
            </div>

            <div
              className={`p-8 sm:p-12 rounded-3xl border-4 shadow-2xl transform transition-all scale-105 ${
                isBurgundy
                  ? 'bg-gradient-to-b from-red-800 to-red-950 border-blue-400 text-white'
                  : 'bg-white border-red-700 text-slate-900'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-blue-400 text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg mb-4">
                #1
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300 block">
                Equipo #{afternoonTop2[0].id}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black font-['Cabinet_Grotesk'] tracking-tight text-blue-200 my-2">
                {afternoonTop2[0].name}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-blue-100 mt-2">
                Integrantes: {afternoonTop2[0].members.join(' &bull; ')}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/20">
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Debate B-E</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {afternoonTop2[0].scores.salaBE.debatePoints} pts
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Crisis F</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {afternoonTop2[0].scores.salaF.crisisPoints} pts
                  </span>
                </div>
                <div className="bg-blue-400/20 border border-blue-400/50 p-3 rounded-xl">
                  <span className="text-[11px] text-blue-300 font-bold block">Puntaje Total</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-blue-300">
                    {afternoonTop2[0].totalScore} pts
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-white text-red-900 font-black rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Revelar 2do Clasificado de la Tarde</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* VIEW STAGE 4: Reveal Afternoon #2 */}
        {revealStep === 4 && afternoonTop2[1] && (
          <div className="space-y-6 animate-fade-in w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/30 border border-blue-400 text-blue-300 text-sm font-extrabold uppercase tracking-widest">
              🌇 OLEADA TARDE &bull; 2do CLASIFICADO
            </div>

            <div
              className={`p-8 sm:p-12 rounded-3xl border-4 shadow-2xl transform transition-all scale-105 ${
                isBurgundy
                  ? 'bg-gradient-to-b from-red-800 to-red-950 border-blue-400 text-white'
                  : 'bg-white border-red-700 text-slate-900'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg mb-4">
                #2
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300 block">
                Equipo #{afternoonTop2[1].id}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black font-['Cabinet_Grotesk'] tracking-tight text-blue-200 my-2">
                {afternoonTop2[1].name}
              </h3>
              <p className="text-sm sm:text-base font-semibold text-blue-100 mt-2">
                Integrantes: {afternoonTop2[1].members.join(' &bull; ')}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/20">
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Debate B-E</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {afternoonTop2[1].scores.salaBE.debatePoints} pts
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl">
                  <span className="text-[11px] opacity-75 block">Crisis F</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {afternoonTop2[1].scores.salaF.crisisPoints} pts
                  </span>
                </div>
                <div className="bg-blue-400/20 border border-blue-400/50 p-3 rounded-xl">
                  <span className="text-[11px] text-blue-300 font-bold block">Puntaje Total</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-blue-300">
                    {afternoonTop2[1].totalScore} pts
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-yellow-400 text-red-950 font-black rounded-xl hover:bg-yellow-300 transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-xl animate-bounce"
            >
              <Crown className="w-5 h-5" />
              <span>Ver el Cuadro Final TOP 4 Semifinales</span>
            </button>
          </div>
        )}

        {/* VIEW STAGE 5: Grand Top 4 Final Showcase */}
        {revealStep === 5 && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-['Cabinet_Grotesk'] text-yellow-300 drop-shadow-md">
                TOP 4 - CLASIFICADOS AL BREAK
              </h2>
            </div>
            <p className="text-base sm:text-xl font-medium opacity-90 max-w-xl mx-auto">
              ¡Felicitaciones a las 4 delegaciones que avanzan a la Gran Semifinal!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {top4List.map((team, idx) => {
                const isMorning = team.wave === 'morning';
                return (
                  <div
                    key={team.id}
                    className={`p-6 rounded-2xl border-2 text-left shadow-2xl relative overflow-hidden transition-all hover:scale-105 ${
                      isBurgundy
                        ? 'bg-gradient-to-b from-red-900/90 to-black border-yellow-400 text-white'
                        : 'bg-white border-red-700 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                          isMorning ? 'bg-amber-400 text-red-950' : 'bg-blue-400 text-slate-950'
                        }`}
                      >
                        {isMorning ? 'Mañana' : 'Tarde'} &bull; Pase #{team.waveRank}
                      </span>
                      <span className="font-mono text-xs font-bold text-yellow-400">
                        Equipo #{team.id}
                      </span>
                    </div>

                    <h4 className="text-xl font-black font-['Cabinet_Grotesk'] leading-tight mb-2 text-yellow-300 truncate">
                      {team.name}
                    </h4>

                    <div className="space-y-1 my-3 text-xs opacity-90 border-t border-white/10 pt-2">
                      <p className="font-semibold text-slate-200">
                        {team.members.join(', ')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/20 flex items-baseline justify-between">
                      <span className="text-xs opacity-75">Puntaje Total:</span>
                      <span className="text-2xl font-black font-mono text-yellow-300">
                        {team.totalScore} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={triggerCelebration}
                className="px-6 py-2.5 bg-yellow-400 text-red-950 font-black rounded-xl hover:bg-yellow-300 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lanzar Confetti</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Projection Footer */}
      <div
        className={`px-6 py-3 flex items-center justify-between text-xs border-t ${
          isBurgundy ? 'bg-black/60 border-red-900 text-red-300' : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <span>Coming Back Aniversario &bull; Sistema Oficial de Tabulación</span>
        <span>Desempate: 1º Debate (50p) &bull; 2º Crisis (25p)</span>
      </div>
    </div>
  );
};
