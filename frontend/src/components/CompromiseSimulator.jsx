import { useState } from 'react';
import { simulateCompromise } from '../api/client';

const nodeTypeStyle = {
  application: { bg: 'var(--sky-bg)', color: 'var(--sky)', border: 'var(--sky-border)' },
  service:     { bg: 'var(--violet-bg)', color: 'var(--violet)', border: 'var(--violet-border)' },
  package:     { bg: 'var(--slate-bg)', color: 'var(--slate)', border: 'var(--slate-border)' },
};

export default function CompromiseSimulator({ nodeId, simulationResults, setSimulationResults }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    setLoading(true); setErr(null);
    try { setSimulationResults(await simulateCompromise(nodeId)); }
    catch { setErr('Simulation failed. Check backend.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel fade-up" style={{ padding: 14, flexShrink: 0, border: '1px solid var(--rose-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 6 }}>
          💥 Compromise Simulation
        </div>
        {simulationResults && (
          <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: 'var(--rose-bg)', color: 'var(--rose)', border: '1px solid var(--rose-border)', fontWeight: 700 }}>
            {simulationResults.total_blast_radius} apps hit
          </span>
        )}
      </div>

      {!simulationResults ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
            Simulate a zero-day on this package to trace the full downstream blast radius.
          </div>
          <button className="btn btn-danger" onClick={run} disabled={loading}>
            {loading
              ? <><Spinner /> Running...</>
              : '⚡ Simulate Compromise'}
          </button>
          {err && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rose)' }}>{err}</div>}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
            <MiniStat label="Apps Hit" value={simulationResults.total_blast_radius} color="var(--rose)" />
            <MiniStat label="Critical" value={simulationResults.critical_applications?.length || 0} color="var(--amber)" />
            <MiniStat label="Propagation" value={`${simulationResults.propagation_depth} hops`} color="var(--violet)" />
          </div>

          {/* Timeline (P6 context) */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 8 }}>
            Propagation Timeline
          </div>
          <div className="timeline-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {simulationResults.timeline.map(step => (
              <div key={step.t} className="tl-step">
                <div className="tl-dot">{step.label}</div>
                <div style={{ paddingTop: 6, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
                    {step.nodes.length} node{step.nodes.length !== 1 ? 's' : ''} compromised
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {step.nodes.map(n => {
                      const s = nodeTypeStyle[n.type] || nodeTypeStyle.package;
                      return (
                        <span key={n.id} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                          {n.name}{n.criticality === 'critical' ? ' 🔴' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setSimulationResults(null)} style={{ marginTop: 10, width: '100%', background: 'none', border: '1px solid var(--border-2)', color: 'var(--text-2)', padding: '5px', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
            Reset Simulation
          </button>
        </>
      )}
    </div>
  );
}

const MiniStat = ({ label, value, color }) => (
  <div style={{ background: 'var(--bg-2)', borderRadius: 5, padding: '7px', textAlign: 'center', border: '1px solid var(--border-1)' }}>
    <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>{label}</div>
  </div>
);

const Spinner = () => (
  <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
);
