/**
 * SEO Controller
 * Handles dynamic SEO pages, sitemap generation, and robots.txt
 * Serves pre-rendered HTML or SSR content for Google crawlability
 */

const User = require('../models/User');
const Location = require('../models/Location');
const { generateServiceSlug, generateLocationSlug, slugToTitle } = require('../utils/slugify');
const {
  generateLocalBusinessSchema,
  generateServiceListingSchema,
  generateBreadcrumbSchema,
  createSchemaTag
} = require('../utils/schemaMarkup');

/**
 * Get all unique services from approved businesses
 */
async function getAllServices() {
  try {
    const services = await User.find(
      { status: 'Approved', businessService: { $exists: true, $ne: '' } },
      { businessService: 1 }
    ).distinct('businessService');

    return services.filter(s => s && s.trim()).map(service => ({
      name: service.trim(),
      slug: generateServiceSlug(service.trim())
    }));
  } catch (err) {
    console.error('Error fetching services:', err);
    return [];
  }
}

/**
 * Get all unique locations from approved businesses
 */
async function getAllLocations() {
  try {
    const locations = await User.find(
      { status: 'Approved', locationName: { $exists: true, $ne: '' } },
      { locationName: 1 }
    ).distinct('locationName');

    return locations.filter(l => l && l.trim()).map(location => ({
      name: location.trim(),
      slug: generateLocationSlug(location.trim())
    }));
  } catch (err) {
    console.error('Error fetching locations:', err);
    return [];
  }
}

/**
 * Get all unique service-location combinations from approved businesses
 */
async function getServiceLocationCombinations() {
  try {
    const businesses = await User.find(
      {
        status: 'Approved',
        businessService: { $exists: true, $ne: '' },
        locationName: { $exists: true, $ne: '' }
      },
      { businessService: 1, locationName: 1 }
    );

    const combinations = new Map();

    businesses.forEach(business => {
      const serviceSlug = generateServiceSlug(business.businessService);
      const locationSlug = generateLocationSlug(business.locationName);
      const key = `${serviceSlug}|${locationSlug}`;

      if (!combinations.has(key)) {
        combinations.set(key, {
          serviceSlug,
          locationSlug,
          serviceName: business.businessService.trim(),
          locationName: business.locationName.trim()
        });
      }
    });

    return Array.from(combinations.values());
  } catch (err) {
    console.error('Error fetching service-location combinations:', err);
    return [];
  }
}

/**
 * Get businesses for a service-location combination
 */
async function getBusinessesForServiceLocation(serviceSlug, locationSlug) {
  try {
    const services = await getAllServices();
    const locations = await getAllLocations();

    const serviceName = services.find(s => s.slug === serviceSlug)?.name;
    const locationName = locations.find(l => l.slug === locationSlug)?.name;

    if (!serviceName || !locationName) {
      return { businesses: [], serviceName: null, locationName: null };
    }

    const businesses = await User.find({
      status: 'Approved',
      businessService: { $regex: new RegExp(`^${serviceName}$`, 'i') },
      locationName: { $regex: new RegExp(`^${locationName}$`, 'i') }
    })
      .select('businessName slug businessCategory businessDescription businessWebsite phone profilePic locationName address averageRating ratingsCount')
      .limit(50);

    return { businesses, serviceName, locationName };
  } catch (err) {
    console.error('Error fetching businesses for service-location:', err);
    return { businesses: [], serviceName: null, locationName: null };
  }
}

/**
 * Get a single business by slug
 */
async function getBusinessBySlug(businessSlug) {
  try {
    // Slug format: "business-name-XXXXX" where XXXXX is last 8 chars of ID
    const business = await User.findOne({
      status: 'Approved',
      slug: businessSlug
    })
      .select('businessName slug businessCategory businessDescription businessWebsite phone profilePic locationName address averageRating ratingsCount')
      .lean();

    return business;
  } catch (err) {
    console.error('Error fetching business by slug:', err);
    return null;
  }
}

/**
 * Generate robots.txt content
 */
async function generateRobotsTxt(baseUrl) {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/private
Allow: /api/public

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-services.xml
Sitemap: ${baseUrl}/sitemap-businesses.xml

# Crawl delay (optional)
Crawl-delay: 1
`;
  return robotsTxt;
}

/**
 * Generate main sitemap index
 */
async function generateMainSitemap(baseUrl) {
  const timestamp = new Date().toISOString();
  const sitemaps = [
    { loc: `${baseUrl}/sitemap-services.xml`, lastmod: timestamp },
    { loc: `${baseUrl}/sitemap-businesses.xml`, lastmod: timestamp },
    { loc: `${baseUrl}/`, lastmod: timestamp },
    { loc: `${baseUrl}/about`, lastmod: timestamp },
    { loc: `${baseUrl}/events`, lastmod: timestamp },
    { loc: `${baseUrl}/leaderboard`, lastmod: timestamp }
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemaps.forEach(sitemap => {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(sitemap.loc)}</loc>\n`;
    xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  });

  xml += '</sitemapindex>';
  return xml;
}

