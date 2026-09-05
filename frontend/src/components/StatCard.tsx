import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  loading?: boolean;
  /** Draws attention to a number that means someone has to act. */
  highlight?: boolean;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, loading, highlight, onClick }: StatCardProps) {
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
    </Card>
  );
}
