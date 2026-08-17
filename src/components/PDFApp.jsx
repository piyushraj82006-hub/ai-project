import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import PDFUpload from './PDFUpload';
import PDFViewer from './PDFViewer';
import TabBar from './TabBar';
import SummaryOutput from './SummaryOutput';
import MindMap from './MindMap';
import ReelViewer from './ReelViewer';
import QuizGenerator from './QuizGenerator';
import Flashcards from './Flashcards';
import YouTubeSearch from './YouTubeSearch';
import PomodoroTimer from './PomodoroTimer';
import { useAuth } from '../context/AuthContext';
import { saveContent } from '../lib/storage';
import { ToastContainer } from './Toast';
import { toast } from '../lib/toast';
import { extractTextFromFile, detectFileType, getFileTypeLabel, fileToBase64 } from '../lib/fileExtractor';
import { summarizeWithGemini, extractMindMapData, generateReelsWithGemini, generateQuizWithGemini, generateFlashcardsWithGemini, generateFlashcardsFromSummary } from '../lib/gemini';
import Chatbot from './Chatbot';

/**
 * A simple info panel shown for non-PDF files (EPUB, DOCX) in place of the PDF viewer.
 */
function FileInfoPanel({ file, fileType }) {
  const icons = {
    epub: '📖',
    docx: '📝',
  };
  const typeNames = {
    epub: 'EPUB eBook',
    docx: 'Word Document',
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      gap: '16px',
    }}>
      <div style={{
        fontSize: '56px',
        lineHeight: 1,
        marginBottom: '8px',
      }}>
        {icons[fileType] || '📄'}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        {file?.name || 'Document'}
      </h3>
      <div style={{
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: fileType === 'epub' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(56, 189, 248, 0.1)',
        border: `1px solid ${fileType === 'epub' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`,
        color: fileType === 'epub' ? 'var(--success)' : '#38BDF8',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
      }}>
        {typeNames[fileType] || fileType?.toUpperCase()}
      </div>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        maxWidth: '280px',
        lineHeight: 1.6,
      }}>
        Text extracted successfully. Switch between tabs to view your summary, mind map, and reels.
      </p>
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        {(file?.size / 1024).toFixed(1)} KB
      </div>
    </div>
  );
}

