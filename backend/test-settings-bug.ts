import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: {
          include: {
            settings: true
          }
        }
      }
    });

    console.log(`--- User Settings Audit ---`);
    console.log(`Found ${users.length} users.`);
    
    for (const u of users) {
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`CompanyId: ${u.companyId}`);
      if (u.companyId) {
        if (u.company) {
          console.log(`Company Name: ${u.company.name}`);
          console.log(`Has Settings: ${!!u.company.settings}`);
          if (!u.company.settings) {
            console.error(`!!! MISSING SETTINGS for Company: ${u.company.name} (${u.companyId})`);
          }
        } else {
            console.error(`!!! Company ID present but record MISSING for user: ${u.email}`);
        }
      } else {
        console.log(`No company associated (Independent User)`);
      }
      console.log('---');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
