'use client';

import React from 'react';
import { AlertTriangle, XCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface ErrorProps {
  message: string;
  errorCode?: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ message, errorCode, onRetry }: ErrorProps) {
  let tip = 'Please ensure the repository exists, is strictly public, and accessible via HTTPS.';

  if (errorCode === 'INVALID_URL') {
    tip = 'The URL must match the format: https://github.com/owner/repository';
  } else if (errorCode === 'REPO_NOT_FOUND_OR_PRIVATE') {
    tip = 'Secretless Code only scans public repositories. Private repositories and incorrect names are rejected.';
  } else if (errorCode === 'TIMEOUT') {
    tip = 'The operation exceeded the 25-second limit. The repository might be unusually large or network-constrained.';
  } else if (errorCode === 'REPO_TOO_LARGE') {
    tip = 'To prevent resource exhaustion, repositories over 60MB are capped on this instance.';
  } else if (message.includes('fetch') || message.includes('Failed to connect')) {
    tip = 'Could not reach backend API at port 4000. Ensure the backend server is running via `npm run dev` in backend/.';
  }

  return (
    <div className="rounded border border-[#C13B2E] bg-surface-50 p-5 mb-8 text-text shadow-sm">
      <div className="flex items-start space-x-3">
        <XCircle className="w-5 h-5 text-[#C13B2E] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-text text-sm font-heading">
              Scan Failed
            </h4>
            {errorCode && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#C13B2E]/10 border border-[#C13B2E]/30 text-[#C13B2E]">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1 font-body">
            {message}
          </p>

          <div className="mt-3 flex items-center space-x-2 text-xs text-muted bg-surface-100 p-2.5 rounded border border-secondary font-mono">
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>{tip}</span>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs font-mono font-medium text-background bg-primary hover:bg-[#A33D18] px-3 py-1.5 rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Scan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
