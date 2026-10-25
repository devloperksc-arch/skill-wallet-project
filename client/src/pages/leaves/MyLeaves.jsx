import React, { useState, useEffect, useCallback } from 'react';
import { getOwnBalances, getMyLeaves, cancelLeave } from '../../api/leaves.js';
import LeaveBalanceCards from '../../components/leaves/LeaveBalanceCards.jsx';
import ApplyLeaveModal from '../../components/leaves/ApplyLeaveModal.jsx';
import DataTable from '../../components/DataTable.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function MyLeaves() {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadBalances = useCallback(async () => {
    try {
      const data = await getOwnBalances(selectedYear);
      setBalances(data.balances || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load leave balances', 'danger');
    }
  }, [selectedYear, showToast]);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        year: selectedYear,
      };
      if (statusFilter) params.status = statusFilter;

      const data = await getMyLeaves(params);
      setLeaves(data.leaves || []);
      setPagination(data.pagination || { totalPages: 1, total: 0 });
    } catch (err) {
      console.error(err);
      showToast('Failed to load leave history', 'danger');
    } finally {
      setLoading(false);
    }
  }, [page, selectedYear, statusFilter, showToast]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setCancellingId(leaveId);
    try {
      await cancelLeave(leaveId);
      showToast('Leave request cancelled successfully', 'success');
      loadBalances();
      loadLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel leave request';
      showToast(msg, 'danger');
    } finally {
      setCancellingId(null);
    }
  };

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

  const columns = [
    {
      header: 'Leave Type',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark">{row.leaveType?.name || 'Leave'}</span>
          {row.halfDay && <span className="badge bg-info-subtle text-info ms-2">Half Day</span>}
        </div>
      ),
    },
    {
      header: 'Dates',
      render: (row) => (
        <span>
          {row.startDate} {row.startDate !== row.endDate ? `to ${row.endDate}` : ''}
        </span>
      ),
    },
    {
      header: 'Days',
      render: (row) => (
        <span className="fw-semibold">{row.days} {row.days === 1 ? 'day' : 'days'}</span>
      ),
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
      header: 'Applied On',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      align: 'end',
      render: (row) => {
        const canCancel =
          row.status === 'pending' ||
          (row.status === 'approved' && row.startDate > today);

        if (!canCancel) return <span className="text-muted small">—</span>;

        return (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleCancel(row._id)}
            disabled={cancellingId === row._id}
          >
            {cancellingId === row._id ? 'Cancelling…' : 'Cancel'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="container-fluid py-2">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">My Leaves</h2>
          <p className="text-muted mb-0">
            View your allocated quotas, track active requests, and apply for time off.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select w-auto"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowApplyModal(true)}
          >
            <i className="bi bi-calendar-plus"></i>
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <LeaveBalanceCards balances={balances} />

      {/* Leave History Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5 className="fw-bold mb-0">Leave History</h5>
          <div className="d-flex gap-2">
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
        <div className="card-body p-0">
          <DataTable
            columns={columns}
            data={leaves}
            loading={loading}
            emptyMessage="No leave requests found for this period."
            pagination={{
              page,
              totalPages: pagination.totalPages,
              onPageChange: (newPage) => setPage(newPage),
            }}
          />
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        show={showApplyModal}
        balances={balances}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => {
          loadBalances();
          loadLeaves();
        }}
      />
    </div>
  );
}
