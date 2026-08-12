import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.salaryTier.findMany().then(res => console.log(JSON.stringify(res, null, 2))).finally(() => p.$disconnect());
