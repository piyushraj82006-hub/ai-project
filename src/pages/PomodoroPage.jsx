import Header from '../components/Header';
import PomodoroTimer from '../components/PomodoroTimer';
import { ToastContainer } from '../components/Toast';

export default function PomodoroPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />
      <Header showNav />
      <ToastContainer />

      <main style={{
        paddingTop: '64px', minHeight: '100vh',
        maxWidth: '600px', margin: '0 auto',
      }}>
        <div style={{
          height: 'calc(100vh - 64px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <PomodoroTimer />
        </div>
      </main>
    </div>
  );
}
