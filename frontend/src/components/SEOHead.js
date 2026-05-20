import { useEffect } from 'react';

const DEFAULT_TITLE = 'JCOM | Verified Business Members and Professional Network';
const DEFAULT_DESCRIPTION = 'Discover verified JCOM members, business categories, professional services, and public business profiles across locations.';
const DEFAULT_KEYWORDS = 'JCOM, business network, business members, professional directory, verified businesses, B2B connections, business listings';

const ensureMetaTag = (selector, attributes = {}) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  return element;
};

const ensureLinkTag = (selector, attributes = {}) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('link');
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  return element;
};

const getAbsoluteUrl = (pathOrUrl = '/') => {
  if (typeof window === 'undefined') return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).toString();
};

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath,
  canonical, // Alternative canonical prop
  imagePath,
  image, // Alternative image prop
  type = 'website',
  noindex = false,
  structuredData,
  schemaData // Alternative structured data prop
}) => {
  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedKeywords = keywords || DEFAULT_KEYWORDS;
    const canonicalUrl = canonical || getAbsoluteUrl(canonicalPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'));
    const imageUrl = getAbsoluteUrl(image || imagePath || '/logo%20web.jpg');

    document.title = resolvedTitle;

    ensureMetaTag('meta[name="description"]', { name: 'description' }).setAttribute('content', resolvedDescription);
    ensureMetaTag('meta[name="keywords"]', { name: 'keywords' }).setAttribute('content', resolvedKeywords);
    ensureMetaTag('meta[name="robots"]', { name: 'robots' }).setAttribute('content', noindex ? 'noindex,follow' : 'index,follow');

    ensureMetaTag('meta[property="og:title"]', { property: 'og:title' }).setAttribute('content', resolvedTitle);
    ensureMetaTag('meta[property="og:description"]', { property: 'og:description' }).setAttribute('content', resolvedDescription);
    ensureMetaTag('meta[property="og:type"]', { property: 'og:type' }).setAttribute('content', type);
    ensureMetaTag('meta[property="og:url"]', { property: 'og:url' }).setAttribute('content', canonicalUrl);
    ensureMetaTag('meta[property="og:image"]', { property: 'og:image' }).setAttribute('content', imageUrl);

    ensureMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }).setAttribute('content', 'summary_large_image');
    ensureMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }).setAttribute('content', resolvedTitle);
    ensureMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }).setAttribute('content', resolvedDescription);
    ensureMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }).setAttribute('content', imageUrl);

    ensureLinkTag('link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', canonicalUrl);

    const previousJsonLd = document.head.querySelector('script[data-jcom-seo="json-ld"]');
    if (previousJsonLd) previousJsonLd.remove();

    const schema = schemaData || structuredData;
    if (schema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.jcomSeo = 'json-ld';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [canonical, canonicalPath, description, image, imagePath, keywords, noindex, schemaData, structuredData, title, type]);

  return null;
};

export default SEOHead;
