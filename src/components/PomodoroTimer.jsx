import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { toast } from '../lib/toast';

const PRESETS = {
  focus: { label: 'Focus', duration: 25 * 60, color: 'var(--accent)', icon: BookOpen },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: 'var(--success)', icon: Coffee },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: '#38BDF8', icon: Coffee },
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(PRESETS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const handleTimerCompleteRef = useRef(null);
  const timeLeftRef = useRef(timeLeft);

  const currentPreset = PRESETS[mode];
  const progress = 1 - (timeLeft / currentPreset.duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleTimerComplete = useCallback(() => {
    if (soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      } catch { /* ignore */ }
    }

    if (mode === 'focus') {
      setSessionsCompleted(s => s + 1);
      toast('Focus session complete! Time for a break', 'success');
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(PRESETS.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(PRESETS.shortBreak.duration);
      }
    } else {
      toast('Break over! Ready to focus?', 'info');
      setMode('focus');
      setTimeLeft(PRESETS.focus.duration);
    }
  }, [mode, sessionsCompleted, soundEnabled]);

  useEffect(() => { handleTimerCompleteRef.current = handleTimerComplete; }, [handleTimerComplete]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  useEffect(() => {
    if (isRunning && timeLeftRef.current > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerCompleteRef.current();
            return 0;
          }
          if (mode === 'focus') setTotalFocusTime(t => t + 1);
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode]);

  useEffect(() => {
    const prefix = isRunning ? '⏸' : '▶';
    document.title = isRunning || timeLeft < currentPreset.duration
      ? `${prefix} ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - Scroll.io`
      : 'Scroll.io - Smart Study Companion';
    return () => { document.title = 'Scroll.io - Smart Study Companion'; };
  }, [timeLeft, isRunning, minutes, seconds, currentPreset.duration]);

  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);
  const handleReset = useCallback(() => { setIsRunning(false); setTimeLeft(PRESETS[mode].duration); }, [mode]);
  const handleModeChange = useCallback((newMode) => { setIsRunning(false); setMode(newMode); setTimeLeft(PRESETS[newMode].duration); }, []);

  const formatTime = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  const formatTotalTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="tool-hero" style={{ gap: '24px' }}>
      {/* Mode selector */}
      <div className="pomodoro-mode-selector">
        {Object.entries(PRESETS).map(([key, preset]) => {
          const Icon = preset.icon;
          const isActive = mode === key;
          return (
            <button
              key={key}
              className="pomodoro-mode-btn"
              onClick={() => handleModeChange(key)}
              style={{
                background: isActive ? `${preset.color}20` : 'transparent',
                borderColor: isActive ? `${preset.color}40` : 'transparent',
                color: isActive ? preset.color : 'var(--text-muted)',
              }}
            >
              <Icon size={14} />
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Timer circle */}
      <div className="pomodoro-timer-ring">
        <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--bg-card)" strokeWidth="6" />
          <circle
            cx="110" cy="110" r={radius}
            fill="none" stroke={currentPreset.color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div className="pomodoro-time-display">
          <span className="pomodoro-time-value" style={{ color: 'var(--text-primary)' }}>
            {formatTime(timeLeft)}
          </span>
          <span className="pomodoro-time-label" style={{ color: currentPreset.color }}>
            {currentPreset.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="pomodoro-controls">
        <button className="pomodoro-ctrl-btn" onClick={handleReset} title="Reset">
          <RotateCcw size={18} />
        </button>
        <button
          className="pomodoro-play-btn"
          onClick={isRunning ? handlePause : handleStart}
          style={{ background: currentPreset.color, boxShadow: `0 4px 20px ${currentPreset.color}40` }}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
        </button>
        <button className="pomodoro-ctrl-btn" onClick={() => setSoundEnabled(s => !s)} title={soundEnabled ? 'Mute' : 'Unmute'}>
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Stats */}
      <div className="pomodoro-stats">
        <div className="pomodoro-stat">
          <div className="pomodoro-stat-value">{sessionsCompleted}</div>
          <div className="pomodoro-stat-label">Sessions</div>
        </div>
        <div className="pomodoro-divider" />
        <div className="pomodoro-stat">
          <div className="pomodoro-stat-value">{formatTotalTime(totalFocusTime)}</div>
          <div className="pomodoro-stat-label">Focus Time</div>
        </div>
        <div className="pomodoro-divider" />
        <div className="pomodoro-stat">
          <div className="pomodoro-stat-value">{sessionsCompleted * 25}m</div>
          <div className="pomodoro-stat-label">Total Pomodoros</div>
        </div>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Space: play/pause · R: reset
      </p>
    </div>
  );
}
