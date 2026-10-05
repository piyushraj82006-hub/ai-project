import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, Loader, Award, ChevronRight, ChevronLeft } from 'lucide-react';

export default function QuizGenerator({ questions, onGenerate, loading, hasText }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [prevQuestions, setPrevQuestions] = useState(questions);

  // Reset when new questions arrive
  if (questions !== prevQuestions) {
    setPrevQuestions(questions);
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
  }

  const totalQuestions = questions?.length || 0;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback((qIndex, optionIndex) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  }, [answers]);

  const handleNext = useCallback(() => {
    if (current < totalQuestions - 1) setCurrent(prev => prev + 1);
  }, [current, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (current > 0) setCurrent(prev => prev - 1);
  }, [current]);

  const handleFinish = useCallback(() => setShowResult(true), []);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setCurrent(0);
    setShowResult(false);
  }, []);

  const getScore = useCallback(() => {
    if (!questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
    };
  }, [questions, answers, totalQuestions]);

  // Loading state
  if (loading) {
    return (
      <div className="tool-hero" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Generating Quiz...</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI is creating questions from your document</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!questions || questions.length === 0) {
    return (
      <div className="tool-hero" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="tool-hero-icon" style={{ background: 'var(--accent-glow)', width: '64px', height: '64px' }}>
            <Award size={28} color="var(--accent)" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No quiz generated yet</p>
          <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px', color: 'var(--text-muted)' }}>
            Upload a document and click Generate to create AI-powered MCQs
          </p>
          {hasText && (
            <button className="tool-btn-generate" onClick={onGenerate} style={{ marginTop: '8px' }}>
              Generate Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const score = getScore();
    const grade = score.percentage >= 90 ? 'A+' : score.percentage >= 80 ? 'A' :
      score.percentage >= 70 ? 'B' : score.percentage >= 60 ? 'C' :
      score.percentage >= 50 ? 'D' : 'F';
    const gradeColor = score.percentage >= 70 ? 'var(--success)' : score.percentage >= 50 ? 'var(--warning)' : 'var(--error)';

    return (
      <div className="tool-hero" style={{ minHeight: '60vh', animation: 'fadeIn 0.4s ease-out' }}>
        {/* Score Circle */}
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: `conic-gradient(${gradeColor} ${score.percentage * 3.6}deg, var(--bg-card) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            background: 'var(--bg-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: gradeColor }}>{score.percentage}%</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: gradeColor, fontFamily: 'var(--font-mono)' }}>Grade: {grade}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Quiz Complete!</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            You got <strong style={{ color: gradeColor }}>{score.correct}</strong> out of{' '}
            <strong>{score.total}</strong> questions correct
          </p>
        </div>

        {/* Question Review */}
        <div style={{ width: '100%', maxWidth: '500px', maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            const wasAnswered = answers[i] !== undefined;
            return (
              <div key={i} className={`quiz-result-item ${wasAnswered ? (isCorrect ? 'correct-item' : 'wrong-item') : 'unanswered-item'}`}>
                {wasAnswered ? (
                  isCorrect ? <CheckCircle size={16} color="var(--success)" /> : <XCircle size={16} color="var(--error)" />
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  Q{i + 1}: {q.question}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: wasAnswered ? (isCorrect ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)' }}>
                  {wasAnswered ? (isCorrect ? '✓' : '✗') : '-'}
                </span>
              </div>
            );
          })}
        </div>

        <button className="tool-btn-generate" onClick={handleRetry} style={{ marginTop: '16px' }}>
          <RotateCcw size={16} /> Try Again
        </button>
      </div>
    );
  }

  // Quiz question view
  const question = questions[current];
  const selectedAnswer = answers[current];
  const isAnswered = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="quiz-counter">{current + 1} / {totalQuestions}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {answeredCount} answered
          </span>
        </div>
        {answeredCount === totalQuestions && (
          <button className="tool-btn-generate" onClick={handleFinish} style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--success)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
            <Award size={14} /> Finish Quiz
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${((current + 1) / totalQuestions) * 100}%` }} />
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.5 }}>{question.question}</h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = idx === question.correctIndex;
            const showCorrect = isAnswered && isCorrectOption;
            const showWrong = isAnswered && isSelected && !isCorrectOption;

            let optionClass = 'quiz-option';
            if (showCorrect) optionClass += ' correct';
            else if (showWrong) optionClass += ' wrong';
            else if (isAnswered && !isSelected) optionClass += ' dimmed';

            return (
              <button
                key={idx}
                className={optionClass}
                onClick={() => handleAnswer(current, idx)}
                disabled={isAnswered}
              >
                <span className="quiz-option-letter" style={{
                  background: showCorrect ? 'rgba(74, 222, 128, 0.2)' :
                    showWrong ? 'rgba(239, 68, 68, 0.2)' :
                    isSelected ? 'rgba(212, 148, 10, 0.2)' : 'var(--bg-secondary)',
                }}>
                  {showCorrect ? <CheckCircle size={14} color="var(--success)" /> :
                   showWrong ? <XCircle size={14} color="var(--error)" /> :
                   String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1 }}>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && question.explanation && (
          <div className={`quiz-explanation ${isCorrect ? 'correct-expl' : 'wrong-expl'}`}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'} -
              </strong>{' '}
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="quiz-nav">
        <button className="quiz-nav-btn" onClick={handlePrev} disabled={current === 0}>
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          className={`quiz-nav-btn ${current === totalQuestions - 1 ? '' : 'primary'}`}
          onClick={handleNext}
          disabled={current === totalQuestions - 1}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
