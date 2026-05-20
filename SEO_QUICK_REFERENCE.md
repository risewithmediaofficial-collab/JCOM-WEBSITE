# JCOM SEO System - Quick Reference & Examples

## 🔍 Quick Examples

### Example 1: RO Water Services in Krishnagiri

#### URL Structure
```
Page: /services/ro-water/krishnagiri
API: /api/seo/services/ro-water/krishnagiri
```

#### What Gets Displayed
- Title: "RO Water Services in Krishnagiri | JCOM"
- Description: "Find verified RO Water service providers in Krishnagiri registered on JCOM."
- All businesses with:
  - businessService containing "RO Water"
  - locationName = "Krishnagiri"
  - status = "Approved"

#### Example Response
```json
{
  "success": true,
  "serviceName": "RO Water",
  "locationName": "Krishnagiri",
  "serviceSlug": "ro-water",
  "locationSlug": "krishnagiri",
  "count": 5,
  "businesses": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "businessName": "Raj Water Systems",
      "slug": "raj-water-systems-99439011",
      "businessCategory": "Plumbing",
      "businessDescription": "High-quality RO water purification...",
      "phone": "+91-9876543210",
      "locationName": "Krishnagiri",
      "address": "123 Main Street",
      "profilePic": "/uploads/user_507f1f77bcf86cd799439011.jpg",
      "averageRating": 4.8,
      "ratingsCount": 25
    },
    // ... more businesses
  ]
}
```

### Example 2: Digital Marketing Services in Hosur

#### URL Structure
```
Page: /services/digital-marketing/hosur
API: /api/seo/services/digital-marketing/hosur
```

#### Matching Criteria
```javascript
{
  status: "Approved",
  businessService: { $regex: "Digital Marketing", $options: "i" },
  locationName: { $regex: "Hosur", $options: "i" }
}
```

## 🏢 Business Profile Examples

### Example 1: Raj Water Systems Profile

#### URL Structure
```
Slug: raj-water-systems-99439011
Page: /business/raj-water-systems-99439011
API: /api/seo/business/raj-water-systems-99439011
```

#### How Slug is Generated
```javascript
// Input
businessName: "Raj Water Systems"
_id: "507f1f77bcf86cd799439011"

// Generation
baseSlug = "raj-water-systems" // normalized
slug = "raj-water-systems-99439011" // appended with last 8 chars of ID

// In URL
/business/raj-water-systems-99439011
```

#### What Gets Displayed
- Business name and logo
- Contact information
- Full description
- Ratings and reviews count
- Website link (if available)
- Address
- Related services in location

### Example 2: ABC Digital Agency Profile

#### URL Structure
```
Business: "ABC Digital Agency"
ID: 507f2a77bcf86cd799439022
Slug: abc-digital-agency-99439022
Page: /business/abc-digital-agency-99439022
```

## 📊 Database Query Examples

### Get All Approved Businesses for Service-Location

```javascript
// In MongoDB or via Mongoose
const businesses = await User.find({
  status: "Approved",
  businessService: { $regex: "RO Water", $options: "i" },
  locationName: { $regex: "Krishnagiri", $options: "i" }
})
.select('businessName slug businessCategory businessDescription phone locationName address profilePic averageRating ratingsCount')
.limit(50);
```

### Get All Unique Services

```javascript
const services = await User.find(
  { status: "Approved", businessService: { $exists: true, $ne: "" } },
  { businessService: 1 }
).distinct('businessService');

// Result: ["RO Water Purification", "Digital Marketing", ...]
```

### Get All Unique Locations

```javascript
const locations = await User.find(
  { status: "Approved", locationName: { $exists: true, $ne: "" } },
  { locationName: 1 }
).distinct('locationName');

// Result: ["Krishnagiri", "Hosur", "Chennai", ...]
```

### Get All Service-Location Combinations

```javascript
const combinations = await User.find({
  status: "Approved",
  businessService: { $exists: true, $ne: "" },
  locationName: { $exists: true, $ne: "" }
})
.select('businessService locationName')
.lean();

// Then deduplicate in application code
```

## 🌐 API Examples

### Get All Services
```bash
curl https://yourdomain.com/api/seo/services

# Response:
{
  "success": true,
  "data": [
    { "name": "RO Water Purification", "slug": "ro-water-purification" },
    { "name": "Digital Marketing", "slug": "digital-marketing" },
    { "name": "Plumbing Services", "slug": "plumbing-services" }
  ]
}
```

### Get All Locations
```bash
curl https://yourdomain.com/api/seo/locations

# Response:
{
  "success": true,
  "data": [
    { "name": "Krishnagiri", "slug": "krishnagiri" },
    { "name": "Hosur", "slug": "hosur" },
    { "name": "Chennai", "slug": "chennai" }
  ]
}
```

### Get Businesses for Service-Location
```bash
curl "https://yourdomain.com/api/seo/services/ro-water/krishnagiri"

# Response:
{
  "success": true,
  "serviceName": "RO Water Purification",
  "locationName": "Krishnagiri",
  "businesses": [
    {
      "businessName": "Raj Water Systems",
      "slug": "raj-water-systems-99439011",
      // ... business details
    }
  ],
  "count": 5
}
```

