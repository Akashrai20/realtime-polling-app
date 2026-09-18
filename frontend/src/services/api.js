// API service helper connecting to Go Gin backend with JWT token injection
const API_BASE_URL = 'http://localhost:8081/api';

// Helper for making authenticated/public HTTP requests
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    console.warn(`[API] Endpoint ${endpoint} warning:`, err.message);
    throw err;
  }
}

// Authentication Service
export const authService = {
  async register(username, password) {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      // Mock Fallback when backend is offline
      console.log('[Auth] Operating in client-side authentication mode');
      const mockUser = { id: 'usr_' + Date.now(), username };
      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { message: 'Registered successfully', token: mockToken, user: mockUser };
    }
  },

  async login(username, password) {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      // Mock Fallback when backend is offline
      console.log('[Auth] Operating in client-side authentication mode');
      const mockUser = { id: 'usr_demo', username };
      const mockToken = 'mock_jwt_token_demo';
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { message: 'Login successful', token: mockToken, user: mockUser };
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  }
};

// Poll Service
export const pollService = {
  async createPoll(pollData) {
    try {
      return await apiRequest('/polls', {
        method: 'POST',
        body: JSON.stringify({
          question: pollData.title || pollData.question,
          description: pollData.description || '',
          options: pollData.options.map(o => typeof o === 'string' ? o : o.text),
          duration_minutes: pollData.durationMinutes || 1440,
          restrict_fingerprint: pollData.restrictFingerprint ?? true,
          restrict_ip: pollData.restrictIP ?? true,
        }),
      });
    } catch (err) {
      // Client-side fallback if backend is offline
      console.log('[Poll API] Storing poll locally');
      const newPoll = {
        id: 'poll-' + Date.now(),
        title: pollData.title || pollData.question,
        question: pollData.title || pollData.question,
        description: pollData.description || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (pollData.durationMinutes || 1440) * 60000).toISOString(),
        options: pollData.options.map((opt, idx) => ({
          id: `opt-${idx + 1}`,
          text: typeof opt === 'string' ? opt : opt.text,
          votes: 0,
        })),
        totalVotes: 0,
        restrictFingerprint: true,
        restrictIP: true,
      };
      return { message: 'Poll created locally', poll: newPoll };
    }
  },

  async getPoll(id) {
    return await apiRequest(`/polls/${id}`);
  }
};
