import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import SEOHead from '../components/SEOHead';
import ProfileAvatar from '../components/ProfileAvatar';
import StarRating from '../components/StarRating';
import { API_BASE_URL } from '../config/api';
import './ServiceLocationPage.css';

/**
 * Service-Location Listing Page
 * Displays all approved businesses for a specific service in a specific location
 * Example URL: /services/ro-water/krishnagiri
 * 
 * SEO Features:
 * - Dynamic meta title: "{Service Name} Services in {Location} | JCOM"
 * - Dynamic description: "Find verified {Service Name} service providers in {Location}"
 * - ItemList JSON-LD schema
 * - Breadcrumb schema
 * - Canonical URL
 */
const ServiceLocationPage = () => {
  const { serviceSlug, locationSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch data for this service-location combination
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [seoRes, servicesRes, locationsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/seo/services/${serviceSlug}/${locationSlug}`),
          axios.get(`${API_BASE_URL}/api/seo/services`),
          axios.get(`${API_BASE_URL}/api/seo/locations`)
        ]);

        if (!seoRes.data.success) {
          setError('Service-location combination not found');
          setData(null);
        } else {
          setData(seoRes.data);
          setServices(servicesRes.data.data || []);
          setLocations(locationsRes.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading services');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug, locationSlug]);

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <>
        <Navbar />
        <div className="container error-container">
          <h1>Service Not Found</h1>
          <p>{error}</p>
          <Link to="/search" className="btn-primary">Back to Search</Link>
        </div>
      </>
    );
  }

  const { serviceName, locationName, businesses } = data;
  const seoTitle = `${serviceName} Services in ${locationName} | JCOM`;
  const seoDescription = `Find verified ${serviceName} service providers in ${locationName} registered on JCOM.`;
  const canonicalUrl = `${window.location.protocol}//${window.location.host}/services/${serviceSlug}/${locationSlug}`;

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: serviceName, path: `/services/${serviceSlug}` },
    { label: locationName, path: null }
  ];

  // Generate schema markup
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${serviceName} services in ${locationName}`,
    description: seoDescription,
    itemListElement: businesses.slice(0, 10).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.businessName,
      url: `/business/${b.slug}`,
      image: b.profilePic
    }))
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        schemaData={schemaData}
      />
      <Navbar />
      <Breadcrumbs items={breadcrumbs} />

      <div className="service-location-page">
        <div className="container">
          <div className="page-header">
            <h1>{serviceName} Services in {locationName}</h1>
            <p className="description">{seoDescription}</p>
            <p className="count">
              Found <strong>{businesses.length}</strong> {businesses.length === 1 ? 'service' : 'services'}
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="no-results">
              <p>No services found for this combination.</p>
              <Link to="/search" className="btn-primary">Search Other Services</Link>
            </div>
          ) : (
            <>
              <div className="filter-section">
                <div className="filters">
                  {services.length > 0 && (
                    <div className="filter-group">
                      <label>Change Service:</label>
                      <select
                        value={serviceSlug}
                        onChange={(e) => navigate(`/services/${e.target.value}/${locationSlug}`)}
                      >
                        {services.map(s => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {locations.length > 0 && (
                    <div className="filter-group">
                      <label>Change Location:</label>
                      <select
                        value={locationSlug}
                        onChange={(e) => navigate(`/services/${serviceSlug}/${e.target.value}`)}
                      >
                        {locations.map(l => (
                          <option key={l.slug} value={l.slug}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="businesses-grid">
                {businesses.map((business) => (
                  <Link
                    key={business._id}
                    to={`/business/${business.slug}`}
                    className="business-card-link"
                  >
                    <div className="business-card">
                      <div className="card-header">
                        <ProfileAvatar user={business} size="lg" />
                        <div className="card-title">
                          <h3>{business.businessName}</h3>
                          <p className="category">{business.businessCategory}</p>
                        </div>
                      </div>

                      <div className="card-body">
                        <p className="description">{business.businessDescription}</p>
                        <p className="location">📍 {business.locationName}</p>
                        <p className="phone">📞 {business.phone}</p>
                      </div>

                      {business.averageRating > 0 && (
                        <div className="card-footer">
                          <StarRating
                            rating={business.averageRating}
                            count={business.ratingsCount}
                            readonly
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Related Services and Locations */}
              <div className="related-section">
                <div className="related-box">
                  <h3>Explore Other Services in {locationName}</h3>
                  <div className="related-links">
                    {services.slice(0, 5).map(s => (
                      <Link
                        key={s.slug}
                        to={`/services/${s.slug}/${locationSlug}`}
                        className="link-tag"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="related-box">
                  <h3>Find {serviceName} in Other Locations</h3>
                  <div className="related-links">
                    {locations.slice(0, 5).map(l => (
                      <Link
                        key={l.slug}
                        to={`/services/${serviceSlug}/${l.slug}`}
                        className="link-tag"
                      >
                        {l.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ServiceLocationPage;
