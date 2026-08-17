import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../lib/firebase';
import { getCoursesByIds, searchCourses, enrollCourse } from '../lib/db';
import courseData from '../../courseData.json';
import { 
  LogOut, User, Search, BookOpen, Sparkles, Settings,
  FileText, PenTool, Brain, ChevronRight, Calendar,
  HelpCircle, Video, Timer
} from 'lucide-react';
import CourseList from './CourseList';
import ProfileSettings from './ProfileSettings';
import Reveal from './Reveal';

const Hero3D = lazy(() => import('./Hero3D'));

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('my_courses');
  const [showSettings, setShowSettings] = useState(false);
  
  // Data states
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Explore filters — default to user's profile branch/semester
  const [exploreBranch, setExploreBranch] = useState('');
  const [exploreSemester, setExploreSemester] = useState('');

  // Sync filter defaults when userProfile loads
  useEffect(() => {
    if (userProfile?.department && !exploreBranch) setExploreBranch(userProfile.department);
    if (userProfile?.semester && !exploreSemester) setExploreSemester(String(userProfile.semester));
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
      // Update local state temporarily for fast feedback
      if (!user.enrolledCourses) user.enrolledCourses = [];
      if (!user.enrolledCourses.includes(courseCode)) {
         user.enrolledCourses.push(courseCode);
      }
      alert(`Successfully enrolled in ${courseCode}!`);
      // It will refresh on tab switch
    } catch (err) {
      console.error("Failed to enroll", err);
      alert("Failed to enroll. Please try again.");
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg-glow" />

      {/* Top Bar */}
      <header className="dashboard-topbar">
        <div className="dashboard-brand">
          <Sparkles size={22} strokeWidth={1.5} />
          <span>VIT Course Portal</span>
        </div>
        
        <div className="dashboard-user">
          {user ? (
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
          )}
        </div>
      </header>

      {/* Welcome Area */}
      <div className="dashboard-header-content">
        <Reveal>
          <div className="hero-pill">
            <Sparkles size={14} strokeWidth={2} />
            AI-Powered Study Companion
          </div>
          <h1>Welcome, <span className="gradient-text">{user ? displayName : 'Guest'}</span></h1>
          <p>Access your course materials, previous year questions, and AI summaries.</p>
        </Reveal>

        <Reveal delay={140}>
          <div className="hero3d-wrap">
            <Suspense fallback={
              <div className="hero3d-fallback"><span className="hero3d-ring" /></div>
            }>
              <Hero3D />
            </Suspense>
          </div>
        </Reveal>
        
        {user ? (
          (!user?.college || !user?.department || !user?.semester) && (
            <div className="profile-alert" onClick={() => setShowSettings(true)}>
              Please complete your profile settings to get personalized course recommendations.
              <ChevronRight size={16} />
            </div>
          )
        ) : (
          <div className="profile-alert" onClick={() => navigate('/login')}>
            Sign in to personalize your courses and track deadlines.
            <ChevronRight size={16} />
          </div>
        )}
      </div>
      
      {/* Quick Tools */}
      <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', maxWidth: '1100px', margin: '0 auto 40px', gap: '16px' }}>
        <Reveal delay={0}>
          <div className="dash-card dash-card-pdf" onClick={() => navigate('/pdf')}>
            <div className="dash-card-icon"><FileText size={24} /></div>
            <h3>PDF Summarizer</h3>
            <p>AI-powered document analysis</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="dash-card dash-card-text" onClick={() => navigate('/summarize')}>
            <div className="dash-card-icon"><PenTool size={24} /></div>
            <h3>Text Summarizer</h3>
            <p>Paste text for quick notes</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="dash-card dash-card-mind" onClick={() => navigate('/tools/quiz')}>
            <div className="dash-card-icon"><HelpCircle size={24} /></div>
            <h3>Quiz Generator</h3>
            <p>Auto MCQs from any document</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="dash-card" onClick={() => navigate('/tools/flashcards')} style={{ '--card-accent': '#F472B6' }}>
            <div className="dash-card-icon" style={{ background: 'rgba(244, 114, 182, 0.1)', border: '1px solid rgba(244, 114, 182, 0.2)' }}>
              <Brain size={24} color="#F472B6" />
            </div>
            <h3>Flashcards</h3>
            <p>Flip-card study mode</p>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <div className="dash-card" onClick={() => navigate('/tools/youtube')} style={{ '--card-accent': '#FF0000' }}>
            <div className="dash-card-icon" style={{ background: 'rgba(255, 0, 0, 0.08)', border: '1px solid rgba(255, 0, 0, 0.15)' }}>
              <Video size={24} color="#FF0000" />
            </div>
            <h3>Video Search</h3>
            <p>Find educational tutorials</p>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="dash-card" onClick={() => navigate('/tools/pomodoro')} style={{ '--card-accent': '#4ADE80' }}>
            <div className="dash-card-icon" style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
              <Timer size={24} color="#4ADE80" />
            </div>
            <h3>Pomodoro Timer</h3>
            <p>Focus sessions & breaks</p>
          </div>
        </Reveal>
        <Reveal delay={360}>
          <div className="dash-card dash-card-mind" onClick={() => navigate('/calendar')}>
            <div className="dash-card-icon"><Calendar size={24} /></div>
            <h3>Academic Calendar</h3>
            <p>Track deadlines & exams</p>
          </div>
        </Reveal>
      </div>

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
                <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
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
