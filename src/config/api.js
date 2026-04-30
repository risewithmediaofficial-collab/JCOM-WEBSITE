import axios from 'axios';

const productionApiUrl = 'https://jcom-website.onrender.com/api';
const developmentApiUrl = 'http://localhost:5000/api';
const rawApiBaseUrl = process.env.VITE_API_URL
  || process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === 'production' ? productionApiUrl : developmentApiUrl);

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const buildAssetUrl = (assetPath) => {
  if (!assetPath) return null;
  if (/^data:/i.test(assetPath)) return assetPath;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
