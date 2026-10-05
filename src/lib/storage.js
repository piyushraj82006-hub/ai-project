const STORAGE_KEY = 'scrollio_summaries';

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

export function saveContent(userId, summary, reels = [], quiz = [], flashcards = [], fileName = '') {
  const store = getStore();
  if (!store[userId]) store[userId] = [];
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: summary.documentTitle || summary.title || 'Untitled Document',
    createdAt: new Date().toISOString(),
    summary,
    reels,
    quiz,
    flashcards,
    fileName
  };
  store[userId].unshift(entry);
  // Keep max 20 summaries
  if (store[userId].length > 20) store[userId] = store[userId].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return entry;
}

export function updateSavedContent(userId, id, updates) {
  const store = getStore();
  if (store[userId]) {
    store[userId] = store[userId].map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updates };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function getSummaries(userId) {
  const store = getStore();
  return store[userId] || [];
}

export function deleteSummary(userId, id) {
  const store = getStore();
  if (store[userId]) {
    store[userId] = store[userId].filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}
