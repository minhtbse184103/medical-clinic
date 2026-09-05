import { Alert, Button, Card, Flex, Input, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../lib/apiError';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import type { Doctor, DoctorQuery } from '../types/api';

interface Filters {
  name?: string;
  specialty?: string;
}

export function DoctorListPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>(DEFAULT_PAGE_QUERY);
  const [filters, setFilters] = useState<Filters>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const canBook = user?.role === 'PATIENT';

  const query: DoctorQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['doctors', query],
    queryFn: () => doctorsApi.list(query),
    // Keeps the previous page on screen while the next one loads, so the table does not flash.
    placeholderData: keepPreviousData,
  });

  // Any filter change must reset to the first page, otherwise a narrower result set
  // can leave the table on a page that no longer exists.
  const applyFilter = (next: Filters) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const columns: ColumnsType<Doctor> = [
    {
      title: 'Bác sĩ',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (fullName: string) => <Typography.Text strong>{fullName}</Typography.Text>,
    },
    { title: 'Chuyên khoa', dataIndex: 'specialty', key: 'specialty' },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone ?? '—',
    },
    {
      title: 'Giới thiệu',
      dataIndex: 'bio',
      key: 'bio',
      ellipsis: true,
      render: (bio: string | null) => bio ?? '—',
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      // Only a PATIENT can book; other roles still get the detail page for the
      // doctor's information and weekly schedule.
      render: (_, doctor) => (
        <Button
          type={canBook ? 'primary' : 'default'}
          onClick={() => navigate(`/doctors/${doctor.doctorId}`)}
        >
          {canBook ? 'Đặt lịch' : 'Xem chi tiết'}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Tìm bác sĩ
      </Typography.Title>

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Flex gap={16} wrap>
          <Input.Search
            allowClear
            placeholder="Tên bác sĩ"
            style={{ maxWidth: 280 }}
            onSearch={(value) => applyFilter({ name: value.trim() || undefined })}
          />
          <Input.Search
            allowClear
            placeholder="Chuyên khoa"
            style={{ maxWidth: 280 }}
            onSearch={(value) => applyFilter({ specialty: value.trim() || undefined })}
          />
        </Flex>
      </Card>

      <Table<Doctor>
        rowKey="doctorId"
        columns={columns}
        dataSource={data?.content}
        loading={isFetching}
        pagination={toTablePagination(data, pageQuery)}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
      />
    </Space>
  );
}
