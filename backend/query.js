const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.onboardingTicket.findMany({ include: { hrDetails: true } })
  .then(t => console.dir(t, { depth: null }))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
