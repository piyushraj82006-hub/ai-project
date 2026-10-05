import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDeadlines, addDeadline, deleteDeadline } from '../lib/db';
import {
  ArrowLeft, Plus, Trash2, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, AlertCircle, CheckCircle,
  Clock, X, BookOpen, FileText, ClipboardCheck, Award,
  Sparkles
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'quiz', label: 'Quiz / CAT', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'project_review', label: 'Project Review', icon: ClipboardCheck, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'submission', label: 'Submission', icon: FileText, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'exam', label: 'FAT / Exam', icon: Award, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'other', label: 'Other', icon: BookOpen, color: '#d4940a', bg: 'rgba(212, 148, 10, 0.12)' },
];

function getEventType(value) {
  return EVENT_TYPES.find(t => t.value === value) || EVENT_TYPES[4];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AcademicCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('quiz');
  const [formDate, setFormDate] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Load deadlines
  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const data = await getDeadlines(user.uid);
        setDeadlines(data);
      } catch (err) {
        console.error('Failed to load deadlines:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    // Padding days from previous month
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, inMonth: false, date: null });
    }
    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      days.push({ day: d, inMonth: true, date: toDateStr(dateObj), dateObj });
    }
    // Padding days for next month
    const remaining = 42 - days.length; // 6 rows × 7
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, inMonth: false, date: null });
    }
    return days;
  }, [viewMonth, viewYear]);

  // Map deadlines to dates
  const deadlinesByDate = useMemo(() => {
    const map = {};
    deadlines.forEach(dl => {
      const dateKey = dl.date?.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(dl);
    });
    return map;
  }, [deadlines]);

  // Upcoming deadlines (from today onward)
  const upcoming = useMemo(() => {
    const todayStr = toDateStr(today);
    return deadlines
      .filter(dl => dl.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [deadlines, today]);

  // Past deadlines count
  const pastCount = useMemo(() => {
    const todayStr = toDateStr(today);
    return deadlines.filter(dl => dl.date < todayStr).length;
  }, [deadlines, today]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  const openAddModal = (dateStr = null) => {
    setFormTitle('');
    setFormType('quiz');
    setFormDate(dateStr || toDateStr(today));
    setFormCourse('');
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!formTitle.trim() || !formDate) return;
    setFormSaving(true);
    try {
      const id = await addDeadline(user.uid, {
        title: formTitle.trim(),
        type: formType,
        date: formDate,
        courseCode: formCourse.trim() || null,
      });
      setDeadlines(prev => [...prev, {
        id,
        title: formTitle.trim(),
        type: formType,
        date: formDate,
        courseCode: formCourse.trim() || null,
      }].sort((a, b) => a.date.localeCompare(b.date)));
      setShowModal(false);
    } catch (err) {
      console.error('Failed to add deadline:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (dlId) => {
    if (!confirm('Delete this deadline?')) return;
    try {
      await deleteDeadline(user.uid, dlId);
      setDeadlines(prev => prev.filter(d => d.id !== dlId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleDateClick = (dayObj) => {
    if (!dayObj.inMonth || !dayObj.date) return;
    setSelectedDate(selectedDate === dayObj.date ? null : dayObj.date);
  };

  const todayStr = toDateStr(today);

  // Deadlines for selected date
  const selectedDeadlines = selectedDate ? (deadlinesByDate[selectedDate] || []) : [];

  function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysUntil(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date(todayStr + 'T00:00:00');
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `${diff} days left`;
  }

  return (
    <div className="cal-page">
      {/* Header */}
      <header className="cal-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="cal-header-title">
          <CalendarIcon size={24} strokeWidth={1.5} />
          <h1>Academic Calendar</h1>
        </div>
        <button className="cal-add-btn" onClick={() => openAddModal()}>
          <Plus size={18} /> Add Deadline
        </button>
      </header>

      {/* Stats Bar */}
      <div className="cal-stats">
        <div className="cal-stat-card">
          <span className="cal-stat-number">{upcoming.length}</span>
          <span className="cal-stat-label">Upcoming</span>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-number">{deadlines.length}</span>
          <span className="cal-stat-label">Total</span>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-number">{pastCount}</span>
          <span className="cal-stat-label">Completed</span>
        </div>
      </div>

      <div className="cal-layout">
        {/* Calendar Grid */}
        <div className="cal-grid-wrapper">
          {/* Month Navigation */}
          <div className="cal-month-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <div className="cal-month-label">
              <h2>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button className="cal-today-btn" onClick={goToToday}>Today</button>
            </div>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>

          {/* Day Headers */}
          <div className="cal-day-headers">
            {DAY_NAMES.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          </div>

          {/* Calendar Grid */}
          <div className="cal-grid">
            {calendarDays.map((dayObj, idx) => {
              const events = dayObj.date ? (deadlinesByDate[dayObj.date] || []) : [];
              const isToday = dayObj.date === todayStr;
              const isSelected = dayObj.date === selectedDate;
              const isPast = dayObj.date && dayObj.date < todayStr;

              return (
                <div
                  key={idx}
                  className={`cal-cell ${!dayObj.inMonth ? 'cal-cell-outside' : ''} ${isToday ? 'cal-cell-today' : ''} ${isSelected ? 'cal-cell-selected' : ''} ${isPast && dayObj.inMonth ? 'cal-cell-past' : ''}`}
                  onClick={() => handleDateClick(dayObj)}
                >
                  <span className="cal-cell-day">{dayObj.day}</span>
                  {events.length > 0 && (
                    <div className="cal-cell-dots">
                      {events.slice(0, 3).map((ev, i) => {
                        const evType = getEventType(ev.type);
                        return <span key={i} className="cal-dot" style={{ background: evType.color }} />;
                      })}
                      {events.length > 3 && <span className="cal-dot-more">+{events.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="cal-legend">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="cal-legend-item">
                <span className="cal-dot" style={{ background: t.color }} />
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="cal-selected-events animate-fadeIn">
              <h3>
                <CalendarIcon size={16} />
                {formatDisplayDate(selectedDate)}
              </h3>
              {selectedDeadlines.length > 0 ? (
                selectedDeadlines.map(dl => {
                  const evType = getEventType(dl.type);
                  const Icon = evType.icon;
                  return (
                    <div key={dl.id} className="cal-event-item" style={{ borderLeftColor: evType.color }}>
                      <div className="cal-event-icon" style={{ background: evType.bg, color: evType.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="cal-event-info">
                        <h4>{dl.title}</h4>
                        <span>{evType.label}{dl.courseCode ? ` • ${dl.courseCode}` : ''}</span>
                      </div>
                      <button className="cal-event-del" onClick={(e) => { e.stopPropagation(); handleDelete(dl.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="cal-no-events">
                  <p>No deadlines on this date.</p>
                  <button className="cal-add-link" onClick={() => openAddModal(selectedDate)}>
                    <Plus size={14} /> Add one
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Sidebar */}
        <div className="cal-sidebar">
          <h3 className="cal-sidebar-title">
            <Clock size={18} /> Upcoming Deadlines
          </h3>

          {loading ? (
            <div className="dashboard-loading"><span className="spinner"></span></div>
          ) : upcoming.length > 0 ? (
            <div className="cal-upcoming-list">
              {upcoming.map(dl => {
                const evType = getEventType(dl.type);
                const Icon = evType.icon;
                const timeLeft = daysUntil(dl.date);
                const isUrgent = dl.date <= todayStr || daysUntil(dl.date).includes('1 day') || timeLeft === 'Tomorrow' || timeLeft === 'Today';

                return (
                  <div key={dl.id} className={`cal-upcoming-card ${isUrgent ? 'cal-urgent' : ''}`}>
                    <div className="cal-upcoming-top">
                      <div className="cal-upcoming-type" style={{ background: evType.bg, color: evType.color }}>
                        <Icon size={14} />
                        <span>{evType.label}</span>
                      </div>
                      <span className={`cal-upcoming-countdown ${isUrgent ? 'urgent' : ''}`}>
                        {timeLeft}
                      </span>
                    </div>
                    <h4 className="cal-upcoming-title">{dl.title}</h4>
                    <div className="cal-upcoming-meta">
                      <span>{formatDisplayDate(dl.date)}</span>
                      {dl.courseCode && <span className="cal-upcoming-course">{dl.courseCode}</span>}
                    </div>
                    <button className="cal-event-del-sm" onClick={() => handleDelete(dl.id)} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cal-empty">
              <Sparkles size={32} strokeWidth={1} />
              <p>No upcoming deadlines!</p>
              <span>Click a date or use "Add Deadline" to get started.</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Deadline Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content cal-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2><Plus size={20} /> Add Deadline</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="cal-modal-body">
              {/* Event Type Selector */}
              <div className="cal-type-grid">
                {EVENT_TYPES.map(t => {
                  const Icon = t.icon;
                  const isActive = formType === t.value;
                  return (
                    <button
                      key={t.value}
                      className={`cal-type-btn ${isActive ? 'active' : ''}`}
                      style={isActive ? { background: t.bg, borderColor: t.color, color: t.color } : {}}
                      onClick={() => setFormType(t.value)}
                    >
                      <Icon size={18} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Title */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g., DBMS CAT-1, SE Project Review"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Date */}
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </div>

              {/* Course Code (optional) */}
              <div className="form-group">
                <label>Course Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g., BCSE302L"
                  value={formCourse}
                  onChange={e => setFormCourse(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  className="auth-btn-primary"
                  onClick={handleAdd}
                  disabled={!formTitle.trim() || !formDate || formSaving}
                  style={{ padding: '10px 28px', fontSize: '14px' }}
                >
                  {formSaving ? <span className="spinner-sm" /> : <CheckCircle size={16} />}
                  {formSaving ? 'Saving...' : 'Add Deadline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
