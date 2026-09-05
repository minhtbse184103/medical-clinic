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
export function BrandMark({ size = 'default' }: { size?: 'default' | 'large' }) {
  const tile = size === 'large' ? 56 : 44;
  const text = size === 'large' ? 26 : 22;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: tile,
          height: tile,
          borderRadius: tile / 3.5,
          background: '#1677ff',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PulseIcon size={tile * 0.55} />
      </div>
      <span style={{ fontSize: text, fontWeight: 700, letterSpacing: -0.4, color: '#101828' }}>
        Medical Clinic
      </span>
    </div>
  );
}
