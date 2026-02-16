const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const target = "8186601822";  // part of 558186601822
  console.log(`Searching for sessions containing ${target}...`);

  const sessions = await prisma.testSession.findMany({
    where: {
      targetNumber: {
        contains: target
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("Found sessions:", JSON.stringify(sessions, null, 2));
  
  const allSessions = await prisma.testSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
  });
  console.log("Last 10 sessions (any number):", JSON.stringify(allSessions.map(s => s.targetNumber), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
