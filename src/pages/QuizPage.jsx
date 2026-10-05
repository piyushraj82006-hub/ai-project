import { useState, useCallback } from 'react';
import Header from '../components/Header';
import QuizGenerator from '../components/QuizGenerator';
import { ToastContainer } from '../components/Toast';
import { toast } from '../lib/toast';
import { extractTextFromFile, detectFileType, getFileTypeLabel } from '../lib/fileExtractor';
import { generateQuizWithGemini } from '../lib/gemini';
import { Upload, Sparkles, FileText, HelpCircle } from 'lucide-react';

export default function QuizPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState([]);
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
      const result = await generateQuizWithGemini(text);
      setQuestions(result);
      toast(`Quiz generated! ${result.length} questions`, 'success');
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
              <div className="tool-split-badge"><HelpCircle size={14} /> AI-Powered</div>
              <h2 className="tool-split-headline">AI Quiz <span className="gradient-text">Generator</span></h2>
              <p className="tool-split-subtext">Upload a document and get AI-powered multiple choice questions instantly.</p>
              <ul className="tool-split-features">
                <li>Multiple choice questions from your notes</li>
                <li>Instant scoring and explanations</li>
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
                onClick={() => document.getElementById('quiz-file-input')?.click()}
              >
                <Upload size={28} className="tool-dropzone-icon" />
                <p>Drag & drop or click to upload</p>
                <span>PDF, EPUB, DOCX up to 50MB</span>
                <input
                  id="quiz-file-input"
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
                  {loading ? 'Generating...' : 'Generate Quiz'}
                </button>
                <button
                  className="tool-btn-secondary"
                  onClick={() => { setFile(null); setText(''); setQuestions([]); }}
                >
                  Change File
                </button>
              </div>
            </div>

            <div className="tool-content">
              <QuizGenerator
                questions={questions}
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
