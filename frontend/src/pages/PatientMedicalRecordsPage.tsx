import { Alert, Card, Descriptions, Divider, Empty, Pagination, Select, Skeleton, Space, Typography } from 'antd';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { patientApi } from '../api/patient';
import { PrescriptionTable } from '../components/PrescriptionTable';
import { errorMessage } from '../lib/apiError';
import { formatDateTime } from '../lib/datetime';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';
import type { MedicalRecordSort, PatientPrescription } from '../types/api';

const SORT_OPTIONS: { value: MedicalRecordSort; label: string }[] = [
  { value: 'createdAt,desc', label: 'Mới nhất trước' },
  { value: 'createdAt,asc', label: 'Cũ nhất trước' },
];

export function PatientMedicalRecordsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });
  const [sort, setSort] = useState<MedicalRecordSort>('createdAt,desc');

  const recordsQuery = useQuery({
    queryKey: ['my-medical-records', pageQuery, sort],
    queryFn: () => patientApi.medicalRecords({ ...pageQuery, sort }),
    placeholderData: keepPreviousData,
  });

  // All prescriptions are fetched once and indexed by medical record, rather than issuing
  // one request per record on screen. The list is small and this keeps it to two requests.
  const prescriptionsQuery = useQuery({
    queryKey: ['my-prescriptions', { page: 0, size: 100 }],
    queryFn: () => patientApi.prescriptions(0, 100),
  });

  const prescriptionByRecord = useMemo(() => {
    const index = new Map<number, PatientPrescription>();
    for (const prescription of prescriptionsQuery.data?.content ?? []) {
      index.set(prescription.medicalRecordId, prescription);
    }
    return index;
  }, [prescriptionsQuery.data]);

  const records = recordsQuery.data;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Bệnh án của tôi
      </Typography.Title>

      {recordsQuery.isError && (
        <Alert type="error" showIcon message={errorMessage(recordsQuery.error)} />
      )}

      <Select
        value={sort}
        style={{ width: 200 }}
        options={SORT_OPTIONS}
        onChange={(value: MedicalRecordSort) => {
          setSort(value);
          setPageQuery((current) => ({ ...current, page: 0 }));
        }}
      />

      {recordsQuery.isPending ? (
        <Skeleton active />
      ) : recordsQuery.isError ? null : records && records.content.length > 0 ? (
        <>
          {records.content.map((record) => {
            const prescription = prescriptionByRecord.get(record.medicalRecordId);

            return (
              <Card key={record.medicalRecordId} title={`Khám ngày ${formatDateTime(record.createdAt)}`}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Chẩn đoán">{record.diagnosis}</Descriptions.Item>
                  <Descriptions.Item label="Triệu chứng">
                    {record.symptoms ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Điều trị">{record.treatment ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">{record.notes ?? '—'}</Descriptions.Item>
                </Descriptions>

                <Divider orientation="left" plain>
                  Đơn thuốc
                </Divider>

                {prescriptionsQuery.isPending ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : prescription ? (
                  <>
                    {prescription.notes && (
                      <Typography.Paragraph>
                        <b>Ghi chú:</b> {prescription.notes}
                      </Typography.Paragraph>
                    )}
                    <PrescriptionTable details={prescription.details} />
                  </>
                ) : (
                  <Typography.Text type="secondary">
                    Lần khám này không có đơn thuốc.
                  </Typography.Text>
                )}
              </Card>
            );
          })}

          <Pagination
            current={records.page + 1}
            pageSize={records.size}
            total={records.totalElements}
            showSizeChanger={false}
            onChange={(page) => setPageQuery((current) => ({ ...current, page: page - 1 }))}
          />
        </>
      ) : (
        <Empty description="Bạn chưa có bệnh án nào" />
      )}
    </Space>
  );
}
