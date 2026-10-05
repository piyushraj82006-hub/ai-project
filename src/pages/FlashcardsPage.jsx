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
    <div className="tool-page">
      <Header showNav />
      <ToastContainer />

      <main className="tool-main">
        {!file ? (
          <div className="tool-split">
            {/* Left — Info */}
            <div className="tool-split-left">
              <div className="tool-split-badge"><Brain size={14} /> Study Tool</div>
              <h2 className="tool-split-headline">AI <span className="gradient-text">Flashcards</span></h2>
              <p className="tool-split-subtext">Create flip-card study sets from your documents for fast recall.</p>
              <ul className="tool-split-features">
                <li>Auto-generated from your notes</li>
                <li>Flip-card review mode</li>
                <li>Supports PDF, EPUB, and DOCX files</li>
              </ul>
            </div>

            {/* Right — Upload */}
            <div className="tool-split-right">
              <div
                className={`tool-dropzone ${dragging ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('flashcard-file-input')?.click()}
              >
                <Upload size={28} className="tool-dropzone-icon" />
                <p>Drag & drop or click to upload</p>
                <span>PDF, EPUB, DOCX up to 50MB</span>
                <input
                  id="flashcard-file-input"
                  type="file"
                  accept=".pdf,.epub,.docx"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
            <div className="tool-filebar">
              <div className="tool-filebar-name">
                <FileText size={16} color="var(--accent)" />
                <span>{file.name}</span>
              </div>
              <div className="tool-filebar-actions">
                <button
                  className="tool-btn-generate"
                  onClick={handleGenerate}
                  disabled={loading || !text}
                >
                  <Sparkles size={14} />
                  {loading ? 'Generating...' : 'Generate Flashcards'}
                </button>
                <button
                  className="tool-btn-secondary"
                  onClick={() => { setFile(null); setText(''); setCards([]); }}
                >
                  Change File
                </button>
              </div>
            </div>

            <div className="tool-content">
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
