'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert, Timer, Database } from 'lucide-react';

interface StatsProps {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
  };
  durationMs?: number;
  repoSizeMB?: number;
}

export default function StatsCards({ summary, durationMs, repoSizeMB }: StatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Leaks */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Total Secrets Found</span>
          <AlertOctagon className={`w-4 h-4 ${summary.total > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-white">
            {summary.total}
          </span>
          <span className="text-xs text-slate-400">
            {summary.total === 0 ? 'clean' : 'detected'}
          </span>
        </div>
        <div className={`mt-3 h-1 w-full rounded-full ${summary.total > 0 ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
          <div 
            className={`h-full rounded-full ${summary.total > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: summary.total > 0 ? '100%' : '100%' }}
          />
        </div>
      </div>

      {/* Critical */}
      <div className="glass-panel rounded-2xl p-5 border border-rose-900/30 bg-rose-950/10 relative overflow-hidden transition-all hover:border-rose-800/50">
        <div className="flex items-center justify-between text-rose-300 mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Critical</span>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-rose-400">
            {summary.critical}
          </span>
          <span className="text-xs text-rose-300/70">AWS, Keys, DB</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 truncate">
          Immediate credential revocation recommended
        </p>
      </div>

      {/* High */}
      <div className="glass-panel rounded-2xl p-5 border border-amber-900/30 bg-amber-950/10 relative overflow-hidden transition-all hover:border-amber-800/50">
        <div className="flex items-center justify-between text-amber-300 mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">High</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-amber-400">
            {summary.high}
          </span>
          <span className="text-xs text-amber-300/70">API Keys & Tokens</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 truncate">
          Write-capable or third-party service tokens
        </p>
      </div>

      {/* Medium & Meta */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Medium / Info</span>
          <Timer className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-cyan-400">
            {summary.medium}
          </span>
          <span className="text-xs text-slate-400">items</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-2">
          {durationMs && <span>⚡ {durationMs}ms</span>}
          {repoSizeMB !== undefined && (
            <>
              <span>•</span>
              <span>💾 {repoSizeMB} MB</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
