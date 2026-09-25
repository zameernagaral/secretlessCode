'use client';

import React, { useState } from 'react';
import { Github, ArrowRight, Shield, AlertCircle, Settings2 } from 'lucide-react';
import { SmoothInput } from '@/components/ui/skiper-ui/skiper106';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/skiper-ui/skiper101';
import { Skiper3 } from '@/components/ui/skiper-ui/skiper3';

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
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded bg-surface-50 border border-secondary text-primary text-xs font-mono mb-4">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Automated Credential Leak Scanner • Gitleaks Subprocess</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight text-text mb-4">
          Audit Any Public GitHub Repo for{' '}
          <span className="text-primary">
            Leaked Secrets
          </span>
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto font-body">
          Paste a public GitHub repo URL. We perform an isolated shallow clone, run static analysis, return masked findings, and instantly purge the sandbox.
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-panel rounded p-3 sm:p-4 border border-secondary">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
              <Github className="w-5 h-5" />
            </div>
            <SmoothInput
              id="repo-url-input"
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
              className="w-full text-text placeholder-muted font-mono text-sm focus:outline-none"
              wrapperClassName="w-full pl-12 pr-4 py-3.5 bg-surface-50 border border-secondary rounded focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all"
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="scan-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-full items-center justify-center space-x-2 px-6 py-4 rounded font-body font-semibold text-sm text-background bg-accent hover:bg-[#D4A325] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <span>{isLoading ? 'Scanning...' : 'Scan'}</span>
                  <ArrowRight className="w-4 h-4 text-background" />
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                <p>Run Gitleaks Security Scan</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>

        {validationError && (
          <div id="url-error" role="alert" className="mt-2.5 px-2 flex items-center space-x-1.5 text-xs text-[#C13B2E] font-mono">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick real-repo shortcuts — no mock data */}
        <div className="mt-4 pt-4 border-t border-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted font-mono text-[11px]">Quick Scan:</span>
            {SAMPLE_REPOS.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded bg-surface-50 border border-secondary text-muted hover:text-text hover:border-muted font-mono text-[11px] transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted font-mono text-[11px] flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" /> Deep Scan
            </span>
            <div className="scale-75 origin-right">
              <Skiper3 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
