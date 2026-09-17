import { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

const STYLES = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      color: '#9aa0bd',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 5,
      'font-size': '9px',
      'font-family': 'Inter, sans-serif',
      'font-weight': '500',
      'text-wrap': 'ellipsis',
      'text-max-width': '72px',
    },
  },
  // Applications — sky blue circles
  {
    selector: 'node[type="application"]',
    style: {
      shape: 'ellipse',
      'background-color': '#0d0f18',
      'border-width': 2,
      'border-color': '#38bdf8',
      width: 34, height: 34,
    },
  },
  // Critical apps — rose ring
  {
    selector: 'node[type="application"][criticality="critical"]',
    style: {
      'border-color': '#fb7185',
      'border-width': 2.5,
    },
  },
  // Services — violet rounded rect
  {
    selector: 'node[type="service"]',
    style: {
      shape: 'round-rectangle',
      'background-color': '#0d0f18',
      'border-width': 2,
      'border-color': '#a78bfa',
      width: 32, height: 20,
    },
  },
  // Packages — small hexagons
  {
    selector: 'node[type="package"]',
    style: {
      shape: 'hexagon',
      'background-color': '#131620',
      'border-width': 1.5,
      'border-color': '#2e3350',
      width: 20, height: 20,
    },
  },
  // Edges
  {
    selector: 'edge',
    style: {
      width: 1,
      'line-color': '#1d2035',
      'target-arrow-color': '#252840',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 0.65,
      opacity: 0.6,
    },
  },
  // Selected
  {
    selector: '.selected',
    style: {
      'border-color': '#fbbf24',
      'border-width': 3,
      'background-color': 'rgba(251,191,36,0.08)',
    },
  },
  // Compromised nodes
  {
    selector: '.compromised',
    style: {
      'background-color': 'rgba(251,113,133,0.12)',
      'border-color': '#fb7185',
      'border-width': 2.5,
      color: '#fb7185',
    },
  },
  // Compromised edges
  {
    selector: '.compromised-edge',
    style: {
      'line-color': '#fb7185',
      'target-arrow-color': '#fb7185',
      width: 2,
      opacity: 0.75,
    },
  },
  // Path highlight
  {
    selector: '.path-edge',
    style: {
      'line-color': '#fbbf24',
      'target-arrow-color': '#fbbf24',
      'line-style': 'dashed',
      'line-dash-pattern': [6, 3],
      width: 2,
      opacity: 0.9,
    },
  },
];

export default function DependencyGraph({ ecosystem, selectedNode, onNodeSelect, simulationResults }) {
  const cyRef = useRef(null);
  const [elements, setElements] = useState([]);
  const layoutRan = useRef(false);

  useEffect(() => {
    if (!ecosystem?.nodes) return;
    setElements([
      ...ecosystem.nodes.map(n => ({
        data: { id: n.id, label: n.name, type: n.type, criticality: n.criticality || '' },
      })),
      ...ecosystem.edges.map(e => ({
        data: { id: `${e.source}__${e.target}`, source: e.source, target: e.target },
      })),
    ]);
    layoutRan.current = false;
  }, [ecosystem]);

  // Apply classes after elements render
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || elements.length === 0) return;
    cy.elements().removeClass('selected compromised compromised-edge path-edge');

    if (selectedNode) cy.getElementById(selectedNode).addClass('selected');

    if (simulationResults) {
      const hitIds = new Set(simulationResults.highlighted_node_ids || []);
      hitIds.forEach(id => { cy.getElementById(id).addClass('compromised'); });

      // Highlight propagation paths (P6)
      (simulationResults.propagation_paths || []).forEach(pathObj => {
        const path = pathObj.path || [];
        for (let i = 0; i < path.length - 1; i++) {
          const edgeId = `${path[i].id}__${path[i + 1].id}`;
          const rev = `${path[i + 1].id}__${path[i].id}`;
          cy.getElementById(edgeId).addClass('path-edge');
          cy.getElementById(rev).addClass('path-edge');
        }
      });

      cy.edges().forEach(edge => {
        if (hitIds.has(edge.source().id()) && hitIds.has(edge.target().id())) {
          edge.addClass('compromised-edge');
        }
      });
    }
  }, [selectedNode, simulationResults, elements]);

  // Run layout once
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || elements.length === 0 || layoutRan.current) return;
    layoutRan.current = true;
    cy.layout({
      name: 'cose',
      animate: true,
      animationDuration: 500,
      randomize: false,
      fit: true,
      padding: 20,
      componentSpacing: 60,
      nodeRepulsion: 450000,
      edgeElasticity: 100,
      gravity: 50,
    }).run();
  }, [elements]);

  if (!ecosystem) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Loading graph...
    </div>
  );

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={STYLES}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      cy={cy => {
        cyRef.current = cy;
        cy.off('tap');
        cy.on('tap', 'node', evt => onNodeSelect(evt.target.id()));
        cy.on('tap', evt => { if (evt.target === cy) onNodeSelect(null); });
      }}
    />
  );
}
