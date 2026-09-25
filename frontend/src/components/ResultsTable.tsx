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
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden mb-12 shadow-2xl">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-100/40">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>Detection Report:</span>
            <span className="text-cyan-400 font-mono">{repoName}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
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
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                  selectedSeverity === sev
                    ? 'bg-slate-700 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={exportJSON}
            className="flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download sanitized report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Severity</th>
              <th className="py-3.5 px-4">Secret Type / Rule</th>
              <th className="py-3.5 px-4">File Path</th>
              <th className="py-3.5 px-4">Line</th>
              <th className="py-3.5 px-4 sm:px-6">Masked Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono">
            {filteredFindings.map((finding) => {
              const masked = maskSecret(finding.rawMatch);
              const isCritical = finding.severity === 'Critical';
              const isHigh = finding.severity === 'High';

              // GitHub file line link
              const githubLineUrl = `https://github.com/${repoName}/blob/HEAD/${finding.filePath}#L${finding.lineNumber}`;

              return (
                <tr 
                  key={finding.id} 
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Severity Badge */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isCritical
                          ? 'bg-rose-950/70 text-rose-300 border-rose-800/60 ring-1 ring-rose-500/20'
                          : isHigh
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                          : 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  {/* Secret Type / Rule */}
                  <td className="py-3.5 px-4">
                    <div className="font-sans font-medium text-slate-200">
                      {finding.secretType}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {finding.ruleId}
                    </div>
                  </td>

                  {/* File Path */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <a
                        href={githubLineUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-400 hover:underline flex items-center space-x-1 group/link truncate max-w-[200px] sm:max-w-xs"
                        title={finding.filePath}
                      >
                        <span className="truncate">{finding.filePath}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    </div>
                  </td>

                  {/* Line Number */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px]">
                      L{finding.lineNumber}
                    </span>
                  </td>

                  {/* Masked Secret Value */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-300 text-xs font-mono selection:bg-slate-800">
                        <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="tracking-wider">{masked}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(masked, finding.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy masked secret"
                      >
                        {copiedId === finding.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
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
      </div>
    </div>
  );
}
