import {
  HomeOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorsApi } from '../api/doctors';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../lib/apiError';
import { initials } from '../lib/user';
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
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });
  const [filters, setFilters] = useState<Filters>({});
  const [draft, setDraft] = useState<Filters>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const canBook = user?.role === 'PATIENT';
  const query: DoctorQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['doctors', query],
    queryFn: () => doctorsApi.list(query),
    placeholderData: keepPreviousData,
  });

  /*
   * Specialty is free text on the doctor record, not an enumeration, so the dropdown is
   * built from the specialties currently in use. One page of 100 covers a clinic of this
   * size; a dedicated endpoint would be the fix if the roster ever outgrows it.
   */
  const allDoctors = useQuery({
    queryKey: ['doctors', { page: 0, size: 100 }],
    queryFn: () => doctorsApi.list({ page: 0, size: 100 }),
    select: (page) => [...new Set(page.content.map((doctor) => doctor.specialty))].sort(),
  });

  const specialtyOptions = useMemo(
    () => (allDoctors.data ?? []).map((specialty) => ({ value: specialty, label: specialty })),
    [allDoctors.data],
  );

  const applySearch = () => {
    setFilters({ name: draft.name?.trim() || undefined, specialty: draft.specialty || undefined });
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const resetSearch = () => {
    setDraft({});
    setFilters({});
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const columns: ColumnsType<Doctor> = [
    {
      title: 'BÁC SĨ',
      key: 'doctor',
      render: (_, doctor) => (
        <Space size={12}>
          <Avatar
            size={40}
            style={{ background: '#e6f4ff', color: '#1677ff', fontWeight: 600, flexShrink: 0 }}
          >
            {initials(doctor.fullName)}
          </Avatar>
          <Typography.Text strong>BS. {doctor.fullName}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'CHUYÊN KHOA',
      dataIndex: 'specialty',
      key: 'specialty',
      width: 190,
      render: (specialty: string) => <Tag color="blue">{specialty}</Tag>,
    },
    {
      title: 'SỐ ĐIỆN THOẠI',
      dataIndex: 'phone',
      key: 'phone',
      width: 180,
      render: (phone: string | null) =>
        phone ? (
          <Space size={8}>
            <PhoneOutlined style={{ color: '#98a2b3' }} />
            <span>{phone}</span>
          </Space>
        ) : (
          <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>
        ),
    },
    {
      title: 'GIỚI THIỆU',
      dataIndex: 'bio',
      key: 'bio',
      ellipsis: true,
      render: (bio: string | null) =>
        bio ?? <Typography.Text type="secondary">Chưa có giới thiệu</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      // Only a PATIENT can book; other roles still get the detail page for the
      // doctor's information and weekly schedule.
      render: (_, doctor) => (
        <Button
          type={canBook ? 'primary' : 'default'}
          icon={canBook ? <MedicineBoxOutlined /> : undefined}
          onClick={() => navigate(`/doctors/${doctor.doctorId}`)}
        >
          {canBook ? 'Đặt lịch' : 'Xem chi tiết'}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Space
        align="center"
        style={{ width: '100%', justifyContent: 'space-between' }}
        wrap
        size={12}
      >
        <Breadcrumb
          items={[
            { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
            { title: 'Danh bạ bác sĩ' },
          ]}
        />
        {data && (
          <Tag color="blue" style={{ marginInlineEnd: 0, borderRadius: 999, paddingInline: 12 }}>
            ● {data.totalElements} bác sĩ đang hoạt động
          </Tag>
        )}
      </Space>

      <div>
        <Space size={10} align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Đội ngũ bác sĩ
          </Typography.Title>
          <MedicineBoxOutlined style={{ color: '#1677ff', fontSize: 18 }} />
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
          {canBook
            ? 'Tra cứu chuyên khoa, thông tin bác sĩ và đặt lịch hẹn khám bệnh.'
            : 'Danh bạ bác sĩ đang hoạt động của phòng khám.'}
        </Typography.Paragraph>
      </div>

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Form layout="vertical" onFinish={applySearch}>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={10}>
              <Form.Item label="Tìm kiếm bác sĩ" style={{ marginBottom: 0 }}>
                <Input
                  size="large"
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                  placeholder="Nhập tên bác sĩ"
                  value={draft.name}
                  onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))}
                  onPressEnter={applySearch}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Chuyên khoa" style={{ marginBottom: 0 }}>
                <Select
                  size="large"
                  allowClear
                  showSearch
                  placeholder="Tất cả chuyên khoa"
                  loading={allDoctors.isFetching}
                  options={specialtyOptions}
                  value={draft.specialty}
                  onChange={(specialty?: string) => setDraft((c) => ({ ...c, specialty }))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" size="large" icon={<SearchOutlined />} htmlType="submit">
                  Tìm kiếm
                </Button>
                <Button size="large" icon={<ReloadOutlined />} onClick={resetSearch}>
                  Đặt lại
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Space size={16} wrap style={{ color: '#667085' }}>
        <span>
          Chuyên khoa:{' '}
          <Typography.Text strong style={{ color: '#1677ff' }}>
            {filters.specialty ?? 'Tất cả'}
          </Typography.Text>
        </span>
        <span>
          Tên bác sĩ:{' '}
          <Typography.Text strong style={{ color: '#1677ff' }}>
            {filters.name ?? 'Tất cả'}
          </Typography.Text>
        </span>
      </Space>

      <Card styles={{ body: { padding: 0 } }}>
        <Table<Doctor>
          rowKey="doctorId"
          columns={columns}
          dataSource={error ? [] : data?.content}
          loading={isFetching}
          pagination={{
            ...toTablePagination(data, pageQuery),
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} – ${range[1]} trong tổng số ${total} bác sĩ`,
          }}
          onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.name || filters.specialty
                    ? 'Không tìm thấy bác sĩ phù hợp'
                    : 'Chưa có bác sĩ nào'
                }
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
}
