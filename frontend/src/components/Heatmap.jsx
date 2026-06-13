import { useMemo } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
);

function getColor(stress) {
  if (stress === undefined || stress === null) return 'var(--color-border-light)';
  if (stress <= 2) return '#bbf7d0';
  if (stress <= 4) return '#86efac';
  if (stress <= 6) return '#fde68a';
  if (stress <= 8) return '#fb923c';
  return '#f87171';
}

export default function Heatmap({ data = [] }) {
  // Build a 7×24 map: dayOfWeek × hour → avgStress
  const grid = useMemo(() => {
    const map = {};
    data.forEach(({ dayOfWeek, hour, avgStress }) => {
      // MongoDB $dayOfWeek: 1=Sun, 7=Sat
      const dayIdx = dayOfWeek - 1;
      map[`${dayIdx}-${hour}`] = avgStress;
    });
    return map;
  }, [data]);

  const hasSomeData = data.length > 0;

  return (
    <div>
      {!hasSomeData ? (
        <div className="empty-state" style={{ minHeight: 180 }}>
          <span className="empty-state-icon">🗓️</span>
          <p>Complete more sessions to see your emotional patterns.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            {/* Hour labels */}
            <div style={{ display: 'flex', marginLeft: 36 }}>
              {HOURS.filter((_, i) => i % 3 === 0).map((h, idx) => (
                <div key={idx} style={{
                  width: `${100 / 8}%`, fontSize: '0.65rem',
                  color: 'var(--color-text-muted)', textAlign: 'center',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <div style={{
                  width: 32, fontSize: '0.7rem', color: 'var(--color-text-muted)',
                  fontWeight: 500, flexShrink: 0,
                }}>
                  {day}
                </div>
                {HOURS.map((_, hourIdx) => {
                  const stress = grid[`${dayIdx}-${hourIdx}`];
                  return (
                    <div
                      key={hourIdx}
                      title={stress !== undefined ? `${day} ${HOURS[hourIdx]}: Avg stress ${stress}` : `${day} ${HOURS[hourIdx]}: No data`}
                      style={{
                        flex: 1, height: 16, margin: '0 1px',
                        background: getColor(stress),
                        borderRadius: 2,
                        cursor: stress !== undefined ? 'pointer' : 'default',
                        transition: 'opacity 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Low stress</span>
              {['#bbf7d0', '#86efac', '#fde68a', '#fb923c', '#f87171'].map((c) => (
                <div key={c} style={{ width: 14, height: 14, background: c, borderRadius: 2 }} />
              ))}
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
