import React from 'react';
import Link from 'next/link';
import { Terminal, Home, AlertOctagon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 font-mono">
      <div className="text-center max-w-md w-full glass-panel border border-secondary bg-surface-50 p-10 rounded">
        <div className="w-20 h-20 rounded bg-surface-100 border border-secondary flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-accent" />
        </div>
        
        <h1 className="text-6xl font-heading font-black text-text mb-4">404</h1>
        
        <div className="h-px w-16 bg-secondary mx-auto mb-4" />
        
        <h2 className="text-lg font-bold text-text mb-2 uppercase tracking-widest">
          Endpoint Not Found
        </h2>
        
        <p className="text-xs text-muted mb-8 font-body leading-relaxed">
          The requested path doesn't exist in our routing table. Don't worry, your secrets are still safe.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded text-sm text-background bg-accent hover:bg-[#D4A325] transition-colors font-bold w-full justify-center"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
