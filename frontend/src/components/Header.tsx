'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Terminal, Cpu, Mail, Menu, X } from 'lucide-react';

// Temporarily disabled Clerk to prevent missing API key crash
// import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded bg-surface-50 border border-secondary text-xs text-muted font-mono">
            <Lock className="w-3 h-3 text-muted" />
            <span>Zero Persistence</span>
          </div>

          <a 
            href="mailto:support@secretlesscode.com"
            className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded bg-surface-50 border border-secondary text-xs text-muted font-mono hover:text-text hover:border-accent transition-colors"
          >
            <Mail className="w-3 h-3" />
            <span>Support</span>
          </a>

          {/* Auth Buttons - Desktop Only */}
          <div className="hidden md:flex pl-2 border-l border-secondary items-center min-w-[80px] justify-center">
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

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex items-center text-text p-1 hover:text-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-secondary bg-surface-200 px-4 py-4 space-y-4">
          <div className="flex items-center space-x-2 px-3 py-2 rounded bg-surface-100 border border-secondary text-xs text-text font-body">
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span>Gitleaks Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>
          
          <div className="flex items-center space-x-1.5 px-3 py-2 rounded bg-surface-50 border border-secondary text-xs text-muted font-mono">
            <Lock className="w-3 h-3 text-muted" />
            <span>Zero Persistence</span>
          </div>
          
          <a 
            href="mailto:support@secretlesscode.com"
            className="flex items-center space-x-2 px-3 py-2 rounded bg-surface-50 border border-secondary text-sm text-text font-body hover:border-accent transition-colors"
          >
            <Mail className="w-4 h-4 text-muted" />
            <span>Support</span>
          </a>
          
          {isLoaded && !isSignedIn && (
             <button className="w-full text-sm font-body font-semibold text-text bg-surface-50 border border-secondary hover:bg-surface-100 px-4 py-2 rounded transition-colors mt-2">
               Sign In
             </button>
          )}
        </div>
      )}
    </header>
  );
}
