const rawApiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
