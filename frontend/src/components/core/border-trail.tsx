'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BorderTrailProps = {
  className?: string;
  size?: number;
  borderWidth?: number;
  transition?: Transition;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
  color?: string;
};

export function BorderTrail({
  className,
  size = 120,
  borderWidth = 2,
  transition,
  onAnimationComplete,
  style,
  color = '#ffffff',
}: BorderTrailProps) {
  const rectRef = useRef<SVGRectElement>(null);
  const [totalLength, setTotalLength] = useState(1200);

  useEffect(() => {
    if (rectRef.current) {
      try {
        const len = rectRef.current.getTotalLength();
        if (len > 0) setTotalLength(len);
      } catch {}
    }
  }, []);

  const defaultTransition: Transition = {
    repeat: Infinity,
    duration: 3.5,
    ease: 'linear',
  };

  const gradientId = React.useId();

  return (
    <svg
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full rounded-[inherit] overflow-visible',
        className
      )}
      style={{
        zIndex: 10,
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.rect
        ref={rectRef}
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="8"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={borderWidth}
        filter={`url(#${gradientId}-glow)`}
        strokeDasharray={`${size} ${Math.max(totalLength - size, 1)}`}
        animate={{
          strokeDashoffset: [0, -totalLength],
        }}
        transition={transition || defaultTransition}
        onAnimationComplete={onAnimationComplete}
      />
    </svg>
  );
}
