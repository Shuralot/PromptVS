const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.testSession.findMany({
    select: {
      id: true,
      targetNumber: true,
      status: true,
      simulationMode: true
    }
  });
  console.log(JSON.stringify(sessions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
