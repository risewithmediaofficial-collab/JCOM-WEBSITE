import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import ProfileAvatar from '../components/ProfileAvatar';

import { API_BASE_URL } from '../config/api';

const API = API_BASE_URL;

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (locationFilter) params.append('location', locationFilter);
      const res = await axios.get(`${API}/users/search?${params}`);
      setResults(res.data.results || []);
      setTotalResults(res.data.totalResults || 0);
      setSearched(true);
    } catch (err) {
      setResults([]);
      setTotalResults(0);
    }
    setLoading(false);
  }, [locationFilter, query]);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setInputVal(searchParams.get('q') || '');
    setLocationFilter(searchParams.get('location') || '');
  }, [searchParams]);

  useEffect(() => {
    if (query.trim().length >= 2) doSearch();
  }, [doSearch, query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    if (locationFilter) params.set('location', locationFilter);
    setSearchParams(params);
  };

  const handleLocationFilter = (location) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    setSearchParams(params);
  };

  const allLocations = [...new Set(results.map((result) => result.location))].sort();

  const visibleResults = useMemo(
    () => (locationFilter ? results.filter((result) => result.location === locationFilter) : results),
    [locationFilter, results]
  );

  const breadcrumbs = [
    { label: 'Home', to: '/' },
    { label: 'Search Results' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div style={{ padding: '80px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumbs items={breadcrumbs} />

        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>
            Find Business <span className="highlight-gold">Professionals</span>
          </h2>
          <p style={{ marginBottom: 24 }}>Search by keyword, business category, service, or name</p>
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              maxWidth: 680,
              margin: '0 auto',
              background: 'var(--bg-card)',
              borderRadius: 50,
              border: '1px solid var(--border-accent)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-gold)'
            }}
          >
            <SearchOutlined style={{ padding: '0 16px', color: 'var(--primary)', fontSize: '1.2rem' }} />
            <input
              type="text"
              placeholder="tax consultant, web design, catering, CA, IT..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', padding: '16px 0' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 50, margin: 6, padding: '10px 28px' }}>
              Search
            </button>
          </form>
        </div>

        {allLocations.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' }}>
            <button onClick={() => handleLocationFilter('')} className={`btn btn-sm ${!locationFilter ? 'btn-primary' : 'btn-ghost'}`}>
              All Locations ({totalResults})
            </button>
            {allLocations.map((loc) => (
              <button key={loc} onClick={() => handleLocationFilter(loc)} className={`btn btn-sm ${locationFilter === loc ? 'btn-primary' : 'btn-ghost'}`}>
                {loc}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="grid-2" style={{ gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>Search</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No results found for "{query}"</h4>
            <p>Try different keywords, or browse by category</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Found <strong style={{ color: 'var(--primary)' }}>{totalResults}</strong> results for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>", grouped by location
            </div>
            {visibleResults.map((group) => (
              <div key={group.location} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-accent)', borderRadius: 20 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: "'Outfit',sans-serif" }}>{group.location}</span>
                    <span className="badge badge-gold">{group.members.length}</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.members.map((member) => {
                    const detailLink = `/search/${member._id}?q=${encodeURIComponent(query)}${locationFilter ? `&location=${encodeURIComponent(locationFilter)}` : ''}`;
                    return (
                      <Link
                        key={member._id}
                        to={detailLink}
                        className="glass-card"
                        style={{ padding: '16px 20px', cursor: 'pointer', display: 'block' }}
                      >
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <ProfileAvatar
                            src={member.profilePic}
                            firstName={member.firstName}
                            lastName={member.lastName}
                            alt="Profile"
                            size={52}
                            borderRadius="50%"
                            fontSize={18}
                          />

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{member.firstName} {member.lastName}</h4>
                              <span className="badge badge-gold">{member.businessCategory}</span>
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.9rem' }}>{member.businessName}</div>
                            {member.businessService && (
                              <p style={{ fontSize: '0.82rem', margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {member.businessService}
                              </p>
                            )}

                            {member.keywords?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                {member.keywords.map((kw, index) => (
                                  <span key={`${kw}-${index}`} style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid var(--border-teal)', borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', color: 'var(--accent)' }}>
                                    #{kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                            <span className="btn btn-primary btn-sm">
                              <InfoCircleOutlined /> View Details
                            </span>
                            <span className="btn btn-outline btn-sm">Connect</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.tableName || 'JCOM Member'}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>Search</div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Search JCOM Members</h4>
            <p>Find verified business professionals by keyword, category, or name<br />Results now open on a dedicated business detail page</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['CA / Accountant', 'Web Design', 'Real Estate', 'Legal', 'IT Software', 'Healthcare'].map((sample) => (
                <button
                  key={sample}
                  onClick={() => {
                    const params = new URLSearchParams({ q: sample });
                    setInputVal(sample);
                    setQuery(sample);
                    setSearchParams(params);
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;


