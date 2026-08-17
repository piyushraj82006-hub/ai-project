import { LayoutGrid, BookOpen, Network, Sparkles, MessageSquare, Bot, Brain, HelpCircle, Video } from 'lucide-react';

export default function TabBar({
  activeTab,
  onTabChange,
  onGenerate,
  loading,
  hasFile,
  hasSummary,
  hasText,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
    }}>
      {/* Left: Main tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {/* Reels Tab */}
        <button
          onClick={() => onTabChange('reels')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'reels' ? 'var(--gradient-accent)' : 'transparent',
            border: activeTab === 'reels' ? 'none' : '1px solid transparent',
            color: activeTab === 'reels' ? '#fff' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <LayoutGrid size={15} />
          Reels
        </button>

        {/* Summary Tab */}
        <button
          onClick={() => onTabChange('summary')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'summary' ? 'var(--gradient-accent)' : 'transparent',
            border: activeTab === 'summary' ? 'none' : '1px solid transparent',
            color: activeTab === 'summary' ? '#fff' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <BookOpen size={15} />
          Summary
        </button>

        {/* Mind Map Tab (Requires Summary Data) */}
        {(hasSummary || activeTab === 'mindmap') && (
          <button
            onClick={() => onTabChange('mindmap')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: activeTab === 'mindmap' ? 'var(--gradient-accent)' : 'transparent',
              border: 'none', color: activeTab === 'mindmap' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)',
              cursor: 'pointer', transition: 'var(--transition-fast)',
            }}
          >
            <Network size={15} />
            Mind Map
          </button>
        )}

        {/* AI Chat Tab (Requires Summary Data) */}
        {(hasSummary || activeTab === 'chat') && (
          <button
            onClick={() => onTabChange('chat')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: activeTab === 'chat' ? 'var(--gradient-accent)' : 'transparent',
              border: 'none', color: activeTab === 'chat' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)',
              cursor: 'pointer', transition: 'var(--transition-fast)',
            }}
          >
            <MessageSquare size={15} />
            AI Chat
          </button>
        )}

        {/* Quiz Tab */}
        {(hasText || activeTab === 'quiz') && (
          <button
            onClick={() => onTabChange('quiz')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: activeTab === 'quiz' ? 'var(--gradient-accent)' : 'transparent',
              border: 'none', color: activeTab === 'quiz' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)',
              cursor: 'pointer', transition: 'var(--transition-fast)',
            }}
          >
            <HelpCircle size={15} />
            Quiz
          </button>
        )}

        {/* Flashcards Tab */}
        {(hasSummary || activeTab === 'flashcards') && (
          <button
            onClick={() => onTabChange('flashcards')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: activeTab === 'flashcards' ? 'var(--gradient-accent)' : 'transparent',
              border: 'none', color: activeTab === 'flashcards' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)',
              cursor: 'pointer', transition: 'var(--transition-fast)',
            }}
          >
            <Brain size={15} />
            Flashcards
          </button>
        )}

        {/* Videos Tab */}
        {(hasText || activeTab === 'videos') && (
          <button
            onClick={() => onTabChange('videos')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: activeTab === 'videos' ? 'var(--gradient-accent)' : 'transparent',
              border: 'none', color: activeTab === 'videos' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)',
              cursor: 'pointer', transition: 'var(--transition-fast)',
            }}
          >
            <Video size={15} />
            Videos
          </button>
        )}
      </div>

      {/* Center flex spacer for layout consistency if needed, though space-between handles 2 items well */}
      <div style={{ flex: 1 }} />

      {/* Right: Generate button */}
      <button
        onClick={onGenerate}
        disabled={loading || !hasFile}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 20px',
          borderRadius: 'var(--radius-full)',
          background: loading || !hasFile ? 'rgba(108, 99, 255, 0.2)' : 'var(--gradient-accent)',
          color: loading || !hasFile ? 'var(--text-muted)' : '#fff',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
          cursor: loading || !hasFile ? 'not-allowed' : 'pointer',
          boxShadow: loading || !hasFile ? 'none' : 'var(--shadow-glow)',
          transition: 'var(--transition-fast)',
        }}
      >
        <Sparkles size={15} />
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
