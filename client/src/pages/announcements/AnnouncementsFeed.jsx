import React, { useState, useEffect, useCallback } from 'react';
import { getAnnouncements } from '../../api/announcements.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';

export default function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory || undefined,
        q: searchQuery || undefined,
        page,
        limit: 10,
      };
      const res = await getAnnouncements(params);
      setAnnouncements(res.announcements || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, page]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'General', value: 'general' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Policy Updates', value: 'policy' },
    { label: 'Company Events', value: 'event' },
  ];

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '960px' }}>
      {/* Page Header */}
      <div className="mb-4 text-center text-md-start">
        <h2 className="fw-bold text-dark mb-1">Company Announcements & News</h2>
        <p className="text-secondary small mb-0">
          Stay informed with official company announcements, policy changes, and events
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search announcements by title or content..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="col-12 col-md-6">
              <div className="d-flex flex-wrap gap-1 justify-content-md-end">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`btn btn-sm ${
                      selectedCategory === cat.value
                        ? 'btn-primary'
                        : 'btn-outline-secondary'
                    }`}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setPage(1);
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div>
        {loading ? (
          <div className="card shadow-sm border-0 p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="card shadow-sm border-0 p-5 text-center text-muted">
            <i className="bi bi-megaphone fs-1 text-secondary mb-3 d-block opacity-50"></i>
            <h5 className="fw-bold text-dark">No Announcements Found</h5>
            <p className="text-secondary small mb-0">
              There are no active announcements matching your selected criteria.
            </p>
          </div>
        ) : (
          announcements.map((item) => (
            <AnnouncementCard key={item._id} announcement={item} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="small text-muted">
            Showing page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
