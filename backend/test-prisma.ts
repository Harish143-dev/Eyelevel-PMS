import prisma from './src/config/db';

async function test() {
  try {
    const company = await prisma.company.findFirst({
      select: {
        id: true,
        slug: true,
        customDomain: true,
        settings: {
          select: {
            logoUrl: true
          }
        }
      }
    });
    console.log('Successfully queried company with new fields:', company?.id);
  } catch (error) {
    console.error('Prisma query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
