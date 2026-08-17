import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Loader, Brain, Filter, Check, Shuffle } from 'lucide-react';
import { toast } from '../lib/toast';

const CATEGORY_COLORS = {
  'Key Concepts': '#6C63FF',
  'Key Takeaways': '#4ADE80',
  'Modules': '#38BDF8',
  'Practice Questions': '#FBBF24',
  'General': '#A78BFA',
};

export default function Flashcards({ cards, onGenerate, loading, hasText }) {
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [unknownCards, setUnknownCards] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [prevCards, setPrevCards] = useState(cards);

  // Reset when new cards arrive
  if (cards !== prevCards) {
    setPrevCards(cards);
    setCurrent(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setSelectedCategory('all');
  }

  const categories = ['all', ...new Set((cards || []).map(c => c.category || 'General'))];
  const filteredCards = selectedCategory === 'all'
    ? cards || []
    : (cards || []).filter(c => (c.category || 'General') === selectedCategory);
  const totalCards = filteredCards.length;
  const card = filteredCards[current];

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (current < totalCards - 1) {
      setCurrent(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [current, totalCards]);

  const handlePrev = useCallback(() => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [current]);

  const handleKnown = useCallback(() => {
    if (!card) return;
    const cardKey = `${selectedCategory}-${current}`;
    setKnownCards(prev => {
      const next = new Set(prev);
      next.add(cardKey);
      return next;
    });
    setUnknownCards(prev => {
      const next = new Set(prev);
      next.delete(cardKey);
      return next;
    });
    handleNext();
  }, [card, current, selectedCategory, handleNext]);

  const handleUnknown = useCallback(() => {
    if (!card) return;
    const cardKey = `${selectedCategory}-${current}`;
    setUnknownCards(prev => {
      const next = new Set(prev);
      next.add(cardKey);
      return next;
    });
    setKnownCards(prev => {
      const next = new Set(prev);
      next.delete(cardKey);
      return next;
    });
    handleNext();
  }, [card, current, selectedCategory, handleNext]);

  const handleShuffle = useCallback(() => {
    setCurrent(0);
    setIsFlipped(false);
    toast('Cards shuffled!', 'info');
  }, []);

  const handleReset = useCallback(() => {
    setCurrent(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === '1') handleKnown();
      if (e.key === '2') handleUnknown();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleFlip, handleNext, handlePrev, handleKnown, handleUnknown]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <Loader size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Creating Flashcards<span className="loading-dots" style={{ display: 'inline-block', width: '20px' }}>...</span>
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          AI is extracting key terms and definitions
        </p>
      </div>
    );
  }

  // Empty state
  if (!cards || cards.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        color: 'var(--text-muted)', padding: '40px',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(108, 99, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={28} color="var(--accent)" />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          No flashcards yet
        </p>
        <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>
          Upload a document and click Generate to create AI-powered flashcards
        </p>
        {hasText && (
          <button
            onClick={onGenerate}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-accent)', border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', marginTop: '8px',
            }}
          >
            Generate Flashcards
          </button>
        )}
      </div>
    );
  }

  const knownCount = [...knownCards].filter(k => k.startsWith(selectedCategory)).length;
  const unknownCount = [...unknownCards].filter(k => k.startsWith(selectedCategory)).length;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '20px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: 'rgba(108, 99, 255, 0.1)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            color: 'var(--accent-light)', fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}>
            {current + 1} / {totalCards}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
            ✓ {knownCount}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 600 }}>
            ✗ {unknownCount}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleShuffle} title="Shuffle" style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <Shuffle size={14} />
          </button>
          <button onClick={handleReset} title="Reset progress" style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '16px',
          overflowX: 'auto', paddingBottom: '4px',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrent(0); setIsFlipped(false); }}
              style={{
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: selectedCategory === cat
                  ? (CATEGORY_COLORS[cat] || 'var(--accent)') + '20'
                  : 'var(--bg-card)',
                border: `1px solid ${selectedCategory === cat
                  ? (CATEGORY_COLORS[cat] || 'var(--accent)') + '40'
                  : 'var(--border-color)'}`,
                color: selectedCategory === cat
                  ? CATEGORY_COLORS[cat] || 'var(--accent-light)'
                  : 'var(--text-muted)',
                fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        width: '100%', height: '3px', borderRadius: '2px',
        background: 'var(--bg-card)', marginBottom: '16px',
      }}>
        <div style={{
          width: `${totalCards > 0 ? ((current + 1) / totalCards) * 100 : 0}%`,
          height: '100%', borderRadius: '2px',
          background: 'var(--gradient-accent)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Flashcard */}
      {card && (
        <div
          onClick={handleFlip}
          style={{
            flex: 1, minHeight: '250px', cursor: 'pointer',
            perspective: '1000px', marginBottom: '16px',
          }}
        >
          <div style={{
            width: '100%', height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            {/* Front */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: 'var(--radius-xl)',
              background: `linear-gradient(135deg, ${CATEGORY_COLORS[card.category] || '#6C63FF'}15, ${CATEGORY_COLORS[card.category] || '#6C63FF'}08)`,
              border: `2px solid ${(CATEGORY_COLORS[card.category] || '#6C63FF')}30`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px', textAlign: 'center',
              gap: '16px',
            }}>
              <span style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                background: `${CATEGORY_COLORS[card.category] || '#6C63FF'}20`,
                color: CATEGORY_COLORS[card.category] || '#6C63FF',
                fontSize: '10px', fontWeight: 700,
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {card.category || 'General'}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '20px',
                fontWeight: 700, color: 'var(--text-primary)',
                lineHeight: 1.4, maxWidth: '400px',
              }}>
                {card.front}
              </h3>
              <p style={{
                fontSize: '12px', color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                Tap to reveal answer
              </p>
            </div>

            {/* Back */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 'var(--radius-xl)',
              background: `linear-gradient(135deg, ${(CATEGORY_COLORS[card.category] || '#6C63FF')}20, ${(CATEGORY_COLORS[card.category] || '#6C63FF')}10)`,
              border: `2px solid ${(CATEGORY_COLORS[card.category] || '#6C63FF')}40`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px', textAlign: 'center',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: CATEGORY_COLORS[card.category] || '#6C63FF',
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Answer
              </span>
              <p style={{
                fontSize: '15px', color: 'var(--text-primary)',
                lineHeight: 1.7, maxWidth: '420px',
              }}>
                {card.back}
              </p>
              <p style={{
                fontSize: '12px', color: 'var(--text-muted)',
                fontStyle: 'italic', marginTop: '8px',
              }}>
                Tap to see question
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '12px',
        marginBottom: '12px',
      }}>
        <button
          onClick={handlePrev}
          disabled={current === 0}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: current === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={handleUnknown}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ✗ Still Learning
        </button>

        <button
          onClick={handleKnown}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-full)',
            background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)',
            color: 'var(--success)', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Check size={14} /> Got It
        </button>

        <button
          onClick={handleNext}
          disabled={current === totalCards - 1}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: current === totalCards - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: current === totalCards - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Keyboard hint */}
      <p style={{
        fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center',
        fontFamily: 'var(--font-mono)',
      }}>
        Space: flip · ←→: navigate · 1: known · 2: learning
      </p>
    </div>
  );
}
