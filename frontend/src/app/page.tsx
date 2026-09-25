'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import ScanForm from '../components/ScanForm';
import ScanProgress from '../components/ScanProgress';
import StatsCards from '../components/StatsCards';
import ResultsTable, { Finding } from '../components/ResultsTable';
import ErrorAlert from '../components/ErrorAlert';

// UI Component Imports
import { Skiper47 } from '@/components/ui/skiper-ui/skiper47';

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleScan = async (url: string) => {
    setStatus('scanning');
    setActiveUrl(url);
    setErrorInfo(null);
    setScanResult(null);

    try {
      // ── Simulate Slow Network (Testing) ──
      // Usage: http://localhost:3000/?delay=3000
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const delay = params.get('delay');
        if (delay) {
          await new Promise(r => setTimeout(r, parseInt(delay, 10)));
        }
      }

      const response = await fetch(`${API_URL}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: url }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setStatus('error');
        setErrorInfo({
          message: data.error?.message || 'Failed to scan the repository.',
          errorCode: data.error?.code || 'UNKNOWN_ERROR',
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-surface-50 border border-secondary text-text font-body text-sm hover:border-accent hover:text-accent transition-colors"
                    aria-label="Download masked scan report"
                  >
                    ↓ Download Report
                    <span className="text-xs text-muted">
                      (expires in {Math.round((scanResult.report.expiresIn ?? 3600) / 60)}min)
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Decorative Security Gallery Component */}
          {status === 'idle' && (
            <div className="mt-12 w-full h-[350px] opacity-80">
              <div className="text-center mb-6">
                <h3 className="text-muted font-mono text-sm uppercase tracking-widest">Supported Engines & Integrations</h3>
              </div>
              <Skiper47 />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-secondary bg-surface-100 py-6 text-center text-xs text-muted font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Secretless Code • Ephemeral GitHub Credential Scanner</span>
          <span className="text-muted">Zero persistence • Guaranteed temp sandbox purge</span>
        </div>
      </footer>
    </div>
  );
}
