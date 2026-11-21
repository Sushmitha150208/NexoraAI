/**
 * NexoraAI API Client Service
 * Encapsulates authentication, chats, messages, uploads, and media generation.
 * Strictly adheres to FR-AUTH-04 and Project Constraints:
 * "passwords can be temp stored in localstorage"
 */

const API_BASE = typeof window !== 'undefined' && window.location.port === '3000'
  ? 'http://127.0.0.1:8000/api'
  : '/api';

// Authentication helper (stores user session & credentials in localStorage)
export const authService = {
  getUser: () => {
    try {
      const data = localStorage.getItem('nexora_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  getCredentials: () => {
    try {
      const creds = localStorage.getItem('nexora_credentials');
      if (creds) return JSON.parse(creds);
      const email = localStorage.getItem('email');
      const password = localStorage.getItem('password');
      const name = localStorage.getItem('name');
      if (email || password) return { email, password, name };
      return null;
    } catch {
      return null;
    }
  },
  setUser: (user, password) => {
    const fullPassword = password || user.password || localStorage.getItem('password') || '';
    const fullUser = {
      ...user,
      password: fullPassword
    };
    
    // 1. Primary User Session
    localStorage.setItem('nexora_user', JSON.stringify(fullUser));
    
    // 2. Explicit Credentials Object in localStorage (Constraint 5 & FR-AUTH-04)
    const credentials = {
      name: fullUser.name || '',
      email: fullUser.email || '',
      password: fullPassword
    };
    localStorage.setItem('nexora_credentials', JSON.stringify(credentials));

    // 3. Direct Key-Value Storage for rapid inspection
    localStorage.setItem('email', fullUser.email || '');
    localStorage.setItem('password', fullPassword);
    localStorage.setItem('name', fullUser.name || '');
  },
  clearUser: () => {
    localStorage.removeItem('nexora_user');
    localStorage.removeItem('nexora_credentials');
    localStorage.removeItem('email');
    localStorage.removeItem('password');
    localStorage.removeItem('name');
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
  const userWithCreds = { ...data, password, name };
  authService.setUser(userWithCreds, password);
  return userWithCreds;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid email or password');
  const userWithCreds = { ...data, password };
  authService.setUser(userWithCreds, password);
  return userWithCreds;
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
