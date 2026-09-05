import { Card } from 'antd';
import type { ReactNode } from 'react';

interface SummaryTileProps {
  label: string;
  value: ReactNode;
  /** Second line under the figure, giving it context. */
  sub?: ReactNode;
  icon: ReactNode;
  /** Accent colour for the icon tile on a plain card. */
  iconColor?: string;
  iconBg?: string;
  /** Fills the tile, for the one figure the screen leads with. */
  featured?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

const FEATURED_BG = '#0d9488';

export function SummaryTile({
  label,
  value,
  sub,
  icon,
  iconColor = '#1677ff',
  iconBg = '#eff6ff',
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
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: featured ? 0.5 : 0,
              textTransform: featured ? 'uppercase' : 'none',
              color: featured ? 'rgba(255,255,255,0.85)' : '#667085',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: featured ? 26 : 28,
              fontWeight: 700,
              lineHeight: 1.25,
              marginTop: 8,
              color: featured ? '#fff' : '#101828',
            }}
          >
            {value}
          </div>
          {sub && (
            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                marginTop: 6,
                color: featured ? 'rgba(255,255,255,0.85)' : '#667085',
              }}
            >
              {sub}
            </div>
          )}
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: featured ? 'rgba(255,255,255,0.18)' : iconBg,
            color: featured ? '#fff' : iconColor,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
