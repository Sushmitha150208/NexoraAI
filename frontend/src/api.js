/**
 * NexoraAI API Client Service
 * Encapsulates authentication, chats, messages, uploads, and media generation.
 */

const API_BASE = typeof window !== 'undefined' && window.location.port === '3000'
  ? 'http://127.0.0.1:8000/api'
  : '/api';

// Authentication helper (uses localStorage as per FR-AUTH-04 & prompt constraints)
export const authService = {
  getUser: () => {
    try {
      const data = localStorage.getItem('nexora_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    localStorage.setItem('nexora_user', JSON.stringify(user));
  },
  clearUser: () => {
    localStorage.removeItem('nexora_user');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('nexora_user');
  }
};

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  authService.setUser(data);
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid email or password');
  authService.setUser(data);
  return data;
}

export async function logoutUser() {
  authService.clearUser();
  try {
    await fetch(`${API_BASE}/auth/logout/`, { method: 'POST' });
  } catch {}
}

export async function fetchConversations(email) {
  const res = await fetch(`${API_BASE}/chats/?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function createConversation(email, title = 'New Chat') {
  const res = await fetch(`${API_BASE}/chats/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, title })
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function fetchConversationDetail(convId) {
  const res = await fetch(`${API_BASE}/chats/${convId}/`);
  if (!res.ok) throw new Error('Failed to load conversation');
  return res.json();
}

export async function renameConversation(convId, title) {
  const res = await fetch(`${API_BASE}/chats/${convId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.json();
}

export async function deleteConversation(convId) {
  const res = await fetch(`${API_BASE}/chats/${convId}/`, { method: 'DELETE' });
  return res.json();
}

export async function sendMessage(convId, content, attachments = [], modality = 'text') {
  const res = await fetch(`${API_BASE}/chats/${convId}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, attachments, modality })
  });
  if (!res.ok) throw new Error('Failed to generate response');
  return res.json();
}

export async function sendFeedback(messageId, score) {
  await fetch(`${API_BASE}/messages/${messageId}/feedback/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: score })
  });
}

export async function uploadMediaFile(file, type, email) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('email', email);

  const res = await fetch(`${API_BASE}/uploads/`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function fetchLibrary(email, type = 'all') {
  const res = await fetch(`${API_BASE}/library/?email=${encodeURIComponent(email)}&type=${type}`);
  if (!res.ok) throw new Error('Failed to fetch library');
  return res.json();
}

export async function deleteLibraryItem(id) {
  await fetch(`${API_BASE}/library/?id=${id}`, { method: 'DELETE' });
}

export async function fetchNotifications(email) {
  const res = await fetch(`${API_BASE}/notifications/?email=${encodeURIComponent(email)}`);
  return res.json();
}

export async function markNotificationsRead(email) {
  await fetch(`${API_BASE}/notifications/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function fetchExplore() {
  const res = await fetch(`${API_BASE}/explore/`);
  return res.json();
}
