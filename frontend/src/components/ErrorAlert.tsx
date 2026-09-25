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
    <div className="glass-panel rounded-2xl p-5 border border-rose-500/30 bg-rose-950/20 mb-8 text-rose-200">
      <div className="flex items-start space-x-3">
        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-rose-300 text-sm">
              Scan Failed
            </h4>
            {errorCode && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/50 text-rose-300">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-200/90 mt-1">
            {message}
          </p>

          <div className="mt-3 flex items-center space-x-2 text-xs text-rose-300/80 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{tip}</span>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs font-mono font-medium text-white bg-rose-800/60 hover:bg-rose-700/80 px-3 py-1.5 rounded-lg border border-rose-600/40 transition-colors"
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
