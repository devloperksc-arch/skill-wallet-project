import crypto from 'crypto';
import { User, generateEmployeeCode } from '../models/user.model.js';
import { Department } from '../models/department.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { LeaveRequest } from '../models/leaveRequest.model.js';
import { ensureBalances } from '../services/leave.service.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateTemporaryPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  let pwd = '';
  pwd += uppers[crypto.randomInt(0, uppers.length)];
  pwd += numbers[crypto.randomInt(0, numbers.length)];
  pwd += symbols[crypto.randomInt(0, symbols.length)];

  const all = chars + uppers + numbers + symbols;
  for (let i = 0; i < 9; i++) {
    pwd += all[crypto.randomInt(0, all.length)];
  }

  // Fisher–Yates shuffle with a CSPRNG (the old sort(Math.random) was biased and not cryptographic)
  const arr = pwd.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export async function listEmployees(req, res) {
  const str = (v) => (typeof v === 'string' ? v : undefined);
  const { page = 1, limit = 10, order = 'desc' } = req.query;
  const q = str(req.query.q);
  const department = str(req.query.department);
  const role = str(req.query.role);
  const status = str(req.query.status);
  const manager = str(req.query.manager);
  const SORTABLE = ['createdAt', 'name', 'email', 'employeeCode', 'designation', 'dateOfJoining', 'status', 'role'];
  const sortBy = SORTABLE.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Manager is strictly scoped to direct reports only
  if (req.user.role === ROLES.MANAGER) {
    filter.manager = req.user._id;
  } else if (manager) {
    filter.manager = manager;
  }

  if (department) filter.department = department;
  if (role) filter.role = role;
  if (status) filter.status = status;

  if (q && q.trim()) {
    const escaped = escapeRegex(q.trim());
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { employeeCode: regex }];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name code')
      .populate('manager', 'name email employeeCode designation')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
}

export async function getDirectory(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const filter = { status: USER_STATUS.ACTIVE };

  if (q && q.trim()) {
    const escaped = escapeRegex(q.trim());
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { employeeCode: regex }, { designation: regex }];
  }

  const employees = await User.find(filter, 'name employeeCode designation department email role phone')
    .populate('department', 'name code')
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: employees });
}

export async function getTeam(req, res) {
  const team = await User.find(
    { manager: req.user._id, status: USER_STATUS.ACTIVE },
    'name employeeCode email designation department phone dateOfJoining'
  )
    .populate('department', 'name code')
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: team });
}

export async function getEmployee(req, res) {
  const employee = await User.findById(req.params.id)
    .populate('department', 'name code')
    .populate('manager', 'name email employeeCode designation')
    .lean();

  if (!employee) throw ApiError.notFound('Employee not found');

  // Authorization check
  const isSelf = employee._id.toString() === req.user._id.toString();
  const isHr = req.user.role === ROLES.HR;
  const isDirectManager = employee.manager?._id?.toString() === req.user._id.toString();

  if (!isHr && !isSelf && !isDirectManager) {
    throw ApiError.forbidden('You do not have permission to view this employee profile');
  }

  res.json({ success: true, data: employee });
}

export async function createEmployee(req, res) {
  const body = req.validated;

  const existingEmail = await User.findOne({ email: body.email });
  if (existingEmail) throw ApiError.conflict('An employee with this email already exists');

  if (body.department) {
    const deptExists = await Department.exists({ _id: body.department });
    if (!deptExists) throw ApiError.badRequest('Specified department does not exist');
  }

  if (body.manager) {
    const mgr = await User.findById(body.manager);
    if (!mgr || (mgr.role !== ROLES.MANAGER && mgr.role !== ROLES.HR)) {
      throw ApiError.badRequest('Assigned manager must have Manager or HR role');
    }
  }

  const employeeCode = await generateEmployeeCode();
  const temporaryPassword = generateTemporaryPassword();

  const user = await User.create({
    ...body,
    employeeCode,
    passwordHash: temporaryPassword, // pre('save') hook will hash this
    mustChangePassword: true,
  });

  await ensureBalances(user._id, new Date().getFullYear());

  const created = await User.findById(user._id)
    .populate('department', 'name code')
    .populate('manager', 'name email employeeCode')
    .lean();

  res.status(201).json({
    success: true,
    data: {
      user: created,
      temporaryPassword,
    },
  });
}

