import axios from 'axios';

// Ensure your Spring Boot server is running on 8080
export const api = axios.create({
  baseURL: 'https://aabit.onrender.com/api/v1',
});

export interface Tag {
  id: string;
  name: string;
}

export interface ExperienceResponse {
  id: string;
  timestamp: string;
  markdownContent: string;
  sensitive: boolean;
  tags: string[];
}

export interface ExperienceRequest {
  markdownContent: string;
  sensitive: boolean;
  tags: string[];
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}


// Outbound Handshake Interceptor
api.interceptors.request.use((config) => {
  const sessionToken = localStorage.getItem('aabit_session_token');
  if (sessionToken && config.headers) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Inbound Error Boundary Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the Spring filter context rejects a token statement as invalid or expired
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('aabit_session_token');
      localStorage.removeItem('aabit_user_profile');
      
      // Force user to identity gateway instantly
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);