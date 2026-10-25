import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { employeeApi } from '../../api/employees.js';
import { departmentApi } from '../../api/departments.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmployeeFormModal from './EmployeeFormModal.jsx';
import ResetPasswordModal from '../../components/ResetPasswordModal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Dropdown from 'react-bootstrap/Dropdown';

export default function Employees() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Temporary password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({ name: '', password: '', isNew: false });

  // Status toggle confirmation
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentApi.list();
      setDepartments(res.data.data || []);
    } catch (err) {
      // non-critical
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy,
        order: sortOrder,
      };
      if (search.trim()) params.q = search.trim();
      if (departmentFilter) params.department = departmentFilter;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await employeeApi.list(params);
      setEmployees(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
    } catch (err) {
      showToast('Failed to load employee list', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, departmentFilter, roleFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleFormSuccess = (emp, isNew, temporaryPassword) => {
    if (isNew && temporaryPassword) {
      setPasswordModalData({
        name: emp.name,
        password: temporaryPassword,
        isNew: true,
      });
      setShowPasswordModal(true);
      showToast(`Employee ${emp.name} created!`, 'success');
    } else {
      showToast(`Employee ${emp.name} updated!`, 'success');
    }
    fetchEmployees();
  };

  const handleResetPassword = async (emp) => {
    try {
      const res = await employeeApi.resetPassword(emp._id);
      setPasswordModalData({
        name: emp.name,
        password: res.data.data.temporaryPassword,
        isNew: false,
      });
      setShowPasswordModal(true);
      showToast('Temporary password generated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
    try {
      setStatusLoading(true);
      await employeeApi.updateStatus(statusTarget._id, nextStatus);
      showToast(`Employee marked as ${nextStatus}`, 'success');
      setStatusTarget(null);
      fetchEmployees();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const columns = [
    {
      key: 'employeeCode',
      label: 'Code',
      sortable: true,
      render: (row) => (
        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
          {row.employeeCode}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Employee',
      sortable: true,
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold small"
            style={{ width: '34px', height: '34px', minWidth: '34px' }}
          >
            {row.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <div
              className="fw-semibold text-dark hover-primary cursor-pointer text-decoration-none"
              onClick={() => navigate(`/employees/${row._id}`)}
              style={{ cursor: 'pointer' }}
            >
              {row.name}
            </div>
            <small className="text-muted">{row.email}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <div>
          <div className="fw-medium text-dark small">{row.department?.name || '—'}</div>
          {row.designation && <small className="text-muted">{row.designation}</small>}
        </div>
      ),
    },
    {
      key: 'manager',
      label: 'Reporting Manager',
      render: (row) =>
        row.manager ? (
          <div>
            <div className="small fw-medium text-dark">{row.manager.name}</div>
            <small className="text-muted">{row.manager.employeeCode}</small>
          </div>
        ) : (
          <span className="text-muted small fst-italic">HR Pool</span>
        ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => {
        const roleColors = {
          hr: 'bg-primary-subtle text-primary border border-primary-subtle',
          manager: 'bg-info-subtle text-info border border-info-subtle',
          employee: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
        };
        return (
          <span className={`badge rounded-pill ${roleColors[row.role] || 'bg-light text-dark'} text-uppercase px-2 py-1`} style={{ fontSize: '0.7rem' }}>
            {row.role}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      tdClassName: 'text-end',
      render: (row) => (
        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="btn btn-light btn-sm py-1 px-2 border-0 rounded-2">
            <i className="bi bi-three-dots-vertical"></i>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm border-0 rounded-3 py-1">
            <Dropdown.Item onClick={() => navigate(`/employees/${row._id}`)} className="small py-2">
              <i className="bi bi-eye me-2 text-muted"></i> View Details
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => {
                setEditingEmployee(row);
                setShowCreateModal(true);
              }}
              className="small py-2"
            >
              <i className="bi bi-pencil me-2 text-muted"></i> Edit Record
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleResetPassword(row)} className="small py-2">
              <i className="bi bi-key me-2 text-muted"></i> Reset Password
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => setStatusTarget(row)}
              className={`small py-2 ${row.status === 'active' ? 'text-danger' : 'text-success'}`}
              disabled={row._id === currentUser?._id}
            >
              <i className={`bi bi-${row.status === 'active' ? 'slash-circle' : 'check-circle'} me-2`}></i>
              {row.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Directory & Workforce"
        subtitle="Complete record of employees, reporting lines, and access privileges"
        breadcrumb={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Employees', active: true },
        ]}
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 rounded-3 shadow-sm"
            onClick={() => {
              setEditingEmployee(null);
              setShowCreateModal(true);
            }}
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Employee</span>
          </button>
        }
      />

      <SearchFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, code..."
        filters={[
          {
            key: 'department',
            label: 'Department',
            value: departmentFilter,
            options: departments.map((d) => ({ label: d.name, value: d._id })),
          },
          {
            key: 'role',
            label: 'Role',
            value: roleFilter,
            options: [
              { label: 'HR Admin', value: 'hr' },
              { label: 'Manager', value: 'manager' },
              { label: 'Employee', value: 'employee' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        onFilterChange={(key, val) => {
          if (key === 'department') setDepartmentFilter(val);
          if (key === 'role') setRoleFilter(val);
          if (key === 'status') setStatusFilter(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No employees matched"
        emptyDescription="Try adjusting your search criteria or clearing filters."
        emptyIcon="bi-people"
      />

      {/* Create / Edit Employee Modal */}
      {showCreateModal && (
        <EmployeeFormModal
          show={showCreateModal}
          employee={editingEmployee}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Temporary Password Modal */}
      <ResetPasswordModal
        show={showPasswordModal}
        employeeName={passwordModalData.name}
        temporaryPassword={passwordModalData.password}
        isNewUser={passwordModalData.isNew}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        show={Boolean(statusTarget)}
        title={`${statusTarget?.status === 'active' ? 'Deactivate' : 'Reactivate'} Employee`}
        message={`Are you sure you want to mark ${statusTarget?.name} (${statusTarget?.employeeCode}) as ${
          statusTarget?.status === 'active' ? 'inactive' : 'active'
        }? ${
          statusTarget?.status === 'active'
            ? 'This will immediately terminate all active sessions and prevent further access.'
            : 'This will restore their access to the system.'
        }`}
        confirmText={statusTarget?.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
        variant={statusTarget?.status === 'active' ? 'danger' : 'success'}
        loading={statusLoading}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}
