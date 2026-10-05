import { useState, useCallback, useRef } from 'react';
import { Copy, Check, BookOpen, Network, FileDown, Loader } from 'lucide-react';
import { toast } from '../lib/toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { exportToPdf, exportTextAsPdf } from '../lib/exportPDF';
/**
 * Builds a readable plain-text version of the summary for clipboard copy.
 * Preserves line breaks, spacing, bullet points, and formatting.
 */
function buildCopyText(summary) {
  if (!summary) return '';
  if (typeof summary === 'string') return summary;

  const lines = [];
  const hr = '─'.repeat(50);

  // Title + Overview
  lines.push(summary.documentTitle || 'Document Summary');
  lines.push(hr);
  if (summary.overview) {
    lines.push('');
    lines.push(summary.overview);
  }

  // Metadata
  if (summary.metadata) {
    const entries = Object.entries(summary.metadata).filter(([, v]) => v != null);
    if (entries.length) {
      lines.push('');
      entries.forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        lines.push(`  ${label}: ${value}`);
      });
    }
  }

  // Key Takeaways
  if (summary.keyTakeaways?.length) {
    lines.push('');
    lines.push('KEY TAKEAWAYS');
    lines.push(hr);
    summary.keyTakeaways.forEach(tk => {
      lines.push(`  • ${tk}`);
    });
  }

  // Course Objectives
  if (summary.courseObjectives?.length) {
    lines.push('');
    lines.push('COURSE OBJECTIVES');
    lines.push(hr);
    summary.courseObjectives.forEach((item, i) => {
      lines.push(`  ${i + 1}. ${item}`);
    });
  }

  // Course Outcomes
  if (summary.courseOutcomes?.length) {
    lines.push('');
    lines.push('COURSE OUTCOMES');
    lines.push(hr);
    summary.courseOutcomes.forEach((item, i) => {
      lines.push(`  ${i + 1}. ${item}`);
    });
  }

  // Modules
  if (summary.modules?.length) {
    lines.push('');
    lines.push('MODULE BREAKDOWN');
    lines.push(hr);
    summary.modules.forEach((mod, i) => {
      lines.push('');
      lines.push(`  Module ${i + 1}: ${mod.title}${mod.hours ? ` (${mod.hours} hours)` : ''}`);
      if (mod.description) {
        lines.push(`    ${mod.description}`);
      }
      if (mod.topics?.length) {
        lines.push('    Topics:');
        mod.topics.forEach(t => {
          lines.push(`      • ${t}`);
        });
      }
    });
  }

  // Key Concepts
  if (summary.keyConcepts?.length) {
    lines.push('');
    lines.push('KEY CONCEPTS & DEFINITIONS');
    lines.push(hr);
    summary.keyConcepts.forEach(kc => {
      lines.push(`  • ${kc.term}: ${kc.definition}`);
    });
  }

  // Key Insights
  if (summary.keyInsights?.length) {
    lines.push('');
    lines.push('KEY INSIGHTS');
    lines.push(hr);
    summary.keyInsights.forEach((ins, i) => {
      lines.push(`  ${i + 1}. ${ins}`);
    });
  }

  // Practice Questions
  if (summary.practiceQuestions?.length) {
    lines.push('');
    lines.push('PRACTICE QUESTIONS & SOLUTIONS');
    lines.push(hr);
    summary.practiceQuestions.forEach((pq, i) => {
      lines.push('');
      lines.push(`  Q${i + 1}: ${pq.question}`);
      lines.push(`  A: ${pq.answer}`);
    });
  }

  // References
  if (summary.references?.length) {
    lines.push('');
    lines.push('REFERENCES');
    lines.push(hr);
    summary.references.forEach(ref => {
      lines.push(`  • ${ref}`);
    });
  }

  // Conclusion
  if (summary.conclusion) {
    lines.push('');
    lines.push('CONCLUSION');
    lines.push(hr);
    lines.push(`  ${summary.conclusion}`);
  }

  return lines.join('\n');
}

