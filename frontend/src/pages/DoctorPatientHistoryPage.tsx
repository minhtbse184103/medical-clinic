import { Alert, Button, Card, Descriptions, Empty, Skeleton, Space, Typography } from 'antd';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { doctorApi } from '../api/doctor';
import { PageHeader } from '../components/PageHeader';
import { errorCode, errorMessage } from '../lib/apiError';
import { formatDateTime } from '../lib/datetime';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';

export function DoctorPatientHistoryPage() {
  const { patientId: patientIdParam } = useParams<{ patientId: string }>();
  const patientId = Number(patientIdParam);
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 10 });
  const navigate = useNavigate();

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['doctor-patient-records', patientId, pageQuery],
    queryFn: () => doctorApi.patientMedicalRecords(patientId, pageQuery.page, pageQuery.size),
    enabled: Number.isFinite(patientId),
    placeholderData: keepPreviousData,
  });

  // Access needs at least one appointment between this doctor and the patient;
  // the DOCTOR role alone is not enough, so a plain 403 is an expected outcome here.
  const isAccessDenied = errorCode(error) === 'DOCTOR_PATIENT_MEDICAL_RECORD_ACCESS_FORBIDDEN';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Lịch sử bệnh án"
        description="Chỉ xem được bệnh nhân bạn đã từng khám."
        onBack={() => navigate('/doctor/appointments')}
        backLabel="Lịch khám"
      />

      {isError && (
        <Alert
          type={isAccessDenied ? 'warning' : 'error'}
          showIcon
          message={
            isAccessDenied
              ? 'Bạn chưa từng khám cho bệnh nhân này nên không xem được bệnh án.'
              : errorMessage(error)
          }
        />
      )}

      {isPending ? (
        <Skeleton active />
      ) : isError ? null : data && data.content.length > 0 ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {data.content.map((record) => (
            <Card
              key={record.medicalRecordId}
              size="small"
              title={formatDateTime(record.createdAt)}
              loading={isFetching}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Chẩn đoán">{record.diagnosis}</Descriptions.Item>
                <Descriptions.Item label="Triệu chứng">
                  {record.symptoms ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Điều trị">{record.treatment ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú">{record.notes ?? '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          ))}

          {data.totalPages > 1 && (
            <Space>
              <Button
                disabled={pageQuery.page === 0}
                onClick={() => setPageQuery((c) => ({ ...c, page: c.page - 1 }))}
              >
                Trang trước
              </Button>
              <Typography.Text type="secondary">
                Trang {data.page + 1} / {data.totalPages}
              </Typography.Text>
              <Button
                disabled={data.page + 1 >= data.totalPages}
                onClick={() => setPageQuery((c) => ({ ...c, page: c.page + 1 }))}
              >
                Trang sau
              </Button>
            </Space>
          )}
        </Space>
      ) : (
        <Empty description="Bệnh nhân chưa có bệnh án nào" />
      )}
    </Space>
  );
}
