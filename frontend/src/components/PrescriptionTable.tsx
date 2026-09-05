import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { PrescriptionMedicine } from '../types/api';

const columns: ColumnsType<PrescriptionMedicine> = [
  { title: 'Thuốc', dataIndex: 'medicineName', key: 'medicineName' },
  { title: 'Liều', dataIndex: 'dosage', key: 'dosage' },
  { title: 'Tần suất', dataIndex: 'frequency', key: 'frequency' },
  { title: 'Thời gian', dataIndex: 'duration', key: 'duration' },
  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
  {
    title: 'Hướng dẫn',
    dataIndex: 'instruction',
    key: 'instruction',
    render: (value: string | null) => value ?? '—',
  },
];

/**
 * Renders the medicines of a prescription. Both the read endpoints already include
 * medicineName, so no extra lookup is needed to display one.
 */
export function PrescriptionTable({ details }: { details: PrescriptionMedicine[] }) {
  return (
    <Table<PrescriptionMedicine>
      rowKey="medicineId"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={details}
    />
  );
}
