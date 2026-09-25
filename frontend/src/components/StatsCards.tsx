'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert, Timer } from 'lucide-react';
import NumberFlow from '@number-flow/react';

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
      <div className="glass-panel rounded border border-secondary p-5 transition-colors hover:border-primary">
        <div className="flex items-center justify-between text-muted mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Total Secrets Found</span>
          <AlertOctagon className={`w-4 h-4 ${summary.total > 0 ? 'text-[#C13B2E]' : 'text-muted'}`} />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-text">
            <NumberFlow value={summary.total} />
          </span>
          <span className="text-xs text-muted">
            {summary.total === 0 ? 'clean' : 'detected'}
          </span>
        </div>
        <div className={`mt-3 h-1 w-full rounded bg-surface-50`}>
          <div 
            className={`h-full rounded ${summary.total > 0 ? 'bg-[#C13B2E]' : 'bg-secondary'}`}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Critical */}
      <div className="glass-panel rounded p-5 border border-secondary transition-colors hover:border-[#C13B2E]">
        <div className="flex items-center justify-between text-[#C13B2E] mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Critical</span>
          <ShieldAlert className="w-4 h-4 text-[#C13B2E]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#C13B2E]">
            {summary.critical}
          </span>
          <span className="text-xs text-muted">AWS, Keys, DB</span>
        </div>
        <p className="text-[11px] text-muted mt-2 truncate font-body">
          Immediate credential revocation recommended
        </p>
      </div>

      {/* High */}
      <div className="glass-panel rounded p-5 border border-secondary transition-colors hover:border-[#D97C2B]">
        <div className="flex items-center justify-between text-[#D97C2B] mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">High</span>
          <AlertTriangle className="w-4 h-4 text-[#D97C2B]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#D97C2B]">
            {summary.high}
          </span>
          <span className="text-xs text-muted">API Keys & Tokens</span>
        </div>
        <p className="text-[11px] text-muted mt-2 truncate font-body">
          Write-capable or third-party service tokens
        </p>
      </div>

      {/* Medium & Meta */}
      <div className="glass-panel rounded p-5 border border-secondary transition-colors hover:border-[#C9A227]">
        <div className="flex items-center justify-between text-[#C9A227] mb-2">
          <span className="text-xs uppercase tracking-wider font-mono font-medium">Medium / Info</span>
          <Timer className="w-4 h-4 text-[#C9A227]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#C9A227]">
            {summary.medium}
          </span>
          <span className="text-xs text-muted">items</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-muted mt-2 font-mono">
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
