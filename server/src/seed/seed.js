import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Department } from '../models/department.model.js';
import { User, generateEmployeeCode } from '../models/user.model.js';
import { ROLES } from '../config/constants.js';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('🌱  Seeding StaffSync…');

  // ── Departments ──────────────────────────────────────────────
  const deptData = [
    { name: 'Human Resources', code: 'HR', description: 'HR department' },
    { name: 'Engineering', code: 'ENG', description: 'Engineering department' },
    { name: 'Sales', code: 'SALES', description: 'Sales department' },
    { name: 'Finance', code: 'FIN', description: 'Finance department' },
  ];

  const depts = {};
  for (const d of deptData) {
    const dept = await Department.findOneAndUpdate({ code: d.code }, d, {
      upsert: true,
      new: true,
    });
    depts[d.code] = dept;
    console.log(`  ✅  Department: ${dept.name}`);
  }

  // ── Users ─────────────────────────────────────────────────────
  const userData = [
    {
      email: 'hr@staffsync.test',
      name: 'Alice HR',
      role: ROLES.HR,
      departmentCode: 'HR',
      designation: 'HR Manager',
    },
    {
      email: 'hr2@staffsync.test',
      name: 'Bob HR',
      role: ROLES.HR,
      departmentCode: 'HR',
      designation: 'HR Specialist',
    },
    {
      email: 'manager@staffsync.test',
      name: 'Carol Manager',
      role: ROLES.MANAGER,
      departmentCode: 'ENG',
      designation: 'Engineering Manager',
    },
    {
      email: 'employee1@staffsync.test',
      name: 'Dave Employee',
      role: ROLES.EMPLOYEE,
      departmentCode: 'ENG',
      designation: 'Software Engineer',
      managerEmail: 'manager@staffsync.test',
    },
    {
      email: 'employee2@staffsync.test',
      name: 'Eve Employee',
      role: ROLES.EMPLOYEE,
      departmentCode: 'ENG',
      designation: 'Frontend Engineer',
      managerEmail: 'manager@staffsync.test',
    },
    {
      email: 'employee3@staffsync.test',
      name: 'Frank Employee',
      role: ROLES.EMPLOYEE,
      departmentCode: 'SALES',
      designation: 'Sales Executive',
      // no manager — routes to HR pool
    },
  ];

  for (const u of userData) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  ⏭️   User already exists: ${u.email}`);
      continue;
    }

    let managerId = null;
    if (u.managerEmail) {
      const mgr = await User.findOne({ email: u.managerEmail });
      managerId = mgr?._id ?? null;
    }

    const code = await generateEmployeeCode();
    const newUser = new User({
      employeeCode: code,
      name: u.name,
      email: u.email,
      passwordHash: env.SEED_PASSWORD,
      role: u.role,
      department: depts[u.departmentCode]._id,
      designation: u.designation,
      manager: managerId,
      dateOfJoining: new Date(),
      status: 'active',
    });
    await newUser.save();
    console.log(`  ✅  User: ${u.email} (${u.role}) [${code}]`);
  }

  console.log('\n🎉  Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
