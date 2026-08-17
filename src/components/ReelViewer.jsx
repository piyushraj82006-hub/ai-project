import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader, AlertCircle, BookOpen } from 'lucide-react';

export default function ReelViewer({ reels, status }) {
  const [current, setCurrent] = useState(0);
  const [prevReels, setPrevReels] = useState(reels);

  // Reset to the first reel when a new reel set arrives. Adjusting state
  // during render (guarded by prevReels) avoids a setState-in-effect cascade.
  if (reels !== prevReels) {
    setPrevReels(reels);
    setCurrent(0);
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') setCurrent(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrent(prev => Math.min((reels?.length || 1) - 1, prev + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reels]);

  const handleDownload = useCallback(() => {
    if (!reels?.length) return;
    const text = reels.map((r, i) => 
      `--- Reel ${i + 1}: ${r.title} ---\n\n${r.content}\n\nKey Points:\n${(r.keyPoints || []).map(kp => `• ${kp}`).join('\n')}\n`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scroll-io-reels.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [reels]);

  // --- Status states ---
  if (status === 'generating') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}>
        <Loader size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Generating Reels<span className="loading-dots" style={{ display: 'inline-block', width: '20px' }}>...</span>
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          AI is creating scrollable educational cards from your PDF
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <AlertCircle size={40} color="var(--error)" />
        <p style={{ fontSize: '15px', color: 'var(--error)', fontWeight: 600 }}>Failed to generate reels</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Please try again</p>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}>
        <BookOpen size={40} />
        <p style={{ fontSize: '14px' }}>Upload a PDF and click <strong style={{ color: 'var(--accent-light)' }}>Generate</strong> to create AI reels</p>
      </div>
    );
  }

  // --- Reel display ---
  const reel = reels[current];
  const total = reels.length;
  const CARD_COLORS = [
    'linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%)',
    'linear-gradient(135deg, #F472B6 0%, #FB923C 100%)',
    'linear-gradient(135deg, #4ADE80 0%, #38BDF8 100%)',
    'linear-gradient(135deg, #FBBF24 0%, #F472B6 100%)',
    'linear-gradient(135deg, #38BDF8 0%, #6C63FF 100%)',
    'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
    'linear-gradient(135deg, #34D399 0%, #FBBF24 100%)',
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '20px',
      position: 'relative',
    }}>
      {/* Reel Card */}
      <div
        key={current}
        style={{
          width: '100%',
          maxWidth: '420px',
          minHeight: '400px',
          borderRadius: 'var(--radius-xl)',
          background: CARD_COLORS[current % CARD_COLORS.length],
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(108,99,255,0.15)',
          animation: 'fadeIn 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Card number badge */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
          fontSize: '12px',
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-mono)',
        }}>
          {current + 1} / {total}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.3,
          paddingRight: '60px',
        }}>
          {reel.title}
        </h3>

        {/* Content */}
        <p style={{
          fontSize: '15px',
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.7,
          flex: 1,
        }}>
          {reel.content}
        </p>

        {/* Key Points */}
        {reel.keyPoints?.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-mono)',
            }}>
              Key Points
            </span>
            {reel.keyPoints.map((point, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.5,
                }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
          disabled={current === 0}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: current === 0 ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
            border: `1px solid ${current === 0 ? 'transparent' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {reels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                background: i === current ? 'var(--accent)' : 'var(--border-color)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent(prev => Math.min(total - 1, prev + 1))}
          disabled={current === total - 1}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: current === total - 1 ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
            border: `1px solid ${current === total - 1 ? 'transparent' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current === total - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: current === total - 1 ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(108, 99, 255, 0.1)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          color: 'var(--accent-light)',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.1)'}
      >
        <Download size={14} />
        Download All Reels
      </button>
    </div>
  );
}
