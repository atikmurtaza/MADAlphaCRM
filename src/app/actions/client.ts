'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getClientHistory(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) return null;

  const sales = await prisma.sale.findMany({
    where: { 
      client: { name: client.name } 
    },
    include: {
      agent: true,
      payments: true,
      refunds: true,
      project: {
        include: {
          assignments: {
            include: { employee: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { client, sales };
}
