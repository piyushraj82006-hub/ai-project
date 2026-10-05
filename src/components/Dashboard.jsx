import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../lib/firebase';
import { getCoursesByIds, enrollCourse } from '../lib/db';
import courseData from '../../courseData.json';
import { 
  LogOut, User, Search, BookOpen, Sparkles, Settings,
  FileText, PenTool, Brain, ChevronRight, Calendar,
  HelpCircle, Video, Timer, Layers, Zap, GraduationCap, Hash
} from 'lucide-react';
import TopNav from './TopNav';
import CourseList from './CourseList';
import ProfileSettings from './ProfileSettings';
import Reveal from './Reveal';
import { getSummaries } from '../lib/storage';


/* ── Skeleton Helpers ───────────────────────── */
function Skel({ className = '', style = {} }) {
  return <div className={`skel ${className}`} style={style} />;
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page skeleton-page" style={{ background: 'var(--bg-hero)' }}>
      {/* Fake topnav */}
      <div className="topnav">
        <div className="topnav-left">
          <Skel className="skel-circle" style={{ width: 34, height: 34 }} />
          <Skel className="skel-text" style={{ width: 140, height: 15 }} />
        </div>
        <div className="topnav-right">
          <Skel className="skel-circle" style={{ width: 34, height: 34 }} />
          <Skel className="skel-circle" style={{ width: 32, height: 32 }} />
          <Skel className="skel-text" style={{ width: 70, height: 13 }} />
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="hero-split">
        <div className="hero-left">
          <Skel className="skel-pill" style={{ width: 100, height: 26 }} />
          <Skel className="skel-text" style={{ width: 280, height: 52 }} />
          <Skel className="skel-text" style={{ width: 320, height: 16, marginTop: 4 }} />
          <Skel className="skel-text" style={{ width: 200, height: 16 }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <Skel className="skel-pill" style={{ width: 130, height: 40 }} />
            <Skel className="skel-pill" style={{ width: 140, height: 40 }} />
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-services-header">
            <Skel className="skel-text" style={{ width: 80, height: 13 }} />
            <Skel className="skel-pill" style={{ width: 52, height: 22 }} />
          </div>
          <div className="hero-services-grid">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="hero-service-card" style={{ pointerEvents: 'none' }}>
                <Skel className="skel-text" style={{ width: 22, height: 14 }} />
                <Skel className="skel-icon" style={{ width: 44, height: 44 }} />
                <div className="svc-body" style={{ flex: 1 }}>
                  <Skel className="skel-text" style={{ width: `${120 + (i % 3) * 20}px`, height: 14, marginBottom: 6 }} />
                  <Skel className="skel-text" style={{ width: `${160 + (i % 4) * 15}px`, height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="stats-section">
        <div className="stats-header">
          <Skel className="skel-text" style={{ width: 160, height: 20 }} />
          <Skel className="skel-text" style={{ width: 180, height: 14 }} />
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card" style={{ pointerEvents: 'none' }}>
              <Skel className="skel-icon" style={{ width: 42, height: 42 }} />
              <div className="stat-info">
                <Skel className="skel-text" style={{ width: 50, height: 22 }} />
                <Skel className="skel-text" style={{ width: 65, height: 11 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="quick-access" style={{ pointerEvents: 'none' }}>
          <Skel className="skel-text" style={{ width: 110, height: 13, marginBottom: 14 }} />
          <div className="quick-access-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="quick-card">
                <Skel className="skel-icon" style={{ width: 28, height: 28 }} />
                <Skel className="skel-text" style={{ width: 70, height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento skeleton */}
      <section className="bento-section">
        {[...Array(7)].map((_, i) => (
          <div key={i} className={`bento-card ${i < 2 ? 'bento-card-tall' : i === 6 ? 'bento-card-wide' : ''}`} style={{ pointerEvents: 'none' }}>
            <Skel className="skel-icon" style={{ width: 44, height: 44 }} />
            <Skel className="skel-text" style={{ width: `${100 + (i % 3) * 30}px`, height: 16 }} />
            <Skel className="skel-text" style={{ width: '100%', height: 12 }} />
            {i < 2 && <Skel className="skel-text" style={{ width: '80%', height: 12 }} />}
          </div>
        ))}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const { user, userProfile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('my_courses');
  const [showSettings, setShowSettings] = useState(false);
  const heroRef = useRef(null);
  const rafRef = useRef(null);

  // Parallax scroll handler — moves background layers at different speeds
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const layers = hero.querySelectorAll('[data-parallax-speed]');
    if (!layers.length) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          const scrolled = -rect.top;
          // Only animate while hero is near viewport
          if (rect.bottom < -200 || rect.top > window.innerHeight + 200) {
            ticking = false;
            return;
          }
          layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.parallaxSpeed) || 0.3;
            const yOffset = scrolled * speed;
            layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
          });
          ticking = false;
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  // Data states
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      const items = getSummaries(user.uid);
      setHistory(items);
    } else {
      setHistory([]);
    }
  }, [user]);


  // Explore filters - default to user's profile branch/semester
  const [exploreBranch, setExploreBranch] = useState('');
  const [exploreSemester, setExploreSemester] = useState('');

  // Refs must come after the states they mirror to avoid TDZ errors
  const initializedRef = useRef(false);
  const exploreBranchRef = useRef(exploreBranch);
  const exploreSemesterRef = useRef(exploreSemester);

  // Sync filter defaults when userProfile loads (only once)
  useEffect(() => {
    if (initializedRef.current) return;
    if (userProfile?.department && !exploreBranchRef.current) {
      setExploreBranch(userProfile.department);
      exploreBranchRef.current = userProfile.department;
    }
    if (userProfile?.semester && !exploreSemesterRef.current) {
      setExploreSemester(String(userProfile.semester));
      exploreSemesterRef.current = String(userProfile.semester);
    }
    initializedRef.current = true;
  }, [userProfile]);

  // Fetch courses
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (activeTab === 'my_courses') {
          if (user?.enrolledCourses?.length > 0) {
            const courses = await getCoursesByIds(user.enrolledCourses);
            setMyCourses(courses);
          } else {
            setMyCourses([]);
          }
        } else if (activeTab === 'explore') {
          // Filter locally from courseData.json by branch + semester
          let filtered = courseData.courses;
          if (exploreBranch) filtered = filtered.filter(c => c.department === exploreBranch);
          if (exploreSemester) filtered = filtered.filter(c => String(c.semester) === exploreSemester);
          // Also apply text search if any
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
              c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
            );
          }
          setExploreCourses(filtered);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, activeTab, searchTerm, exploreBranch, exploreSemester]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleEnroll = async (courseCode) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await enrollCourse(user.uid, courseCode);
      await refreshProfile();
      alert(`Successfully enrolled in ${courseCode}!`);
    } catch (err) {
      console.error("Failed to enroll", err);
      alert("Failed to enroll. Please try again.");
    }
  };

  const handleLoadHistory = (item) => {
    navigate('/pdf', {
      state: {
        loadSummary: item.summary,
        loadReels: item.reels,
        id: item.id,
        quiz: item.quiz,
        flashcards: item.flashcards
      }
    });
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';


  if (authLoading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page" style={{ background: 'var(--bg-hero)' }}>
      <TopNav
        variant="dashboard"
        title="VIT Course Portal"
        right={
          user ? (
            <>
              <button className="icon-btn" onClick={() => setShowSettings(true)} title="Profile Settings">
                <Settings size={18} />
              </button>
              <div className="dashboard-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" />
                ) : (
                  <User size={18} />
                )}
              </div>
              <span className="dashboard-username">{displayName}</span>
              <button className="dashboard-logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <button className="btn-view" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => navigate('/login')}>
              Sign In
            </button>
          )
        }
      />

      {/* Hero — Split Layout */}
      <section className="hero-split" ref={heroRef}>
        {/* Parallax background layers */}
        <div className="parallax-layer parallax-orb parallax-orb-1" data-parallax-speed="0.15" aria-hidden="true" />
        <div className="parallax-layer parallax-orb parallax-orb-2" data-parallax-speed="0.25" aria-hidden="true" />
        <div className="parallax-layer parallax-orb parallax-orb-3" data-parallax-speed="0.1" aria-hidden="true" />
        <div className="parallax-layer parallax-grid" data-parallax-speed="0.05" aria-hidden="true" />
        <div className="parallax-layer parallax-noise" data-parallax-speed="0.08" aria-hidden="true" />
        {/* Left: Branding */}
        <Reveal>
          <div className="hero-left">
            <div className="hero-brand-badge">
              <Sparkles size={14} /> AI-Powered
            </div>
            <h1 className="hero-headline hero-headline-left hero-logo-animated">
              <span className="logo-scroll">Scroll</span><span className="logo-dot-io gradient-text">.io</span>
              <span className="logo-cursor" aria-hidden="true" />
            </h1>
            <p className="hero-subtext hero-subtext-left">
              Your AI-powered study companion for VIT students.
              Courses, summaries, flashcards, and more — all in one place.
            </p>
            <div className="hero-actions hero-actions-left">
              {user ? (
                <button className="btn-primary" onClick={() => document.querySelector('.dashboard-main')?.scrollIntoView({ behavior: 'smooth' })}>
                  <BookOpen size={16} /> My Courses
                </button>
              ) : (
                <button className="btn-primary" onClick={() => navigate('/login')}>
                  <Sparkles size={16} /> Get Started
                </button>
              )}
              <button className="btn-ghost" onClick={() => document.querySelector('.bento-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Tools <ChevronRight size={16} />
              </button>
            </div>
            
            {user && history.length > 0 && (
              <div className="history-board">
                <div className="history-board-header">
                  <h3><FileText size={16} /> Recent History</h3>
                  <span className="history-count">{history.length} items</span>
                </div>
                <div className="history-list">
                  {history.slice(0, 3).map(item => (
                    <div key={item.id} className="history-item" onClick={() => handleLoadHistory(item)}>
                      <div className="history-item-icon">
                        <FileText size={14} />
                      </div>
                      <div className="history-item-details">
                        <span className="history-item-title">{item.title}</span>
                        <span className="history-item-date">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="history-item-badges">
                        {item.summary && <span className="badge-svc summary">Summary</span>}
                        {item.quiz?.length > 0 && <span className="badge-svc quiz">Quiz</span>}
                        {item.flashcards?.length > 0 && <span className="badge-svc flashcards">Cards</span>}
                      </div>
                      <ChevronRight size={14} className="history-item-arrow" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && (!user?.college || !user?.department || !user?.semester) && (
              <div className="profile-alert" onClick={() => setShowSettings(true)}>
                Complete your profile for personalized recommendations.
                <ChevronRight size={16} />
              </div>
            )}
          </div>
        </Reveal>

        {/* Right: Services */}
        <div className="hero-right">
          <Reveal delay={60}>
            <div className="hero-services-header">
              <h2 className="hero-services-title">Services</h2>
              <span className="hero-services-count">7 tools</span>
            </div>
          </Reveal>
          <div className="hero-services-grid">
            <Reveal delay={80}>
              <div className="hero-service-card" onClick={() => navigate('/pdf')}>
                <div className="svc-glow" />
                <span className="svc-index">01</span>
                <div className="svc-icon"><FileText size={22} /></div>
                <div className="svc-body">
                  <h4>PDF Summarizer</h4>
                  <p>Upload any document for AI-powered analysis and structured notes.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="hero-service-card" onClick={() => navigate('/tools/quiz')}>
                <div className="svc-glow" />
                <span className="svc-index">02</span>
                <div className="svc-icon"><HelpCircle size={22} /></div>
                <div className="svc-body">
                  <h4>Quiz Generator</h4>
                  <p>Auto-generate MCQs from your study materials.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="hero-service-card" onClick={() => navigate('/summarize')}>
                <div className="svc-glow" />
                <span className="svc-index">03</span>
                <div className="svc-icon"><PenTool size={22} /></div>
                <div className="svc-body">
                  <h4>Text Summarizer</h4>
                  <p>Paste any text for quick, intelligent notes.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="hero-service-card" onClick={() => navigate('/tools/flashcards')}>
                <div className="svc-glow" />
                <span className="svc-index">04</span>
                <div className="svc-icon"><Brain size={22} /></div>
                <div className="svc-body">
                  <h4>Flashcards</h4>
                  <p>Flip-card study mode for fast recall.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="hero-service-card" onClick={() => navigate('/calendar')}>
                <div className="svc-glow" />
                <span className="svc-index">05</span>
                <div className="svc-icon"><Calendar size={22} /></div>
                <div className="svc-body">
                  <h4>Academic Calendar</h4>
                  <p>Track deadlines, exams & semester events.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={280}>
              <div className="hero-service-card" onClick={() => navigate('/tools/youtube')}>
                <div className="svc-glow" />
                <span className="svc-index">06</span>
                <div className="svc-icon"><Video size={22} /></div>
                <div className="svc-body">
                  <h4>Video Search</h4>
                  <p>Find the best educational tutorials online.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
            <Reveal delay={310}>
              <div className="hero-service-card" onClick={() => navigate('/tools/pomodoro')}>
                <div className="svc-glow" />
                <span className="svc-index">07</span>
                <div className="svc-icon"><Timer size={22} /></div>
                <div className="svc-body">
                  <h4>Pomodoro Timer</h4>
                  <p>Structured focus sessions with timed breaks.</p>
                </div>
                <ChevronRight size={16} className="svc-arrow" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats + Quick Access (logged-in only) */}
      {user && (
      <section className="stats-section">
        <Reveal delay={0}>
          <div className="stats-header">
            <h2 className="stats-title">Your Dashboard</h2>
            <span className="stats-greeting">Welcome back, <span className="gradient-text">{displayName}</span></span>
          </div>
        </Reveal>

        <div className="stats-grid">
          <Reveal delay={40}>
            <div className="stat-card stat-card-accent">
              <div className="stat-icon"><Layers size={20} /></div>
              <div className="stat-info">
                <span className="stat-value">{user?.enrolledCourses?.length || 0}</span>
                <span className="stat-label">Enrolled</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="stat-card">
              <div className="stat-icon"><BookOpen size={20} /></div>
              <div className="stat-info">
                <span className="stat-value">{courseData.courses.length}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="stat-card">
              <div className="stat-icon"><GraduationCap size={20} /></div>
              <div className="stat-info">
                <span className="stat-value">{userProfile?.department || '—'}</span>
                <span className="stat-label">Branch</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="stat-card">
              <div className="stat-icon"><Hash size={20} /></div>
              <div className="stat-info">
                <span className="stat-value">{userProfile?.semester ? `Sem ${userProfile.semester}` : '—'}</span>
                <span className="stat-label">Semester</span>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="quick-access">
            <h3 className="quick-access-title"><Zap size={14} /> Quick Access</h3>
            <div className="quick-access-grid">
              <button className="quick-card" onClick={() => navigate('/pdf')}>
                <FileText size={18} />
                <span>Summarize PDF</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/tools/quiz')}>
                <HelpCircle size={18} />
                <span>Generate Quiz</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/tools/flashcards')}>
                <Brain size={18} />
                <span>Flashcards</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/tools/pomodoro')}>
                <Timer size={18} />
                <span>Focus Timer</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/summarize')}>
                <PenTool size={18} />
                <span>Text Notes</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/tools/youtube')}>
                <Video size={18} />
                <span>Video Search</span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>
      )}

      {/* Tools Bento Grid (kept for logged-in users below) */}
      {user && (
      <section className="bento-section">
        <Reveal delay={0}>
          <div className="bento-card bento-card-tall" onClick={() => navigate('/pdf')}>
            <div className="bento-icon"><FileText size={24} /></div>
            <h3>PDF Summarizer</h3>
            <p>Upload any document for AI-powered analysis and structured notes.</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="bento-card bento-card-tall" onClick={() => navigate('/tools/quiz')}>
            <div className="bento-icon"><HelpCircle size={24} /></div>
            <h3>Quiz Generator</h3>
            <p>Auto-generate MCQs from your study materials.</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="bento-card" onClick={() => navigate('/summarize')}>
            <div className="bento-icon"><PenTool size={24} /></div>
            <h3>Text Summarizer</h3>
            <p>Paste text for quick notes</p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="bento-card" onClick={() => navigate('/tools/flashcards')}>
            <div className="bento-icon"><Brain size={24} /></div>
            <h3>Flashcards</h3>
            <p>Flip-card study mode</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="bento-card" onClick={() => navigate('/calendar')}>
            <div className="bento-icon"><Calendar size={24} /></div>
            <h3>Academic Calendar</h3>
            <p>Track deadlines & exams</p>
          </div>
        </Reveal>
        <Reveal delay={210}>
          <div className="bento-card" onClick={() => navigate('/tools/youtube')}>
            <div className="bento-icon"><Video size={24} /></div>
            <h3>Video Search</h3>
            <p>Find educational tutorials</p>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <div className="bento-card bento-card-wide" onClick={() => navigate('/tools/pomodoro')}>
            <div className="bento-icon"><Timer size={24} /></div>
            <div>
              <h3>Pomodoro Timer</h3>
              <p>Focus sessions & breaks</p>
            </div>
          </div>
        </Reveal>
      </section>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
        <Reveal delay={100}>
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'my_courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_courses')}
          >
            <BookOpen size={16} /> My Courses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Search size={16} /> Explore Courses
          </button>
        </div>

        {activeTab === 'explore' && (
          <div className="explore-filters">
            {/* Branch selector */}
            <select
              className="explore-filter-select"
              value={exploreBranch}
              onChange={e => { setExploreBranch(e.target.value); setExploreSemester(''); }}
            >
              <option value="">All Branches</option>
              {courseData.branches.map(b => (
                <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
              ))}
            </select>

            {/* Semester selector */}
            <select
              className="explore-filter-select"
              value={exploreSemester}
              onChange={e => setExploreSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>

            {/* Search */}
            <div className="search-bar-container" style={{ flex: 1 }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        )}

        </Reveal>
        <Reveal delay={160}>
        <div className="courses-container">
          {activeTab === 'my_courses' && !user ? (
            <div className="dashboard-empty" style={{ padding: '48px 24px' }}>
              <BookOpen size={36} strokeWidth={1} />
              <p style={{ marginTop: '12px' }}>Sign in to view your enrolled courses and personalized schedule.</p>
              <button 
                className="btn-enroll" 
                style={{ maxWidth: '200px', margin: '20px auto 0' }} 
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div className="dashboard-loading">
              <span className="spinner"></span>
            </div>
          ) : (
            <CourseList 
              courses={activeTab === 'my_courses' ? myCourses : exploreCourses}
              enrolledCourseIds={user?.enrolledCourses || []}
              onEnroll={handleEnroll}
              exploreBranch={activeTab === 'explore' ? exploreBranch : undefined}
              exploreSemester={activeTab === 'explore' ? exploreSemester : undefined}
            />
          )}
        </div>
        </Reveal>
      </div>

      {showSettings && (
        <ProfileSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
