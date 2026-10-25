import React, { useState } from 'react';

export default function AnnouncementCard({ announcement }) {
  const [expanded, setExpanded] = useState(false);

  const { title, body, category, priority, isPinned, publishAt, createdBy } = announcement;

  const isLong = body && body.length > 200;
  const displayedBody = isLong && !expanded ? `${body.slice(0, 200)}…` : body;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'urgent':
        return 'bg-danger text-white';
      case 'event':
        return 'bg-info text-white';
      case 'policy':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-white';
    }
  };

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'urgent':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Urgent Priority</span>;
      case 'high':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">High Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`card shadow-sm border-0 mb-3 ${isPinned ? 'border-start border-primary border-4' : ''}`}>
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            {isPinned && (
              <span className="badge bg-primary d-inline-flex align-items-center gap-1">
                <i className="bi bi-pin-angle-fill"></i> Pinned
              </span>
            )}
            <span className={`badge ${getCategoryColor(category)} text-uppercase`}>
              {category}
            </span>
            {getPriorityBadge(priority)}
          </div>
          <span className="text-muted small">
            {new Date(publishAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <h5 className="fw-bold text-dark mb-2">{title}</h5>

        {/* Safe body rendering */}
        <p className="text-secondary mb-2 text-pre-wrap" style={{ whiteSpace: 'pre-line' }}>
          {displayedBody}
        </p>

        {isLong && (
          <button
            className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Read full announcement →'}
          </button>
        )}

        {createdBy && (
          <div className="border-top pt-2 mt-2 text-muted small d-flex justify-content-between align-items-center">
            <span>Posted by: <strong>{createdBy.name || 'HR Team'}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
