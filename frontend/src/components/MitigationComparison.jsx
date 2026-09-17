// P5 — Mitigation + Transition Risk Budget + Recharts + Before/After + P7 timeline sparkline
// + Implement Changes / Undo (ephemeral UI state)
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { evaluateMitigations, fetchBeforeAfter } from '../api/client';

const S_META = {
  do_nothing:         { icon: '⏸', label: 'Do Nothing',          color: 'var(--rose)' },
  patch_isolate:      { icon: '🩹', label: 'Patch & Isolate',     color: 'var(--amber)' },
  immediate_replace:  { icon: '🔄', label: 'Immediate Replace',   color: '#fb923c' },
  gradual_migration:  { icon: '🔀', label: 'Gradual Migration',   color: 'var(--emerald)' },
};

const DISRUPTION_LEVEL = { None: 0, Low: 1, Medium: 2, High: 3 };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-0)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 11, color: p.fill || 'var(--sky)' }}>
          Residual Risk: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// P7 — Strategy-specific health timeline curves
// Each strategy has a distinct shape: immediate_replace = steep early drop then flat,
// gradual = smooth linear improvement, patch = partial step-down, do_nothing = flat
const buildTimeline = (before, after, strategy) => {
  if (!before || !after) return [];
  const start = before.risk;
  const end = after.risk;
  const delta = end - start; // negative = improvement

  const curves = {
    immediate_replace: [
      { week: 'Now', risk: start },
      { week: 'W1',  risk: Math.round(start + delta * 0.72) },  // steep early drop
      { week: 'W2',  risk: Math.round(start + delta * 0.90) },
      { week: 'W3',  risk: Math.round(start + delta * 0.96) },
      { week: 'W4',  risk: end },
    ],
    gradual_migration: [
      { week: 'Now', risk: start },
      { week: 'W1',  risk: Math.round(start + delta * 0.15) },  // slow start
      { week: 'W2',  risk: Math.round(start + delta * 0.40) },
      { week: 'W3',  risk: Math.round(start + delta * 0.72) },  // accelerates mid
      { week: 'W4',  risk: end },
    ],
    patch_isolate: [
      { week: 'Now', risk: start },
      { week: 'W1',  risk: Math.round(start + delta * 0.80) },  // quick partial fix
      { week: 'W2',  risk: Math.round(start + delta * 0.90) },
      { week: 'W3',  risk: Math.round(start + delta * 0.95) },
      { week: 'W4',  risk: end },
    ],
    do_nothing: [
      { week: 'Now', risk: start },
      { week: 'W1',  risk: Math.round(start * 1.03) },  // risk creeps up
      { week: 'W2',  risk: Math.round(start * 1.06) },
      { week: 'W3',  risk: Math.round(start * 1.09) },
      { week: 'W4',  risk: Math.round(start * 1.12) },
    ],
  };

  return curves[strategy] || curves.gradual_migration;
};