export default function SummaryOutput({ summary }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef(null);

  const handleCopy = useCallback(() => {
    const text = buildCopyText(summary);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast('Summary copied with formatting', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [summary]);

  /**
   * Clone the content node, walk the tree to replace dark-theme inline colors
   * with print-friendly equivalents, then export the cleaned clone as PDF.
   */
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const title = summary?.documentTitle || 'Document Summary';
      const filename = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);

      if (typeof summary === 'string') {
        await exportTextAsPdf(title, summary, filename);
      } else if (contentRef.current) {
        // Deep-clone the node so we can modify styles without affecting the live DOM
        const clone = contentRef.current.cloneNode(true);

        // Walk the cloned tree and replace dark-theme colors with print-friendly ones
        const DARK_TO_LIGHT = {
          '#0A0A0F': '#FFFFFF',
          '#111118': '#FFFFFF',
          '#16161F': '#FFFFFF',
          '#1C1C28': '#FFFFFF',
          '#1E1E2E': '#E2E4EA',
          '#2A2A3E': '#C8CBD4',
          '#111827': '#F4F5F9',
          '#1a1a2e': '#F4F5F9',
          'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.04)',
          'rgba(255, 255, 255, 0.05)': 'rgba(0,0,0,0.04)',
          'rgba(255,255,255,0.1)': 'rgba(0,0,0,0.06)',
          'rgba(255, 255, 255, 0.1)': 'rgba(0,0,0,0.06)',
          '#F0F0FF': '#1A1A2E',
          '#e2e2e8': '#333333',
        };

        const walk = (node) => {
          if (node.nodeType === 1) { // Element node
            const style = node.style;
            if (style.background) {
              for (const [dark, light] of Object.entries(DARK_TO_LIGHT)) {
                if (style.background.includes(dark)) {
                  style.background = style.background.replaceAll(dark, light);
                }
              }
            }
            if (style.backgroundColor) {
              for (const [dark, light] of Object.entries(DARK_TO_LIGHT)) {
                if (style.backgroundColor.includes(dark)) {
                  style.backgroundColor = light;
                }
              }
            }
            if (style.color) {
              for (const [dark, light] of Object.entries(DARK_TO_LIGHT)) {
                if (style.color.includes(dark)) {
                  style.color = light;
                }
              }
            }
            if (style.borderBottomColor) {
              for (const [dark, light] of Object.entries(DARK_TO_LIGHT)) {
                if (style.borderBottomColor.includes(dark)) {
                  style.borderBottomColor = light;
                }
              }
            }
            // Recurse into children
            Array.from(node.children).forEach(walk);
          }
        };
        walk(clone);

        // Force a clean white background on the clone root
        clone.style.background = '#FFFFFF';
        clone.style.color = '#1A1A2E';
        clone.style.setProperty('--bg-primary', '#F4F5F9');
        clone.style.setProperty('--bg-secondary', '#FFFFFF');
        clone.style.setProperty('--bg-card', '#FFFFFF');
        clone.style.setProperty('--text-primary', '#1A1A2E');
        clone.style.setProperty('--text-secondary', 'rgba(0,0,0,0.6)');
        clone.style.setProperty('--text-muted', 'rgba(0,0,0,0.38)');
        clone.style.setProperty('--border-color', '#E2E4EA');

        // Append clone to body, capture, then remove
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.width = '7.5in';
        clone.style.zIndex = '-1';
        clone.style.overflow = 'hidden';
        clone.style.height = 'auto';
        document.body.appendChild(clone);

        try {
          await exportToPdf(clone, filename, {
            margin: 0.6,
            html2canvas: {
              scale: 2,
              backgroundColor: '#FFFFFF',
              logging: false,
            },
            jsPDF: {
              unit: 'in',
              format: 'letter',
              orientation: 'portrait',
            },
          });
          toast('PDF exported successfully!', 'success');
        } finally {
          document.body.removeChild(clone);
        }
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      toast('Failed to export PDF: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [summary]);

  if (!summary) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
        padding: '40px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(108, 99, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={24} color="var(--accent)" />
        </div>
        <p style={{ fontSize: '14px', textAlign: 'center' }}>
          Click <strong style={{ color: 'var(--accent-light)' }}>Generate</strong> to create an AI summary
        </p>
      </div>
    );
  }

  // String summary
  if (typeof summary === 'string') {
    return (
      <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
          <ExportPdfBtn exporting={exporting} onClick={handleExportPDF} />
          <CopyBtn copied={copied} onClick={handleCopy} />
        </div>
        <p style={{
          fontSize: '14px', color: 'var(--text-secondary)',
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
        }}>
          {summary}
        </p>
      </div>
    );
  }

  return (
    <div ref={contentRef} style={{
      padding: '28px 24px',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* ─── Header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginBottom: '8px',
          }}>
            {summary.documentTitle || 'Document Summary'}
          </h2>
          {summary.overview && (
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}>
              {summary.overview}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportPdfBtn exporting={exporting} onClick={handleExportPDF} />
          <CopyBtn copied={copied} onClick={handleCopy} />
        </div>
      </div>

      {/* ─── Metadata Grid ─── */}
      {summary.metadata && (() => {
        const entries = Object.entries(summary.metadata).filter(([, v]) => v != null);
        return entries.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '8px',
            marginBottom: '24px',
          }}>
            {entries.map(([key, value]) => (
              <div key={key} style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{
                  fontSize: '10px', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '4px', fontFamily: 'var(--font-mono)',
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{
                  fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600,
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* ─── AI Full Markdown Essay (If Supported) ─── */}
      {summary.markdownContent ? (
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '24px 32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({...props}) => <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '24px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '16px' }} {...props} />,
              h2: ({...props}) => <h2 style={{ fontSize: '22px', fontWeight: 600, marginTop: '36px', marginBottom: '16px', color: '#A78BFA' }} {...props} />,
              h3: ({...props}) => <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '24px', marginBottom: '12px', color: '#38BDF8' }} {...props} />,
              p: ({...props}) => <p style={{ fontSize: '15px', lineHeight: 1.75, marginBottom: '20px', color: 'var(--text-secondary)' }} {...props} />,
              ul: ({...props}) => <ul style={{ marginBottom: '20px', paddingLeft: '24px', color: 'var(--text-secondary)' }} {...props} />,
              ol: ({...props}) => <ol style={{ marginBottom: '20px', paddingLeft: '24px', color: 'var(--text-secondary)' }} {...props} />,
              li: ({...props}) => <li style={{ marginBottom: '8px', lineHeight: 1.6 }} {...props} />,
              table: ({...props}) => <div style={{ overflowX: 'auto', marginBottom: '24px', width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}><table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} /></div>,
              th: ({...props}) => <th style={{ padding: '14px', textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '14px', fontWeight: 600 }} {...props} />,
              td: ({...props}) => <td style={{ padding: '14px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px' }} {...props} />,
              strong: ({...props}) => <strong style={{ color: '#fff', fontWeight: 600 }} {...props} />,
              hr: ({...props}) => <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} {...props} />,
              blockquote: ({...props}) => <blockquote style={{ borderLeft: '4px solid #F472B6', marginLeft: 0, marginRight: 0, padding: '16px 20px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '24px 0', background: 'rgba(244, 114, 182, 0.05)', borderRadius: '0 8px 8px 0' }} {...props} />,
              code: ({inline, ...props}) => inline ? <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: '#F472B6', fontFamily: 'var(--font-mono)' }} {...props} /> : <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}><pre style={{ background: '#111827', padding: '16px', overflowX: 'auto', margin: 0 }}><code style={{ color: '#e2e2e8', fontSize: '14px', fontFamily: 'var(--font-mono)' }} {...props} /></pre></div>
            }}
          >
            {summary.markdownContent}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          {/* ─── Key Takeaways (Legacy JSON) ─── */}
      {summary.keyTakeaways?.length > 0 && (
        <NoteSection title="Key Takeaways" color="#d4940a">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.keyTakeaways.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <span style={{ color: '#d4940a', marginTop: '2px' }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </NoteSection>
      )}

      {/* ─── Course Objectives ─── */}
      {summary.courseObjectives?.length > 0 && (
        <NoteSection title="Course Objectives" color="#4ADE80">
          <NumberedList items={summary.courseObjectives} />
        </NoteSection>
      )}

      {/* ─── Course Outcomes ─── */}
      {summary.courseOutcomes?.length > 0 && (
        <NoteSection title="Course Outcomes" color="#FBBF24">
          <NumberedList items={summary.courseOutcomes} />
        </NoteSection>
      )}

      {/* ─── Module Breakdown ─── */}
      {summary.modules?.length > 0 && (
        <NoteSection title={`Module Breakdown (${summary.modules.length} modules)`} color="#6C63FF">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {summary.modules.map((mod, i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--gradient-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-display)',
                    }}>
                      {mod.title}
                    </div>
                    {mod.hours && (
                      <span style={{
                        fontSize: '11px', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {mod.hours} hours
                      </span>
                    )}
                  </div>
                </div>
                {mod.description && (
                  <p style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    lineHeight: 1.6, marginBottom: '10px', paddingLeft: '36px',
                  }}>
                    {mod.description}
                  </p>
                )}
                {mod.topics?.length > 0 && (
                  <div style={{ paddingLeft: '36px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {mod.topics.map((topic, j) => (
                      <span key={j} style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(108, 99, 255, 0.08)',
                        border: '1px solid rgba(108, 99, 255, 0.15)',
                        fontSize: '11px', color: 'var(--accent-light)',
                      }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </NoteSection>
      )}

      {/* ─── Key Concepts ─── */}
      {summary.keyConcepts?.length > 0 && (
        <NoteSection title="Key Concepts & Definitions" color="#F472B6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.keyConcepts.map((kc, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                borderLeft: '3px solid #F472B6',
              }}>
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  color: '#F9A8D4', marginBottom: '4px',
                  fontFamily: 'var(--font-display)',
                }}>
                  {kc.term}
                </div>
                <div style={{
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  {kc.definition}
                </div>
              </div>
            ))}
          </div>
        </NoteSection>
      )}

      {/* ─── Key Insights ─── */}
      {summary.keyInsights?.length > 0 && (
        <NoteSection title="Key Insights" color="#38BDF8">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.keyInsights.map((insight, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#38BDF8',
                  fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  {insight}
                </span>
              </div>
            ))}
          </div>
        </NoteSection>
      )}

      {/* ─── Practice Questions ─── */}
      {summary.practiceQuestions?.length > 0 && (
        <NoteSection title="Practice Questions & Solutions" color="#F59E0B">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {summary.practiceQuestions.map((pq, i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)',
                borderLeft: '4px solid #F59E0B',
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                  marginBottom: '8px', fontFamily: 'var(--font-display)',
                }}>
                  Q{i + 1}: {pq.question}
                </div>
                <div style={{
                  fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  <strong style={{ color: '#F59E0B' }}>Answer:</strong> {pq.answer}
                </div>
              </div>
            ))}
          </div>
        </NoteSection>
      )}

      {/* ─── References ─── */}
      {summary.references?.length > 0 && (
        <NoteSection title="References" color="#A78BFA">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.references.map((ref, i) => (
              <li key={i} style={{
                display: 'flex', gap: '8px', fontSize: '13px',
                color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <span style={{ color: '#A78BFA', flexShrink: 0 }}>•</span>
                <span>{ref}</span>
              </li>
            ))}
          </ul>
        </NoteSection>
      )}

      {/* ─── Conclusion ─── */}
      {summary.conclusion && (
        <NoteSection title="Conclusion" color="#34D399">
          <p style={{
            fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7,
          }}>
            {summary.conclusion}
          </p>
        </NoteSection>
      )}

      {/* Bottom spacer */}
      <div style={{ height: '40px' }} />
        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

/**
 * Always-open section with colored heading - NO collapsing.
 */
function NoteSection({ title, color, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: `2px solid ${color}22`,
      }}>
        <div style={{
          width: '4px', height: '18px', borderRadius: '2px',
          background: color,
        }} />
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15px', fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function NumberedList({ items }) {
  if (!items?.length) return null;
  return (
    <ol style={{
      listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px',
      counterReset: 'item',
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: '10px',
          fontSize: '13px', color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <span style={{
            color: 'var(--accent)', fontWeight: 600,
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            flexShrink: 0, marginTop: '2px', minWidth: '18px',
          }}>
            {i + 1}.
          </span>
          <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
        </li>
      ))}
    </ol>
  );
}

function CopyBtn({ copied, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px',
        borderRadius: 'var(--radius-full)',
        background: copied ? 'rgba(74, 222, 128, 0.1)' : 'rgba(108, 99, 255, 0.08)',
        border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.2)' : 'rgba(108, 99, 255, 0.15)'}`,
        color: copied ? 'var(--success)' : 'var(--accent-light)',
        fontSize: '12px', fontWeight: 500,
        transition: 'var(--transition-fast)',
        flexShrink: 0, cursor: 'pointer',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ExportPdfBtn({ exporting, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={exporting}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px',
        borderRadius: 'var(--radius-full)',
        background: exporting ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.08)',
        border: `1px solid ${exporting ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
        color: exporting ? 'var(--error)' : '#EF4444',
        fontSize: '12px', fontWeight: 500,
        transition: 'var(--transition-fast)',
        flexShrink: 0, cursor: exporting ? 'wait' : 'pointer',
      }}
    >
      {exporting ? (
        <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
      ) : (
        <FileDown size={13} />
      )}
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
