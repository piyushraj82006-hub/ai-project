import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Loader, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from '../lib/toast';

const CARD_COLORS = [
  'linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%)',
  'linear-gradient(135deg, #F472B6 0%, #FB923C 100%)',
  'linear-gradient(135deg, #4ADE80 0%, #38BDF8 100%)',
  'linear-gradient(135deg, #FBBF24 0%, #F472B6 100%)',
  'linear-gradient(135deg, #38BDF8 0%, #6C63FF 100%)',
];

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
    if (answers[qIndex] !== undefined) return; // Already answered
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  }, [answers]);

  const handleNext = useCallback(() => {
    if (current < totalQuestions - 1) {
      setCurrent(prev => prev + 1);
    }
  }, [current, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
    }
  }, [current]);

  const handleFinish = useCallback(() => {
    setShowResult(true);
  }, []);

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
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <Loader size={40} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Generating Quiz<span className="loading-dots" style={{ display: 'inline-block', width: '20px' }}>...</span>
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          AI is creating questions from your document
        </p>
      </div>
    );
  }

  // Empty state
  if (!questions || questions.length === 0) {
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
          <Award size={28} color="var(--accent)" />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          No quiz generated yet
        </p>
        <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '300px' }}>
          Upload a document and click Generate to create AI-powered MCQs
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
            Generate Quiz
          </button>
        )}
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const score = getScore();
    const grade = score.percentage >= 90 ? 'A+' : score.percentage >= 80 ? 'A' :
      score.percentage >= 70 ? 'B' : score.percentage >= 60 ? 'C' :
      score.percentage >= 50 ? 'D' : 'F';
    const gradeColor = score.percentage >= 70 ? '#4ADE80' : score.percentage >= 50 ? '#FBBF24' : '#EF4444';

    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '24px',
        padding: '40px', animation: 'fadeIn 0.4s ease-out',
      }}>
        {/* Score Circle */}
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: `conic-gradient(${gradeColor} ${score.percentage * 3.6}deg, var(--bg-card) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            background: 'var(--bg-secondary)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '32px', fontWeight: 800, color: gradeColor,
              fontFamily: 'var(--font-display)',
            }}>
              {score.percentage}%
            </span>
            <span style={{
              fontSize: '14px', fontWeight: 700, color: gradeColor,
              fontFamily: 'var(--font-mono)',
            }}>
              Grade: {grade}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            fontWeight: 700, marginBottom: '8px',
          }}>
            Quiz Complete!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            You got <strong style={{ color: gradeColor }}>{score.correct}</strong> out of{' '}
            <strong>{score.total}</strong> questions correct
          </p>
        </div>

        {/* Question Review */}
        <div style={{
          width: '100%', maxWidth: '500px', maxHeight: '250px',
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          gap: '6px', padding: '4px',
        }}>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            const wasAnswered = answers[i] !== undefined;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                background: wasAnswered
                  ? isCorrect ? 'rgba(74, 222, 128, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                  : 'var(--bg-card)',
                border: `1px solid ${wasAnswered
                  ? isCorrect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  : 'var(--border-color)'}`,
              }}>
                {wasAnswered ? (
                  isCorrect ? <CheckCircle size={16} color="#4ADE80" /> : <XCircle size={16} color="#EF4444" />
                ) : (
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid var(--border-color)',
                  }} />
                )}
                <span style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  Q{i + 1}: {q.question}
                </span>
                <span style={{
                  fontSize: '11px', fontFamily: 'var(--font-mono)',
                  color: wasAnswered ? (isCorrect ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)',
                }}>
                  {wasAnswered ? (isCorrect ? '✓' : '✗') : '—'}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-accent)', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', marginTop: '8px',
          }}
        >
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
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '24px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: CARD_COLORS[current % CARD_COLORS.length],
            color: '#fff', fontSize: '12px', fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}>
            {current + 1} / {totalQuestions}
          </span>
          <span style={{
            fontSize: '12px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {answeredCount} answered
          </span>
        </div>
        {answeredCount === totalQuestions && (
          <button
            onClick={handleFinish}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)',
              color: 'var(--success)', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Award size={14} /> Finish Quiz
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: '4px', borderRadius: '2px',
        background: 'var(--bg-card)', marginBottom: '24px',
      }}>
        <div style={{
          width: `${((current + 1) / totalQuestions) * 100}%`,
          height: '100%', borderRadius: '2px',
          background: 'var(--gradient-accent)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: '20px', overflowY: 'auto',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '18px',
          fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}>
          {question.question}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = idx === question.correctIndex;
            const showCorrect = isAnswered && isCorrectOption;
            const showWrong = isAnswered && isSelected && !isCorrectOption;

            let bg = 'var(--bg-card)';
            let border = 'var(--border-color)';
            let textColor = 'var(--text-primary)';

            if (showCorrect) {
              bg = 'rgba(74, 222, 128, 0.1)';
              border = 'rgba(74, 222, 128, 0.4)';
              textColor = '#4ADE80';
            } else if (showWrong) {
              bg = 'rgba(239, 68, 68, 0.1)';
              border = 'rgba(239, 68, 68, 0.4)';
              textColor = '#EF4444';
            } else if (isSelected) {
              bg = 'rgba(108, 99, 255, 0.1)';
              border = 'rgba(108, 99, 255, 0.4)';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(current, idx)}
                disabled={isAnswered}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 18px', borderRadius: '12px',
                  background: bg, border: `1px solid ${border}`,
                  color: textColor, fontSize: '14px', textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'var(--transition-fast)',
                  opacity: isAnswered && !showCorrect && !showWrong ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!isAnswered) {
                    e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
                    e.currentTarget.style.background = 'rgba(108, 99, 255, 0.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isAnswered && !isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }
                }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: showCorrect ? 'rgba(74, 222, 128, 0.2)' :
                    showWrong ? 'rgba(239, 68, 68, 0.2)' :
                    isSelected ? 'rgba(108, 99, 255, 0.2)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}>
                  {showCorrect ? <CheckCircle size={14} color="#4ADE80" /> :
                   showWrong ? <XCircle size={14} color="#EF4444" /> :
                   String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1 }}>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && question.explanation && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px',
            background: isCorrect ? 'rgba(74, 222, 128, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${isCorrect ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <p style={{
              fontSize: '13px', color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'} —
              </strong>{' '}
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '20px', paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <button
          onClick={handlePrev}
          disabled={current === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: current === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: 500,
            cursor: current === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={handleNext}
          disabled={current === totalQuestions - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: 'var(--radius-full)',
            background: current === totalQuestions - 1 ? 'var(--bg-card)' : 'var(--gradient-accent)',
            border: current === totalQuestions - 1 ? '1px solid var(--border-color)' : 'none',
            color: current === totalQuestions - 1 ? 'var(--text-muted)' : '#fff',
            fontSize: '13px', fontWeight: 500,
            cursor: current === totalQuestions - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
