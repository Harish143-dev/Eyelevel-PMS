/// <reference types="node" />
/**
 * QA Test Data Seeder
 * 
 * Seeds test data for 3 tenants per the QA Master Test Plan Section 13.
 * Generates a test-ids.json registry for cross-tenant attack simulations.
 * 
 * Usage: npx ts-node tests/seed-test-data.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test@12345';
const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

interface SeededIds {
  companies: Record<string, string>;
  users: Record<string, { id: string; email: string; role: string; companyId: string }>;
  projects: Record<string, { id: string; companyId: string }>;
  tasks: Record<string, { id: string; projectId: string; companyId: string }>;
  departments: Record<string, { id: string; companyId: string }>;
}

async function seed() {
  console.log('🌱 Starting QA test data seeding...\n');

  const ids: SeededIds = {
    companies: {},
    users: {},
    projects: {},
    tasks: {},
    departments: {},
  };

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  // ───────────────────────────────────────────────────
  // Step 1: Create 3 Test Companies
  // ───────────────────────────────────────────────────
  console.log('📦 Creating test companies...');

  const companyA = await prisma.company.create({
    data: { name: 'Acme Corp', status: 'active', setupCompleted: true, setupStep: 5 }
  });
  const companyB = await prisma.company.create({
    data: { name: 'Beta Ltd', status: 'active', setupCompleted: true, setupStep: 5 }
  });
  const companyC = await prisma.company.create({
    data: { name: 'Gamma Inc', status: 'active', setupCompleted: true, setupStep: 5 }
  });

  ids.companies['T-001'] = companyA.id;
  ids.companies['T-002'] = companyB.id;
  ids.companies['T-003'] = companyC.id;

  // Create company settings
  for (const company of [companyA, companyB, companyC]) {
    await prisma.companySettings.create({
      data: { companyId: company.id }
    });
  }

  console.log(`  ✅ T-001: ${companyA.id} (Acme Corp)`);
  console.log(`  ✅ T-002: ${companyB.id} (Beta Ltd)`);
  console.log(`  ✅ T-003: ${companyC.id} (Gamma Inc)`);

  // ───────────────────────────────────────────────────
  // Step 2: Create Test Users
  // ───────────────────────────────────────────────────
  console.log('\n👥 Creating test users...');

  const userDefs = [
    { key: 'admin_a', name: 'Admin A', email: 'admin@acme-test.com', role: 'admin', company: companyA.id },
    { key: 'manager_a', name: 'Manager A', email: 'manager@acme-test.com', role: 'manager', company: companyA.id },
    { key: 'employee_a1', name: 'Employee A1', email: 'emp1@acme-test.com', role: 'employee', company: companyA.id },
    { key: 'employee_a2', name: 'Employee A2', email: 'emp2@acme-test.com', role: 'employee', company: companyA.id },
    { key: 'employee_a3', name: 'Employee A3', email: 'emp3@acme-test.com', role: 'employee', company: companyA.id },
    { key: 'hr_a', name: 'HR A', email: 'hr@acme-test.com', role: 'hr', company: companyA.id },
    { key: 'admin_b', name: 'Admin B', email: 'admin@beta-test.com', role: 'admin', company: companyB.id },
    { key: 'employee_b1', name: 'Employee B1', email: 'emp1@beta-test.com', role: 'employee', company: companyB.id },
    { key: 'employee_b2', name: 'Employee B2', email: 'emp2@beta-test.com', role: 'employee', company: companyB.id },
    { key: 'admin_c', name: 'Admin C', email: 'admin@gamma-test.com', role: 'admin', company: companyC.id },
  ];

  for (const def of userDefs) {
    const user = await prisma.user.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        role: def.role as any,
        status: 'ACTIVE',
        isActive: true,
        companyId: def.company,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      }
    });
    ids.users[def.key] = { id: user.id, email: def.email, role: def.role, companyId: def.company };
    console.log(`  ✅ ${def.key}: ${user.id} (${def.email})`);
  }

  // ───────────────────────────────────────────────────
  // Step 3: Create Departments
  // ───────────────────────────────────────────────────
  console.log('\n🏢 Creating departments...');

  const deptDefs = [
    { key: 'engineering_a', name: 'Engineering', company: companyA.id },
    { key: 'marketing_a', name: 'Marketing', company: companyA.id },
    { key: 'sales_a', name: 'Sales', company: companyA.id },
    { key: 'engineering_b', name: 'Engineering', company: companyB.id },
    { key: 'hr_b', name: 'Human Resources', company: companyB.id },
  ];

  for (const def of deptDefs) {
    const dept = await prisma.department.create({
      data: { name: def.name, companyId: def.company }
    });
    ids.departments[def.key] = { id: dept.id, companyId: def.company };
    console.log(`  ✅ ${def.key}: ${dept.id}`);
  }

  // ───────────────────────────────────────────────────
  // Step 4: Create Projects
  // ───────────────────────────────────────────────────
  console.log('\n📂 Creating projects...');

  const projectDefs = [
    { key: 'project_a1', name: 'Website Redesign', owner: ids.users.admin_a.id, company: companyA.id },
    { key: 'project_a2', name: 'Mobile App Launch', owner: ids.users.manager_a.id, company: companyA.id },
    { key: 'project_a3', name: 'Marketing Campaign', owner: ids.users.admin_a.id, company: companyA.id },
    { key: 'project_b1', name: 'Backend Overhaul', owner: ids.users.admin_b.id, company: companyB.id },
    { key: 'project_b2', name: 'Data Migration', owner: ids.users.admin_b.id, company: companyB.id },
    { key: 'project_b3', name: 'API Gateway', owner: ids.users.admin_b.id, company: companyB.id },
  ];

  for (const def of projectDefs) {
    const project = await prisma.project.create({
      data: {
        name: def.name,
        description: `Test project: ${def.name}`,
        status: 'in_progress',
        category: 'Development',
        ownerId: def.owner,
        companyId: def.company,
        startDate: new Date(),
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        members: {
          create: [{ userId: def.owner, isProjectManager: true }]
        }
      }
    });
    ids.projects[def.key] = { id: project.id, companyId: def.company };
    console.log(`  ✅ ${def.key}: ${project.id}`);
  }

  // ───────────────────────────────────────────────────
  // Step 5: Create Tasks  
  // ───────────────────────────────────────────────────
  console.log('\n📝 Creating tasks...');

  const taskDefs = [
    { key: 'task_a1', title: 'Design homepage', project: 'project_a1', creator: ids.users.admin_a.id, assignee: ids.users.employee_a1.id },
    { key: 'task_a2', title: 'Build login page', project: 'project_a1', creator: ids.users.admin_a.id, assignee: ids.users.employee_a2.id },
    { key: 'task_a3', title: 'Setup CI/CD', project: 'project_a2', creator: ids.users.manager_a.id, assignee: ids.users.employee_a1.id },
    { key: 'task_a4', title: 'Write test specs', project: 'project_a2', creator: ids.users.manager_a.id, assignee: ids.users.employee_a3.id },
    { key: 'task_a5', title: 'Create landing page', project: 'project_a3', creator: ids.users.admin_a.id, assignee: null },
    { key: 'task_b1', title: 'Refactor database schema', project: 'project_b1', creator: ids.users.admin_b.id, assignee: ids.users.employee_b1.id },
    { key: 'task_b2', title: 'Setup monitoring', project: 'project_b1', creator: ids.users.admin_b.id, assignee: ids.users.employee_b2.id },
    { key: 'task_b3', title: 'Migrate user data', project: 'project_b2', creator: ids.users.admin_b.id, assignee: ids.users.employee_b1.id },
    { key: 'task_b4', title: 'Setup API gateway', project: 'project_b3', creator: ids.users.admin_b.id, assignee: null },
    { key: 'task_b5', title: 'Load testing', project: 'project_b3', creator: ids.users.admin_b.id, assignee: ids.users.employee_b2.id },
  ];

  for (const def of taskDefs) {
    const projectId = ids.projects[def.project].id;
    const companyId = ids.projects[def.project].companyId;
    const task = await prisma.task.create({
      data: {
        title: def.title,
        description: `Test task: ${def.title}`,
        projectId,
        companyId,
        createdBy: def.creator,
        assignedTo: def.assignee,
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        position: 0,
      }
    });
    ids.tasks[def.key] = { id: task.id, projectId, companyId };
    console.log(`  ✅ ${def.key}: ${task.id}`);
  }

  // ───────────────────────────────────────────────────
  // Step 6: Create Clients
  // ───────────────────────────────────────────────────
  console.log('\n🤝 Creating clients...');

  await prisma.client.create({
    data: { name: 'Acme Client X', email: 'clientx@acme.com', companyId: companyA.id }
  });
  await prisma.client.create({
    data: { name: 'Beta Client Y', email: 'clienty@beta.com', companyId: companyB.id }
  });

  // ───────────────────────────────────────────────────
  // Step 7: Write ID registry
  // ───────────────────────────────────────────────────
  const outputPath = path.join(__dirname, 'test-ids.json');
  fs.writeFileSync(outputPath, JSON.stringify(ids, null, 2));
  console.log(`\n📁 ID registry written to ${outputPath}`);

  console.log('\n✅ Test data seeding complete!');
  console.log(`   Companies: ${Object.keys(ids.companies).length}`);
  console.log(`   Users: ${Object.keys(ids.users).length}`);
  console.log(`   Departments: ${Object.keys(ids.departments).length}`);
  console.log(`   Projects: ${Object.keys(ids.projects).length}`);
  console.log(`   Tasks: ${Object.keys(ids.tasks).length}`);
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
