import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdmins = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { name: true, email: true, status: true }
  });
  console.log(JSON.stringify(superAdmins, null, 2));
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
