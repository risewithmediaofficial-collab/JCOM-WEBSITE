import axios from 'axios';

const API_URL = 'https://jcom-website.onrender.com';
const rawApiOrigin = process.env.VITE_API_URL
  || process.env.REACT_APP_API_URL
  || API_URL;

const normalizedApiUrl = rawApiOrigin.replace(/\/+$/, '');

export const API_ORIGIN = normalizedApiUrl.replace(/\/api$/, '');
export const API_BASE_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${API_ORIGIN}/api`;

export const buildAssetUrl = (assetPath) => {
  if (!assetPath) return null;
  if (/^data:/i.test(assetPath)) return assetPath;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export default API_ORIGIN;
