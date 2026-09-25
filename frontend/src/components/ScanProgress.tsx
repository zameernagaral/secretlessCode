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
    <div className="glass-panel rounded p-6 sm:p-8 border border-accent mb-8 relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Animated Scanner Radar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded bg-surface-50 border border-accent flex items-center justify-center relative">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <div className="absolute inset-0 rounded border border-accent animate-ping" />
          </div>
        </div>

        {/* Status description */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Live Audit In Progress
            </span>
            <span className="inline-block w-2 h-2 rounded bg-accent animate-ping" />
          </div>
          <h3 className="text-lg font-heading font-semibold text-text mt-1 break-all">
            Auditing {repoUrl}
          </h3>
          <p className="text-xs text-muted mt-1 font-body">
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
                      ? 'text-primary'
                      : isCurrent
                      ? 'text-accent font-semibold translate-x-1'
                      : 'text-secondary'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'animate-bounce' : ''}`} />
                  <span>{step.label}</span>
                  {isPast && <span className="text-[10px] text-primary">✓ done</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
