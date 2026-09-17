// P3 + P4 — Lock-in Score and Exit Cost panel
import { useState, useEffect } from 'react';
import { fetchPackageLockin } from '../api/client';

const LOCKIN_COLORS = {
  'VERY HIGH': { color: 'var(--rose)',    bg: 'var(--rose-bg)',    border: 'var(--rose-border)' },
  'HIGH':      { color: 'var(--amber)',   bg: 'var(--amber-bg)',   border: 'var(--amber-border)' },
  'MEDIUM':    { color: '#fb923c',        bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
  'LOW':       { color: 'var(--emerald)', bg: 'var(--emerald-bg)', border: 'var(--emerald-border)' },
};

const RATING_COLOR = {
  'Very High': 'var(--rose)',
  'High':      'var(--amber)',
  'Medium':    '#fb923c',
  'Low':       'var(--emerald)',
};

export default function LockinPanel({ nodeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    let active = true;
    setLoading(true);
    setData(null);
    fetchPackageLockin(nodeId)
      .then(d => { if (active) setData(d); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [nodeId]);

  if (loading) return (
    <div className="panel fade-up" style={{ padding: 14 }}>
      <div style={{ color: 'var(--text-2)', fontSize: 12 }}>Calculating lock-in profile...</div>
    </div>
  );
  if (!data) return null;

  const { lockin, exit_cost } = data;
  const lm = LOCKIN_COLORS[lockin.lockin_level] || LOCKIN_COLORS['MEDIUM'];

  return (
    <div className="panel fade-up" style={{ padding: 14, flexShrink: 0 }}>
      {/* Lock-in header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 3 }}>
            Dependency Lock-in
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: lm.color, lineHeight: 1 }}>
            {lockin.lockin_score}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginLeft: 4 }}>/100</span>
          </div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: 20, background: lm.bg, color: lm.color, border: `1px solid ${lm.border}`, fontWeight: 700, fontSize: 12 }}>
          {lockin.lockin_level}
        </div>
      </div>

      {/* Lock-in factors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {Object.entries(lockin.factors).map(([key, f]) => {
          const pct = key === 'replaceability' ? (f.value === 'low' ? 90 : f.value === 'medium' ? 50 : 15) : (f.pct || 0);
          const barColor = pct >= 70 ? 'var(--rose)' : pct >= 40 ? 'var(--amber)' : 'var(--emerald)';
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-1)' }}>{f.label}</span>
                {f.pct !== undefined && <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>{f.pct}%</span>}
              </div>
              <div className="lockin-bar-wrap">
                <div className="lockin-bar" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Exit cost */}
      <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)' }}>
            Exit Cost
          </div>
          <div style={{ fontWeight: 700, fontSize: 12, color: RATING_COLOR[exit_cost.overall_exit_cost] || 'var(--text-1)' }}>
            {exit_cost.overall_exit_cost}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Object.entries(exit_cost.dimensions).map(([key, dim]) => {
            // Replacement availability is INVERTED: High availability = green (easy to find alt)
            // All other dimensions: High = bad (red), Low = good (green)
            let dimColor;
            if (key === 'replacement_availability') {
              dimColor = dim.rating === 'High' ? 'var(--emerald)'
                : dim.rating === 'Medium' ? 'var(--amber)'
                : 'var(--rose)';
            } else {
              dimColor = RATING_COLOR[dim.rating] || 'var(--text-1)';
            }
            return (
              <div key={key} style={{ padding: '7px 9px', background: 'var(--bg-2)', borderRadius: 5, border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'capitalize', marginBottom: 2 }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: dimColor }}>
                  {dim.rating}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
