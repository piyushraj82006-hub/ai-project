import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, Minimize2, X } from 'lucide-react';
import { toast } from '../lib/toast';

const BRANCH_COLORS = {
  modules: '#6C63FF',
  module: '#8B83FF',
  topic: '#A78BFA',
  concepts: '#F472B6',
  concept: '#F9A8D4',
  objectives: '#4ADE80',
  objective: '#86EFAC',
  insights: '#38BDF8',
  insight: '#7DD3FC',
  outcomes: '#FBBF24',
  outcome: '#FDE68A',
  default: '#6C63FF',
};

function getColor(type) {
  return BRANCH_COLORS[type] || BRANCH_COLORS.default;
}

/**
 * Builds structured text from mind map tree data for clipboard copy.
 */
function buildMindMapText(node, indent = 0) {
  if (!node) return '';
  const prefix = '  '.repeat(indent);
  let text = `${prefix}${indent === 0 ? '📌 ' : '• '}${node.name}\n`;
  if (node.description) {
    text += `${prefix}  → ${node.description}\n`;
  }
  if (node.children?.length) {
    node.children.forEach(child => {
      text += buildMindMapText(child, indent + 1);
    });
  }
  return text;
}

export default function MindMap({ data, onBack }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 400), height: Math.max(height, 400) });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Close highlight panel on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (selectedNode) setSelectedNode(null);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedNode, isFullscreen]);

  // D3 rendering
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const root = d3.hierarchy(data);

    // Give nodes a massive amount of breathing room across the circumference
    const radius = Math.max(500, Math.max(width, height) * 0.7);

    const treeLayout = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 2 : 3) / a.depth);

    treeLayout(root);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    // Start zoomed out enough to fit the massive new radius
    const initialScale = Math.min(width, height) / (radius * 2.5);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(initialScale));
    svg.node().__zoom_behavior = zoom;

    const radialPoint = (angle, radius) => {
      const x = radius * Math.cos(angle - Math.PI / 2);
      const y = radius * Math.sin(angle - Math.PI / 2);
      return [x, y];
    };

    // Node dimensions by depth
    const nodeSize = (d) => {
      if (d.depth === 0) return { w: 200, h: 56 };
      if (d.depth === 1) return { w: 150, h: 42 };
      return { w: 130, h: 34 };
    };

    // Links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d => {
        const s = radialPoint(d.source.x, d.source.y);
        const t = radialPoint(d.target.x, d.target.y);
        return `M${s[0]},${s[1]} C${s[0]},${(s[1]+t[1])/2} ${t[0]},${(s[1]+t[1])/2} ${t[0]},${t[1]}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => getColor(d.target.data.type))
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', d => Math.max(1.5, 3 - d.target.depth))
      .style('opacity', 0)
      .transition().duration(800).delay((d, i) => i * 30)
      .style('opacity', 1);

    // Nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => {
        const p = radialPoint(d.x, d.y);
        return `translate(${p[0]},${p[1]})`;
      })
      .style('opacity', 0)
      .style('cursor', 'pointer');

    nodes.transition().duration(500).delay((d, i) => 200 + i * 40).style('opacity', 1);

    // Rectangular card backgrounds
    nodes.append('rect')
      .attr('x', d => -nodeSize(d).w / 2)
      .attr('y', d => -nodeSize(d).h / 2)
      .attr('width', d => nodeSize(d).w)
      .attr('height', d => nodeSize(d).h)
      .attr('rx', d => d.depth === 0 ? 14 : d.depth === 1 ? 10 : 8)
      .attr('ry', d => d.depth === 0 ? 14 : d.depth === 1 ? 10 : 8)
      .attr('fill', d => {
        if (d.depth === 0) return '#6C63FF';
        const color = getColor(d.data.type);
        return color + '18'; // low opacity fill
      })
      .attr('stroke', d => getColor(d.data.type || 'default'))
      .attr('stroke-width', d => d.depth === 0 ? 2.5 : 1.5)
      .attr('stroke-opacity', d => d.depth === 0 ? 1 : 0.5);

    // Root glow effect
    nodes.filter(d => d.depth === 0)
      .append('rect')
      .attr('x', d => -nodeSize(d).w / 2 - 6)
      .attr('y', d => -nodeSize(d).h / 2 - 6)
      .attr('width', d => nodeSize(d).w + 12)
      .attr('height', d => nodeSize(d).h + 12)
      .attr('rx', 18)
      .attr('ry', 18)
      .attr('fill', 'none')
      .attr('stroke', '#6C63FF')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.15);

    // Text labels using foreignObject for proper wrapping
    nodes.append('foreignObject')
      .attr('x', d => -nodeSize(d).w / 2 + 4)
      .attr('y', d => -nodeSize(d).h / 2 + 2)
      .attr('width', d => nodeSize(d).w - 8)
      .attr('height', d => nodeSize(d).h - 4)
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('text-align', 'center')
      .style('padding', '2px 4px')
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden')
      .style('font-family', d => d.depth === 0 ? 'Space Grotesk, sans-serif' : 'DM Sans, sans-serif')
      .style('font-size', d => d.depth === 0 ? '13px' : d.depth === 1 ? '11px' : '10px')
      .style('font-weight', d => d.depth <= 1 ? '600' : '500')
      .style('color', d => d.depth === 0 ? '#fff' : '#e2e2e8')
      .style('line-height', '1.25')
      .style('letter-spacing', '-0.01em')
      .style('pointer-events', 'none')
      .text(d => {
        const name = d.data.name || '';
        if (d.depth === 0) return name.length > 40 ? name.slice(0, 37) + '...' : name;
        if (d.depth === 1) return name.length > 28 ? name.slice(0, 25) + '...' : name;
        return name.length > 24 ? name.slice(0, 21) + '...' : name;
      });

    // Child count badge for depth 1 nodes
    nodes.filter(d => d.depth === 1 && d.children?.length)
      .append('circle')
      .attr('cx', d => nodeSize(d).w / 2 - 4)
      .attr('cy', d => -nodeSize(d).h / 2 + 4)
      .attr('r', 9)
      .attr('fill', d => getColor(d.data.type))
      .attr('stroke', '#16161f')
      .attr('stroke-width', 2);

    nodes.filter(d => d.depth === 1 && d.children?.length)
      .append('text')
      .text(d => d.children.length)
      .attr('x', d => nodeSize(d).w / 2 - 4)
      .attr('y', d => -nodeSize(d).h / 2 + 4)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff').attr('font-size', '8px').attr('font-weight', 700)
      .attr('pointer-events', 'none');

    // Click: show topic highlights
    nodes.on('click', function(event, d) {
      event.stopPropagation();
      const nodeData = d.data;
      const highlights = [];

      // Build highlight info from node and children
      if (nodeData.description) highlights.push(nodeData.description);
      if (d.children?.length) {
        d.children.forEach(child => {
          const name = child.data.name || '';
          const desc = child.data.description || '';
          highlights.push(desc ? `${name}: ${desc}` : name);
        });
      }

      setSelectedNode({
        name: nodeData.name,
        type: nodeData.type,
        color: getColor(nodeData.type),
        depth: d.depth,
        childrenCount: d.children?.length || 0,
        highlights,
      });

      // Visual feedback: pulse the clicked node
      d3.select(this).select('rect')
        .transition().duration(150)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 3)
        .transition().duration(300)
        .attr('stroke-opacity', d.depth === 0 ? 1 : 0.5)
        .attr('stroke-width', d.depth === 0 ? 2.5 : 1.5);
    });

    // Hover effects
    nodes.on('mouseenter', function(event, d) {
      d3.select(this).select('rect')
        .transition().duration(200)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-width', d.depth === 0 ? 3 : 2.5);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('rect')
        .transition().duration(200)
        .attr('stroke-opacity', d.depth === 0 ? 1 : 0.5)
        .attr('stroke-width', d.depth === 0 ? 2.5 : 1.5);
    });

    // Click SVG background to dismiss highlight panel
    svg.on('click', () => setSelectedNode(null));

  }, [data, dimensions]);

  const handleZoom = useCallback((factor) => {
    const svg = d3.select(svgRef.current);
    const zoom = svg.node()?.__zoom_behavior;
    if (zoom) svg.transition().duration(300).call(zoom.scaleBy, factor);
  }, []);

  const handleReset = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const zoom = svg.node()?.__zoom_behavior;
    if (zoom) {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(0.65)
      );
    }
  }, [dimensions]);

  const handleCopy = useCallback(() => {
    if (!data) return;
    const text = buildMindMapText(data);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast('Mind map copied as structured text', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    // Force resize after transition
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, []);

  if (!data) {
    return (
      <div style={{
        height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px', color: 'var(--text-muted)',
      }}>
        <p style={{ fontSize: '14px' }}>Generate a summary first to view the mind map</p>
      </div>
    );
  }

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'var(--bg-primary)',
  } : {
    height: '100%',
    position: 'relative',
    background: 'var(--bg-primary)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* ─── Top-left: Back to Summary ─── */}
      {!isFullscreen && onBack && (
        <div style={{
          position: 'absolute',
          top: '12px', left: '12px',
          zIndex: 10,
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(22, 22, 31, 0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            ← Back to Summary
          </button>
        </div>
      )}

      {/* ─── Top-right controls ─── */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        gap: '4px',
        zIndex: 10,
      }}>
        {/* Copy Mind Map */}
        <button
          onClick={handleCopy}
          title="Copy mind map as text"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: copied ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg-card)',
            border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.2)' : 'var(--border-color)'}`,
            color: copied ? 'var(--success)' : 'var(--text-secondary)',
            fontSize: '11px', fontWeight: 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: isFullscreen ? 'rgba(108, 99, 255, 0.15)' : 'var(--bg-card)',
            border: `1px solid ${isFullscreen ? 'rgba(108, 99, 255, 0.3)' : 'var(--border-color)'}`,
            color: isFullscreen ? 'var(--accent-light)' : 'var(--text-secondary)',
            fontSize: '11px', fontWeight: 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
      </div>

      {/* ─── Bottom-left: Zoom controls ─── */}
      <div style={{
        position: 'absolute',
        bottom: '50px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 10,
      }}>
        {[
          { icon: ZoomIn, action: () => handleZoom(1.3), label: 'Zoom in' },
          { icon: ZoomOut, action: () => handleZoom(0.7), label: 'Zoom out' },
          { icon: RotateCcw, action: handleReset, label: 'Reset' },
        ].map(({ icon: Icon, action, label }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* ─── Legend ─── */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(22, 22, 31, 0.9)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}>
        {[
          { label: 'Modules', color: BRANCH_COLORS.modules },
          { label: 'Concepts', color: BRANCH_COLORS.concepts },
          { label: 'Objectives', color: BRANCH_COLORS.objectives },
          { label: 'Insights', color: BRANCH_COLORS.insights },
          { label: 'Outcomes', color: BRANCH_COLORS.outcomes },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: item.color,
            }} />
            <span style={{
              fontSize: '10px', color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Topic Highlight Panel ─── */}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: (!isFullscreen && onBack) ? '60px' : '12px',
            left: '12px',
            width: '280px',
            maxHeight: 'calc(100% - 24px)',
            overflowY: 'auto',
            background: 'rgba(22, 22, 31, 0.95)',
            border: `1px solid ${selectedNode.color}33`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            zIndex: 20,
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out',
            boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${selectedNode.color}15`,
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            <X size={10} />
          </button>

          {/* Title */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px', paddingRight: '24px',
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: selectedNode.color,
              flexShrink: 0,
            }} />
            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px', fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}>
              {selectedNode.name}
            </h4>
          </div>

          {/* Type badge */}
          {selectedNode.type && (
            <div style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: `${selectedNode.color}15`,
              border: `1px solid ${selectedNode.color}30`,
              fontSize: '10px', fontWeight: 500,
              color: selectedNode.color,
              textTransform: 'capitalize',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)',
            }}>
              {selectedNode.type}
            </div>
          )}

          {/* Highlights */}
          {selectedNode.highlights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{
                fontSize: '10px', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', marginBottom: '2px',
              }}>
                {selectedNode.childrenCount > 0 ? `${selectedNode.childrenCount} items` : 'Details'}
              </span>
              {selectedNode.highlights.map((h, i) => (
                <div key={i} style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  lineHeight: 1.5, display: 'flex', gap: '6px',
                }}>
                  <span style={{
                    color: selectedNode.color, flexShrink: 0, marginTop: '1px',
                  }}>•</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{
              fontSize: '12px', color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              Click on child nodes for more details
            </p>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
