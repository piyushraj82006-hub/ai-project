import Header from '../components/Header';
import PomodoroTimer from '../components/PomodoroTimer';
import { ToastContainer } from '../components/Toast';
import { Timer, Zap, Coffee, Target } from 'lucide-react';

export default function PomodoroPage() {
  return (
    <div className="tool-page">
      <Header showNav />
      <ToastContainer />

      <main className="tool-main">
        <div className="tool-split">
          {/* Left — Info */}
          <div className="tool-split-left">
            <div className="tool-split-badge"><Timer size={14} /> Focus Tool</div>
            <h2 className="tool-split-headline">Pomodoro <span className="gradient-text">Timer</span></h2>
            <p className="tool-split-subtext">Stay focused with structured study sessions and timed breaks.</p>
            <ul className="tool-split-features">
              <li><Zap size={14} /> 25 / 50 minute focus sessions</li>
              <li><Coffee size={14} /> Short and long break modes</li>
              <li><Target size={14} /> Track completed sessions</li>
            </ul>
          </div>

          {/* Right — Timer */}
          <div className="tool-split-right">
            <PomodoroTimer />
          </div>
        </div>
      </main>
    </div>
  );
}
