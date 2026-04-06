import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reproduce() {
  const user = {
    id: '7bcb83de-e897-4147-bd55-1c2ce86e641e', // Admin Harish
    name: 'Harish Saravanan',
    companyId: '484d67f2-1a69-4894-8dfa-9e7a186e7e71'
  };

  const body = {
    name: "Test Project reproduction",
    description: "Testing 500 error",
    status: "planning",
    category: "Development",
    startDate: "2026-04-06",
    deadline: "2026-04-20",
    memberIds: [],
    projectManagerId: user.id
  };

  try {
    console.log('Attempting to create project...');
    
    // Reproduce the logic from project.controller.ts:164 onwards
    const { name, description, status, startDate, deadline, category, clientId, departmentId } = body;
    const finalMemberIds = [user.id];
    const finalProjectManagerId = user.id;
    const defaultTasks: any[] = [];
    const defaultMilestones: any[] = [];

    const project = await prisma.project.create({
      data: {
        name, description, status: status as any || 'planning', category: category || null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: user.id,
        companyId: user.companyId || null,
        clientId: (clientId as any) || null,
        departmentId: (departmentId as any) || null,
        members: {
          create: finalMemberIds.map((userId: string) => ({ userId, isProjectManager: userId === finalProjectManagerId })),
        },
        tasks: defaultTasks.length > 0 ? { create: defaultTasks } : undefined,
        milestones: defaultMilestones.length > 0 ? { create: defaultMilestones } : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    });

    console.log('Project created successfully:', project.id);
  } catch (error) {
    console.error('💥 REPRODUCED ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reproduce();
