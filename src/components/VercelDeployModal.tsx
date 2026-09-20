import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Globe, Github, Terminal, Sparkles, Server } from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const gitCommands = `# 1. Inisialisasi Git di folder project
git init

# 2. Tambahkan semua file dan buat commit
git add .
git commit -m "feat: inisialisasi HAMA PRO EDITING siap deploy Vercel"

# 3. Ganti dengan URL repositori GitHub Anda
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA_REPO.git

# 4. Upload ke GitHub
git push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Deploy ke Vercel via GitHub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Siap Deploy
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Langkah mudah mempublikasikan HAMA PRO EDITING ke domain Vercel gratis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Configuration Badges */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300 truncate">vercel.json</div>
                <div className="text-[10px] text-emerald-400">Terkonfigurasi</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300 truncate">api/index.ts</div>
                <div className="text-[10px] text-emerald-400">Serverless AI Ready</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300 truncate">Build Output</div>
                <div className="text-[10px] text-emerald-400">dist (Vite 60FPS)</div>
              </div>
            </div>
          </div>

          {/* STEP 1: Git Push */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                  1
                </span>
                <Github className="w-4 h-4 text-indigo-400" />
                <span>Upload Kode ke Repositori GitHub</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Perintah'}</span>
              </button>
            </div>
            <div className="relative rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-300 border border-slate-800/80">
              <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-indigo-200/90">
                {gitCommands}
              </pre>
            </div>
          </div>

          {/* STEP 2: Import to Vercel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                2
              </span>
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Import Project di Vercel Dashboard</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                1. Buka{' '}
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  vercel.com/new <ExternalLink className="w-3 h-3" />
                </a>{' '}
                dan login dengan akun GitHub Anda.
              </p>
              <p>2. Pilih repositori GitHub yang baru saja Anda buat, lalu klik tombol <b>Import</b>.</p>
              <p className="text-slate-400">
                Framework preset (<code className="text-cyan-300 font-mono">Vite</code>) dan build output (<code className="text-cyan-300 font-mono">dist</code>) akan otomatis terdeteksi dari file <code className="text-slate-200 font-mono">vercel.json</code>.
              </p>
            </div>
          </div>

          {/* STEP 3: Environment Variable */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-xs">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs">
                3
              </span>
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Environment Variable untuk Fitur AI (Opsional)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Pada bagian <b>Environment Variables</b> di halaman konfigurasi Vercel:
              </p>
              <div className="flex items-center gap-2 font-mono bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-pink-400">GEMINI_API_KEY</span>
                <span className="text-slate-500">=</span>
                <span className="text-slate-400">AIzaSy... (API Key dari Google AI Studio)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Jika tanpa API key, seluruh fungsi video equalizer, slide foto, efek video, pemutar lagu, dan lirik manual tetap bekerja normal 100%!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-xs text-slate-400">
            File instruksi lengkap juga tersimpan di <code className="text-slate-200 font-mono">README.md</code>
          </span>
          <div className="flex items-center gap-2">
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Vercel</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
