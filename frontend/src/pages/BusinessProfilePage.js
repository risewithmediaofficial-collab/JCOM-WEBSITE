import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import SEOHead from '../components/SEOHead';
import ProfileAvatar from '../components/ProfileAvatar';
import StarRating from '../components/StarRating';
import { API_BASE_URL } from '../config/api';
import './BusinessProfilePage.css';

/**
 * Business Profile Page
 * Displays detailed information about a single business
 * Example URL: /business/ro-water-purification-abc123def45
 * 
 * SEO Features:
 * - Dynamic meta title: "{Business Name} - {Service} in {Location} | JCOM"
 * - Dynamic description: Business description or category
 * - LocalBusiness JSON-LD schema
 * - Breadcrumb schema
 * - Open Graph tags
 * - Canonical URL
 */
const BusinessProfilePage = () => {
  const { businessSlug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch business data
  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/seo/business/${businessSlug}`);

        if (!res.data.success) {
          setError('Business not found');
          setBusiness(null);
        } else {
          setBusiness(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading business profile');
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessSlug]);

  if (loading) return <Loader />;

  if (error || !business) {
    return (
      <>
        <Navbar />
        <div className="container error-container">
          <h1>Business Not Found</h1>
          <p>{error}</p>
          <Link to="/search" className="btn-primary">Back to Search</Link>
        </div>
      </>
    );
  }

  const seoTitle = `${business.businessName} - ${business.businessCategory} in ${business.locationName} | JCOM`;
  const seoDescription = business.businessDescription || `${business.businessName} on JCOM - ${business.businessCategory}`;
  const canonicalUrl = `${window.location.protocol}//${window.location.host}/business/${businessSlug}`;

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Businesses', path: '/search' },
    { label: business.businessName, path: null }
  ];

  // Generate LocalBusiness schema
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.businessName,
    description: seoDescription,
    telephone: business.phone,
    url: business.businessWebsite || canonicalUrl,
    image: business.profilePic ? `${API_BASE_URL}${business.profilePic}` : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address || '',
      addressLocality: business.locationName || '',
      addressCountry: 'IN'
    }
  };

  if (business.averageRating && business.ratingsCount > 0) {
    schemaData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.averageRating.toFixed(1),
      ratingCount: business.ratingsCount
    };
  }

  // Remove undefined properties
  Object.keys(schemaData).forEach(key => {
    if (schemaData[key] === undefined) delete schemaData[key];
  });

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        image={business.profilePic}
        schemaData={schemaData}
      />
      <Navbar />
      <Breadcrumbs items={breadcrumbs} />

      <div className="business-profile-page">
        <div className="container">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <ProfileAvatar user={business} size="xl" />
            </div>

            <div className="profile-info">
              <h1>{business.businessName}</h1>
              <p className="category">{business.businessCategory}</p>

              {business.averageRating > 0 && (
                <div className="rating-section">
                  <StarRating
                    rating={business.averageRating}
                    count={business.ratingsCount}
                    readonly
                  />
                </div>
              )}

              <div className="contact-info">
                <div className="info-item">
                  <span className="icon">📍</span>
                  <span className="value">{business.locationName}</span>
                </div>
                <div className="info-item">
                  <span className="icon">📞</span>
                  <a href={`tel:${business.phone}`} className="value">
                    {business.phone}
                  </a>
                </div>
                {business.address && (
                  <div className="info-item">
                    <span className="icon">🏢</span>
                    <span className="value">{business.address}</span>
                  </div>
                )}
              </div>

              {business.businessWebsite && (
                <div className="website-section">
                  <a
                    href={business.businessWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-website"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>

          {business.businessDescription && (
            <div className="profile-section">
              <h2>About</h2>
              <p className="description">{business.businessDescription}</p>
            </div>
          )}

          <div className="profile-section">
            <h2>Service Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <label>Service Category</label>
                <p>{business.businessCategory}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{business.locationName}</p>
              </div>
              <div className="detail-item">
                <label>Contact Number</label>
                <p>{business.phone}</p>
              </div>
              {business.address && (
                <div className="detail-item">
                  <label>Address</label>
                  <p>{business.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Services Section */}
          <div className="related-services-section">
            <h2>Other Verified Services in {business.locationName}</h2>
            <p className="section-description">
              Browse other verified service providers in {business.locationName}
            </p>
            <div className="related-link">
              <Link
                to={`/search?location=${encodeURIComponent(business.locationName)}`}
                className="btn-primary-outline"
              >
                View All Services in {business.locationName}
              </Link>
            </div>
          </div>

          {/* Trust Section */}
          <div className="trust-section">
            <h2>Why Trust This Business?</h2>
            <div className="trust-items">
              <div className="trust-item">
                <div className="icon">✓</div>
                <h3>Verified Member</h3>
                <p>Registered and verified on JCOM</p>
              </div>
              <div className="trust-item">
                <div className="icon">⭐</div>
                <h3>Rated & Reviewed</h3>
                <p>Transparent ratings from community</p>
              </div>
              <div className="trust-item">
                <div className="icon">🤝</div>
                <h3>Professional Network</h3>
                <p>Part of exclusive business network</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessProfilePage;
