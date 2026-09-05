import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** One line explaining what the screen is for, or what the rules are. */
  description?: ReactNode;
  /** Primary actions, shown on the right. */
  extra?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * One heading treatment for every screen. Pages previously each rolled their own
 * combination of title, back link and action buttons, which drifted apart.
 */
export function PageHeader({
  title,
  description,
  extra,
  onBack,
  backLabel = 'Quay lại',
}: PageHeaderProps) {
  return (
    <Flex align="flex-start" justify="space-between" gap={16} wrap>
      <Space direction="vertical" size={2}>
        {onBack && (
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{ paddingInline: 0 }}
          >
            {backLabel}
          </Button>
        )}
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </Space>
      {extra && <Space wrap>{extra}</Space>}
    </Flex>
  );
}
