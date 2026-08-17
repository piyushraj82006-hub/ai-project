/**
 * Toast Notification Store
 * Module-level state shared across the app. Kept in its own file so
 * `toast()` can be imported anywhere while the ToastContainer component
 * lives in its own component file (fast-refresh friendly).
 */

let _toasts = [];
let _listeners = [];

function notifyListeners() {
  _listeners.forEach(fn => fn([..._toasts]));
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {'success'|'error'|'info'} type - Toast type
 * @param {number} duration - Auto-dismiss duration in ms
 */
export function toast(message, type = 'info', duration = 4000) {
  const id = Date.now() + Math.random();
  _toasts.push({ id, message, type, duration });
  notifyListeners();

  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    notifyListeners();
  }, duration);
}

/** Dismiss a toast immediately. */
export function dismissToast(id) {
  _toasts = _toasts.filter(t => t.id !== id);
  notifyListeners();
}

/**
 * Subscribe to toast list changes.
 * @returns {Function} Unsubscribe function
 */
export function subscribeToasts(listener) {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

/** Current snapshot of toasts (for initial state). */
export function getToasts() {
  return [..._toasts];
}
