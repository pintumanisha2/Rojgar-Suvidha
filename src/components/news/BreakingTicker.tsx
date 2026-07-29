"use client";

export default function BreakingTicker({ headlines }: { headlines: string[] }) {
  if (!headlines.length) return null;
  const doubled = [...headlines, ...headlines];
  const duration = Math.max(25, headlines.length * 7);

  return (
    <>
      <style>{`
        @keyframes rs-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .rs-ticker-track {
          animation: rs-ticker ${duration}s linear infinite;
          will-change: transform;
          display: flex;
          align-items: center;
          white-space: nowrap;
        }
        .rs-ticker-track:hover { animation-play-state: paused; cursor: default; }
      `}</style>

      <div style={{ background: '#c81e1e', display: 'flex', alignItems: 'stretch', height: 38, overflow: 'hidden', flexShrink: 0 }}>
        {/* BREAKING label */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
          background: '#991b1b', padding: '0 18px', color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
          BREAKING
        </div>

        {/* Arrow chevron */}
        <div style={{
          width: 0, height: 0, flexShrink: 0,
          borderTop: '38px solid transparent',
          borderLeft: '15px solid #991b1b',
        }} />

        {/* Scrolling marquee */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div className="rs-ticker-track">
            {doubled.map((h, i) => (
              <span key={i} style={{
                color: 'white', fontSize: 12.5, fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
                padding: '0 28px',
                borderRight: '1px solid rgba(255,255,255,0.22)',
                flexShrink: 0,
              }}>
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
