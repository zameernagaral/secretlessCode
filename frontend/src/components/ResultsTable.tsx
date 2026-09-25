'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Download, 
  FileCode, 
  Lock,
  ChevronRight
} from 'lucide-react';
import { maskSecret } from '../utils/maskSecret';
import { ProgressiveBlur } from '@/components/ui/skiper-ui/skiper41';

export interface Finding {
  id: string;
  filePath: string;
  lineNumber: number;
  endLine: number;
  secretType: string;
  ruleId: string;
  severity: 'Critical' | 'High' | 'Medium';
  rawMatch: string;
}

interface ResultsTableProps {
  findings: Finding[];
  repoName: string;
  scannedAt: string;
}

export default function ResultsTable({ findings, repoName, scannedAt }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter findings based on search and severity
  const filteredFindings = findings.filter((item) => {
    const matchesSearch = 
      item.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.secretType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ruleId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = 
      selectedSeverity === 'ALL' || item.severity.toUpperCase() === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportJSON = () => {
    const sanitizedReport = {
      repository: repoName,
      scannedAt,
      totalFindings: findings.length,
      findings: findings.map((f) => ({
        filePath: f.filePath,
        lineNumber: f.lineNumber,
        secretType: f.secretType,
        ruleId: f.ruleId,
        severity: f.severity,
        maskedSecret: maskSecret(f.rawMatch)
      }))
    };

    const blob = new Blob([JSON.stringify(sanitizedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secretless-report-${repoName.replace('/', '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (findings.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-emerald-500/30 bg-emerald-950/10 mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Zero Leaked Secrets Detected
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
          Gitleaks completed inspection on <span className="text-slate-200 font-mono font-medium">{repoName}</span> and found zero exposed credentials, API keys, or private tokens.
        </p>
        <span className="inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
          <span>✓ Clean Repository</span>
        </span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-lg overflow-hidden mb-12">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-secondary flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-100">
        <div>
          <h3 className="text-base sm:text-lg font-heading text-text flex items-center space-x-2">
            <span>Detection Report:</span>
            <span className="text-primary font-mono">{repoName}</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Showing {filteredFindings.length} of {findings.length} findings • Secrets are masked client-side
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter file or rule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44 sm:w-52"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1 bg-surface-50 p-1 border border-secondary">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`text-[11px] font-mono px-2.5 py-1 transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-secondary text-text font-semibold'
                    : 'text-muted hover:text-text'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={exportJSON}
            className="flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-text border border-secondary transition-colors"
            title="Download sanitized report"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-secondary bg-surface-50 text-muted font-mono uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Severity</th>
              <th className="py-3.5 px-4">Secret Type / Rule</th>
              <th className="py-3.5 px-4">File Path</th>
              <th className="py-3.5 px-4">Line</th>
              <th className="py-3.5 px-4 sm:px-6">Masked Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary font-mono">
            {filteredFindings.map((finding) => {
              const masked = maskSecret(finding.rawMatch);
              const isCritical = finding.severity === 'Critical';
              const isHigh = finding.severity === 'High';

              // GitHub file line link
              const githubLineUrl = `https://github.com/${repoName}/blob/HEAD/${finding.filePath}#L${finding.lineNumber}`;

              return (
                <tr 
                  key={finding.id} 
                  className="hover:bg-surface-200 transition-colors group"
                >
                  {/* Severity Badge */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        isCritical
                          ? 'bg-[#C13B2E]/10 text-[#C13B2E] border-[#C13B2E]'
                          : isHigh
                          ? 'bg-[#D97C2B]/10 text-[#D97C2B] border-[#D97C2B]'
                          : 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]'
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  {/* Secret Type / Rule */}
                  <td className="py-3.5 px-4">
                    <div className="font-body font-medium text-text">
                      {finding.secretType}
                    </div>
                    <div className="text-[10px] text-muted font-mono mt-0.5">
                      {finding.ruleId}
                    </div>
                  </td>

                  {/* File Path */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2 text-text font-mono">
                      <FileCode className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <a
                        href={githubLineUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent hover:underline flex items-center space-x-1 group/link truncate max-w-[200px] sm:max-w-xs"
                        title={finding.filePath}
                      >
                        <span className="truncate">{finding.filePath}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    </div>
                  </td>

                  {/* Line Number */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-surface-50 text-text border border-secondary text-[11px] font-mono">
                      L{finding.lineNumber}
                    </span>
                  </td>

                  {/* Masked Secret Value */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-surface-200 border border-secondary text-text text-xs font-mono">
                        <Lock className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="tracking-wider">{masked}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(masked, finding.id)}
                        className="p-1 text-muted hover:text-text hover:bg-surface-200 transition-colors"
                        title="Copy masked secret"
                      >
                        {copiedId === finding.id ? (
                          <Check className="w-3.5 h-3.5 text-accent" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredFindings.length > 3 && (
          <ProgressiveBlur position="bottom" backgroundColor="#1B1B16" blurAmount="8px" height="60px" />
        )}
      </div>
    </div>
  );
}
