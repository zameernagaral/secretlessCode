'use client';

import React from 'react';
import { ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-surface-200/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SECRETLESS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                CODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ephemeral Credential & Secret Leak Auditor
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gitleaks Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Ephemeral / Zero Persistence</span>
          </div>
        </div>
      </div>
    </header>
  );
}
