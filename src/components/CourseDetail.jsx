import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import courseData from '../../courseData.json';
import {
  ArrowLeft, BookOpen, PlayCircle, HelpCircle,
  Clock, ExternalLink, ChevronDown, ChevronUp,
  Youtube, Lightbulb, CheckCircle2
} from 'lucide-react';

export default function CourseDetail() {
  const { courseCode } = useParams();
  const navigate = useNavigate();

  // Load course directly from local JSON — no API, no Firestore
  const course = courseData.courses.find(c => c.code === courseCode) || null;

  const [activeTab, setActiveTab] = useState('syllabus');
  const [expandedModule, setExpandedModule] = useState(null);
  // Per-module state: show Q&A or YouTube inline
  const [moduleView, setModuleView] = useState({}); // { [index]: 'qa' | 'yt' | null }

  const toggleModuleView = (index, view) => {
    setModuleView(prev => ({
      ...prev,
      [index]: prev[index] === view ? null : view,
    }));
  };

  if (!course) {
    return (
      <div className="course-detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="dashboard-empty" style={{ marginTop: '60px' }}>
          <BookOpen size={48} strokeWidth={1} />
          <h2>Course not found</h2>
          <p>No data found for <strong>{courseCode}</strong>. Add it to courseData.json to get started.</p>
        </div>
      </div>
    );
  }

  // Group YouTube links by moduleIndex for fast lookup
  const ytByModule = {};
  course.youtubeLinks?.forEach(link => {
    if (!ytByModule[link.moduleIndex]) ytByModule[link.moduleIndex] = [];
    ytByModule[link.moduleIndex].push(link);
  });

  // Group importantQuestions by moduleIndex
  const qByModule = {};
  course.importantQuestions?.forEach(q => {
    if (!qByModule[q.moduleIndex]) qByModule[q.moduleIndex] = [];
    qByModule[q.moduleIndex].push(q);
  });

  return (
    <div className="course-detail-page">
      <div className="dashboard-bg-glow" />

      {/* Header */}
      <header className="course-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="course-header-info">
          <div className="course-code-badge">{course.code}</div>
          <h1>{course.name}</h1>
          <div className="course-meta-large">
            <span>{course.department}</span> •&nbsp;
            <span>Semester {course.semester}</span> •&nbsp;
            <span>{course.credits} Credits</span>
          </div>
          <p className="course-description">{course.description}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="course-tabs">
        <button
          className={`course-tab ${activeTab === 'syllabus' ? 'active' : ''}`}
          onClick={() => setActiveTab('syllabus')}
        >
          <BookOpen size={16} /> Syllabus
        </button>
        <button
          className={`course-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <HelpCircle size={16} /> Important Questions
        </button>
        <button
          className={`course-tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <PlayCircle size={16} /> All Videos
        </button>
      </div>

      {/* Content */}
      <div className="course-content">

        {/* ── SYLLABUS TAB ── */}
        {activeTab === 'syllabus' && (
          <div className="syllabus-container">
            {course.modules?.length > 0 ? course.modules.map((mod, index) => {
              const hasYt = (ytByModule[index]?.length ?? 0) > 0;
              const hasQa = (qByModule[index]?.length ?? 0) > 0;
              const isOpen = expandedModule === index;

              return (
                <div key={index} className="module-card">
                  {/* Module Header */}
                  <div
                    className="module-header"
                    onClick={() => {
                      setExpandedModule(isOpen ? null : index);
                      // Reset inline view when collapsing
                      if (isOpen) setModuleView(prev => ({ ...prev, [index]: null }));
                    }}
                  >
                    <div className="module-title">
                      <span className="module-number">Module {index + 1}</span>
                      <h3>{mod.title}</h3>
                    </div>
                    <div className="module-actions">
                      <span className="module-hours"><Clock size={13} /> {mod.hours}h</span>
                      {hasYt && <span className="module-badge yt-badge"><Youtube size={12} /> {ytByModule[index].length}</span>}
                      {hasQa && <span className="module-badge qa-badge"><HelpCircle size={12} /> {qByModule[index].length} Q</span>}
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Module Body */}
                  {isOpen && (
                    <div className="module-body animate-fadeIn">
                      <p className="module-desc">{mod.description}</p>

                      {/* Topics */}
                      <div className="module-topics">
                        <h4>📌 Key Topics</h4>
                        <ul>
                          {mod.topics?.map((topic, i) => (
                            <li key={i}><CheckCircle2 size={13} className="topic-check" />{topic}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="module-action-btns">
                        {hasQa && (
                          <button
                            className={`mod-action-btn qa-btn ${moduleView[index] === 'qa' ? 'active' : ''}`}
                            onClick={() => toggleModuleView(index, 'qa')}
                          >
                            <Lightbulb size={15} />
                            {moduleView[index] === 'qa' ? 'Hide Questions' : 'Important Questions'}
                          </button>
                        )}
                        {hasYt && (
                          <button
                            className={`mod-action-btn yt-btn ${moduleView[index] === 'yt' ? 'active' : ''}`}
                            onClick={() => toggleModuleView(index, 'yt')}
                          >
                            <Youtube size={15} />
                            {moduleView[index] === 'yt' ? 'Hide Videos' : `Watch Videos (${ytByModule[index].length})`}
                          </button>
                        )}
                      </div>

                      {/* Inline Q&A */}
                      {moduleView[index] === 'qa' && (
                        <div className="inline-qa animate-fadeIn">
                          {qByModule[index].map((q, qi) => (
                            <div key={qi} className="inline-question">
                              <p className="iq-q">Q{qi + 1}: {q.question}</p>
                              <p className="iq-a"><span>A:</span> {q.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline YouTube */}
                      {moduleView[index] === 'yt' && (
                        <div className="inline-yt animate-fadeIn">
                          {ytByModule[index].map((link, li) => (
                            <a
                              key={li}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-yt-link"
                            >
                              <Youtube size={18} color="#FF0000" />
                              <span>{link.title}</span>
                              <ExternalLink size={14} className="ext-icon" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="dashboard-empty">
                <BookOpen size={36} strokeWidth={1} />
                <p>Syllabus modules not added yet for this course.</p>
              </div>
            )}
          </div>
        )}

        {/* ── IMPORTANT QUESTIONS TAB (all modules) ── */}
        {activeTab === 'questions' && (
          <div className="questions-container">
            {course.importantQuestions?.length > 0 ? (
              <>
                <p className="section-note">
                  <Lightbulb size={14} /> Pre-curated important questions with answers for exam preparation.
                </p>
                {course.modules?.map((mod, modIdx) => {
                  const qs = qByModule[modIdx] || [];
                  if (qs.length === 0) return null;
                  return (
                    <div key={modIdx} className="q-module-section">
                      <div className="q-module-label">
                        <span className="module-number">Module {modIdx + 1}</span>
                        <span>{mod.title}</span>
                      </div>
                      {qs.map((q, qi) => (
                        <div key={qi} className="question-card">
                          <p className="iq-q">Q{qi + 1}: {q.question}</p>
                          <p className="iq-a"><span>A:</span> {q.answer}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="dashboard-empty">
                <HelpCircle size={36} strokeWidth={1} />
                <p>No important questions added yet for this course.</p>
                <p style={{ fontSize: '12px', opacity: 0.5 }}>Add them to courseData.json under "importantQuestions".</p>
              </div>
            )}
          </div>
        )}

        {/* ── ALL VIDEOS TAB ── */}
        {activeTab === 'media' && (
          <div className="media-container">
            {course.youtubeLinks?.length > 0 ? (
              <>
                <p className="section-note">
                  <Youtube size={14} /> Curated video resources for each module.
                </p>
                {course.modules?.map((mod, modIdx) => {
                  const links = ytByModule[modIdx] || [];
                  if (links.length === 0) return null;
                  return (
                    <div key={modIdx} className="q-module-section">
                      <div className="q-module-label">
                        <span className="module-number">Module {modIdx + 1}</span>
                        <span>{mod.title}</span>
                      </div>
                      <div className="media-grid">
                        {links.map((link, li) => (
                          <a
                            key={li}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="media-card"
                          >
                            <div className="media-icon"><PlayCircle size={28} color="#FF0000" /></div>
                            <div className="media-info">
                              <h4>{link.title}</h4>
                            </div>
                            <ExternalLink size={14} className="external-icon" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="dashboard-empty">
                <PlayCircle size={36} strokeWidth={1} />
                <p>No video links added yet for this course.</p>
                <p style={{ fontSize: '12px', opacity: 0.5 }}>Add them to courseData.json under "youtubeLinks".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
