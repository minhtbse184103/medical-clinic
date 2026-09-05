import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  loading?: boolean;
  /** Draws attention to a number that means someone has to act. */
  highlight?: boolean;
  /** A short line under the number, for what the number means in context. */
  footer?: ReactNode;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon,
  loading,
  highlight,
  footer,
  onClick,
}: StatCardProps) {
  return (
    <Card
      size="small"
      hoverable={onClick !== undefined}
      onClick={onClick}
      styles={{ body: { padding: 20 } }}
      style={highlight ? { borderColor: '#faad14', background: '#fffbe6' } : undefined}
    >
      <Statistic
        title={title}
        value={value}
        loading={loading}
        prefix={icon}
        valueStyle={highlight ? { color: '#d48806' } : undefined}
      />
      {footer && <div style={{ marginTop: 8, fontSize: 12.5, color: '#667085' }}>{footer}</div>}
    </Card>
  );
}
