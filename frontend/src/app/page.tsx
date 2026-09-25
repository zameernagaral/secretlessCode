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
}

// Preset dummy findings for instant demo preview
const DUMMY_MOCK_FINDINGS: ScanResultData = {
  status: 'success',
  repo: 'secretless-demo/sample-vulnerable-repo',
  scannedAt: new Date().toISOString(),
  scanDurationMs: 840,
  repoSizeMB: 1.4,
  summary: {
    total: 4,
    critical: 2,
    high: 1,
    medium: 1,
  },
  findings: [
    {
      id: 'demo-1',
      filePath: 'src/config.py',
      lineNumber: 12,
      endLine: 12,
      secretType: 'AWS Access Key ID',
      ruleId: 'aws-access-token',
      severity: 'Critical',
      rawMatch: 'AKIAIOSFODNN7EXAMPLE',
    },
    {
      id: 'demo-2',
      filePath: 'src/config.py',
      lineNumber: 18,
      endLine: 18,
      secretType: 'Stripe Live Secret Key',
      ruleId: 'stripe-api-key',
      severity: 'Critical',
      rawMatch: 'sk_test_mockStripeToken9948281048291048',
    },
    {
      id: 'demo-3',
      filePath: 'backend/database.js',
      lineNumber: 8,
      endLine: 8,
      secretType: 'GitHub Personal Access Token',
      ruleId: 'github-pat',
      severity: 'High',
      rawMatch: 'ghp_TEST_MOCK_PAT_FOR_SCANNER_DEMO_PURPOSES',
    },
    {
      id: 'demo-4',
      filePath: 'backend/database.js',
      lineNumber: 14,
      endLine: 14,
      secretType: 'Slack Incoming Webhook URL',
      ruleId: 'slack-webhook-url',
      severity: 'Medium',
      rawMatch: 'https://hooks.slack.com/services/T01234567/B01234567/FakeSlackTokenForTesting00',
    },
  ],
};

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

  const handleLoadDemo = () => {
    setStatus('complete');
    setActiveUrl('https://github.com/secretless-demo/sample-vulnerable-repo');
    setErrorInfo(null);
    setScanResult(DUMMY_MOCK_FINDINGS);
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
            onLoadDemo={handleLoadDemo}
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
