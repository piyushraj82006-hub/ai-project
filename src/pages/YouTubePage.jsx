import Header from '../components/Header';
import YouTubeSearch from '../components/YouTubeSearch';
import { ToastContainer } from '../components/Toast';
import { Video, Search, PlayCircle, GraduationCap } from 'lucide-react';

export default function YouTubePage() {
  return (
    <div className="tool-page">
      <Header showNav />
      <ToastContainer />

      <main className="tool-main">
        <div className="tool-split">
          {/* Left — Info */}
          <div className="tool-split-left">
            <div className="tool-split-badge"><Video size={14} /> Discovery</div>
            <h2 className="tool-split-headline">Video <span className="gradient-text">Search</span></h2>
            <p className="tool-split-subtext">Find the best educational tutorials and lectures online.</p>
            <ul className="tool-split-features">
              <li><Search size={14} /> Search by topic or concept</li>
              <li><PlayCircle size={14} /> Curated tutorial results</li>
              <li><GraduationCap size={14} /> VIT curriculum aligned</li>
            </ul>
          </div>

          {/* Right — Search */}
          <div className="tool-split-right">
            <YouTubeSearch documentTitle="" keyConcepts={[]} />
          </div>
        </div>
      </main>
    </div>
  );
}
