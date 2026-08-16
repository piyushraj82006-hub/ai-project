import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { summarizeWithGemini } from '../lib/gemini';
import { saveContent } from '../lib/storage';
import SummaryOutput from './SummaryOutput';
import { Sparkles, FileText, Copy, Check, ArrowLeft, Brain, AlignLeft } from 'lucide-react';

export default function TextSummarizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) { setError('Please paste some text to summarize'); return; }
    if (text.trim().length < 50) { setError('Text is too short. Please provide at least a paragraph.'); return; }

    setError('');
    setLoading(true);
    setSummary(null);

    try {
      const result = await summarizeWithGemini(text.trim());
      setSummary(result);
      // Save to history
      if (user) {
        saveContent(user.uid, result);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="summarizer-page">
      <div className="summarizer-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1><Sparkles size={22} /> AI Text Summarizer</h1>
      </div>

      <div className="summarizer-layout">
        {/* Input Panel */}
        <div className="summarizer-input-panel">
          <div className="summarizer-input-header">
            <h2><FileText size={18} /> Paste Your Text</h2>
            <span className="char-count">{text.length.toLocaleString()} chars</span>
          </div>
          <textarea
            className="summarizer-textarea"
            placeholder="Paste your notes, article, chapter, or any long text here...&#10;&#10;The AI will generate a structured summary with headings, bullet points, key concepts, and more."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={16}
          />
          <div className="summarizer-actions">
            <button className="summarizer-copy-btn" onClick={handleCopy} disabled={!text}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Input'}
            </button>
            <button 
              className="summarizer-generate-btn" 
              onClick={handleGenerate} 
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Summary
                </>
              )}
            </button>
          </div>
          {error && <div className="summarizer-error">{error}</div>}
        </div>

        {/* Output Panel */}
        <div className="summarizer-output-panel">
          {loading && (
            <div className="summarizer-loading">
              <div className="spinner" />
              <p>AI is analyzing your text...</p>
              <p className="summarizer-loading-sub">This may take 10-20 seconds</p>
            </div>
          )}

          {!loading && !summary && (
            <div className="summarizer-empty">
              <Brain size={48} strokeWidth={1} />
              <h3>Your summary will appear here</h3>
              <p>Paste text on the left and click "Generate Summary"</p>
            </div>
          )}

          {summary && !loading && (
            <>
              <SummaryOutput summary={summary} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
