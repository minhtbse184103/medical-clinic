import { Alert, Button, Card, DatePicker, Flex, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { PageHeader } from '../components/PageHeader';
import { errorMessage } from '../lib/apiError';
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
  isReadyToExamine,
} from '../lib/appointmentStatus';
import { formatDate, formatTime, toApiDate } from '../lib/datetime';
import {
  DEFAULT_PAGE_QUERY,
  fromTablePagination,
  toTablePagination,
  type PageQuery,
} from '../lib/pagination';
import type { AppointmentStatus, DoctorAppointment, DoctorAppointmentQuery } from '../types/api';

const STATUS_OPTIONS = (Object.keys(APPOINTMENT_STATUS_LABEL) as AppointmentStatus[]).map(
  (status) => ({ value: status, label: APPOINTMENT_STATUS_LABEL[status] }),
);

interface Filters {
  date?: string;
  status?: AppointmentStatus;
}

export function DoctorAppointmentsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>(DEFAULT_PAGE_QUERY);
  const [filters, setFilters] = useState<Filters>({});
  const navigate = useNavigate();

  const query: DoctorAppointmentQuery = { ...pageQuery, ...filters };

  const { data, isFetching, error } = useQuery({
    queryKey: ['doctor-appointments', query],
    queryFn: () => doctorApi.appointments(query),
    placeholderData: keepPreviousData,
  });

  const applyFilter = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPageQuery((current) => ({ ...current, page: 0 }));
  };

  const columns: ColumnsType<DoctorAppointment> = [
    {
      title: 'Ngày giờ',
      key: 'when',
      render: (_, appointment) => (
        <Space direction="vertical" size={0}>
          <span>{formatDate(appointment.appointmentDate)}</span>
          <Typography.Text type="secondary">
            {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, appointment) => (
        <Typography.Text strong>{appointment.patientFullName}</Typography.Text>
      ),
    },
    { title: 'Lý do khám', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: AppointmentStatus) => (
        <Tag color={APPOINTMENT_STATUS_COLOR[status]}>{APPOINTMENT_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 230,
      render: (_, appointment) => (
        <Space>
          {isReadyToExamine(appointment) && (
            <Button
              type="primary"
              onClick={() => navigate(`/doctor/appointments/${appointment.appointmentId}/examine`)}
            >
              Khám
            </Button>
          )}
          <Button onClick={() => navigate(`/doctor/patients/${appointment.patientId}`)}>
            Bệnh án cũ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Lịch khám của tôi"
        description="Nút Khám chỉ hiện với lịch đã được lễ tân xác nhận và đã tới giờ."
      />

      {error && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Card>
        <Flex gap={16} wrap>
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Ngày khám"
            onChange={(value: Dayjs | null) =>
              applyFilter({ date: value ? toApiDate(value) : undefined })
            }
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ minWidth: 180 }}
            options={STATUS_OPTIONS}
            onChange={(status?: AppointmentStatus) => applyFilter({ status })}
          />
        </Flex>
      </Card>

      <Table<DoctorAppointment>
        rowKey="appointmentId"
        columns={columns}
        dataSource={error ? [] : data?.content}
        loading={isFetching}
        pagination={toTablePagination(data, pageQuery)}
        onChange={(pagination) => setPageQuery(fromTablePagination(pagination, pageQuery))}
        locale={{ emptyText: error ? 'Không tải được danh sách' : 'Chưa có lịch khám nào' }}
      />
    </Space>
  );
}
