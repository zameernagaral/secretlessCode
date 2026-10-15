'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface ScanItem {
  id: string;
  repoUrl: string;
  repoName: string;
  status: string;
  findingsCount: number;
  scanDurationMs?: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Read local session if present
    const stored = localStorage.getItem('secretless_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }

    // Fetch database scan history
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/v1/scans`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data.data?.scans) {
          setScans(data.data.scans);
        }
      })
      .catch(() => {
        // Fallback to sample history if backend is offline
        setScans([
          {
            id: 'sample-scan-1',
            repoUrl: 'https://github.com/acme/sample-vulnerable-repo',
            repoName: 'acme/sample-vulnerable-repo',
            status: 'completed',
            findingsCount: 3,
            scanDurationMs: 1240,
            createdAt: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('secretless_user');
    setUser(null);
  };

  const totalFindings = scans.reduce((acc, s) => acc + (s.findingsCount || 0), 0);
  const cleanScans = scans.filter((s) => s.findingsCount === 0).length;

  return (
    <div className={styles.dashboardContainer}>
      <Link href="/" className={styles.backHomeLink}>
        &larr; Back to Live Scanner
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Scan History & Database Telemetry</h1>
          <p className={styles.subtitle}>
            Live records persisted from ephemeral memory buffers into PostgreSQL.
          </p>
        </div>

        {user ? (
          <div className={styles.userBadge}>
            <div>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/#live-scan-console" className={styles.userBadge}>
            <span className={styles.userEmail}>Guest Mode (Public Scans)</span>
          </Link>
        )}
      </header>

      {/* ── Metric Cards ── */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Repos Scanned</p>
          <p className={styles.statValue}>{scans.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Leaks Caught & Masked</p>
          <p className={styles.statValue} style={{ color: '#f87171' }}>
            {totalFindings}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Clean Commit Trees</p>
          <p className={styles.statValue} style={{ color: '#4ade80' }}>
            {cleanScans}
          </p>
        </div>
      </section>

      {/* ── Scans Table ── */}
      <section className={styles.scansSection}>
        <h2 className={styles.sectionHeading}>Persisted Scans in PostgreSQL</h2>

        {loading ? (
          <p className={styles.emptyNotice}>Loading database records...</p>
        ) : scans.length === 0 ? (
          <div className={styles.emptyNotice}>
            <p>No scans recorded yet.</p>
            <Link href="/#live-scan-console" style={{ color: 'var(--color-accent-amber)' }}>
              Run your first repository scan &rarr;
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.scansTable}>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th>Duration</th>
                  <th>Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td className={styles.repoName}>
                      <a
                        href={scan.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {scan.repoName || scan.repoUrl}
                      </a>
                    </td>
                    <td>
                      {scan.findingsCount === 0 ? (
                        <span className={styles.badgeClean}>CLEAN</span>
                      ) : (
                        <span className={styles.badgeLeaked}>
                          {scan.findingsCount} LEAKS
                        </span>
                      )}
                    </td>
                    <td>{scan.findingsCount} secrets</td>
                    <td>{scan.scanDurationMs ? `${scan.scanDurationMs}ms` : '—'}</td>
                    <td>{new Date(scan.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
