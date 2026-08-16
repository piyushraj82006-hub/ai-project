/**
 * Firestore Database Helper Functions
 * All read/write operations for users, courses, and PYQs.
 */
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy, limit,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════

/**
 * Get user profile from Firestore.
 * @returns {Object|null} User profile data or null
 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

/**
 * Update user profile fields (merge).
 */
export async function updateUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Enroll a course for the user.
 */
export async function enrollCourse(uid, courseCode) {
  await updateDoc(doc(db, 'users', uid), {
    enrolledCourses: arrayUnion(courseCode),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Unenroll a course for the user.
 */
export async function unenrollCourse(uid, courseCode) {
  await updateDoc(doc(db, 'users', uid), {
    enrolledCourses: arrayRemove(courseCode),
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════
//  COURSES
// ═══════════════════════════════════════════════

/**
 * Get a single course by its code.
 */
export async function getCourse(courseCode) {
  const snap = await getDoc(doc(db, 'courses', courseCode));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Get multiple courses by their codes.
 */
export async function getCoursesByIds(courseCodes) {
  if (!courseCodes?.length) return [];
  // Firestore 'in' queries support max 30 items
  const results = [];
  const chunks = [];
  for (let i = 0; i < courseCodes.length; i += 30) {
    chunks.push(courseCodes.slice(i, i + 30));
  }
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'courses'),
      where('__name__', 'in', chunk)
    );
    const snap = await getDocs(q);
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
  }
  return results;
}

const CACHE_KEY = 'scrollio_course_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get all courses, optionally filtered by department and semester.
 */
export async function getCourses(filters = {}) {
  // If no filters (full catalog), try to use cache
  if (Object.keys(filters).length === 0) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
      }
    } catch (e) {
      console.warn("Course cache read failed", e);
    }
  }

  const constraints = [];
  if (filters.department) {
    constraints.push(where('department', '==', filters.department));
  }
  if (filters.semester) {
    constraints.push(where('semester', '==', filters.semester));
  }
  constraints.push(orderBy('name'));
  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, 'courses'), ...constraints);
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Update cache if full catalog
  if (Object.keys(filters).length === 0) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn("Course cache write failed", e);
    }
  }

  return data;
}

/**
 * Search courses by name or code (client-side filter on a prefix match).
 * Firestore doesn't support full-text search natively, so we fetch all
 * courses for the department and filter locally.
 */
export async function searchCourses(searchTerm, filters = {}) {
  const allCourses = await getCourses(filters);
  if (!searchTerm) return allCourses;
  
  const term = searchTerm.toLowerCase().trim();
  return allCourses.filter(c =>
    c.name?.toLowerCase().includes(term) ||
    c.code?.toLowerCase().includes(term) ||
    c.id?.toLowerCase().includes(term)
  );
}

/**
 * Add or update a course document (used by admin/seeding).
 */
export async function setCourse(courseCode, data) {
  await setDoc(doc(db, 'courses', courseCode), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════
//  PYQs (Previous Year Questions)
// ═══════════════════════════════════════════════

/**
 * Get all PYQs for a course, ordered by year descending.
 */
export async function getPYQs(courseCode) {
  const q = query(
    collection(db, 'pyqs'),
    where('courseCode', '==', courseCode),
    orderBy('year', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Add a PYQ document.
 */
export async function addPYQ(data) {
  const docId = `${data.courseCode}_${data.examType}_${data.year}`;
  await setDoc(doc(db, 'pyqs', docId), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return docId;
}

/**
 * Delete a PYQ document.
 */
export async function deletePYQ(docId) {
  await deleteDoc(doc(db, 'pyqs', docId));
}

// ═══════════════════════════════════════════════
//  DEADLINES (Academic Calendar)
// ═══════════════════════════════════════════════

/**
 * Get all deadlines for a user, ordered by date ascending.
 */
export async function getDeadlines(uid) {
  const q = query(
    collection(db, 'users', uid, 'deadlines'),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Add a deadline for a user.
 * @param {string} uid - User ID
 * @param {object} data - { title, type, date (ISO string), courseCode? }
 */
export async function addDeadline(uid, data) {
  const deadlinesRef = collection(db, 'users', uid, 'deadlines');
  const docRef = doc(deadlinesRef);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a deadline.
 */
export async function updateDeadline(uid, deadlineId, data) {
  await updateDoc(doc(db, 'users', uid, 'deadlines', deadlineId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a deadline.
 */
export async function deleteDeadline(uid, deadlineId) {
  await deleteDoc(doc(db, 'users', uid, 'deadlines', deadlineId));
}
