export default function InsightCard({ title, value, subtitle, icon, color = 'primary', trend }) {
  const colorMap = {
    primary: { bg: 'var(--color-primary-soft)', text: 'var(--color-primary)', border: '#c7d2fe' },
    success: { bg: 'var(--color-secondary-soft)', text: 'var(--color-secondary)', border: '#a7f3d0' },
    warning: { bg: 'var(--color-accent-soft)', text: 'var(--color-accent)', border: '#fde68a' },
    danger: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', border: '#fecaca' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div
      className="card"
      style={{ border: `1px solid ${c.border}`, transition: 'transform 150ms ease, box-shadow 150ms ease' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--color-secondary)' : 'var(--color-danger)',
            background: trend >= 0 ? 'var(--color-secondary-soft)' : 'var(--color-danger-soft)',
            padding: '3px 8px', borderRadius: 'var(--radius-full)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: c.text, lineHeight: 1.2, marginBottom: 4 }}>
          {value}
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
