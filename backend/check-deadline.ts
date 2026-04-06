const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findUnique({ where: { id: 'cded4c41-5cc6-4935-8f8d-f616b4650d47' } });
  if (p) {
    console.log('NAME:', p.name);
    console.log('DEADLINE:', p.deadline);
  } else {
    console.log('NOT FOUND');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
