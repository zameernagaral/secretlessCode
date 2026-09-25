'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, GitFork, ShieldAlert, Cpu, Trash2, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { label: 'Verifying GitHub repository & URL sanitation', icon: GitFork },
  { label: 'Isolated shallow clone (depth: 1) into ephemeral sandbox', icon: Cpu },
  { label: 'Executing Gitleaks static analysis subprocess', icon: ShieldAlert },
  { label: 'Parsing rules, masking secrets, and sanitizing output', icon: CheckCircle2 },
  { label: 'Executing guaranteed sandbox purge (try...finally)', icon: Trash2 },
];

export default function ScanProgress({ repoUrl }: { repoUrl: string }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/20 bg-surface-100/80 mb-8 relative overflow-hidden shadow-2xl shadow-cyan-950/30">
      {/* Animated Scan Line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Animated Scanner Radar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center relative">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="absolute inset-0 rounded-2xl ring-2 ring-cyan-500/20 animate-ping" />
          </div>
        </div>

        {/* Status description */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Live Audit In Progress
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <h3 className="text-lg font-semibold text-white mt-1 break-all">
            Auditing {repoUrl}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Running isolated security inspection. Repository is deleted immediately after scanning.
          </p>

          {/* Stepper */}
          <div className="mt-5 space-y-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 text-xs font-mono transition-all duration-300 ${
                    isPast
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-cyan-300 font-semibold translate-x-1'
                      : 'text-slate-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'animate-bounce' : ''}`} />
                  <span>{step.label}</span>
                  {isPast && <span className="text-[10px] text-emerald-500">✓ done</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