export async function updateEmployee(req, res) {
  const { id } = req.params;
  const body = req.validated;

  const employee = await User.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  // Prevent HR from demoting themselves
  if (id === req.user._id.toString() && body.role && body.role !== ROLES.HR) {
    throw ApiError.badRequest('You cannot change your own HR role');
  }

  // Prevent changing role away from Manager if they have direct reports
  if (body.role && body.role !== employee.role && employee.role === ROLES.MANAGER) {
    const directReports = await User.countDocuments({ manager: employee._id });
    if (directReports > 0) {
      throw ApiError.conflict('Cannot change role: user has direct reports. Reassign them first.');
    }
  }

  if (body.email && body.email !== employee.email) {
    const existing = await User.findOne({ email: body.email });
    if (existing) throw ApiError.conflict('An employee with this email already exists');
    employee.email = body.email;
  }

  if (body.manager !== undefined) {
    if (body.manager) {
      if (body.manager === id) throw ApiError.badRequest('An employee cannot be their own manager');
      const mgr = await User.findById(body.manager);
      if (!mgr || (mgr.role !== ROLES.MANAGER && mgr.role !== ROLES.HR)) {
        throw ApiError.badRequest('Assigned manager must have Manager or HR role');
      }
      // Prevent reporting cycles (A -> B -> ... -> A)
      let cursor = mgr;
      for (let hops = 0; cursor && hops < 50; hops++) {
        if (String(cursor._id) === String(employee._id)) {
          throw ApiError.badRequest('Invalid manager: this would create a circular reporting chain');
        }
        cursor = cursor.manager ? await User.findById(cursor.manager).select('manager') : null;
      }
      employee.manager = body.manager;
    } else {
      employee.manager = null;
    }
  }

  if (body.department) {
    const deptExists = await Department.exists({ _id: body.department });
    if (!deptExists) throw ApiError.badRequest('Specified department does not exist');
  }
  if (body.department !== undefined) employee.department = body.department || null;
  if (body.name !== undefined) employee.name = body.name;
  if (body.role !== undefined) employee.role = body.role;
  if (body.designation !== undefined) employee.designation = body.designation;
  if (body.dateOfJoining !== undefined) employee.dateOfJoining = body.dateOfJoining;
  if (body.phone !== undefined) employee.phone = body.phone;
  if (body.dob !== undefined) employee.dob = body.dob;
  if (body.gender !== undefined) employee.gender = body.gender;
  if (body.address !== undefined) employee.address = body.address;
  if (body.emergencyContact !== undefined) employee.emergencyContact = body.emergencyContact;

  const managerChanged = employee.isModified('manager');
  await employee.save();

  // Re-route this employee's still-pending leave requests to the new approver
  if (managerChanged) {
    await LeaveRequest.updateMany(
      { user: employee._id, status: 'pending' },
      employee.manager
        ? { assignedTo: employee.manager, approverRole: 'manager' }
        : { assignedTo: null, approverRole: 'hr' }
    );
  }

  const updated = await User.findById(employee._id)
    .populate('department', 'name code')
    .populate('manager', 'name email employeeCode')
    .lean();

  res.json({ success: true, data: updated });
}

export async function updateMyProfile(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const { phone, dob, gender, address, emergencyContact } = req.validated;

  if (phone !== undefined) user.phone = phone;
  if (dob !== undefined) user.dob = dob;
  if (gender !== undefined) user.gender = gender;
  if (address !== undefined) user.address = address;
  if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

  await user.save();

  const updated = await User.findById(user._id)
    .populate('department', 'name code')
    .populate('manager', 'name email employeeCode')
    .lean();

  res.json({ success: true, data: updated });
}

export async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.validated;

  const employee = await User.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  if (id === req.user._id.toString() && status === USER_STATUS.INACTIVE) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  if (status === USER_STATUS.INACTIVE && employee.role === ROLES.MANAGER) {
    const reports = await User.countDocuments({ manager: employee._id, status: USER_STATUS.ACTIVE });
    if (reports > 0) {
      throw ApiError.conflict('Cannot deactivate a manager who still has active direct reports. Reassign them first.');
    }
  }

  if (status === USER_STATUS.INACTIVE && employee.role === ROLES.HR) {
    const activeHrCount = await User.countDocuments({ role: ROLES.HR, status: USER_STATUS.ACTIVE });
    if (activeHrCount <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active HR administrator');
    }
  }

  employee.status = status;
  if (status === USER_STATUS.INACTIVE) {
    employee.tokenVersion += 1; // invalidate all sessions
  }

  await employee.save();

  res.json({
    success: true,
    data: { _id: employee._id, status: employee.status },
    message: `Employee marked as ${status}`,
  });
}

export async function resetPassword(req, res) {
  const { id } = req.params;

  const employee = await User.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  const temporaryPassword = generateTemporaryPassword();
  employee.passwordHash = temporaryPassword; // pre('save') hook will hash it
  employee.mustChangePassword = true;
  employee.tokenVersion += 1;

  await employee.save();

  res.json({
    success: true,
    data: {
      temporaryPassword,
    },
    message: 'Temporary password generated successfully',
  });
}
