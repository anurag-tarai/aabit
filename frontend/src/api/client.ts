import axios from 'axios';

export const api = axios.create({
  // baseURL: 'https://backend-autumn-ember-2113.fly.dev/api/v1',
  baseURL: 'http://localhost:8080/api/v1'
});

export interface Tag {
  id:   string;
  name: string;
}

export interface ExperienceResponse {
  id:              string;
  timestamp:       string;
  markdownContent: string;
  sensitive:       boolean;
  clientEncrypted: boolean;
  tags:            string[];
}

export interface ExperienceRequest {
  markdownContent: string;
  sensitive:       boolean;
  clientEncrypted: boolean;
  tags:            string[];
}

export interface AuthResponse {
  token: string;
  name:  string;
  email: string;
}

export interface VaultMetadata {
  vaultPinWrapped:    string | null;
  vaultPhraseWrapped: string | null;
}

// Outbound Handshake Interceptor
api.interceptors.request.use((config) => {
  const sessionToken = localStorage.getItem('aabit_session_token');
  if (sessionToken && config.headers) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Inbound Error Boundary Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('aabit_session_token');
      localStorage.removeItem('aabit_user_profile');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    } else if (error.response && error.response.data && error.response.data.message) {
      // Dispatch a custom event to our GlobalErrorToast
      window.dispatchEvent(
        new CustomEvent('api-error', { 
          detail: { message: error.response.data.message } 
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('api-error', { 
          detail: { message: 'An unexpected network error occurred.' } 
        })
      );
    }
    return Promise.reject(error);
  }
);