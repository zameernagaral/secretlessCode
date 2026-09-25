'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import ScanForm from '../components/ScanForm';
import ScanProgress from '../components/ScanProgress';
import StatsCards from '../components/StatsCards';
import ResultsTable, { Finding } from '../components/ResultsTable';
import ErrorAlert from '../components/ErrorAlert';

type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';

interface ScanResultData {
  status: string;
  repo: string;
  scannedAt: string;
  scanDurationMs: number;
  repoSizeMB?: number;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
  };
  findings: Finding[];
  report?: {
    stored: boolean;
    provider?: string;
    presignedUrl?: string;
    expiresIn?: number;
    publicUrl?: string | null;
    reason?: string;
  };
}

export default function Home() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; errorCode?: string } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleScan = async (url: string) => {
    setStatus('scanning');
    setActiveUrl(url);
    setErrorInfo(null);
    setScanResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: url }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        setStatus('error');
        setErrorInfo({
          message: data.message || 'Failed to scan the repository.',
          errorCode: data.errorCode || 'UNKNOWN_ERROR',
        });
        return;
      }

      setScanResult(data.data);
      setStatus('complete');
    } catch (err: any) {
      setStatus('error');
      setErrorInfo({
        message: err.message || 'Network error: could not connect to backend server.',
        errorCode: 'NETWORK_ERROR',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          {/* Hero & URL Input */}
          <ScanForm
            onScan={handleScan}
            isLoading={status === 'scanning'}
          />

          {/* Error Banner */}
          {status === 'error' && errorInfo && (
            <ErrorAlert
              message={errorInfo.message}
              errorCode={errorInfo.errorCode}
              onRetry={() => activeUrl && handleScan(activeUrl)}
            />
          )}

          {/* Scanning Live State */}
          {status === 'scanning' && <ScanProgress repoUrl={activeUrl} />}

          {/* Complete Results Display */}
          {status === 'complete' && scanResult && (
            <div className="animate-fadeIn">
              <StatsCards
                summary={scanResult.summary}
                durationMs={scanResult.scanDurationMs}
                repoSizeMB={scanResult.repoSizeMB}
              />

              <ResultsTable
                findings={scanResult.findings}
                repoName={scanResult.repo}
                scannedAt={scanResult.scannedAt}
              />

              {/* Report download link (shown when cloud storage is configured) */}
              {scanResult.report?.stored && scanResult.report.presignedUrl && (
                <div className="mt-4 flex justify-end">
                  <a
                    href={scanResult.report.presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-200 border border-slate-700 text-slate-300 text-sm hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                    aria-label="Download masked scan report"
                  >
                    ↓ Download Report
                    <span className="text-xs text-slate-500">
                      (expires in {Math.round((scanResult.report.expiresIn ?? 3600) / 60)}min)
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-surface-300 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Secretless Code • Ephemeral GitHub Credential Scanner</span>
          <span className="text-slate-600">Zero persistence • Guaranteed temp sandbox purge</span>
        </div>
      </footer>
    </div>
  );
}
