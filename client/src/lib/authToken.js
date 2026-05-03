const TOKEN_STORAGE_KEY = 'ca_tracker_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  if (token == null || token === '') {
    clearAuthToken();
    return;
  }
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, String(token));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
