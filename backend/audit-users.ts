import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });

    console.log(`Auditing ${users.length} users...`);

    for (const u of users) {
      try {
        const fullUser = await prisma.user.findUnique({
          where: { id: u.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            avatarColor: true,
            designation: true,
            isActive: true,
            companyId: true,
            createdAt: true,
            company: {
              select: {
                id: true,
                name: true,
                setupCompleted: true,
                setupStep: true,
                features: true,
                settings: {
                  select: {
                    primaryColor: true,
                    logoUrl: true,
                    city: true,
                    state: true,
                    country: true
                  }
                }
              },
            },
          },
        });
        console.log(`[OK] User: ${u.email}`);
      } catch (err: any) {
        console.error(`[FAIL] User: ${u.email}, Error: ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error('Audit failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditAllUsers();