/**
 * Generate service-location sitemap
 */
async function generateServiceLocationSitemap(baseUrl) {
  const combinations = await getServiceLocationCombinations();
  const timestamp = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  combinations.forEach(combo => {
    const url = `${baseUrl}/services/${combo.serviceSlug}/${combo.locationSlug}`;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += `    <lastmod>${timestamp}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Generate businesses sitemap
 */
async function generateBusinessesSitemap(baseUrl) {
  const businesses = await User.find(
    { status: 'Approved' },
    { slug: 1, updatedAt: 1 }
  )
    .lean()
    .limit(50000); // Sitemap limit

  const timestamp = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  businesses.forEach(business => {
    const url = `${baseUrl}/business/${business.slug}`;
    const lastmod = business.updatedAt ? business.updatedAt.toISOString() : timestamp;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };
  return str.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Generate HTML page for service-location listing
 */
async function generateServiceLocationPageHTML(serviceSlug, locationSlug, baseUrl) {
  const { businesses, serviceName, locationName } = await getBusinessesForServiceLocation(serviceSlug, locationSlug);

  if (!serviceName || !locationName) {
    return null;
  }

  const title = `${serviceName} Services in ${locationName} | JCOM`;
  const description = `Find verified ${serviceName} service providers in ${locationName} registered on JCOM.`;
  const url = `${baseUrl}/services/${serviceSlug}/${locationSlug}`;

  // Generate schema markup
  const listingSchema = generateServiceListingSchema(businesses, serviceName, locationName, baseUrl);
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: serviceName, url: `${baseUrl}/services/${serviceSlug}` },
    { name: locationName, url }
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  // Generate HTML content
  let businessListHTML = '';
  businesses.forEach(business => {
    businessListHTML += `
    <div class="business-card">
      <h3><a href="/business/${business.slug}">${escapeHtml(business.businessName)}</a></h3>
      <p class="category">${escapeHtml(business.businessCategory)}</p>
      <p class="description">${escapeHtml(business.businessDescription || '')}</p>
      <p class="location">${escapeHtml(business.locationName)}</p>
      <p class="contact">${escapeHtml(business.phone)}</p>
      ${business.averageRating ? `<div class="rating">★ ${business.averageRating.toFixed(1)} (${business.ratingsCount} ratings)</div>` : ''}
    </div>`;
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:type" content="website">
  ${createSchemaTag(listingSchema)}
  ${createSchemaTag(breadcrumbSchema)}
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <div class="business-listings">
    ${businessListHTML}
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate HTML page for single business
 */
async function generateBusinessPageHTML(businessSlug, baseUrl) {
  const business = await getBusinessBySlug(businessSlug);

  if (!business) {
    return null;
  }

  const title = `${business.businessName} - Services in ${business.locationName} | JCOM`;
  const description = business.businessDescription || `${business.businessName} on JCOM - ${business.businessCategory}`;
  const url = `${baseUrl}/business/${businessSlug}`;

  // Generate schema markup
  const businessSchema = generateLocalBusinessSchema(business, baseUrl);
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Businesses', url: `${baseUrl}/search` },
    { name: business.businessName, url }
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:type" content="business.business">
  ${business.profilePic ? `<meta property="og:image" content="${escapeHtml(business.profilePic)}">` : ''}
  ${createSchemaTag(businessSchema)}
  ${createSchemaTag(breadcrumbSchema)}
</head>
<body>
  <h1>${escapeHtml(business.businessName)}</h1>
  <p class="category">${escapeHtml(business.businessCategory)}</p>
  <p class="description">${escapeHtml(description)}</p>
  <p class="location">${escapeHtml(business.locationName)}</p>
  <p class="phone">${escapeHtml(business.phone)}</p>
  ${business.averageRating ? `<p class="rating">Rating: ★ ${business.averageRating.toFixed(1)} / 5 (${business.ratingsCount} ratings)</p>` : ''}
  ${business.businessWebsite ? `<p class="website"><a href="${escapeHtml(business.businessWebsite)}" target="_blank">Visit Website</a></p>` : ''}
</body>
</html>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

module.exports = {
  getAllServices,
  getAllLocations,
  getServiceLocationCombinations,
  getBusinessesForServiceLocation,
  getBusinessBySlug,
  generateRobotsTxt,
  generateMainSitemap,
  generateServiceLocationSitemap,
  generateBusinessesSitemap,
  generateServiceLocationPageHTML,
  generateBusinessPageHTML
};
