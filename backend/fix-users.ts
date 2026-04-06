import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      role: {
        in: ['super_admin', 'admin']
      }
    },
    data: {
      status: 'ACTIVE',
      isActive: true,
    }
  });
  console.log(`Successfully updated ${result.count} admin/super_admin users to ACTIVE status.`);

  // Also, let's just make the very first user a super_admin actively if somehow failed
  const allUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, take: 1 });
  if (allUsers.length > 0) {
    await prisma.user.update({
      where: { id: allUsers[0].id },
      data: { status: 'ACTIVE', role: 'super_admin', isActive: true }
    });
    console.log(`Ensured the first registered user (${allUsers[0].email}) is ACTIVE and super_admin.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
