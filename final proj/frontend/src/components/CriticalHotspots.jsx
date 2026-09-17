const RISK_META = (score) => {
  if (score >= 70) return { color: 'var(--rose)', bg: 'var(--rose-bg)', border: 'var(--rose-border)', label: 'Critical' };
  if (score >= 50) return { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', label: 'High' };
  if (score >= 30) return { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)', label: 'Medium' };
  return { color: 'var(--emerald)', bg: 'var(--emerald-bg)', border: 'var(--emerald-border)', label: 'Low' };
};

export default function CriticalHotspots({ hotspots, onSelect }) {
  if (!hotspots?.length) return (
    <div className="panel" style={{ padding: 16 }}>
      <p style={{ color: 'var(--text-2)', fontSize: 12 }}>No data yet.</p>
    </div>
  );

  return (
    <div className="panel fade-up" style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-0)' }}>Critical Hotspots</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Ranked by composite risk · click to inspect</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'var(--rose-bg)', color: 'var(--rose)', borderRadius: 20, border: '1px solid var(--rose-border)' }}>
          {hotspots.length} packages
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1 }}>
        {hotspots.map((h, i) => {
          const m = RISK_META(h.risk_score);
          return (
            <div
              key={h.package_id}
              className="hotspot-row"
              style={{ borderLeftColor: m.color }}
              onClick={() => onSelect(h.package_id)}
            >
              {/* Rank */}
              <div style={{ width: 20, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>
                {i + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1, display: 'flex', gap: 8 }}>
                  <span>v{h.version}</span>
                  <span>{h.blast_radius} apps</span>
                  {h.critical_app_count > 0 && <span style={{ color: 'var(--rose)' }}>{h.critical_app_count} critical</span>}
                </div>
              </div>

              {/* Risk score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>{h.risk_score}</div>
                <div style={{ fontSize: 9, color: m.color, opacity: 0.8, textTransform: 'uppercase' }}>{m.label}</div>
              </div>

              {/* Mini risk bar */}
              <div style={{ width: 3, alignSelf: 'stretch', background: m.border, borderRadius: 2, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