export default function PDFApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [mindMapData, setMindMapData] = useState(null);
  const [reels, setReels] = useState([]);
  const [reelStatus, setReelStatus] = useState('idle');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reels');
  const [subView, setSubView] = useState('text');
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [pdfBase64Data, setPdfBase64Data] = useState(null);
  const [fileType, setFileType] = useState(null);
  const location = useLocation();

  const handleFileSelect = useCallback((selectedFile) => {
    const detectedType = detectFileType(selectedFile);
    if (!detectedType) {
      toast('Please upload a PDF, EPUB, or DOCX file', 'error');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast('File size must be under 50MB', 'error');
      return;
    }
    setFile(selectedFile);
    setFileType(detectedType);
    setSummary(null);
    setMindMapData(null);
    setReels([]);
    setReelStatus('idle');
    setShowResults(false);
    setActiveTab('reels');
    setSubView('text');
    setExtractedText('');
    setPdfBase64Data(null);
    toast(`${getFileTypeLabel(detectedType)} uploaded successfully`, 'success');
  }, []);

  useEffect(() => {
    if (location.state?.loadSummary) {
      const { loadSummary, loadReels } = location.state;
      setSummary(loadSummary);
      setMindMapData(extractMindMapData(loadSummary));
      setReels(loadReels || []);
      setReelStatus('completed');
      setShowResults(true);
      setActiveTab('summary');
      setSubView('text');
      setTimeout(() => toast('Loaded from history', 'info'), 500);
      
      // Clear state so it doesn't reload on refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.pyqUrl) {
      const loadPYQ = async () => {
        try {
          toast('Downloading PYQ from cloud...', 'info');
          const res = await fetch(location.state.pyqUrl);
          if (!res.ok) throw new Error('Network response was not ok');
          const blob = await res.blob();
          const loadedFile = new File([blob], `${location.state.title || 'PYQ'}.pdf`, { type: 'application/pdf' });
          handleFileSelect(loadedFile);
        } catch (err) {
          console.error(err);
          toast('Failed to load PYQ. Please check network or CORS.', 'error');
        }
      };
      loadPYQ();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, handleFileSelect]);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setFileType(null);
    setSummary(null);
    setMindMapData(null);
    setReels([]);
    setReelStatus('idle');
    setQuizQuestions([]);
    setFlashcards([]);
    setShowResults(false);
    setActiveTab('reels');
    setSubView('text');
    setExtractedText('');
    setPdfBase64Data(null);
  }, []);

  const handleDemo = useCallback(() => {
    const demoSummary = {
      documentTitle: "Software Engineering — BCSE302L",
      overview: "A comprehensive course covering software engineering principles, methodologies, and practices including requirements engineering, software design, testing strategies, and project management.",
      courseObjectives: [
        "Understand fundamental software engineering concepts and process models",
        "Apply requirements engineering techniques to real-world problems",
        "Design software systems using architectural patterns and UML",
        "Implement comprehensive testing strategies including TDD",
        "Manage software projects using estimation and risk management techniques"
      ],
      courseOutcomes: [
        "Design and develop large-scale software systems",
        "Write formal Software Requirements Specification (SRS) documents",
        "Apply design patterns and create UML diagrams",
        "Perform unit, integration, and system testing",
        "Estimate project costs using COCOMO and manage risks"
      ],
      modules: [
        { title: "Introduction to Software Engineering", description: "Covers software crisis, process models, Waterfall, Agile, Scrum and XP.", topics: ["Software Crisis", "Process Models", "Waterfall", "Agile & Scrum", "XP"], hours: "5" },
        { title: "Requirements Engineering", description: "Techniques for gathering, analyzing, and documenting software requirements.", topics: ["Elicitation", "SRS Document", "Use Cases", "User Stories", "Validation"], hours: "6" },
        { title: "Software Design", description: "Architectural design principles, GoF patterns, and UML modeling.", topics: ["Architecture", "Design Patterns", "UML Class", "Sequence Diagrams", "Components"], hours: "7" },
        { title: "Software Testing", description: "Testing from unit to system level, TDD and automation.", topics: ["Unit Testing", "Integration", "System Testing", "TDD", "Black/White Box"], hours: "6" },
        { title: "Project Management", description: "Estimation, scheduling, risk management and configuration management.", topics: ["COCOMO", "Scheduling", "Risk Mgmt", "Config Mgmt", "QA"], hours: "6" }
      ],
      keyConcepts: [
        { term: "Software Crisis", definition: "The difficulty of writing correct, verifiable programs, leading to cost/schedule overruns." },
        { term: "Agile Methodology", definition: "Iterative development delivering working software in short sprints." },
        { term: "Design Patterns", definition: "Reusable solutions to common software design problems (Creational, Structural, Behavioral)." },
        { term: "TDD", definition: "Tests written before code, following Red-Green-Refactor cycle." },
        { term: "COCOMO", definition: "Constructive Cost Model — estimates effort and schedule from project size in KLOC." }
      ],
      keyInsights: [
        "Modern SE emphasizes iterative development over waterfall",
        "Requirements errors cost 100x more to fix in production",
        "Design patterns provide shared vocabulary for architectural decisions",
        "Automated testing reduces regression bugs by 80%",
        "Risk management should be proactive, not reactive"
      ],
      references: [
        "Software Engineering: A Practitioner's Approach — Pressman, 9th Ed",
        "Software Engineering — Sommerville, 10th Ed",
        "Design Patterns — Gang of Four"
      ],
      conclusion: "This course provides a comprehensive SE foundation for designing, developing, testing, and managing large-scale software systems.",
      metadata: { courseCode: "BCSE302L", credits: "4", prerequisite: "Programming Fundamentals", totalHours: "30" }
    };
    const demoReels = [
      { title: "What Is Software Engineering?", content: "Software engineering is all about applying systematic, disciplined approaches to software development. It emerged from the 'software crisis' of the 1960s, when projects kept failing spectacularly — going way over budget and delivering buggy software.", keyPoints: ["Born from the 1960s software crisis", "Systematic approach to building software", "Focuses on quality, cost, and schedule"], index: 0 },
      { title: "Process Models That Actually Work", content: "From the classic Waterfall model to modern Agile and Scrum, different situations call for different approaches. Waterfall works for well-defined projects, while Agile shines when requirements keep changing — which, let's be honest, is most of the time.", keyPoints: ["Waterfall: sequential, plan-driven", "Agile: iterative, flexible sprints", "Scrum: daily standups, 2-week sprints"], index: 1 },
      { title: "Requirements: Get Them Right First", content: "Requirements engineering is arguably the most critical phase. Getting requirements wrong early costs 100x more to fix later in production. Use cases, user stories, and SRS documents help teams capture exactly what the software should do.", keyPoints: ["Errors here cost 100x more later", "SRS documents capture requirements formally", "Use cases model user interactions"], index: 2 },
      { title: "Design Patterns Are Your Best Friends", content: "Gang of Four design patterns give developers a shared vocabulary for solving common problems. Whether it's Singleton for single instances, Observer for event handling, or Factory for object creation — patterns make code maintainable and teams productive.", keyPoints: ["Creational, Structural, Behavioral patterns", "Shared vocabulary across teams", "Makes code more maintainable"], index: 3 },
      { title: "Testing: Break It Before Users Do", content: "Test-Driven Development flips the script: write tests BEFORE code. Combined with unit testing, integration testing, and system testing, automated testing catches 80% of regression bugs and enables continuous integration pipelines.", keyPoints: ["TDD: Red → Green → Refactor cycle", "Automated testing catches 80% of regressions", "Black box + white box techniques"], index: 4 },
      { title: "Managing Projects Like A Pro", content: "COCOMO helps estimate project costs from code size, while risk management identifies threats before they derail your timeline. Configuration management keeps track of every version, and quality assurance ensures the final product actually meets user needs.", keyPoints: ["COCOMO: estimate from KLOC", "Risk management: proactive, not reactive", "Configuration management tracks versions"], index: 5 },
    ];
    const demoFile = new File(['demo'], 'SOFTWARE_ENGINEERING.pdf', { type: 'application/pdf' });
    setFile(demoFile);
    setSummary(demoSummary);
    const mapData = extractMindMapData(demoSummary);
    setMindMapData(mapData);
    setReels(demoReels);
    setReelStatus('completed');
    setShowResults(true);
    setActiveTab('reels');
    toast('Demo loaded! Switch between Reels and Summary tabs', 'success');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      toast('Please upload a document first', 'error');
      return;
    }
    
    setLoading(true);
    setSummary(null);
    setMindMapData(null);
    setReels([]);
    setReelStatus('idle');
    setSubView('text');

    try {
      toast(`Extracting text from ${getFileTypeLabel(fileType)}...`, 'info');
      let text = '';
      let pdfBase64 = null;
      
      const result = await extractTextFromFile(file);
      text = result.text;
      
      if (result.needsVision && result.fileType === 'pdf') {
        toast('Scanned PDF detected. Using AI Vision to read document...', 'info');
        pdfBase64 = await fileToBase64(file);
      }

      setExtractedText(text);
      setPdfBase64Data(pdfBase64);

      toast('Generating AI summary...', 'info');
      let summaryOk = false;
      let generatedSummary = null;
      try {
        generatedSummary = await summarizeWithGemini(text, pdfBase64);
        setSummary(generatedSummary);
        const mapData = extractMindMapData(generatedSummary);
        setMindMapData(mapData);
        summaryOk = true;
        setShowResults(true);
        setActiveTab('summary');
        toast('Summary generated! Now creating reels...', 'success');
      } catch (summaryErr) {
        console.error('Summary failed:', summaryErr);
        const isQuota = summaryErr.message?.includes('quota') || summaryErr.message?.includes('429');
        toast(
          isQuota ? '⚠️ API daily quota exhausted. Please try again tomorrow.' : 'Summary failed: ' + summaryErr.message,
          'error'
        );
      }

      if (summaryOk) {
        await new Promise(r => setTimeout(r, 3000));
      }
      setReelStatus('generating');
      try {
        const reelResult = await generateReelsWithGemini(text, pdfBase64);
        if (reelResult?.length > 0) {
          setReels(reelResult);
          setReelStatus('completed');
          toast('Reels generated!', 'success');
          // Save complete content (summary + reels) to history
          if (user && summaryOk && generatedSummary) {
            saveContent(user.uid, generatedSummary, reelResult);
          }
        } else {
          setReelStatus('failed');
        }
      } catch (reelErr) {
        console.error('Reels failed:', reelErr);
        setReelStatus('failed');
      }

      setShowResults(true);
      if (!summaryOk) setActiveTab('reels');
    } catch (err) {
      console.error('Generation failed:', err);
      toast(err.message || 'Failed to generate', 'error');
      setReelStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [file, user, fileType]);

  const handleQuizGenerate = useCallback(async () => {
    const text = extractedText || summary?.markdownContent || '';
    if (!text) {
      toast('Generate a summary first to create a quiz', 'error');
      return;
    }
    setQuizLoading(true);
    try {
      const questions = await generateQuizWithGemini(text, pdfBase64Data);
      setQuizQuestions(questions);
      toast(`Quiz generated! ${questions.length} questions`, 'success');
    } catch (err) {
      console.error('Quiz generation failed:', err);
      toast('Failed to generate quiz: ' + err.message, 'error');
    } finally {
      setQuizLoading(false);
    }
  }, [extractedText, summary, pdfBase64Data]);

  const handleFlashcardGenerate = useCallback(async () => {
    // First try generating from summary (no API call needed)
    if (summary) {
      const cards = generateFlashcardsFromSummary(summary);
      if (cards.length > 0) {
        setFlashcards(cards);
        toast(`Flashcards created! ${cards.length} cards`, 'success');
        return;
      }
    }
    // Fallback to API-based generation
    const text = extractedText || summary?.markdownContent || '';
    if (!text) {
      toast('Generate a summary first to create flashcards', 'error');
      return;
    }
    setFlashcardLoading(true);
    try {
      const cards = await generateFlashcardsWithGemini(text, pdfBase64Data);
      setFlashcards(cards);
      toast(`Flashcards created! ${cards.length} cards`, 'success');
    } catch (err) {
      console.error('Flashcard generation failed:', err);
      toast('Failed to generate flashcards: ' + err.message, 'error');
    } finally {
      setFlashcardLoading(false);
    }
  }, [summary, extractedText, pdfBase64Data]);

  const handleBack = useCallback(() => {
    setShowResults(false);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />
      <Header fileName={file?.name} showNav />
      <ToastContainer />

      <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {!showResults ? (
          <>
            <PDFUpload
              file={file}
              onFileSelect={handleFileSelect}
              onClear={handleClearFile}
              onGenerate={handleGenerate}
              loading={loading}
            />
            {!file && (
              <div style={{ textAlign: 'center', marginTop: '-20px', paddingBottom: '40px' }}>
                <button
                  onClick={handleDemo}
                  style={{
                    padding: '10px 22px', borderRadius: 'var(--radius-full)',
                    background: 'rgba(0, 122, 255, 0.08)',
                    border: '1px solid rgba(0, 122, 255, 0.2)',
                    color: 'var(--accent-light)', fontSize: '13px', fontWeight: 500,
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.2)'; }}
                >
                  ✨ Try Demo — See sample output
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <TabBar
              activeTab={activeTab} onTabChange={setActiveTab}
              onGenerate={handleGenerate} loading={loading}
              hasFile={!!file} hasSummary={!!summary}
              hasText={!!extractedText}
            />
            <div style={{
              flex: 1, display: 'flex', overflow: 'hidden',
              gap: '1px', background: 'var(--border-color)',
            }}>
              <div style={{
                width: fileType === 'pdf' ? '45%' : '35%',
                flexShrink: 0, background: 'var(--bg-primary)',
              }}>
                {fileType === 'pdf' ? (
                  <PDFViewer file={file} onBack={handleBack} />
                ) : (
                  <FileInfoPanel file={file} fileType={fileType} />
                )}
              </div>
              <div style={{ flex: 1, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                {activeTab === 'chat' ? (() => {
                  const chatText = extractedText || summary?.markdownContent || '';
                  const chatPdf = extractedText ? pdfBase64Data : null;
                  return <Chatbot text={chatText} pdfBase64={chatPdf} onClose={() => setActiveTab('summary')} />;
                })() : activeTab === 'reels' ? (
                  <ReelViewer reels={reels} status={reelStatus} />
                ) : activeTab === 'mindmap' ? (
                  <MindMap data={mindMapData} onBack={() => setActiveTab('summary')} />
                ) : activeTab === 'quiz' ? (
                  <QuizGenerator
                    questions={quizQuestions}
                    onGenerate={handleQuizGenerate}
                    loading={quizLoading}
                    hasText={!!extractedText}
                  />
                ) : activeTab === 'flashcards' ? (
                  <Flashcards
                    cards={flashcards}
                    onGenerate={handleFlashcardGenerate}
                    loading={flashcardLoading}
                    hasText={!!extractedText || !!summary}
                  />
                ) : activeTab === 'videos' ? (
                  <YouTubeSearch
                    documentTitle={summary?.documentTitle || file?.name || ''}
                    keyConcepts={summary?.keyConcepts || []}
                  />
                ) : (
                  <SummaryOutput summary={summary} />
                )}
              </div>
            </div>
          </div>
        )}

        {loading && !showResults && (
          <div style={{
            position: 'fixed', inset: 0,            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 500,
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              border: '3px solid var(--border-color)', borderTopColor: 'var(--accent)',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                Analyzing your {getFileTypeLabel(fileType)}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                AI is generating summary, mind map & reels...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
