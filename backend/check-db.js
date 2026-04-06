const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const priorities = await prisma.customTaskPriority.findMany();
  let out = '--- Custom Priorities ---\n';
  priorities.forEach((p, i) => { out += `${i+1}. [${p.companyId}] ${p.name} (${p.id})\n`; });
  
  const statuses = await prisma.customTaskStatus.findMany();
  out += '\n--- Custom Statuses ---\n';
  statuses.forEach((s, i) => { out += `${i+1}. [${s.companyId}] ${s.name} (${s.id})\n`; });
  
  fs.writeFileSync('db-dump.txt', out);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
