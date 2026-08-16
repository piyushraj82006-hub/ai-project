import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../lib/db';
import { updateProfile as updateFirebaseProfile } from '../lib/firebase';
import { X, Save, User } from 'lucide-react';

export default function ProfileSettings({ onClose }) {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [college, setCollege] = useState(user?.college || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState(user?.semester || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Update Firebase Auth Profile (DisplayName)
      if (displayName !== user.displayName) {
        await updateFirebaseProfile(user, { displayName });
      }
      
      // Update Firestore User Profile (College, Dept, Sem)
      await updateUser(user.uid, {
        displayName,
        college,
        department,
        semester
      });
      
      // Need to reload window or context to fetch new data
      window.location.reload();
      
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-modal animate-fadeInScale">
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="e.g. John Doe" 
              required
            />
          </div>
          
          <div className="form-group">
            <label>Campus/College</label>
            <select value={college} onChange={e => setCollege(e.target.value)} required>
              <option value="" disabled>Select Campus</option>
              <option value="VIT Vellore">VIT Vellore</option>
              <option value="VIT Chennai">VIT Chennai</option>
              <option value="VIT AP">VIT AP</option>
              <option value="VIT Bhopal">VIT Bhopal</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} required>
              <option value="" disabled>Select Department</option>
              <option value="CSE">Computer Science & Engineering</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="MECH">Mechanical Engineering</option>
              <option value="EEE">Electrical & Electronics</option>
              <option value="CIVIL">Civil Engineering</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Semester</label>
            <select value={semester} onChange={e => setSemester(e.target.value)} required>
              <option value="" disabled>Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="spinner-sm"></span> : <><Save size={16}/> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
