import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardData } from '../../api/dashboard.js';
import { decideLeave } from '../../api/leaves.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from 'react-router';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await getDashboardData();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load Manager dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApprove = async (leaveId) => {
    setActionLoading(true);
    try {
      await decideLeave(leaveId, { decision: 'approved', note: 'Approved via Manager Dashboard' });
      showToast('Leave request approved', 'success');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve leave', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const d = dashboardData || {};
  const pendingApprovals = d.pendingApprovals || [];
  const trainings = d.upcomingTeamTrainings || [];

  return (
    <div className="container-fluid py-4">
      <PageHeader
        title="Manager Overview"
        subtitle={`Welcome back, ${user?.name || 'Manager'}. Here is your direct reports team pulse and pending actions.`}
      />

      {/* Hero Welcome Banner */}
      <div className="card border-0 bg-dark text-white rounded-4 shadow-sm mb-4 p-4 overflow-hidden position-relative">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-primary text-white fw-semibold mb-2 px-3 py-1 rounded-pill">
                Team Management Portal
              </span>
              <h3 className="fw-bold mb-1">{user?.name}</h3>
              <p className="text-white-50 mb-0">
                {user?.designation || 'Team Lead'} &bull; {user?.department?.name || 'Engineering'} &bull; Employee Code: {user?.employeeCode}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light fw-semibold px-3 py-2 rounded-3"
                onClick={() => navigate('/attendance/team')}
              >
                <i className="bi bi-clock-history me-1"></i> Team Attendance
              </button>
              <button
                className="btn btn-primary fw-semibold px-3 py-2 rounded-3 shadow-sm"
                onClick={() => navigate('/team')}
              >
                <i className="bi bi-people me-1"></i> View Direct Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/team')}>
          <StatCard
            title="Direct Reports"
            value={loading ? '—' : d.teamSize}
            icon="bi-people-fill"
            color="primary"
            trend="Active team workforce"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance/team')}>
          <StatCard
            title="Present Today"
            value={loading ? '—' : d.teamPresentToday}
            icon="bi-person-check-fill"
            color="success"
            trend={`${d.teamLateToday || 0} late arrivals`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaves/approvals')}>
          <StatCard
            title="Pending Approvals"
            value={loading ? '—' : pendingApprovals.length}
            icon="bi-hourglass-split"
            color="warning"
            trend="Awaiting your review"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance/team')}>
          <StatCard
            title="On Leave Today"
            value={loading ? '—' : d.teamOnLeaveToday}
            icon="bi-calendar-check"
            color="info"
            trend="Approved time-off"
          />
        </div>
      </div>

      {/* Quick Approvals & Team Trainings Row */}
      <div className="row g-4 mb-4">
        {/* Pending Approvals Quick Panel */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clipboard-check text-warning fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">Pending Leave Approvals</h5>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/leaves/approvals')}>
                Review All ({pendingApprovals.length}) &rarr;
              </button>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading pending requests...</div>
              ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-check-circle fs-2 text-success mb-2 d-block"></i>
                  All caught up! No pending leave requests from your team.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {pendingApprovals.slice(0, 4).map((req) => (
                    <div
                      key={req._id}
                      className="list-group-item d-flex flex-wrap justify-content-between align-items-center p-3"
                    >
                      <div>
                        <div className="fw-bold text-dark">{req.user?.name}</div>
                        <div className="small text-muted">
                          {req.leaveType?.name} &bull; {req.days} Day(s) &bull;{' '}
                          <span className="text-dark fw-medium">
                            {req.startDate} to {req.endDate}
                          </span>
                        </div>
                        {req.reason && <div className="small text-secondary fst-italic">"{req.reason}"</div>}
                      </div>

                      <div className="d-flex gap-2 mt-2 mt-sm-0">
                        <button
                          className="btn btn-success btn-sm rounded-3 d-flex align-items-center gap-1"
                          disabled={actionLoading}
                          onClick={() => handleQuickApprove(req._id)}
                        >
                          <i className="bi bi-check-lg"></i>
                          <span>Quick Approve</span>
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm rounded-3"
                          onClick={() => navigate('/leaves/approvals')}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Team Trainings */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard text-primary fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">Upcoming Team Trainings</h5>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/trainings')}>
                Manage &rarr;
              </button>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading trainings...</div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-mortarboard fs-2 text-secondary mb-2 d-block opacity-50"></i>
                  No upcoming team workshops scheduled.
                  <div className="mt-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/trainings')}>
                      Create Program
                    </button>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {trainings.map((t) => (
                    <div
                      key={t._id}
                      className="list-group-item d-flex justify-content-between align-items-center p-3 cursor-pointer"
                      onClick={() => navigate(`/trainings/${t._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="fw-semibold text-dark">{t.title}</div>
                        <small className="text-muted">
                          {new Date(t.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} &bull;{' '}
                          {t.mode}
                        </small>
                      </div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-capitalize">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Panel */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Company Bulletins</h5>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/announcements')}>
            View All ({d.latestAnnouncements?.length || 0}) &rarr;
          </button>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading bulletins...</div>
          ) : !d.latestAnnouncements || d.latestAnnouncements.length === 0 ? (
            <div className="text-center py-4 text-muted">No recent announcements posted.</div>
          ) : (
            d.latestAnnouncements.map((item) => <AnnouncementCard key={item._id} announcement={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
