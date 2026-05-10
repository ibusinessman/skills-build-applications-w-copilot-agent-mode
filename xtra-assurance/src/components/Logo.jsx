import React from 'react';

/**
 * XTRA ASSURANCE animated brand mark.
 * Variants:
 *   - "full"  : star + wordmark (header)
 *   - "mark"  : star only (compact)
 *   - "hero"  : large animated hero for splash/login
 */
export default function Logo({ variant = 'full', size = 28, animated = false }) {
  if (variant === 'mark') {
    return (
      <svg
        width={size} height={size} viewBox="0 0 64 64"
        className={animated ? 'logo-animated' : ''}
        aria-label="Xtra Assurance"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#A8860E" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F0D060" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="#003087" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" />
        <path
          d="M32 10 L36 24 L50 24 L39 32 L43 46 L32 38 L21 46 L25 32 L14 24 L28 24 Z"
          fill="url(#goldGrad)"
        />
      </svg>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`logo-hero ${animated ? 'logo-hero-animated' : ''}`} aria-label="Xtra Assurance">
        <svg width={size} height={size} viewBox="0 0 120 120">
          <defs>
            <linearGradient id="goldGradH" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"  stopColor="#A8860E" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#F0D060" />
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(212,175,55,0.4)" />
              <stop offset="100%" stopColor="rgba(212,175,55,0)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="58" fill="url(#glow)" />
          <circle cx="60" cy="60" r="48" fill="#003087" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="url(#goldGradH)" strokeWidth="2" />
          <path
            d="M60 22 L66 44 L88 44 L70 58 L77 80 L60 66 L43 80 L50 58 L32 44 L54 44 Z"
            fill="url(#goldGradH)"
          />
          <text x="60" y="105" textAnchor="middle" fontFamily="Arial Black, sans-serif"
                fontSize="11" fontWeight="900" fill="#F0D060" letterSpacing="2">XTRA</text>
        </svg>
      </div>
    );
  }

  // full = mark + wordmark
  return (
    <div className="brand-badge">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={`gg-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#A8860E" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F0D060" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="#003087" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={`url(#gg-${size})`} strokeWidth="1.5" />
        <path
          d="M32 10 L36 24 L50 24 L39 32 L43 46 L32 38 L21 46 L25 32 L14 24 L28 24 Z"
          fill={`url(#gg-${size})`}
        />
      </svg>
      <span className="brand-name">XTRA ASSURANCE</span>
    </div>
  );
}