export default function MitigationComparison({ nodeId, mitigationResults, setMitigationResults }) {
  const [loading, setLoading] = useState(false);
  const [selectedStrat, setSelectedStrat] = useState(null);
  const [baData, setBaData] = useState(null);
  const [baLoading, setBaLoading] = useState(false);

  // Budget state (P5)
  const [maxDisruption, setMaxDisruption] = useState(null);
  const [protectCritical, setProtectCritical] = useState(false);

  // Implement Changes / Undo state
  const [implementedStrat, setImplementedStrat] = useState(null);
  const [showImplemented, setShowImplemented] = useState(false);

  // Fetch mitigations — re-fetch when budget changes
  useEffect(() => {
    if (!nodeId) return;
    let active = true;
    setLoading(true);
    const budget = {};
    if (maxDisruption) budget.max_disruption = maxDisruption;
    if (protectCritical) budget.protect_critical = true;

    evaluateMitigations(nodeId, budget)
      .then(d => {
        if (!active) return;
        setMitigationResults(d);
        const rec = d.recommendation?.recommended_strategy || d.recommendation?.strategy;
        if (rec) setSelectedStrat(rec);
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [nodeId, maxDisruption, protectCritical, setMitigationResults]);

  // Fetch before/after when strategy selected
  useEffect(() => {
    if (!nodeId || !selectedStrat) return;
    let active = true;
    setBaLoading(true);
    setBaData(null);
    fetchBeforeAfter(nodeId, selectedStrat)
      .then(d => { if (active) setBaData(d); })
      .catch(console.error)
      .finally(() => { if (active) setBaLoading(false); });
    return () => { active = false; };
  }, [nodeId, selectedStrat]);

  // Reset implemented state when node changes
  useEffect(() => {
    setImplementedStrat(null);
    setShowImplemented(false);
  }, [nodeId]);

  if (loading || !mitigationResults) {
    return (
      <div className="panel fade-up" style={{ padding: 14, flexShrink: 0 }}>
        <div style={{ color: 'var(--text-2)', fontSize: 12 }}>Evaluating counterfactual strategies...</div>
      </div>
    );
  }

  const { strategies = [], recommendation } = mitigationResults;
  const rec = recommendation?.recommended_strategy || recommendation?.strategy;

  const chartData = strategies.map(s => ({ name: s.label, id: s.strategy, risk: s.residual_risk }));
  const timelineData = buildTimeline(baData?.before, baData?.after, selectedStrat);

  const handleImplement = () => {
    setImplementedStrat(selectedStrat);
    setShowImplemented(true);
  };
  const handleUndo = () => {
    setImplementedStrat(null);
    setShowImplemented(false);
  };

  // When a strategy is implemented, show the "after" numbers as the effective state
  const effectiveBefore = implementedStrat ? baData?.after : baData?.before;
  const displayLabel = implementedStrat ? '✓ Applied' : 'Before';
  const displayColor = implementedStrat ? 'var(--emerald)' : 'var(--rose)';

  return (
    <div className="panel fade-up" style={{ padding: 14, flexShrink: 0, border: '1px solid rgba(56,189,248,0.15)' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sky)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        🎯 Intervention Planner
      </div>

      {/* Implemented banner */}
      {showImplemented && (
        <div style={{ padding: '10px 12px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', borderRadius: 7, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--emerald)', marginBottom: 2 }}>
              ✓ Changes Applied (UI Preview)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-0)', fontWeight: 600 }}>
              {S_META[implementedStrat]?.icon} {S_META[implementedStrat]?.label} — risk view updated below
            </div>
          </div>
          <button onClick={handleUndo} style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid var(--rose-border)',
            background: 'var(--rose-bg)', color: 'var(--rose)', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            ↩ Undo
          </button>
        </div>
      )}

      {/* Recommendation box */}
      {recommendation && !showImplemented && (
        <div style={{ padding: '10px 12px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', borderRadius: 7, marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--emerald)', marginBottom: 4 }}>
            ✓ Recommended Strategy
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-0)', marginBottom: 6 }}>
            {S_META[rec]?.icon} {recommendation.recommended_label || recommendation.label}
          </div>
          {(recommendation.reasons || []).slice(0, 2).map((r, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text-1)', display: 'flex', gap: 5, marginBottom: 2 }}>
              <span style={{ color: 'var(--emerald)', flexShrink: 0 }}>›</span> {r}
            </div>
          ))}
        </div>
      )}

      {/* P5 — Transition Risk Budget controls */}
      <div style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 7, marginBottom: 12, border: '1px solid var(--border-1)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 8 }}>
          ⚖️ Transition Risk Budget
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>Max disruption allowed:</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {[null, 'None', 'Low', 'Medium', 'High'].map(d => (
            <button key={d ?? 'any'} onClick={() => setMaxDisruption(d)}
              style={{ padding: '3px 9px', borderRadius: 4, border: `1px solid ${maxDisruption === d ? 'var(--sky)' : 'var(--border-2)'}`, background: maxDisruption === d ? 'var(--sky-bg)' : 'transparent', color: maxDisruption === d ? 'var(--sky)' : 'var(--text-2)', fontSize: 11, cursor: 'pointer', fontWeight: maxDisruption === d ? 700 : 400 }}>
              {d ?? 'Any'}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-1)', cursor: 'pointer' }}>
          <input type="checkbox" checked={protectCritical} onChange={e => setProtectCritical(e.target.checked)} />
          Protect all critical applications
        </label>
      </div>

      {/* Strategy selector */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 7 }}>
        Select Strategy
      </div>
      <div className="strategy-grid" style={{ marginBottom: 12 }}>
        {strategies.map(s => {
          const m = S_META[s.strategy] || {};
          const isRec = s.strategy === rec;
          const isActive = s.strategy === selectedStrat;
          const outOfBudget = s.within_budget === false;
          return (
            <div key={s.strategy}
              className={`strategy-card ${isRec ? 'recommended' : isActive ? 'active' : ''} ${outOfBudget ? 'out-of-budget' : ''}`}
              onClick={() => setSelectedStrat(s.strategy)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-0)' }}>{m.icon} {s.label}</div>
                {isRec && <span style={{ fontSize: 9, background: 'var(--emerald-bg)', color: 'var(--emerald)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>★ REC</span>}
                {outOfBudget && <span style={{ fontSize: 9, background: 'var(--rose-bg)', color: 'var(--rose)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>✗ OVER</span>}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.color || 'var(--text-0)', lineHeight: 1 }}>{s.residual_risk}</div>
              <div style={{ fontSize: 9, color: 'var(--text-2)', marginTop: 2 }}>residual risk · {s.disruption} disruption</div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div style={{ height: 110, marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 2, right: 4, left: -30, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#5c6280', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5c6280', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 5']} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="risk" radius={[3, 3, 0, 0]}>
              {chartData.map(entry => {
                const m = S_META[entry.id];
                const isSelected = entry.id === selectedStrat;
                return <Cell key={entry.id} fill={isSelected ? (m?.color || 'var(--sky)') : 'var(--bg-3)'} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Before / After */}
      {baLoading ? (
        <div style={{ color: 'var(--text-2)', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>Loading comparison...</div>
      ) : baData ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 7, display: 'flex', justifyContent: 'space-between' }}>
            <span>Before vs After</span>
            <span style={{ color: S_META[selectedStrat]?.color || 'var(--text-2)' }}>{S_META[selectedStrat]?.label}</span>
          </div>
          <div className="ba-grid" style={{ marginBottom: 10 }}>
            <div className="ba-cell ba-before">
              <div style={{ fontSize: 9, fontWeight: 700, color: displayColor, textTransform: 'uppercase', marginBottom: 6 }}>
                {displayLabel}
              </div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Risk</span><strong style={{ color: displayColor }}>{effectiveBefore?.risk ?? baData.before.risk}</strong></div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Apps</span><span>{effectiveBefore?.affected_applications ?? baData.before.affected_applications}</span></div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Critical</span><span style={{ color: displayColor }}>{effectiveBefore?.critical_applications ?? baData.before.critical_applications}</span></div>
            </div>
            <div className="ba-cell ba-after">
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: 6 }}>After</div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Risk</span><strong style={{ color: 'var(--emerald)' }}>{baData.after.risk}</strong></div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Apps</span><span>{baData.after.affected_applications}</span></div>
              <div className="ba-row"><span style={{ color: 'var(--text-1)' }}>Critical</span><span style={{ color: 'var(--emerald)' }}>{baData.after.critical_applications}</span></div>
            </div>
          </div>

          {/* Reduction badge */}
          {baData.before.risk > 0 && (
            <div style={{ textAlign: 'center', padding: '5px', background: 'var(--emerald-bg)', borderRadius: 5, border: '1px solid var(--emerald-border)', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)' }}>
                ↓ {Math.round((1 - baData.after.risk / baData.before.risk) * 100)}% risk reduction
              </span>
            </div>
          )}

          {/* Implement Changes / Undo buttons */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {!showImplemented ? (
              <button
                onClick={handleImplement}
                disabled={!selectedStrat || selectedStrat === 'do_nothing'}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 5,
                  border: '1px solid var(--emerald-border)',
                  background: 'var(--emerald-bg)', color: 'var(--emerald)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: (!selectedStrat || selectedStrat === 'do_nothing') ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selectedStrat && selectedStrat !== 'do_nothing') e.currentTarget.style.background = 'rgba(110,231,183,0.15)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--emerald-bg)'}
              >
                ✓ Implement Changes
              </button>
            ) : (
              <>
                <button disabled style={{ flex: 1, padding: '7px 12px', borderRadius: 5, border: '1px solid var(--emerald-border)', background: 'var(--emerald-bg)', color: 'var(--emerald)', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.6 }}>
                  ✓ Applied
                </button>
                <button onClick={handleUndo} style={{ padding: '7px 12px', borderRadius: 5, border: '1px solid var(--rose-border)', background: 'var(--rose-bg)', color: 'var(--rose)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                  ↩ Undo
                </button>
              </>
            )}
          </div>

          {/* P7 — Strategy-specific Health Timeline Sparkline */}
          {timelineData.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Projected Recovery (4 weeks)</span>
                <span style={{ color: S_META[selectedStrat]?.color, fontWeight: 500 }}>
                  {selectedStrat === 'immediate_replace' ? 'Steep then flat' :
                   selectedStrat === 'gradual_migration' ? 'Linear ramp' :
                   selectedStrat === 'patch_isolate' ? 'Quick partial fix' :
                   selectedStrat === 'do_nothing' ? 'Risk grows' : ''}
                </span>
              </div>
              <div style={{ height: 70 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fill: '#5c6280', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5c6280', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, baData.before.risk + 10]} />
                    <ReferenceLine y={baData.after.risk} stroke="var(--emerald)" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke={S_META[selectedStrat]?.color || 'var(--sky)'}
                      strokeWidth={2}
                      dot={{ fill: S_META[selectedStrat]?.color || 'var(--sky)', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
