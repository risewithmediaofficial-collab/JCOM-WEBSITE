/**
 * JSON-LD Schema helpers for structured data markup
 * Used for SEO and Google rich snippets
 * Reference: https://schema.org/
 */

const { slugToTitle } = require('./slugify');

/**
 * Generate LocalBusiness schema for a single business
 * Used on /business/:businessSlug pages
 * @param {Object} business - Business object with fields: businessName, businessDescription, phone, businessWebsite, profilePic, location, address
 * @param {string} baseUrl - Base URL of the site (e.g., https://jcom.com)
 * @returns {Object} - LocalBusiness JSON-LD schema
 */
function generateLocalBusinessSchema(business, baseUrl = 'https://jcom.com') {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.businessName,
    description: business.businessDescription || `${business.businessName} on JCOM`,
    telephone: business.phone,
    url: business.businessWebsite || `${baseUrl}/business/${business.slug}`,
    image: business.profilePic ? `${baseUrl}${business.profilePic}` : null,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address || '',
      addressLocality: business.location || '',
      addressCountry: 'IN'
    }
  };

  // Add rating if available
  if (business.averageRating && business.ratingsCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.averageRating.toFixed(1),
      ratingCount: business.ratingsCount
    };
  }

  // Remove null values
  if (!schema.image) delete schema.image;
  if (!schema.address.streetAddress) delete schema.address.streetAddress;

  return schema;
}

/**
 * Generate ItemList schema for service listing pages
 * Used on /services/:serviceSlug/:locationSlug pages
 * @param {Array} businesses - Array of business objects
 * @param {string} serviceName - Service name (e.g., "RO Water Purification")
 * @param {string} locationName - Location name (e.g., "Krishnagiri")
 * @param {string} baseUrl - Base URL of the site
 * @returns {Object} - ItemList JSON-LD schema
 */
function generateServiceListingSchema(businesses, serviceName, locationName, baseUrl = 'https://jcom.com') {
  const items = businesses.slice(0, 10).map((business, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: business.businessName,
    description: business.businessDescription,
    url: `${baseUrl}/business/${business.slug}`,
    image: business.profilePic ? `${baseUrl}${business.profilePic}` : undefined
  }));

  // Remove undefined image fields
  items.forEach(item => {
    if (!item.image) delete item.image;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${serviceName} services in ${locationName}`,
    description: `Verified ${serviceName} service providers in ${locationName}`,
    itemListElement: items
  };
}

/**
 * Generate BreadcrumbList schema
 * Used on all pages for breadcrumb navigation
 * @param {Array} breadcrumbs - Array with {name, url} objects
 * @returns {Object} - BreadcrumbList JSON-LD schema
 */
function generateBreadcrumbSchema(breadcrumbs) {
  const itemListElement = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  };
}

/**
 * Generate Organization schema
 * Used on homepage
 * @param {string} baseUrl - Base URL of the site
 * @returns {Object} - Organization JSON-LD schema
 */
function generateOrganizationSchema(baseUrl = 'https://jcom.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JCOM',
    description: 'Justdial-style business directory and networking platform',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    telephone: '+91-XXXXXXXXXX',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN'
    },
    sameAs: [
      'https://www.facebook.com/jcom',
      'https://twitter.com/jcom',
      'https://www.linkedin.com/company/jcom'
    ]
  };
}

/**
 * Create meta tags HTML string for schema.org markup
 * @param {Object} schema - JSON-LD schema object
 * @returns {string} - HTML script tag with schema
 */
function createSchemaTag(schema) {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

module.exports = {
  generateLocalBusinessSchema,
  generateServiceListingSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  createSchemaTag
};
