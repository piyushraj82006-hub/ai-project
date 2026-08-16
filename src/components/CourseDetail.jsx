import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getPYQs } from '../lib/db';
import { 
  ArrowLeft, BookOpen, PlayCircle, HelpCircle, 
  FileText, Clock, ExternalLink, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function CourseDetail() {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('syllabus');
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const [courseData, pyqData] = await Promise.all([
          getCourse(courseCode),
          getPYQs(courseCode)
        ]);
        setCourse(courseData);
        setPyqs(pyqData);
      } catch (err) {
        console.error("Failed to load course details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [courseCode]);

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="dashboard-loading"><span className="spinner"></span></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="dashboard-empty">
          <h2>Course not found</h2>
          <p>The course you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="dashboard-bg-glow" />
      
      <header className="course-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        
        <div className="course-header-info">
          <div className="course-code-badge">{course.code}</div>
          <h1>{course.name}</h1>
          <div className="course-meta-large">
            <span>{course.department}</span> • 
            <span>Semester {course.semester}</span> • 
            <span>{course.credits} Credits</span>
          </div>
          <p className="course-description">{course.description}</p>
        </div>
      </header>

      <div className="course-tabs">
        <button 
          className={`course-tab ${activeTab === 'syllabus' ? 'active' : ''}`}
          onClick={() => setActiveTab('syllabus')}
        >
          <BookOpen size={18} /> Syllabus
        </button>
        <button 
          className={`course-tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <PlayCircle size={18} /> Media & Links
        </button>
        <button 
          className={`course-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <HelpCircle size={18} /> Important Questions
        </button>
        <button 
          className={`course-tab ${activeTab === 'pyqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pyqs')}
        >
          <FileText size={18} /> Previous Year Papers
        </button>
      </div>

      <div className="course-content">
        {/* SYLLABUS TAB */}
        {activeTab === 'syllabus' && (
          <div className="syllabus-container">
            {course.modules?.map((mod, index) => (
              <div key={index} className="module-card">
                <div 
                  className="module-header"
                  onClick={() => setExpandedModule(expandedModule === index ? null : index)}
                >
                  <div className="module-title">
                    <span className="module-number">Module {index + 1}</span>
                    <h3>{mod.title}</h3>
                  </div>
                  <div className="module-actions">
                    <span className="module-hours"><Clock size={14} /> {mod.hours} hours</span>
                    {expandedModule === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {expandedModule === index && (
                  <div className="module-body animate-fadeIn">
                    <p>{mod.description}</p>
                    <div className="module-topics">
                      <h4>Topics:</h4>
                      <ul>
                        {mod.topics?.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="media-container">
            {course.youtubeLinks?.length > 0 ? (
              <div className="media-grid">
                {course.youtubeLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="media-card">
                    <div className="media-icon"><PlayCircle size={32} color="#FF0000" /></div>
                    <div className="media-info">
                      <h4>{link.title}</h4>
                      <span className="media-module">Module {link.moduleIndex + 1}</span>
                    </div>
                    <ExternalLink size={16} className="external-icon" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <p>No media links available for this course.</p>
              </div>
            )}
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="questions-container">
            {course.importantQuestions?.length > 0 ? (
              course.importantQuestions.map((q, idx) => (
                <div key={idx} className="question-card">
                  <div className="question-badge">Module {q.moduleIndex + 1}</div>
                  <h4>Q: {q.question}</h4>
                  <div className="answer-section">
                    <strong>A: </strong>
                    <p>{q.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">
                <p>No important questions available.</p>
              </div>
            )}
          </div>
        )}

        {/* PYQs TAB */}
        {activeTab === 'pyqs' && (
          <div className="pyq-container">
            {pyqs?.length > 0 ? (
              <div className="pyq-list">
                {pyqs.map((pyq, idx) => (
                  <div key={idx} className="pyq-card" onClick={() => navigate('/pdf', { state: { pyqUrl: pyq.url, title: `${course.code} ${pyq.year} ${pyq.examType}` } })}>
                    <FileText size={24} />
                    <div className="pyq-info">
                      <h4>{pyq.examType} - {pyq.year}</h4>
                      <span>Uploaded by {pyq.uploadedBy}</span>
                    </div>
                    <button className="btn-view">View & Summarize</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <FileText size={36} strokeWidth={1} />
                <p>No Previous Year Questions available for this course yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
