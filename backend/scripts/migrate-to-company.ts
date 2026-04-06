/**
 * Data Migration Script: Assign existing data to a "Default Company"
 * 
 * Run this script ONCE after applying the SaaS foundation migration.
 * It creates a default company, system roles, and links all existing data.
 * 
 * Usage: npx ts-node scripts/migrate-to-company.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DefaultFeatures: Record<string, boolean> = {
  projectManagement: true,
  taskManagement: true,
  timeTracking: true,
  teamChat: true,
  calendar: true,
  hrManagement: true,
  leaveManagement: true,
  payroll: false,
  performance: true,
  clientManagement: true,
  templates: true,
  analytics: true,
  documents: true,
};

const DefaultRolePermissions: Record<string, string[]> = {
  admin: [
    'project:view', 'project:create', 'project:edit', 'project:delete', 'project:archive', 'project:manage_members',
    'task:view', 'task:create', 'task:edit', 'task:delete', 'task:assign',
    'user:view', 'user:create', 'user:edit', 'user:delete', 'user:approve', 'user:manage_roles',
    'department:view', 'department:create', 'department:edit', 'department:delete',
    'role:view', 'role:create', 'role:edit', 'role:delete',
    'analytics:view', 'activity_log:view',
    'leave:view', 'leave:manage', 'payroll:view', 'payroll:manage', 'performance:view', 'performance:manage',
    'client:view', 'client:create', 'client:edit', 'client:delete',
    'template:view', 'template:create', 'template:edit', 'template:delete',
    'company:manage', 'company:settings', 'feature:toggle',
  ],
  manager: [
    'project:view', 'project:create', 'project:edit', 'project:delete', 'project:archive', 'project:manage_members',
    'task:view', 'task:create', 'task:edit', 'task:delete', 'task:assign',
    'user:view',
    'department:view',
    'analytics:view',
    'client:view', 'client:create', 'client:edit',
    'template:view', 'template:create', 'template:edit', 'template:delete',
    'leave:view',
    'performance:view', 'performance:manage',
  ],
  hr: [
    'user:view', 'user:edit', 'user:approve',
    'department:view', 'department:create', 'department:edit', 'department:delete',
    'leave:view', 'leave:manage',
    'payroll:view', 'payroll:manage',
    'performance:view', 'performance:manage',
    'project:view', 'task:view',
  ],
  employee: [
    'project:view',
    'task:view', 'task:create', 'task:edit',
    'leave:view',
    'performance:view',
  ],
};

async function main() {
  console.log('🚀 Starting data migration to multi-tenant company structure...\n');

  // Check if default company already exists
  const existingCompany = await prisma.company.findFirst({ where: { name: 'Default Company' } });
  if (existingCompany) {
    console.log('⚠️  Default company already exists. Skipping migration.');
    return;
  }

  // 1. Create default company
  const company = await prisma.company.create({
    data: {
      name: 'Default Company',
      features: DefaultFeatures,
      setupCompleted: true,
      setupStep: 5,
      settings: {
        create: {
          businessType: 'Technology',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        },
      },
    },
  });
  console.log(`✅ Created default company: ${company.id}`);

  // 2. Create system roles
  const createdRoles: Record<string, string> = {};
  for (const [key, permissions] of Object.entries(DefaultRolePermissions)) {
    const role = await prisma.role.create({
      data: {
        companyId: company.id,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        permissions,
        isSystemRole: true,
      },
    });
    createdRoles[key] = role.id;
    console.log(`  ✅ Created role: ${role.name} (${role.id})`);
  }

  // 3. Assign all existing users to this company and map roles
  const users = await prisma.user.findMany({ where: { companyId: null } });
  console.log(`\n📦 Migrating ${users.length} users...`);

  for (const user of users) {
    const legacyRole = String(user.role).toLowerCase();
    const newRoleId = createdRoles[legacyRole] || createdRoles['employee'];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyId: company.id,
        roleId: newRoleId,
      },
    });
    console.log(`  ✅ ${user.name} → ${legacyRole} role`);
  }

  // 4. Assign departments to company
  const deptResult = await prisma.department.updateMany({
    where: { companyId: null },
    data: { companyId: company.id },
  });
  console.log(`\n✅ Assigned ${deptResult.count} departments to default company`);

  // 5. Assign projects to company
  const projResult = await prisma.project.updateMany({
    where: { companyId: null },
    data: { companyId: company.id },
  });
  console.log(`✅ Assigned ${projResult.count} projects to default company`);

  // 6. Assign tasks to company
  const taskResult = await prisma.task.updateMany({
    where: { companyId: null },
    data: { companyId: company.id },
  });
  console.log(`✅ Assigned ${taskResult.count} tasks to default company`);

  // 7. Assign clients to company
  const clientResult = await prisma.client.updateMany({
    where: { companyId: null },
    data: { companyId: company.id },
  });
  console.log(`✅ Assigned ${clientResult.count} clients to default company`);

  console.log('\n🎉 Migration complete! All data assigned to Default Company.');
}

main()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
