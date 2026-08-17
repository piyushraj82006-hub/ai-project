import { BookOpen, Clock, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CourseList({ courses, onEnroll, enrolledCourseIds = [], exploreBranch, exploreSemester }) {
  const navigate = useNavigate();

  if (!courses || courses.length === 0) {
    return (
      <div className="dashboard-empty">
        <BookOpen size={36} strokeWidth={1} />
        {exploreBranch || exploreSemester ? (
          <>
            <p>No courses yet for <strong>{exploreBranch || 'this branch'}</strong>{exploreSemester ? ` — Semester ${exploreSemester}` : ''}.</p>
            <p style={{ fontSize: '12px', opacity: 0.6 }}>Courses will appear here once they are added to the system.</p>
          </>
        ) : (
          <p>No courses found. Try selecting a branch or semester above.</p>
        )}
      </div>
    );
  }

  return (
    <div className="course-list">
      {courses.map(course => {
        const isEnrolled = enrolledCourseIds.includes(course.code || course.id);

        return (
          <div key={course.id || course.code} className="course-card">
            <div className="course-card-header">
              <span className="course-code">{course.code}</span>
              <span className="course-credits">{course.credits} Credits</span>
            </div>
            
            <h3 className="course-title">{course.name}</h3>
            
            <div className="course-meta">
              <span className="meta-item"><Users size={14} /> {course.department}</span>
              <span className="meta-item"><Clock size={14} /> Sem {course.semester}</span>
            </div>
            
            <p className="course-desc truncate">
              {course.description}
            </p>
            
            <div className="course-actions">
              {isEnrolled ? (
                <>
                  <button 
                    className="btn-view"
                    onClick={() => navigate(`/course/${course.code}`)}
                  >
                    View Course <ChevronRight size={16} />
                  </button>
                  <span className="enrolled-badge"><CheckCircle2 size={14} /> Enrolled</span>
                </>
              ) : (
                <button 
                  className="btn-enroll"
                  onClick={() => onEnroll && onEnroll(course.code)}
                >
                  Enroll Now
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