### Get Single Business
```bash
curl "https://yourdomain.com/api/seo/business/raj-water-systems-99439011"

# Response:
{
  "success": true,
  "data": {
    "businessName": "Raj Water Systems",
    "slug": "raj-water-systems-99439011",
    "businessCategory": "Plumbing",
    "businessDescription": "...",
    "phone": "+91-9876543210",
    "locationName": "Krishnagiri",
    "address": "123 Main Street",
    "profilePic": "/uploads/...",
    "averageRating": 4.8,
    "ratingsCount": 25,
    "businessWebsite": "https://..."
  }
}
```

## 📱 Frontend Component Usage

### Using ServiceLocationPage
```jsx
// App.js
<Route path="/services/:serviceSlug/:locationSlug" element={<ServiceLocationPage />} />

// URLs generated:
// /services/ro-water/krishnagiri
// /services/digital-marketing/hosur
// /services/plumbing-services/bangalore
```

### Using BusinessProfilePage
```jsx
// App.js
<Route path="/business/:businessSlug" element={<BusinessProfilePage />} />

// URLs generated:
// /business/raj-water-systems-99439011
// /business/abc-digital-agency-99439022
// /business/john-plumbing-services-abc123
```

## 🔗 Link Generation

### Generate Service-Location Link
```javascript
// Slug format
const serviceSlug = "ro-water-purification"; // lowercase, no spaces
const locationSlug = "krishnagiri";

// Create link
const url = `/services/${serviceSlug}/${locationSlug}`;
// Result: /services/ro-water-purification/krishnagiri
```

### Generate Business Link
```javascript
// Using slug from database
const businessSlug = "raj-water-systems-99439011";

// Create link
const url = `/business/${businessSlug}`;
// Result: /business/raj-water-systems-99439011

// In JSX
<Link to={url}>{business.businessName}</Link>
```

## 🗺️ Sitemap Examples

### Main Sitemap Index
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://yourdomain.com/sitemap-services.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://yourdomain.com/sitemap-businesses.xml</loc>
  </sitemap>
</sitemapindex>
```

### Service-Location Sitemap Entry
```xml
<url>
  <loc>https://yourdomain.com/services/ro-water/krishnagiri</loc>
  <lastmod>2024-01-15T10:30:00Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

### Business Sitemap Entry
```xml
<url>
  <loc>https://yourdomain.com/business/raj-water-systems-99439011</loc>
  <lastmod>2024-01-15T10:30:00Z</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

## 🏆 SEO Best Practices

### For Service-Location Pages

1. **Keep descriptions specific to location**
   ```
   ✓ Good: "Find verified RO Water services in Krishnagiri"
   ✗ Bad: "RO Water services"
   ```

2. **Include internal links to related services**
   ```jsx
   <Link to={`/services/${otherService}/${locationSlug}`}>
     Other Services in {locationName}
   </Link>
   ```

3. **Add breadcrumb navigation**
   ```jsx
   <Breadcrumbs items={[
     { label: 'Home', path: '/' },
     { label: 'RO Water', path: '/services/ro-water' },
     { label: 'Krishnagiri', path: null }
   ]} />
   ```

### For Business Pages

1. **Complete business information**
   - Business name
   - Category
   - Description
   - Phone
   - Address
   - Website

2. **Enable ratings/reviews**
   ```jsx
   {business.averageRating > 0 && (
     <div className="rating">
       ★ {business.averageRating.toFixed(1)} ({business.ratingsCount})
     </div>
   )}
   ```

3. **Rich media**
   - Business logo/image
   - Photo gallery (future enhancement)

## 🔧 Common Customizations

### Change Title Format
```javascript
// Current
const title = `${serviceName} Services in ${locationName} | JCOM`;

// Alternative
const title = `Best ${serviceName} in ${locationName} - JCOM`;
// const title = `${serviceName} Providers - ${locationName} | JCOM`;
```

### Add More Business Fields to Display
```javascript
// In ServiceLocationPage, modify API call:
const res = await axios.get(`${API_BASE_URL}/api/seo/services/${serviceSlug}/${locationSlug}`);

// Then use additional fields:
// business.keywords
// business.websiteName
// business.totalConnections
// business.givenRequests
```

### Modify Sitemap Update Frequency
```javascript
// In seoController.js
// Change changefreq value:
// "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"

xml += `    <changefreq>weekly</changefreq>\n`; // Change this
```

## 📋 Important Notes

### URL Slug Rules
- Always lowercase
- Replace spaces with hyphens
- Remove special characters
- No trailing/leading hyphens
- Business slugs include last 8 chars of ID for uniqueness

### Business Status Filtering
Only "Approved" businesses show in:
- Service-location pages
- Sitemaps
- APIs

Pending/Rejected businesses:
- Do NOT appear in search results
- Do NOT appear in sitemaps
- Cannot be accessed via public URLs

### Sitemap Limits
- Max 50,000 URLs per sitemap
- Max 50MB per sitemap
- If exceeded, split into numbered sitemaps

### Canonical URLs
Always use full absolute URLs:
```
✓ https://yourdomain.com/services/ro-water/krishnagiri
✗ /services/ro-water/krishnagiri (relative)
✗ yourdomain.com/services/... (missing protocol)
```

---

**Last Updated:** 2024
**Version:** 1.0
