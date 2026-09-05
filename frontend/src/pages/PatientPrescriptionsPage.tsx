import { Alert, Card, Empty, Pagination, Skeleton, Space, Typography } from 'antd';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { patientApi } from '../api/patient';
import { PrescriptionTable } from '../components/PrescriptionTable';
import { errorMessage } from '../lib/apiError';
import { formatDateTime } from '../lib/datetime';
import { DEFAULT_PAGE_QUERY, type PageQuery } from '../lib/pagination';

export function PatientPrescriptionsPage() {
  const [pageQuery, setPageQuery] = useState<PageQuery>({ ...DEFAULT_PAGE_QUERY, size: 5 });

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-prescriptions', pageQuery],
    queryFn: () => patientApi.prescriptions(pageQuery.page, pageQuery.size),
    placeholderData: keepPreviousData,
  });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Đơn thuốc của tôi
      </Typography.Title>

      {isError && <Alert type="error" showIcon message={errorMessage(error)} />}

      {isPending ? (
        <Skeleton active />
      ) : isError ? null : data && data.content.length > 0 ? (
        <>
          {data.content.map((prescription) => (
            <Card
              key={prescription.prescriptionId}
              title={`Đơn thuốc ngày ${formatDateTime(prescription.createdAt)}`}
            >
              {prescription.notes && (
                <Typography.Paragraph>
                  <b>Ghi chú:</b> {prescription.notes}
                </Typography.Paragraph>
              )}
              <PrescriptionTable details={prescription.details} />
            </Card>
          ))}

          <Pagination
            current={data.page + 1}
            pageSize={data.size}
            total={data.totalElements}
            showSizeChanger={false}
            onChange={(page) => setPageQuery((current) => ({ ...current, page: page - 1 }))}
          />
        </>
      ) : (
        <Empty description="Bạn chưa có đơn thuốc nào" />
      )}
    </Space>
  );
}
