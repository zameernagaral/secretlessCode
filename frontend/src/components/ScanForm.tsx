'use client';

import React, { useState } from 'react';
import { Search, Github, ArrowRight, Sparkles, Shield, AlertCircle } from 'lucide-react';

interface ScanFormProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  onLoadDemo: () => void;
}

const SAMPLE_REPOS = [
  { label: 'Clean Test Repo (octocat/Hello-World)', url: 'https://github.com/octocat/Hello-World' },
  { label: 'Express Starter (expressjs/express)', url: 'https://github.com/expressjs/express' },
];

export default function ScanForm({ onScan, isLoading, onLoadDemo }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateUrl = (val: string) => {
    if (!val.trim()) {
      setValidationError('Please enter a GitHub repository URL.');
      return false;
    }
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git|\/)?$/;
    if (!githubRegex.test(val.trim())) {
      setValidationError('URL must match: https://github.com/<owner>/<repo>');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      onScan(url.trim());
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setValidationError('');
    onScan(sampleUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      {/* Hero Headline */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-mono mb-4">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Automated Credential Leak Scanner • Gitleaks Subprocess</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Audit Any Public GitHub Repo for{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Leaked Secrets
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Paste a public GitHub repo URL. We perform an isolated shallow clone, run Gitleaks static analysis, return masked findings, and instantly purge the workspace.
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-2xl shadow-cyan-950/20">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Github className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) validateUrl(e.target.value);
              }}
              placeholder="https://github.com/owner/repository"
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-medium text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20 font-semibold"
          >
            <span>{isLoading ? 'Scanning...' : 'Scan Repository'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        {validationError && (
          <div className="mt-2.5 px-2 flex items-center space-x-1.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick Sample Repos & Mock Demo Pill */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-mono text-[11px]">Quick Tests:</span>
            {SAMPLE_REPOS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700 font-mono text-[11px] transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Instant Demo Visualization Button */}
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/90 font-mono text-[11px] transition-colors"
            title="Preview detection report with dummy AWS, Stripe, and Database secrets"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Instant Demo Mock Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
