import React, { useState, useEffect, useCallback } from 'react';
import { getPendingApprovals, getAllLeaves } from '../../api/leaves.js';
import DataTable from '../../components/DataTable.jsx';
import LeaveDecisionModal from '../../components/leaves/LeaveDecisionModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeaveApprovals() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ totalPages: 1, total: 0 });
  const [selectedLeave, setSelectedLeave] = useState(null);

  const loadPending = useCallback(async () => {
    try {
      const data = await getPendingApprovals();
      setPendingLeaves(data.leaves || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load pending leave approvals', 'danger');
    }
  }, [showToast]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getAllLeaves({ page: historyPage, limit: 10 });
      setHistoryLeaves(data.leaves || []);
      setHistoryPagination(data.pagination || { totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
      showToast('Failed to load team leave history', 'danger');
    }
  }, [historyPage, showToast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPending(), loadHistory()]);
    setLoading(false);
  }, [loadPending, loadHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Approved</span>;
      case 'pending':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Pending</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Rejected</span>;
      case 'cancelled':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const pendingColumns = [
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark">{row.user?.name || 'Employee'}</span>
          <div className="small text-muted">{row.user?.employeeCode} • {row.user?.designation}</div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      render: (row) => (
        <div>
          <span>{row.leaveType?.name}</span>
          {row.halfDay && <span className="badge bg-info-subtle text-info ms-2">Half Day</span>}
        </div>
      ),
    },
    {
      header: 'Dates',
      render: (row) => (
        <span>{row.startDate} {row.startDate !== row.endDate ? `to ${row.endDate}` : ''}</span>
      ),
    },
    {
      header: 'Days',
      render: (row) => <span className="badge bg-primary">{row.days} {row.days === 1 ? 'day' : 'days'}</span>,
    },
    {
      header: 'Reason',
      render: (row) => <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{row.reason}</span>,
    },
    {
      header: 'Applied On',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Action',
      align: 'end',
      render: (row) => (
        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={() => setSelectedLeave(row)}
        >
          <i className="bi bi-check2-circle"></i>
          Review
        </button>
      ),
    },
  ];

  const historyColumns = [
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark">{row.user?.name || 'Employee'}</span>
          <div className="small text-muted">{row.user?.employeeCode}</div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      render: (row) => row.leaveType?.name,
    },
    {
      header: 'Dates',
      render: (row) => <span>{row.startDate} {row.startDate !== row.endDate ? `to ${row.endDate}` : ''}</span>,
    },
    {
      header: 'Days',
      render: (row) => `${row.days} d`,
    },
    {
      header: 'Status',
      render: (row) => (
        <div>
          {getStatusBadge(row.status)}
          {row.status === 'rejected' && row.decisionNote && (
            <div className="small text-danger mt-1">Note: {row.decisionNote}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Decided By',
      render: (row) => row.decidedBy?.name || '—',
    },
  ];

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Team Leave Approvals</h2>
          <p className="text-muted mb-0">
            Review and approve leave applications submitted by your team members.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="bi bi-clock-history me-1"></i>
            Pending Approvals
            {pendingLeaves.length > 0 && (
              <span className="badge bg-danger ms-2">{pendingLeaves.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-journal-text me-1"></i>
            All Team Requests
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {activeTab === 'pending' ? (
            <DataTable
              columns={pendingColumns}
              data={pendingLeaves}
              loading={loading}
              emptyMessage="No pending leave requests to review at this time."
            />
          ) : (
            <DataTable
              columns={historyColumns}
              data={historyLeaves}
              loading={loading}
              emptyMessage="No team leave history found."
              pagination={{
                page: historyPage,
                totalPages: historyPagination.totalPages,
                onPageChange: (newPage) => setHistoryPage(newPage),
              }}
            />
          )}
        </div>
      </div>

      {/* Review / Decision Modal */}
      <LeaveDecisionModal
        show={!!selectedLeave}
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
        onSuccess={() => {
          setSelectedLeave(null);
          loadAll();
        }}
      />
    </div>
  );
}
