'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BorderTrail } from '@/components/core/border-trail';

export function BorderTrailSpecimen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'idle' | 'scanning' | 'passed'>('idle');

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult('scanning');
  };

  const handleAnimationComplete = () => {
    setIsScanning(false);
    setScanResult('passed');
    setTimeout(() => {
      setScanResult('idle');
    }, 4000);
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-md border border-[#2C2F35] bg-[#1A1C20] p-5 font-mono text-sm shadow-xl">
      {isScanning && (
        <BorderTrail
          color="#ffffff"
          size={120}
          borderWidth={2}
          transition={{
            ease: 'linear',
            duration: 3,
            repeat: 2,
          }}
          onAnimationComplete={handleAnimationComplete}
        />
      )}

      {scanResult === 'passed' && (
        <BorderTrail
          color="#34D399"
          size={100}
          borderWidth={2}
          transition={{
            ease: 'linear',
            duration: 3,
            repeat: 1,
          }}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#2C2F35] pb-2 text-xs uppercase tracking-wider text-[#9A9EA6]">
          <span>RAM-DISK BUFFER // SPECIMEN</span>
          <span className={isScanning ? 'text-[#E0A93B]' : scanResult === 'passed' ? 'text-emerald-400' : 'text-[#9A9EA6]'}>
            {isScanning ? '[SCANNING]' : scanResult === 'passed' ? '[CLEAN 0 LEAKS]' : '[STANDBY]'}
          </span>
        </div>

        <p className="font-sans text-sm text-[#E6E7E9]">
          Simulates an animated border trail tracing the card perimeter during live repository analysis.
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#9A9EA6]">
            {isScanning ? 'Cloning commits...' : scanResult === 'passed' ? 'Remediation clear' : 'Idle buffer ready'}
          </span>
          <button
            type="button"
            disabled={isScanning}
            onClick={handleSimulateScan}
            className="rounded border border-[#2C2F35] bg-[#121316] px-3 py-1.5 text-xs text-[#E6E7E9] hover:border-[#E0A93B] hover:text-[#E0A93B] disabled:opacity-50 transition-colors"
          >
            {isScanning ? 'Analyzing...' : 'Simulate scan'}
          </button>
        </div>
      </div>
    </div>
  );
}
