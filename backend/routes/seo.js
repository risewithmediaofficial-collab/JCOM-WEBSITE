/**
 * SEO Routes
 * Public routes for dynamic SEO pages, sitemaps, and robots.txt
 * No authentication required - optimized for Google crawlers
 */

const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');

// Determine base URL from environment
const getBaseUrl = (req) => {
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'jcom.com';
  return `${protocol}://${host}`;
};

/**
 * GET /robots.txt
 * Returns robots.txt with sitemap links
 */
router.get('/robots.txt', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const robotsTxt = await seoController.generateRobotsTxt(baseUrl);
    res.type('text/plain');
    res.send(robotsTxt);
  } catch (err) {
    console.error('Error generating robots.txt:', err);
    res.status(500).send('Error generating robots.txt');
  }
});

/**
 * GET /sitemap.xml
 * Main sitemap index
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const sitemap = await seoController.generateMainSitemap(baseUrl);
    res.type('application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('Error generating sitemap.xml:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /sitemap-services.xml
 * Sitemap for all service-location combinations
 */
router.get('/sitemap-services.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const sitemap = await seoController.generateServiceLocationSitemap(baseUrl);
    res.type('application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('Error generating sitemap-services.xml:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /sitemap-businesses.xml
 * Sitemap for all business profiles
 */
router.get('/sitemap-businesses.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const sitemap = await seoController.generateBusinessesSitemap(baseUrl);
    res.type('application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('Error generating sitemap-businesses.xml:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /api/seo/services
 * Get all available services (public API)
 */
router.get('/api/seo/services', async (req, res) => {
  try {
    const services = await seoController.getAllServices();
    res.json({
      success: true,
      data: services
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching services'
    });
  }
});

/**
 * GET /api/seo/locations
 * Get all available locations (public API)
 */
router.get('/api/seo/locations', async (req, res) => {
  try {
    const locations = await seoController.getAllLocations();
    res.json({
      success: true,
      data: locations
    });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations'
    });
  }
});

/**
 * GET /api/seo/service-locations
 * Get all service-location combinations (public API)
 */
router.get('/api/seo/service-locations', async (req, res) => {
  try {
    const combinations = await seoController.getServiceLocationCombinations();
    res.json({
      success: true,
      data: combinations,
      count: combinations.length
    });
  } catch (err) {
    console.error('Error fetching service-location combinations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching combinations'
    });
  }
});

/**
 * GET /api/seo/services/:serviceSlug/:locationSlug
 * Get businesses for a service-location combination (public API)
 * Used by React frontend to render service-location pages
 */
router.get('/api/seo/services/:serviceSlug/:locationSlug', async (req, res) => {
  try {
    const { serviceSlug, locationSlug } = req.params;
    const { businesses, serviceName, locationName } = await seoController.getBusinessesForServiceLocation(
      serviceSlug,
      locationSlug
    );

    if (!serviceName || !locationName) {
      return res.status(404).json({
        success: false,
        message: 'Service-location combination not found'
      });
    }

    res.json({
      success: true,
      serviceName,
      locationName,
      serviceSlug,
      locationSlug,
      businesses,
      count: businesses.length
    });
  } catch (err) {
    console.error('Error fetching businesses:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching businesses'
    });
  }
});

/**
 * GET /api/seo/business/:businessSlug
 * Get a single business by slug (public API)
 * Used by React frontend to render business profile pages
 */
router.get('/api/seo/business/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params;
    const business = await seoController.getBusinessBySlug(businessSlug);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error('Error fetching business:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching business'
    });
  }
});

/**
 * GET /api/seo/service-location-html/:serviceSlug/:locationSlug
 * Get pre-rendered HTML for service-location page (for crawlers)
 * Used by server-side rendering or prerendering
 */
router.get('/api/seo/service-location-html/:serviceSlug/:locationSlug', async (req, res) => {
  try {
    const { serviceSlug, locationSlug } = req.params;
    const baseUrl = getBaseUrl(req);
    const html = await seoController.generateServiceLocationPageHTML(serviceSlug, locationSlug, baseUrl);

    if (!html) {
      return res.status(404).send('Service-location combination not found');
    }

    res.type('text/html');
    res.send(html);
  } catch (err) {
    console.error('Error generating HTML:', err);
    res.status(500).send('Error generating page');
  }
});

/**
 * GET /api/seo/business-html/:businessSlug
 * Get pre-rendered HTML for business page (for crawlers)
 * Used by server-side rendering or prerendering
 */
router.get('/api/seo/business-html/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params;
    const baseUrl = getBaseUrl(req);
    const html = await seoController.generateBusinessPageHTML(businessSlug, baseUrl);

    if (!html) {
      return res.status(404).send('Business not found');
    }

    res.type('text/html');
    res.send(html);
  } catch (err) {
    console.error('Error generating HTML:', err);
    res.status(500).send('Error generating page');
  }
});

module.exports = router;
