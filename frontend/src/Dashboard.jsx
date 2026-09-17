import { useState } from 'react';
import DependencyGraph from './components/DependencyGraph';
import CriticalHotspots from './components/CriticalHotspots';
import RiskExplainPanel from './components/RiskExplainPanel';
import LockinPanel from './components/LockinPanel';
import CompromiseSimulator from './components/CompromiseSimulator';
import MitigationComparison from './components/MitigationComparison';
import PackagesTable from './components/PackagesTable';
import './Dashboard.css';

export default function Dashboard({
  ecosystem, summary, hotspots, allPackages,
  selectedNode, onNodeSelect, onDeselect,
  simulationResults, setSimulationResults,
  mitigationResults, setMitigationResults,
}) {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'packages'
  const nodeInfo = selectedNode && ecosystem
    ? ecosystem.nodes.find(n => n.id === selectedNode)
    : null;
  const isPackage = nodeInfo?.type === 'package';

  return (
    <div className="dash-root">
      {/* ── Left column ─────────────────────────────────── */}
      <div className="dash-left">
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 12, padding: '3px', background: 'var(--bg-2)', borderRadius: 'var(--r-sm)', width: 'fit-content' }}>
            {[['graph', '⬡ Graph'], ['packages', '≡ All Packages']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '4px 14px', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeTab === id ? 'var(--bg-1)' : 'transparent',
                color: activeTab === id ? 'var(--text-0)' : 'var(--text-2)',
                boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Graph tab */}
          {activeTab === 'graph' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-2)' }}>
                  <LegendDot color="var(--sky)" shape="circle" label="App" />
                  <LegendDot color="var(--violet)" shape="square" label="Service" />
                  <LegendDot color="var(--slate)" shape="hex" label="Package" />
                  <span style={{ color: 'var(--rose)', opacity: 0.8 }}>◉ = critical</span>
                </div>
                {selectedNode && (
                  <button onClick={onDeselect} style={{ fontSize: 11, padding: '3px 8px', border: '1px solid var(--border-2)', borderRadius: 4, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' }}>
                    ✕ Deselect
                  </button>
                )}
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--border-1)', background: 'var(--bg-0)' }}>
                <DependencyGraph
                  ecosystem={ecosystem}
                  selectedNode={selectedNode}
                  onNodeSelect={onNodeSelect}
                  simulationResults={simulationResults}
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
                Click any node to inspect → select a package (hexagon) to simulate attacks
              </div>
            </>
          )}

          {/* All packages table tab (P2) */}
          {activeTab === 'packages' && (
            <PackagesTable packages={allPackages} onSelect={(id) => { setActiveTab('graph'); onNodeSelect(id); }} />
          )}
        </div>
      </div>

      {/* ── Right column ─────────────────────────────────── */}
      <div className="dash-right">
        {!selectedNode ? (
          <CriticalHotspots hotspots={hotspots} onSelect={onNodeSelect} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>
            <RiskExplainPanel nodeId={selectedNode} nodeInfo={nodeInfo} onClose={onDeselect} />
            {isPackage && <LockinPanel nodeId={selectedNode} />}
            {isPackage && (
              <CompromiseSimulator
                nodeId={selectedNode}
                simulationResults={simulationResults}
                setSimulationResults={setSimulationResults}
              />
            )}
            {simulationResults && isPackage && (
              <MitigationComparison
                nodeId={selectedNode}
                mitigationResults={mitigationResults}
                setMitigationResults={setMitigationResults}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const LegendDot = ({ color, label }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', opacity: 0.85 }} />
    {label}
  </span>
);
