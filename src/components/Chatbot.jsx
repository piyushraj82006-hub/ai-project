import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, ArrowLeft, Loader2, MessageSquare, Bot } from 'lucide-react';
import { initializeVectorStore, chatWithRAG } from '../lib/rag';
import { toast } from '../lib/toast';

export default function Chatbot({ text, pdfBase64, onClose }) {
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [vectorStore, setVectorStore] = useState(null);
  
  const bottomRef = useRef(null);

  // Initialize embeddings seamlessly when opening the chat memory pipeline
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        if (text) {
          const vs = await initializeVectorStore(text);
          if (active) setVectorStore(vs);
        }
      } catch (err) {
        if (active) toast('Failed to embed document context: ' + err.message, 'error');
      } finally {
        if (active) setIsInitializing(false);
      }
    }
    init();
    return () => { active = false; };
  }, [text]);

  // Keep chat scrolled visually
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const handleSend = async (overrideQuery = null) => {
    // If the event object is passed securely via onClick or keydown, fallback to query string
    const textToSend = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!textToSend.trim()) return;
    
    const userMsg = { role: 'user', content: textToSend.trim() };
    setHistory(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      const responseText = await chatWithRAG(userMsg.content, history, vectorStore, pdfBase64);
      setHistory(prev => [...prev, { role: 'ai', content: responseText }]);
    } catch (err) {
      toast('AI Error: ' + err.message, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-sans)', borderRadius: 'var(--radius-lg)' }}>
      {/* Dynamic Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Summary
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
          <MessageSquare size={18} color="var(--accent)" /> Ask the Document
        </div>
        <button onClick={() => setHistory([])} disabled={history.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: history.length ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, opacity: history.length ? 1 : 0.5, transition: 'var(--transition-fast)' }} onMouseEnter={e => { if(history.length) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Physics Chat Bubbles */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
        {isInitializing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px', color: 'var(--accent)' }} />
            <p style={{ fontSize: '14px' }}>Generating document embeddings...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: '40px' }}>
            <p style={{ fontWeight: 600, fontSize: '20px', color: 'var(--text-primary)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               👋 Hi~ Feel free to ask me anything!
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '600px' }}>
              {[
                { icon: '✅', text: 'Generate 5 related MCQs.' },
                { icon: '📝', text: 'Extract the outline.' },
                { icon: '🔑', text: 'List 5 keywords and explain their meanings.' },
                { icon: '📌', text: 'Extract 5 key points.' },
                { icon: '🌟', text: 'List all key conclusions or recommendations.' }
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.text)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px 20px', borderRadius: '12px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)', fontSize: '14.5px', textAlign: 'left',
                    cursor: 'pointer', transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108, 99, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span style={{ fontSize: '16px' }}>{prompt.icon}</span>
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {history.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '14px 18px', borderRadius: '14px',
                  background: msg.role === 'user' ? 'var(--gradient-accent)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(108, 99, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                  border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '14px',
                  lineHeight: 1.6, fontSize: '15px', whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderBottomLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" color="var(--accent)" /> AI is searching...
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: '4px' }} />
          </div>
        )}
      </div>

      {/* Input Engine */}
      <div style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isTyping && !isInitializing && handleSend()}
            placeholder="Type your question..."
            disabled={isInitializing || isTyping}
            style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none', transition: 'var(--transition-fast)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-light)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <button
            onClick={handleSend}
            disabled={!query.trim() || isInitializing || isTyping}
            style={{ width: '56px', borderRadius: '12px', background: 'var(--gradient-accent)', border: 'none', color: '#fff', cursor: (!query.trim() || isInitializing || isTyping) ? 'not-allowed' : 'pointer', opacity: (!query.trim() || isInitializing || isTyping) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)', boxShadow: 'var(--shadow-glow)' }}
            onMouseEnter={e => { if(query.trim() && !isTyping) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { if(query.trim() && !isTyping) e.currentTarget.style.opacity = '1' }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
