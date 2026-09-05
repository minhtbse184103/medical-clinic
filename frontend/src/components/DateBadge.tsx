import dayjs from 'dayjs';

const MONTH_SHORT = [
  'TH1',
  'TH2',
  'TH3',
  'TH4',
  'TH5',
  'TH6',
  'TH7',
  'TH8',
  'TH9',
  'TH10',
  'TH11',
  'TH12',
];

/** Day-over-month tile used to anchor each row in the appointment lists. */
export function DateBadge({ date }: { date: string }) {
  const value = dayjs(date);

  return (
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: 12,
        background: '#e6fffb',
        color: '#08979c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: 1.15,
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 700 }}>{value.format('DD')}</span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4 }}>
        {MONTH_SHORT[value.month()]}
      </span>
    </div>
  );
}
