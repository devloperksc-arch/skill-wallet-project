import { LeaveRequest } from '../models/leaveRequest.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';
import { Holiday } from '../models/holiday.model.js';
import { User } from '../models/user.model.js';
import {
  calculateWorkingDays,
  ensureBalances,
  determineRouting,
  getTodayDateKey,
  getMinAllowedDateKey,
  assertAllowedYear,
} from '../services/leave.service.js';
import { ROLES, LEAVE_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export async function previewLeave(req, res, next) {
  try {
    const { startDate, endDate, halfDay } = req.query;
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate query parameters are required');
    }

    const isHalfDay = halfDay === 'true' || halfDay === true;
    const result = await calculateWorkingDays(startDate, endDate, isHalfDay);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOwnBalances(req, res, next) {
  try {
    const year = assertAllowedYear(req.query.year ? parseInt(req.query.year, 10) : Number(getTodayDateKey().slice(0, 4)));
    const balances = await ensureBalances(req.user._id, year);
    res.json({ balances, year });
  } catch (err) {
    next(err);
  }
}

export async function getUserBalances(req, res, next) {
  try {
    const { userId } = req.params;
    const year = assertAllowedYear(req.query.year ? parseInt(req.query.year, 10) : Number(getTodayDateKey().slice(0, 4)));

    const targetUser = await User.findById(userId).populate('department', 'name code');
    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    if (req.user.role === ROLES.MANAGER) {
      const isDirectReport = targetUser.manager?.toString() === req.user._id.toString();
      if (!isDirectReport && targetUser._id.toString() !== req.user._id.toString()) {
        throw ApiError.forbidden('You are only authorized to view balances for your direct reports');
      }
    } else if (req.user.role === ROLES.EMPLOYEE) {
      if (targetUser._id.toString() !== req.user._id.toString()) {
        throw ApiError.forbidden('Access denied');
      }
    }

    const balances = await ensureBalances(userId, year);
    res.json({ balances, year, user: targetUser });
  } catch (err) {
    next(err);
  }
}

export async function adjustBalance(req, res, next) {
  try {
    const { id } = req.params;
    const { allocated, reason } = req.validated;

    const balance = await LeaveBalance.findById(id).populate('leaveType user');
    if (!balance) {
      throw ApiError.notFound('Leave balance record not found');
    }

    const minAllowed = balance.used + balance.pending;
    if (allocated < minAllowed) {
      throw ApiError.badRequest(
        `Allocated days cannot be less than already used (${balance.used}) + pending (${balance.pending}) days`
      );
    }

    balance.adjustments.push({
      reason,
      previousAllocated: balance.allocated,
      newAllocated: allocated,
      adjustedBy: req.user._id,
      adjustedAt: new Date(),
    });

    balance.allocated = allocated;
    await balance.save();

    res.json({
      message: 'Leave balance adjusted successfully',
      balance,
    });
  } catch (err) {
    next(err);
  }
}

async function acquireLeaveLock(userId) {
  const now = new Date();
  const locked = await User.findOneAndUpdate(
    { _id: userId, $or: [{ leaveLockUntil: null }, { leaveLockUntil: { $lt: now } }] },
    { $set: { leaveLockUntil: new Date(now.getTime() + 10000) } },
    { projection: { _id: 1 } }
  );
  return !!locked;
}

export async function applyLeave(req, res, next) {
  let reserved = null; // { balanceId, days } so we can roll back on any later failure
  let lockHeld = false;
  try {
    // Serialise applications per user: stops double-submits / parallel requests from
    // creating duplicate or overlapping requests or over-booking the balance.
    lockHeld = await acquireLeaveLock(req.user._id);
    if (!lockHeld) {
      throw ApiError.conflict('Another leave request is being processed. Please try again.');
    }

    const { leaveType, startDate, endDate, halfDay, reason } = req.validated;

    const minAllowedDate = getMinAllowedDateKey();
    if (startDate < minAllowedDate) {
      throw ApiError.badRequest(`Leave start date cannot be earlier than ${minAllowedDate}`);
    }

    const startYear = startDate.slice(0, 4);
    const endYear = endDate.slice(0, 4);
    if (startYear !== endYear) {
      throw ApiError.badRequest(
        'Leave requests cannot span across calendar years. Please submit separate requests for each year.'
      );
    }

    const leaveTypeDoc = await LeaveType.findById(leaveType);
    if (!leaveTypeDoc || !leaveTypeDoc.isActive) {
      throw ApiError.badRequest('Selected leave type is invalid or inactive');
    }

    const { days } = await calculateWorkingDays(startDate, endDate, halfDay);

    const reqYear = parseInt(startYear, 10);
    await ensureBalances(req.user._id, reqYear);

    // Atomically reserve the days: the availability check and the $inc are ONE operation,
    // so concurrent requests can no longer over-book the balance.
    const balanceFilter = {
      user: req.user._id,
      leaveType: leaveTypeDoc._id,
      year: reqYear,
    };
    if (!leaveTypeDoc.isUnlimited) {
      balanceFilter.$expr = {
        $gte: [{ $subtract: ['$allocated', { $add: ['$used', '$pending'] }] }, days],
      };
    }
    const balance = await LeaveBalance.findOneAndUpdate(
      balanceFilter,
      { $inc: { pending: days } },
      { returnDocument: 'after' }
    );
    if (!balance) {
      const current = await LeaveBalance.findOne({
        user: req.user._id,
        leaveType: leaveTypeDoc._id,
        year: reqYear,
      });
      if (!current) throw ApiError.badRequest('Leave balance record not found');
      const available = current.allocated - current.used - current.pending;
      throw ApiError.badRequest(
        `Insufficient leave balance. Available: ${available} days, requested: ${days} days`
      );
    }
    reserved = { balanceId: balance._id, days };

    // Overlap check AFTER reserving; if another request won the race we roll back.
    const overlap = await LeaveRequest.findOne({
      user: req.user._id,
      status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    if (overlap) {
      throw ApiError.badRequest(
        'You already have a pending or approved leave request overlapping these dates'
      );
    }

    const userDoc = await User.findById(req.user._id);
    const routing = determineRouting(userDoc);

    const leaveRequest = await LeaveRequest.create({
      user: req.user._id,
      leaveType: leaveTypeDoc._id,
      startDate,
      endDate,
      halfDay: !!halfDay,
      days,
      reason,
      status: LEAVE_STATUS.PENDING,
      approverRole: routing.approverRole,
      assignedTo: routing.assignedTo,
    });
    reserved = null; // success — keep the reservation

    // Concurrent duplicate guard: if two identical requests slipped through, keep the oldest only.
    const dupes = await LeaveRequest.find({
      user: req.user._id,
      status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id');
    if (dupes.length > 1 && String(dupes[0]._id) !== String(leaveRequest._id)) {
      await LeaveRequest.deleteOne({ _id: leaveRequest._id, status: LEAVE_STATUS.PENDING });
      await LeaveBalance.updateOne({ _id: balance._id }, { $inc: { pending: -days } });
      throw ApiError.badRequest(
        'You already have a pending or approved leave request overlapping these dates'
      );
    }

    await leaveRequest.populate('leaveType');

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest,
    });
  } catch (err) {
    if (reserved) {
      await LeaveBalance.updateOne(
        { _id: reserved.balanceId },
        { $inc: { pending: -reserved.days } }
      ).catch(() => {});
    }
    next(err);
  } finally {
    if (lockHeld) {
      await User.updateOne({ _id: req.user._id }, { $set: { leaveLockUntil: null } }).catch(() => {});
    }
  }
}

export async function getMyLeaves(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.year) {
      query.startDate = { $regex: `^${req.query.year}-` };
    }

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('leaveType')
        .populate('assignedTo', 'name email')
        .populate('decidedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LeaveRequest.countDocuments(query),
    ]);

    res.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllLeaves(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.user.role === ROLES.MANAGER) {
      const directReports = await User.find({ manager: req.user._id }).select('_id');
      const directReportIds = directReports.map((d) => d._id);
      query.$or = [{ assignedTo: req.user._id }, { user: { $in: directReportIds } }];
    } else if (req.user.role === ROLES.EMPLOYEE) {
      throw ApiError.forbidden('Access denied');
    }

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.userId) {
      query.user = req.query.userId;
    }
    if (req.query.department) {
      const usersInDept = await User.find({ department: req.query.department }).select('_id');
      const userIds = usersInDept.map((u) => u._id);
      query.user = { $in: userIds };
    }
    if (req.query.startDate && req.query.endDate) {
      query.startDate = { $lte: req.query.endDate };
      query.endDate = { $gte: req.query.startDate };
    }

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('user', 'name email employeeCode department designation')
        .populate('leaveType')
        .populate('assignedTo', 'name email')
        .populate('decidedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LeaveRequest.countDocuments(query),
    ]);

    res.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingApprovals(req, res, next) {
  try {
    let query;
    if (req.user.role === ROLES.MANAGER) {
      query = {
        assignedTo: req.user._id,
        status: LEAVE_STATUS.PENDING,
      };
    } else if (req.user.role === ROLES.HR) {
      query = {
        status: LEAVE_STATUS.PENDING,
      };
    } else {
      throw ApiError.forbidden('Access denied');
    }

    const leaves = await LeaveRequest.find(query)
      .populate('user', 'name email employeeCode department designation')
      .populate('leaveType')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: 1 });

    res.json({ leaves });
  } catch (err) {
    next(err);
  }
}

