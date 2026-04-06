import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A single animated skeleton block.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  className = '',
  style,
}) => (
  <div
    className={`skeleton-block ${className}`}
    style={{ width, height, borderRadius, ...style }}
  />
);

/**
 * Pre-built skeleton layouts for common UI patterns.
 */
export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <Skeleton height="160px" borderRadius="12px 12px 0 0" />
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton width="70%" height="20px" />
      <Skeleton width="90%" height="14px" />
      <Skeleton width="50%" height="14px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Skeleton width="60px" height="24px" borderRadius="12px" />
        <Skeleton width="60px" height="24px" borderRadius="12px" />
      </div>
    </div>
  </div>
);

export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="skeleton-table-row">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} style={{ padding: '12px 16px' }}>
        <Skeleton height="16px" width={i === 0 ? '60%' : '80%'} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => (
  <table className="skeleton-table" style={{ width: '100%' }}>
    <thead>
      <tr>
        {Array.from({ length: columns }).map((_, i) => (
          <th key={i} style={{ padding: '12px 16px' }}>
            <Skeleton height="14px" width="60%" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </tbody>
  </table>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="skeleton-dashboard">
    {/* Stat Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <Skeleton width="50%" height="14px" />
          <Skeleton width="40%" height="28px" style={{ marginTop: '8px' }} />
          <Skeleton width="70%" height="12px" style={{ marginTop: '6px' }} />
        </div>
      ))}
    </div>
    {/* Chart placeholder */}
    <div className="skeleton-chart">
      <Skeleton height="300px" borderRadius="12px" />
    </div>
  </div>
);
