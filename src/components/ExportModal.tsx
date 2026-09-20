import React from 'react';
import { Film, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  progress: number; // 0 to 1
  elapsedTime: number;
  totalTime: number;
  onCancel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  progress,
  elapsedTime,
  totalTime,
  onCancel,
}) => {
  if (!isOpen) return null;

  const percentage = Math.min(100, Math.floor(progress * 100));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400 animate-spin" />
            Ekspor Video & Audio Sedang Berjalan
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-1 rounded font-bold">
            {percentage}%
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Kanvas sedang merender seluruh slide dan membakar (burn-in) efek visual equalizer bersama
          musik latar serta efek suara SFX ke dalam file video. Jangan menutup tab browser ini.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-150 shadow-sm"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Timer stats */}
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>
            Waktu Rekam: <strong className="text-slate-200">{elapsedTime.toFixed(1)}s</strong>
          </span>
          <span>
            Total Durasi: <strong className="text-slate-200">{totalTime.toFixed(1)}s</strong>
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};
