import { useState, useEffect, useCallback } from 'react';
import Dashboard from './Dashboard';
import { fetchEcosystem, fetchDashboardSummary, fetchHotspots, fetchAllPackages, resetEcosystem, uploadEcosystem } from './api/client';
import './theme/tokens.css';
import './index.css';

export default function App() {
  const [ecosystem, setEcosystem] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [allPackages, setAllPackages] = useState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [mitigationResults, setMitigationResults] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(null); // 'upload'|'reset'|null

  // Dark/Light mode
  const [theme, setTheme] = useState(() => localStorage.getItem('dl-theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
    localStorage.setItem('dl-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setSimulationResults(null);
    setMitigationResults(null);
    try {
      const [eco, sum, hs, pkgs] = await Promise.all([
        fetchEcosystem(),
        fetchDashboardSummary(),
        fetchHotspots(12),
        fetchAllPackages(),
      ]);
      setEcosystem(eco);
      setSummary(sum);
      setHotspots(hs);
      setAllPackages(pkgs);
    } catch {
      setError('Cannot reach the DependLock API on port 8000. Make sure the FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNodeSelect = useCallback((nodeId) => {
    setSelectedNode(prev => {
      if (prev === nodeId) return prev;
      setSimulationResults(null);
      setMitigationResults(null);
      return nodeId;
    });
  }, []);

  const handleReset = async () => {
    setUploading('reset');
    try {
      await resetEcosystem();
      await loadData();
    } catch (e) {
      alert('Reset failed: ' + e.message);
    } finally {
      setUploading(null);
    }
  };

  const handleUpload = async (file) => {
    setUploading('upload');
    try {
      await uploadEcosystem(file);
      await loadData();
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <AppHeader
        summary={summary}
        uploading={uploading}
        onReset={handleReset}
        onUpload={handleUpload}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main style={{ flex: 1, overflow: 'hidden', padding: '12px 16px' }}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorScreen message={error} onRetry={loadData} />
        ) : (
          <Dashboard
            ecosystem={ecosystem}
            summary={summary}
            hotspots={hotspots}
            allPackages={allPackages}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            onDeselect={() => { setSelectedNode(null); setSimulationResults(null); setMitigationResults(null); }}
            simulationResults={simulationResults}
            setSimulationResults={setSimulationResults}
            mitigationResults={mitigationResults}
            setMitigationResults={setMitigationResults}
          />
        )}
      </main>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function AppHeader({ summary, uploading, onReset, onUpload, theme, onToggleTheme }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const isLight = theme === 'light';

  return (
    <header style={{
      height: 52,
      borderBottom: '1px solid var(--border-1)',
      background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(13,15,24,0.9)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 16,
      flexShrink: 0,
      zIndex: 10,
      position: 'relative',
      transition: 'background 0.25s ease',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
        <img
          src="/logo.png"
          alt="DependLock Logo"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
            Depend<span style={{ color: 'var(--sky)' }}>Lock</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Exit Intelligence
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border-2)', flexShrink: 0 }} />

      {/* Ecosystem controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border-2)',
          color: 'var(--text-1)', fontSize: 12, cursor: 'pointer',
          transition: 'all 0.15s',
          background: uploading === 'upload' ? 'var(--sky-bg)' : 'transparent',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sky)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
        >
          <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          {uploading === 'upload' ? '⏳' : '📁'} Upload Ecosystem
        </label>
        <button
          onClick={onReset}
          disabled={!!uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border-2)',
            background: 'transparent', color: 'var(--text-1)',
            fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
        >
          {uploading === 'reset' ? '⏳' : '↺'} Reset Sample
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Summary pills */}
      {summary && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Stat label="Ecosystem Risk" value={`${summary.ecosystem_risk}`}
            color={summary.ecosystem_risk > 60 ? 'var(--rose)' : summary.ecosystem_risk > 40 ? 'var(--amber)' : 'var(--emerald)'} />
          <Stat label="Needs Action" value={summary.critical_dependencies} color="var(--rose)" />
          <Stat label="Applications" value={summary.total_applications} color="var(--sky)" />
          <Stat label="Max Blast" value={`${summary.highest_blast_radius} apps`} color="var(--amber)" />
        </div>
      )}

      <div style={{ width: 1, height: 28, background: 'var(--border-2)', flexShrink: 0 }} />

      {/* Theme toggle */}
      <button
        id="theme-toggle"
        onClick={onToggleTheme}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid var(--border-2)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: 'var(--text-1)',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sky)'; e.currentTarget.style.color = 'var(--sky)'; e.currentTarget.style.transform = 'rotate(20deg)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
      >
        {isLight ? '🌙' : '☀️'}
      </button>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'block', animation: 'blink 2s infinite' }} />
        <span style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}>Live</span>
      </div>
    </header>
  );
}

const Stat = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 1 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
  </div>
);

const Loader = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
    <div style={{ width: 36, height: 36, border: '2.5px solid var(--border-2)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Initializing DependLock...</div>
  </div>
);

const ErrorScreen = ({ message, onRetry }) => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ maxWidth: 480, padding: 32, background: 'var(--bg-1)', border: '1px solid var(--rose-border)', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>⚡</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rose)', marginBottom: 8 }}>Backend Offline</div>
      <div style={{ color: 'var(--text-1)', lineHeight: 1.6, marginBottom: 16, fontSize: 13 }}>{message}</div>
      <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sky)', textAlign: 'left', marginBottom: 14 }}>
        cd backend<br/>
        source venv/bin/activate<br/>
        python3 run.py
      </div>
      <button onClick={onRetry} style={{ padding: '8px 20px', background: 'var(--sky)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
        Retry Connection
      </button>
    </div>
  </div>
);
