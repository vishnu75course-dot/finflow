const API_BASE = '/api';

interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

export async function login(payload: LoginPayload): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function register(payload: RegisterPayload): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function logout(accessToken: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
  });
  return await res.json();
}

export async function refreshToken(refreshToken: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return await res.json();
}

export async function forgotPassword(email: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return await res.json();
}

export async function resetPassword(password: string, accessToken: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ password }),
  });
  return await res.json();
}

export async function getCurrentUser(accessToken: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  return await res.json();
}

export async function sendChatMessage(
  message: string,
  history: { role: string; text: string }[],
  accessToken: string
): Promise<{ reply: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ message, history }),
    });
    return await res.json();
  } catch (error) {
    return {
      reply: "I'm currently offline. The AI service requires the backend server to be running with a valid OPENAI_API_KEY. Please check your server configuration.",
    };
  }
}

export async function fetchAIInsights(data: {
  income: number;
  transactions: any[];
  budgets: any[];
}): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}
