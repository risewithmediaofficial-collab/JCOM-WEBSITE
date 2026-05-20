/**
 * Utility functions for slug generation and manipulation
 * Used for creating SEO-friendly URLs for services and locations
 */

/**
 * Generate a slug from a string
 * Example: "RO Water Purification" -> "ro-water-purification"
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate service slug from service name
 * @param {string} serviceName - Service name (e.g., "Digital Marketing", "RO Water")
 * @returns {string} - Service slug
 */
function generateServiceSlug(serviceName) {
  return generateSlug(serviceName);
}

/**
 * Generate location slug from location name
 * @param {string} locationName - Location name (e.g., "Krishnagiri", "Hosur")
 * @returns {string} - Location slug
 */
function generateLocationSlug(locationName) {
  return generateSlug(locationName);
}

/**
 * Generate business slug from business name and ID
 * Ensures uniqueness by appending ID
 * @param {string} businessName - Business name
 * @param {string} id - Unique identifier (usually MongoDB ObjectId)
 * @returns {string} - Business slug
 */
function generateBusinessSlug(businessName, id) {
  const baseSlug = generateSlug(businessName);
  if (id) {
    return `${baseSlug}-${id.toString().slice(-8).toLowerCase()}`;
  }
  return baseSlug;
}

/**
 * Convert slug back to readable format
 * Example: "ro-water-purification" -> "RO Water Purification"
 * @param {string} slug - Slug string
 * @returns {string} - Human-readable format
 */
function slugToTitle(slug) {
  if (!slug) return '';
  
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  generateSlug,
  generateServiceSlug,
  generateLocationSlug,
  generateBusinessSlug,
  slugToTitle
};
