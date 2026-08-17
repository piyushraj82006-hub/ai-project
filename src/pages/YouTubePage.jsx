import Header from '../components/Header';
import YouTubeSearch from '../components/YouTubeSearch';
import { ToastContainer } from '../components/Toast';

export default function YouTubePage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />
      <Header showNav />
      <ToastContainer />

      <main style={{
        paddingTop: '64px', minHeight: '100vh',
        maxWidth: '900px', margin: '0 auto',
      }}>
        <div style={{
          height: 'calc(100vh - 64px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <YouTubeSearch
            documentTitle=""
            keyConcepts={[]}
          />
        </div>
      </main>
    </div>
  );
}
