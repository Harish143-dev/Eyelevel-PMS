import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGetMe(userId: string) {
  try {
    console.log(`Testing getMe for user: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      console.log('User not found in DB');
    } else {
      console.log('User found:', JSON.stringify(user, null, 2));
    }
  } catch (error) {
    console.error('Error in findUnique query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get a user ID first
async function run() {
    const user = await prisma.user.findFirst();
    if (user) {
        await testGetMe(user.id);
    } else {
        console.log('No users in database');
    }
}

run();
