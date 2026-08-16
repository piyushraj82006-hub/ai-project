import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../lib/firebase';
import { getCoursesByIds, searchCourses, enrollCourse } from '../lib/db';
import { 
  LogOut, User, Search, BookOpen, Sparkles, Settings,
  FileText, PenTool, Brain, ChevronRight, Calendar
} from 'lucide-react';
import CourseList from './CourseList';
import ProfileSettings from './ProfileSettings';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('my_courses');
  const [showSettings, setShowSettings] = useState(false);
  
  // Data states
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
          const courses = await searchCourses(searchTerm, { 
            department: user?.department || null 
          });
          setExploreCourses(courses);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, activeTab, searchTerm]);

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
        <h1>Welcome, <span className="gradient-text">{user ? displayName : 'Guest'}</span></h1>
        <p>Access your course materials, previous year questions, and AI summaries.</p>
        
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
      <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '900px', margin: '0 auto 40px' }}>
        <div className="dash-card dash-card-pdf" onClick={() => navigate('/pdf')}>
          <div className="dash-card-icon"><FileText size={24} /></div>
          <h3>PDF Summarizer</h3>
          <p>Extract and summarize any PDF</p>
        </div>
        <div className="dash-card dash-card-text" onClick={() => navigate('/summarize')}>
          <div className="dash-card-icon"><PenTool size={24} /></div>
          <h3>Text Summarizer</h3>
          <p>Paste text for quick notes</p>
        </div>
        <div className="dash-card dash-card-mind" onClick={() => navigate('/calendar')}>
          <div className="dash-card-icon"><Calendar size={24} /></div>
          <h3>Academic Calendar</h3>
          <p>Track deadlines & exams</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main">
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
          <div className="search-bar-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search courses by name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}

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
            />
          )}
        </div>
      </div>

      {showSettings && (
        <ProfileSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
