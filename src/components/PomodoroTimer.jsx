import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Timer, Volume2, VolumeX } from 'lucide-react';
import { toast } from '../lib/toast';

const PRESETS = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#6C63FF', icon: BookOpen },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#4ADE80', icon: Coffee },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: '#38BDF8', icon: Coffee },
};

const SOUND_URLS = {
  tick: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(PRESETS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const currentPreset = PRESETS[mode];
  const progress = 1 - (timeLeft / currentPreset.duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          if (mode === 'focus') {
            setTotalFocusTime(t => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  // Update document title
  useEffect(() => {
    const prefix = isRunning ? '⏸' : '▶';
    document.title = isRunning || timeLeft < currentPreset.duration
      ? `${prefix} ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} — Scroll.io`
      : 'Scroll.io — Smart Study Companion';
    return () => { document.title = 'Scroll.io — Smart Study Companion'; };
  }, [timeLeft, isRunning, minutes, seconds, currentPreset.duration]);

  const handleTimerComplete = useCallback(() => {
    if (soundEnabled) {
      // Play a simple beep using Web Audio API
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
      } catch (e) { /* ignore */ }
    }

    if (mode === 'focus') {
      setSessionsCompleted(s => s + 1);
      toast('Focus session complete! Time for a break 🎉', 'success');
      // Auto-switch to break
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(PRESETS.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(PRESETS.shortBreak.duration);
      }
    } else {
      toast('Break over! Ready to focus? 💪', 'info');
      setMode('focus');
      setTimeLeft(PRESETS.focus.duration);
    }
  }, [mode, sessionsCompleted, soundEnabled]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(PRESETS[mode].duration);
  }, [mode]);

  const handleModeChange = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(PRESETS[newMode].duration);
  }, []);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // SVG circle params
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', gap: '24px',
      background: 'var(--bg-primary)',
    }}>
      {/* Mode selector */}
      <div style={{
        display: 'flex', gap: '4px', padding: '4px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      }}>
        {Object.entries(PRESETS).map(([key, preset]) => {
          const Icon = preset.icon;
          return (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                background: mode === key ? `${preset.color}20` : 'transparent',
                border: mode === key ? `1px solid ${preset.color}40` : '1px solid transparent',
                color: mode === key ? preset.color : 'var(--text-muted)',
                fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'var(--transition-fast)',
              }}
            >
              <Icon size={14} />
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Timer circle */}
      <div style={{ position: 'relative', width: '220px', height: '220px' }}>
        <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none"
            stroke="var(--bg-card)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none"
            stroke={currentPreset.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          {/* Glow effect */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none"
            stroke={currentPreset.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              filter: `drop-shadow(0 0 8px ${currentPreset.color}60)`,
              opacity: 0.6,
            }}
          />
        </svg>

        {/* Time display */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '42px',
            fontWeight: 800, color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{
            fontSize: '12px', color: currentPreset.color,
            fontWeight: 600, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {currentPreset.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={handleReset}
          title="Reset"
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={isRunning ? handlePause : handleStart}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: currentPreset.color,
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
            boxShadow: `0 4px 20px ${currentPreset.color}40`,
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
        </button>

        <button
          onClick={() => setSoundEnabled(s => !s)}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '24px', padding: '16px 24px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {sessionsCompleted}
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Sessions
          </div>
        </div>
        <div style={{
          width: '1px', background: 'var(--border-color)',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {formatTotalTime(totalFocusTime)}
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Focus Time
          </div>
        </div>
        <div style={{
          width: '1px', background: 'var(--border-color)',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {sessionsCompleted * 25}m
          </div>
          <div style={{
            fontSize: '10px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Total Pomodoros
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <p style={{
        fontSize: '10px', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        Space: play/pause · R: reset
      </p>
    </div>
  );
}
