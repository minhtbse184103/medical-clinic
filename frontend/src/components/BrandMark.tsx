/** The pulse line used as the product mark. Ant Design's icon set has no equivalent. */
export function PulseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}

/** Logo lockup: the mark in a rounded blue tile, followed by the product name. */
export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#1677ff',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 6px 16px rgba(22, 119, 255, 0.28)',
        }}
      >
        <PulseIcon size={26} />
      </div>
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, color: '#101828' }}>
          Medical Clinic
        </div>
        {subtitle && <div style={{ fontSize: 13, color: '#667085' }}>{subtitle}</div>}
      </div>
    </div>
  );
}
