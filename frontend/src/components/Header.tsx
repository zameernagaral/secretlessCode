'use client';

import React from 'react';
import { ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';

// Temporarily disabled Clerk to prevent missing API key crash
// import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  // const { isSignedIn, isLoaded } = useAuth();
  const isSignedIn = false;
  const isLoaded = true;

  return (
    <header className="border-b border-secondary bg-surface-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-lg tracking-tight text-text">
                SECRETLESS
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-surface-50 text-accent border border-secondary">
                CODE
              </span>
            </div>
            <p className="text-[11px] text-muted hidden sm:block font-body">
              Ephemeral Credential & Secret Leak Auditor
            </p>
          </div>
        </div>

        {/* Status Indicators & Auth */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded bg-surface-100 border border-secondary text-xs text-text font-body">
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span>Gitleaks Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-surface-50 border border-secondary text-xs text-muted font-mono">
            <Lock className="w-3 h-3 text-muted" />
            <span>Zero Persistence</span>
          </div>

          {/* Auth Buttons */}
          <div className="pl-2 border-l border-secondary flex items-center min-w-[80px] justify-center">
            {isLoaded ? (
              isSignedIn ? (
                <div className="w-8 h-8 rounded bg-surface-100 flex items-center justify-center text-xs text-text border border-secondary">U</div>
              ) : (
                <button className="text-sm font-body font-semibold text-text bg-surface-50 border border-secondary hover:bg-surface-100 px-4 py-1.5 rounded transition-colors">
                  Sign In
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
