import React from 'react';

export function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton width="40%" height={12} />
      <div style={{ height: 12 }} />
      <Skeleton width="60%" height={28} />
      <div style={{ height: 12 }} />
      <Skeleton width="100%" height={6} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <Skeleton width="50%" height={14} />
        <div style={{ height: 6 }} />
        <Skeleton width="80%" height={10} />
      </div>
      <Skeleton width={60} height={22} radius={12} />
    </div>
  );
}
