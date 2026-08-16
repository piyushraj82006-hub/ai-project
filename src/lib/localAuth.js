/**
 * Local Authentication System
 * Uses localStorage to store users and session state.
 */

const USERS_KEY = 'scrollio_local_users';
const SESSION_KEY = 'scrollio_local_session';

function getLocalUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.length === 0) {
      const demoUser = {
        uid: 'local_demo',
        email: 'demo@scroll.io',
        password: 'password123',
        displayName: 'Demo User',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]));
      return [demoUser];
    }
    return users;
  } catch { return []; }
}

function saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch { return null; }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Notify listeners
  notifyListeners(user);
}

const listeners = new Set();

function notifyListeners(user) {
  listeners.forEach(cb => cb(user));
}

export async function signUp(email, password, displayName) {
  const users = getLocalUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('User already exists');
  }

  const newUser = {
    uid: 'local_' + Date.now().toString(36),
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: new Date().toISOString()
  };

  users.push({ ...newUser, password }); // In a real app, never store plain text passwords
  saveLocalUsers(users);
  saveSession(newUser);
  return newUser;
}

export async function signIn(email, password) {
  const users = getLocalUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const sessionUser = { ...user };
  delete sessionUser.password;
  saveSession(sessionUser);
  return sessionUser;
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  notifyListeners(null);
}

export function onAuthStateChanged(callback) {
  listeners.add(callback);
  // Immediate trigger with current session
  callback(getSession());
  return () => listeners.delete(callback);
}

export async function updateProfile(user, { displayName }) {
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.uid === user.uid);
  if (idx !== -1) {
    users[idx].displayName = displayName;
    saveLocalUsers(users);
    saveSession({ ...users[idx] });
  }
}

// Helper to list all users (for the user's initial request)
export function getAllUsers() {
  return getLocalUsers().map(u => {
    const { password, ...safeUser } = u;
    return safeUser;
  });
}
