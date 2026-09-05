import { Card } from 'antd';
import type { ReactNode } from 'react';

interface SummaryTileProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  /** Accent colour for the icon on a plain tile. */
  iconColor?: string;
  /** Fills the tile, for the one figure the screen leads with. */
  featured?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

const FEATURED_BG = '#0d9488';

export function SummaryTile({
  label,
  value,
  icon,
  iconColor = '#1677ff',
  featured,
  loading,
  onClick,
}: SummaryTileProps) {
  return (
    <Card
      hoverable={onClick !== undefined}
      onClick={onClick}
      loading={loading}
      styles={{ body: { padding: 20 } }}
      style={{
        height: '100%',
        background: featured ? FEATURED_BG : undefined,
        borderColor: featured ? FEATURED_BG : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              marginBottom: 6,
              color: featured ? 'rgba(255,255,255,0.85)' : '#667085',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.2,
              color: featured ? '#fff' : '#101828',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </div>
        </div>
        <span style={{ fontSize: 22, color: featured ? 'rgba(255,255,255,0.9)' : iconColor }}>
          {icon}
        </span>
      </div>
    </Card>
  );
}
