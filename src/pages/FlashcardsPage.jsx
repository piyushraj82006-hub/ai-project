import { useState, useCallback } from 'react';
import Header from '../components/Header';
import Flashcards from '../components/Flashcards';
import { ToastContainer } from '../components/Toast';
import { toast } from '../lib/toast';
import { extractTextFromFile, detectFileType, getFileTypeLabel } from '../lib/fileExtractor';
import { generateFlashcardsWithGemini } from '../lib/gemini';
import { Upload, Sparkles, FileText, Brain } from 'lucide-react';

export default function FlashcardsPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (selectedFile) => {
    const type = detectFileType(selectedFile);
    if (!type) {
      toast('Please upload a PDF, EPUB, or DOCX file', 'error');
      return;
    }
    setFile(selectedFile);
    toast(`${getFileTypeLabel(type)} uploaded`, 'success');
    try {
      const result = await extractTextFromFile(selectedFile);
      setText(result.text);
    } catch (err) {
      toast('Failed to extract text: ' + err.message, 'error');
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text) {
      toast('Upload a document first', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await generateFlashcardsWithGemini(text);
      setCards(result);
      toast(`Flashcards created! ${result.length} cards`, 'success');
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [text]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />
      <Header showNav />
      <ToastContainer />

      <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {!file ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)', padding: '40px 20px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(244, 114, 182, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Brain size={32} color="#F472B6" />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700, marginBottom: '8px',
              }}>
                AI <span className="gradient-text">Flashcards</span>
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                Create flip-card study sets from your documents
              </p>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('flashcard-file-input')?.click()}
              style={{
                width: '100%', maxWidth: '480px', minHeight: '200px',
                borderRadius: 'var(--radius-xl)',
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-color)'}`,
                background: dragging ? 'rgba(108, 99, 255, 0.08)' : 'var(--bg-secondary)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '12px', cursor: 'pointer',
                transition: 'var(--transition-base)',
              }}
            >
              <Upload size={28} color="var(--accent)" />
              <p style={{ fontSize: '14px', fontWeight: 500 }}>Drag & drop or click to upload</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF, EPUB, DOCX up to 50MB</p>
              <input
                id="flashcard-file-input"
                type="file"
                accept=".pdf,.epub,.docx"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{file.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !text}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: 'var(--radius-full)',
                    background: loading ? 'rgba(108, 99, 255, 0.2)' : 'var(--gradient-accent)',
                    border: 'none', color: loading ? 'var(--text-muted)' : '#fff',
                    fontSize: '12px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Sparkles size={14} />
                  {loading ? 'Generating...' : 'Generate Flashcards'}
                </button>
                <button
                  onClick={() => { setFile(null); setText(''); setCards([]); }}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Change File
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Flashcards
                cards={cards}
                onGenerate={handleGenerate}
                loading={loading}
                hasText={!!text}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
