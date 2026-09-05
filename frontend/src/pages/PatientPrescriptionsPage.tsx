import {
  BulbOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  NumberOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Breadcrumb,
  Card,
  Empty,
  Pagination,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { appointmentsApi } from '../api/appointments';
import { patientApi } from '../api/patient';
import { errorMessage } from '../lib/apiError';
import { formatDateTime } from '../lib/datetime';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';
import type { PatientAppointment, PrescriptionMedicine } from '../types/api';

type SortOrder = 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Mới nhất trước' },
  { value: 'oldest', label: 'Cũ nhất trước' },
];

const columns: ColumnsType<PrescriptionMedicine> = [
  {
    title: 'TÊN THUỐC',
    dataIndex: 'medicineName',
    key: 'medicineName',
    render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
  },
  { title: 'LIỀU DÙNG', dataIndex: 'dosage', key: 'dosage', width: 120 },
  { title: 'TẦN SUẤT', dataIndex: 'frequency', key: 'frequency', width: 140 },
  { title: 'THỜI GIAN', dataIndex: 'duration', key: 'duration', width: 130 },
  {
    title: 'SỐ LƯỢNG',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 110,
    render: (quantity: number) => (
      <Typography.Text style={{ color: '#1677ff', fontWeight: 600 }}>{quantity}</Typography.Text>
    ),
  },
  {
    title: 'CÁCH DÙNG & HƯỚNG DẪN',
    dataIndex: 'instruction',
    key: 'instruction',
    render: (instruction: string | null) =>
      instruction ?? <Typography.Text type="secondary">—</Typography.Text>,
  },
];

export function PatientPrescriptionsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });
  const [order, setOrder] = useState<SortOrder>('newest');
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-prescriptions', pageQuery],
    queryFn: () => patientApi.prescriptions(pageQuery.page, pageQuery.size),
    placeholderData: keepPreviousData,
  });

  /** A prescription carries no doctor; the completed appointment behind it does. */
  const visits = useQuery({
    queryKey: ['my-appointments-completed'],
    queryFn: () => appointmentsApi.mine({ page: 0, size: 100, status: 'COMPLETED' }),
  });

  const visitByAppointment = useMemo(() => {
    const index = new Map<number, PatientAppointment>();
    for (const visit of visits.data?.content ?? []) {
      index.set(visit.appointmentId, visit);
    }
    return index;
  }, [visits.data]);

  /*
   * The endpoint has no sort parameter, so the order is applied to the page in hand.
   * Sorting the whole history would need the backend to accept one.
   */
  const rows = useMemo(() => {
    const content = [...(data?.content ?? [])];
    content.sort((a, b) =>
      order === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
    return content;
  }, [data?.content, order]);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined />, onClick: () => navigate('/') },
          { title: 'Đơn thuốc' },
        ]}
      />

      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Đơn thuốc của tôi
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
          Tra cứu thông tin đơn thuốc, hướng dẫn liều dùng và thời gian sử dụng theo từng đợt khám.
        </Typography.Paragraph>
      </div>

      {/* Medical safety advice, not a claim about the system. */}
      <Alert
        type="info"
        showIcon
        icon={<WarningOutlined />}
        message="Lưu ý y tế quan trọng"
        description="Uống đúng liều lượng và thời gian ghi trên đơn. Không tự ý ngưng thuốc, tăng giảm liều hoặc dùng lại đơn cũ khi chưa có chỉ định của bác sĩ."
      />

      {isError && <Alert type="error" showIcon message={errorMessage(error)} />}

      <Space align="center" size={12}>
        <Typography.Text type="secondary">Thứ tự sắp xếp:</Typography.Text>
        <Select
          style={{ width: 190 }}
          options={SORT_OPTIONS}
          value={order}
          onChange={setOrder}
        />
      </Space>

      {isPending ? (
        <Skeleton active />
      ) : rows.length > 0 ? (
        <>
          {rows.map((prescription) => {
            const visit = visitByAppointment.get(prescription.appointmentId);

            return (
              <Card key={prescription.prescriptionId} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0' }}>
                  <Space size={10} wrap>
                    <MedicineBoxOutlined style={{ color: '#1677ff' }} />
                    <Typography.Text strong>
                      Đơn thuốc ngày {formatDateTime(prescription.createdAt)}
                    </Typography.Text>
                    {visit && (
                      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        {visit.doctorSpecialty}
                      </Tag>
                    )}
                  </Space>

                  <Space size={16} wrap style={{ marginTop: 8, color: '#667085', fontSize: 13 }}>
                    {/* The real prescription id, not an invented reference format. */}
                    <Space size={4}>
                      <NumberOutlined />
                      <span>Đơn #{prescription.prescriptionId}</span>
                    </Space>
                    {visit && (
                      <Space size={4}>
                        <UserOutlined />
                        <span>BS. {visit.doctorFullName}</span>
                      </Space>
                    )}
                    <Space size={4}>
                      <MedicineBoxOutlined />
                      <span>{prescription.details.length} loại thuốc</span>
                    </Space>
                  </Space>
                </div>

                {prescription.notes && (
                  <div style={{ padding: '16px 20px 0' }}>
                    <Alert
                      type="warning"
                      showIcon
                      icon={<BulbOutlined />}
                      message={
                        <span>
                          <b>Ghi chú của bác sĩ:</b> {prescription.notes}
                        </span>
                      }
                    />
                  </div>
                )}

                <div style={{ padding: 20 }}>
                  <Table<PrescriptionMedicine>
                    rowKey="medicineId"
                    size="small"
                    pagination={false}
                    columns={columns}
                    dataSource={prescription.details}
                  />
                </div>
              </Card>
            );
          })}

          {data && (
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Typography.Text type="secondary">
                Hiển thị {rows.length} trong tổng số {data.totalElements} đơn thuốc
              </Typography.Text>
              <Pagination
                current={data.page + 1}
                pageSize={data.size}
                total={data.totalElements}
                showSizeChanger={false}
                onChange={(page) => setPageQuery((current) => ({ ...current, page: page - 1 }))}
              />
            </Space>
          )}
        </>
      ) : (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa có đơn thuốc nào">
            <Typography.Text type="secondary">
              Đơn thuốc được tạo khi bác sĩ kê đơn sau buổi khám.
            </Typography.Text>
          </Empty>
        </Card>
      )}
    </Space>
  );
}
