import { useState, useEffect } from 'react';
import { fetchPackageRisk } from '../api/client';

const riskMeta = (score) => {
  if (score >= 70) return { color: 'var(--rose)', label: 'Critical' };
  if (score >= 50) return { color: 'var(--amber)', label: 'High' };
  if (score >= 30) return { color: '#fb923c', label: 'Medium' };
  return { color: 'var(--emerald)', label: 'Low' };
};

const repMeta = (rep) => ({
  low:    { color: 'var(--rose)',    icon: '🔒', text: 'Hard to replace' },
  medium: { color: 'var(--amber)',   icon: '⚠️', text: 'Moderate effort' },
  high:   { color: 'var(--emerald)', icon: '✓',  text: 'Easy to replace' },
}[rep] || { color: 'var(--slate)', icon: '?', text: rep });

const reasonIcon = (r) => {
  if (/severity/i.test(r)) return '⚡';
  if (/critical/i.test(r)) return '🎯';
  if (/replac/i.test(r)) return '🔒';
  if (/propagat/i.test(r)) return '🌊';
  if (/centrality/i.test(r)) return '🕸️';
  return '›';
};

export default function RiskExplainPanel({ nodeId, nodeInfo, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nodeId || !nodeInfo || nodeInfo.type !== 'package') { setData(null); return; }
    let active = true;
    setLoading(true);
    setData(null);
    fetchPackageRisk(nodeId)
      .then(d => { if (active) setData(d); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [nodeId, nodeInfo]);

  if (!nodeInfo) return null;

  const typeColor = { application: 'var(--sky)', service: 'var(--violet)', package: 'var(--slate)' }[nodeInfo.type] || 'var(--slate)';

  return (
    <div className="panel fade-up" style={{ padding: 14, flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {nodeInfo.type}
            </span>
            {nodeInfo.criticality === 'critical' && (
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: 'var(--rose-bg)', color: 'var(--rose)', border: '1px solid var(--rose-border)', fontWeight: 700 }}>
                Critical
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-0)', marginTop: 4, lineHeight: 1.2 }}>
            {nodeInfo.name}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-2)', color: 'var(--text-2)', cursor: 'pointer', width: 24, height: 24, borderRadius: 4, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* Non-package */}
      {nodeInfo.type !== 'package' && (
        <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 6, fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6 }}>
          {nodeInfo.type === 'application'
            ? `${nodeInfo.criticality === 'critical' ? 'A mission-critical' : 'A standard'} application in the ecosystem. Select a package node (hexagon) to analyze risk and blast radius.`
            : 'An internal service. Packages that this service depends on carry the risk. Select a package node to inspect.'}
        </div>
      )}

      {/* Loading */}
      {nodeInfo.type === 'package' && loading && (
        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-2)', fontSize: 12 }}>Analyzing...</div>
      )}

      {/* Package risk data */}
      {data && nodeInfo.type === 'package' && (
        <>
          {/* Score row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
            <ScoreBox label="Risk Score" value={data.risk_score} color={riskMeta(data.risk_score).color} sub={riskMeta(data.risk_score).label} />
            <ScoreBox label="Blast Radius" value={data.blast_radius} color="var(--text-0)" sub={`${data.critical_app_count} critical`} subColor={data.critical_app_count > 0 ? 'var(--rose)' : 'var(--text-2)'} />
            <ScoreBox label="Depth" value={data.propagation_depth} color="var(--text-0)" sub="levels" />
          </div>

          {/* Replaceability + version */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <Tag text={`v${data.version}`} color="var(--slate)" />
            {(() => { const m = repMeta(data.replaceability); return <Tag text={`${m.icon} ${m.text}`} color={m.color} />; })()}
            <Tag text={`${data.confidence * 100 | 0}% confidence`} color="var(--text-2)" />
          </div>

          {/* Reasons */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 6 }}>
            Why it's risky
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.reasons.map((r, i) => {
              const isHigh = /high|critical/i.test(r);
              const isMed = /moderate/i.test(r);
              return (
                <div key={i} style={{
                  display: 'flex', gap: 8, padding: '6px 8px',
                  background: 'var(--bg-2)', borderRadius: 5,
                  borderLeft: `2px solid ${isHigh ? 'var(--rose)' : isMed ? 'var(--amber)' : 'var(--border-3)'}`,
                  fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4,
                }}>
                  <span style={{ flexShrink: 0 }}>{reasonIcon(r)}</span>
                  <span>{r}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const ScoreBox = ({ label, value, color, sub, subColor }) => (
  <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '8px', textAlign: 'center', border: '1px solid var(--border-1)' }}>
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-2)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: subColor || 'var(--text-2)', marginTop: 2 }}>{sub}</div>}
  </div>
);

const Tag = ({ text, color }) => (
  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30`, fontWeight: 500 }}>
    {text}
  </span>
);
