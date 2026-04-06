
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();
    
    console.log(JSON.stringify({
      users: userCount,
      departments: deptCount,
      projects: projectCount,
      tasks: taskCount
    }));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
