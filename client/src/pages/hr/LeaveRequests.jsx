import React, { useState, useEffect, useCallback } from 'react';
import { getPendingApprovals, getAllLeaves } from '../../api/leaves.js';
import { departmentApi } from '../../api/departments.js';
import DataTable from '../../components/DataTable.jsx';
import LeaveDecisionModal from '../../components/leaves/LeaveDecisionModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeaveRequests() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [departments, setDepartments] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for 'all' tab
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    departmentApi.list().then((res) => setDepartments(res.data.data || [])).catch(console.error);
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const data = await getPendingApprovals();
      setPendingLeaves(data.leaves || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load pending leave requests', 'danger');
    }
  }, [showToast]);

  const loadAll = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;

      const data = await getAllLeaves(params);
      setAllLeaves(data.leaves || []);
      setPagination(data.pagination || { totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
      showToast('Failed to load leave records', 'danger');
    }
  }, [page, statusFilter, deptFilter, showToast]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPending(), loadAll()]);
    setLoading(false);
  }, [loadPending, loadAll]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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
      header: 'Assigned To',
      render: (row) => row.assignedTo ? row.assignedTo.name : <span className="badge bg-info-subtle text-info">HR Pool</span>,
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

  const allColumns = [
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
          <h2 className="fw-bold mb-1">Company Leave Requests</h2>
          <p className="text-muted mb-0">
            Monitor, approve, and track employee leave requests across all departments.
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
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="bi bi-journal-text me-1"></i>
            All Leave Records
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="card shadow-sm border-0">
        {activeTab === 'all' && (
          <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <span className="fw-semibold text-muted">Filter Requests</span>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm w-auto"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="form-select form-select-sm w-auto"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}

        <div className="card-body p-0">
          {activeTab === 'pending' ? (
            <DataTable
              columns={pendingColumns}
              data={pendingLeaves}
              loading={loading}
              emptyMessage="No pending leave requests in the queue."
            />
          ) : (
            <DataTable
              columns={allColumns}
              data={allLeaves}
              loading={loading}
              emptyMessage="No leave records matching the selected filters."
              pagination={{
                page,
                totalPages: pagination.totalPages,
                onPageChange: (newPage) => setPage(newPage),
              }}
            />
          )}
        </div>
      </div>

      {/* Review Modal */}
      <LeaveDecisionModal
        show={!!selectedLeave}
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
        onSuccess={() => {
          setSelectedLeave(null);
          refreshAll();
        }}
      />
    </div>
  );
}