export async function getLeaveById(req, res, next) {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findById(id)
      .populate('user', 'name email employeeCode department designation manager')
      .populate('leaveType')
      .populate('assignedTo', 'name email')
      .populate('decidedBy', 'name email');

    if (!leave) {
      throw ApiError.notFound('Leave request not found');
    }

    const isOwner = leave.user._id.toString() === req.user._id.toString();
    const isAssigned = leave.assignedTo?._id.toString() === req.user._id.toString();
    const isHr = req.user.role === ROLES.HR;

    if (!isOwner && !isAssigned && !isHr) {
      throw ApiError.forbidden('Access denied');
    }

    res.json({ leave });
  } catch (err) {
    next(err);
  }
}

export async function decideLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, note } = req.validated;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      throw ApiError.notFound('Leave request not found');
    }

    if (request.user.toString() === req.user._id.toString()) {
      throw ApiError.forbidden('You cannot approve or reject your own leave request');
    }

    if (req.user.role === ROLES.MANAGER) {
      const isAssigned = request.assignedTo?.toString() === req.user._id.toString();
      if (!isAssigned) {
        throw ApiError.forbidden('You are not authorized to decide on this leave request');
      }
    } else if (req.user.role !== ROLES.HR) {
      throw ApiError.forbidden('Access denied');
    }

    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, status: LEAVE_STATUS.PENDING },
      {
        status: decision,
        decidedBy: req.user._id,
        decidedAt: new Date(),
        decisionNote: note || '',
      },
      { returnDocument: 'after' }
    )
      .populate('user', 'name email employeeCode')
      .populate('leaveType');

    if (!updated) {
      throw ApiError.conflict('Request has already been processed or is not in pending status');
    }

    const reqYear = parseInt(updated.startDate.slice(0, 4), 10);
    if (decision === LEAVE_STATUS.APPROVED) {
      await LeaveBalance.updateOne(
        { user: updated.user._id, leaveType: updated.leaveType._id, year: reqYear },
        { $inc: { pending: -updated.days, used: updated.days } }
      );
    } else if (decision === LEAVE_STATUS.REJECTED) {
      await LeaveBalance.updateOne(
        { user: updated.user._id, leaveType: updated.leaveType._id, year: reqYear },
        { $inc: { pending: -updated.days } }
      );
    }

    res.json({
      message: `Leave request ${decision} successfully`,
      leave: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelLeave(req, res, next) {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);
    if (!request) {
      throw ApiError.notFound('Leave request not found');
    }

    if (request.user.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You can only cancel your own leave requests');
    }

    const reqYear = parseInt(request.startDate.slice(0, 4), 10);
    const today = getTodayDateKey();

    if (request.status === LEAVE_STATUS.APPROVED && request.startDate <= today) {
      throw ApiError.badRequest(
        'Cannot cancel an approved leave that has already started or is in the past'
      );
    }
    if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(request.status)) {
      throw ApiError.badRequest('Leave request cannot be cancelled in its current state');
    }

    // Atomic state transition: only ONE concurrent cancel can win, so balances are restored once.
    const wasStatus = request.status;
    const cancelled = await LeaveRequest.findOneAndUpdate(
      { _id: id, user: req.user._id, status: wasStatus },
      { status: LEAVE_STATUS.CANCELLED, cancelledAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!cancelled) {
      throw ApiError.conflict('Request was already processed or cancelled');
    }

    await LeaveBalance.updateOne(
      { user: request.user, leaveType: request.leaveType, year: reqYear },
      { $inc: wasStatus === LEAVE_STATUS.PENDING ? { pending: -request.days } : { used: -request.days } }
    );

    res.json({
      message: 'Leave request cancelled successfully',
      leave: cancelled,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeaveCalendar(req, res, next) {
  try {
    const month = req.query.month || getTodayDateKey().slice(0, 7);
    if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw ApiError.badRequest('month must be formatted as YYYY-MM');
    }
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const leaveQuery = {
      status: LEAVE_STATUS.APPROVED,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    };

    if (req.user.role === ROLES.MANAGER) {
      const directReports = await User.find({ manager: req.user._id }).select('_id');
      const directReportIds = directReports.map((d) => d._id);
      leaveQuery.user = { $in: [...directReportIds, req.user._id] };
    } else if (req.user.role === ROLES.EMPLOYEE) {
      const userDoc = await User.findById(req.user._id);
      if (userDoc.manager) {
        const teammates = await User.find({ manager: userDoc.manager }).select('_id');
        leaveQuery.user = { $in: teammates.map((t) => t._id) };
      } else {
        leaveQuery.user = req.user._id;
      }
    }

    const leaves = await LeaveRequest.find(leaveQuery)
      // Privacy: never expose reason / decision notes to colleagues; only HR and the owner's manager
      // may see the leave category, everyone else just sees that the person is away.
      .select('user leaveType startDate endDate halfDay days status')
      .populate('user', 'name employeeCode department designation')
      .populate('leaveType', 'name code isPaid')
      .sort({ startDate: 1 })
      .lean();

    if (req.user.role === ROLES.EMPLOYEE) {
      for (const l of leaves) {
        if (String(l.user?._id) !== String(req.user._id)) {
          l.leaveType = { name: 'On leave', code: 'LEAVE' };
        }
      }
    }

    res.json({
      month,
      holidays,
      leaves,
    });
  } catch (err) {
    next(err);
  }
}
