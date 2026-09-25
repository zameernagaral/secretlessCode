'use client';

import React, { useState } from 'react';
import { Github, ArrowRight, Shield, AlertCircle } from 'lucide-react';

interface ScanFormProps {
  onScan: (url: string) => void;
  isLoading: boolean;
}

// Real public repos for quick-test — no mock data
const SAMPLE_REPOS = [
  { label: 'octocat/Hello-World', url: 'https://github.com/octocat/Hello-World' },
  { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
];

// Strict client-side regex matching the backend validator exactly
const GITHUB_URL_REGEX =
  /^https:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\/([a-zA-Z0-9_.\-]{1,100}?)(?:\.git|\/)?$/;

export default function ScanForm({ onScan, isLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const validate = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setValidationError('Please enter a GitHub repository URL.');
      return false;
    }
    if (trimmed.length > 300) {
      setValidationError('URL is too long.');
      return false;
    }
    if (!trimmed.startsWith('https://github.com/')) {
      setValidationError('Only public https://github.com URLs are supported.');
      return false;
    }
    if (!GITHUB_URL_REGEX.test(trimmed)) {
      setValidationError('Invalid URL. Expected: https://github.com/<owner>/<repository>');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate(url)) {
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
          Paste a public GitHub repo URL. We perform an isolated shallow clone, run static analysis, return masked findings, and instantly purge the sandbox.
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
              id="repo-url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) validate(e.target.value);
              }}
              placeholder="https://github.com/owner/repository"
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
              aria-label="GitHub repository URL"
              aria-describedby={validationError ? 'url-error' : undefined}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            id="scan-submit-btn"
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
          >
            <span>{isLoading ? 'Scanning...' : 'Scan Repository'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        {validationError && (
          <div id="url-error" role="alert" className="mt-2.5 px-2 flex items-center space-x-1.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick real-repo shortcuts — no mock data */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Quick Scan:</span>
          {SAMPLE_REPOS.map((sample) => (
            <button
              key={sample.url}
              type="button"
              onClick={() => handleSelectSample(sample.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700 font-mono text-[11px] transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
