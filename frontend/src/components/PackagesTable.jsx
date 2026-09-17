// P2 — Full Packages Table
import { useState, useMemo } from 'react';

const riskColor = (s) => s >= 70 ? 'var(--rose)' : s >= 50 ? 'var(--amber)' : s >= 30 ? '#fb923c' : 'var(--emerald)';
const repColor = (r) => ({ low: 'var(--rose)', medium: 'var(--amber)', high: 'var(--emerald)' }[r] || 'var(--text-2)');

export default function PackagesTable({ packages, onSelect }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const filtered = packages.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.package_id.toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'number') return sortDir === 'desc' ? bv - av : av - bv;
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [packages, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const Th = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label} {sortKey === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter packages..."
          style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-0)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-2)', flexShrink: 0 }}>{sorted.length} packages</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="pkg-table">
          <thead>
            <tr>
              <Th col="name" label="Package" />
              <Th col="version" label="Version" />
              <Th col="risk_score" label="Risk" />
              <Th col="blast_radius" label="Blast" />
              <Th col="critical_app_count" label="Critical" />
              <Th col="replaceability" label="Replace" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.package_id} onClick={() => onSelect(p.package_id)}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-0)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{p.name}</div>
                </td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>v{p.version}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: riskColor(p.risk_score) }}>{p.risk_score}</span>
                    <div style={{ width: 36, height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.risk_score}%`, background: riskColor(p.risk_score), borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
                <td><span style={{ fontWeight: 600, color: 'var(--text-0)' }}>{p.blast_radius}</span> <span style={{ color: 'var(--text-2)', fontSize: 11 }}>apps</span></td>
                <td>
                  {p.critical_app_count > 0
                    ? <span style={{ color: 'var(--rose)', fontWeight: 600 }}>{p.critical_app_count} 🔴</span>
                    : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </td>
                <td>
                  <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: `${repColor(p.replaceability)}18`, color: repColor(p.replaceability), border: `1px solid ${repColor(p.replaceability)}30`, textTransform: 'capitalize', fontWeight: 500 }}>
                    {p.replaceability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
