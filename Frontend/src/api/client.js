const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function getStoredToken() {
  return localStorage.getItem('ttm_token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('ttm_token', token);
    return;
  }

  localStorage.removeItem('ttm_token');
}

async function request(path, options = {}) {
  const { token = true, body, headers = {}, ...rest } = options;
  const requestHeaders = { ...headers };

  if (body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${getStoredToken()}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data ?? payload;
}

export const api = {
  request,
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export { API_BASE_URL };