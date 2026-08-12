'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createSale(formData: FormData) {
  const clientName = formData.get('clientName') as string;
  const agentId = formData.get('agentId') as string;
  const targetAmount = parseFloat(formData.get('targetAmount') as string);
  const advanceAmount = parseFloat(formData.get('advanceAmount') as string);
  const saleStatus = formData.get('saleStatus') as string;
  
  // Phase 8 new fields
  const customSaleId = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const product = formData.get('product') as string | null;
  const productDescription = formData.get('productDescription') as string | null;
  const clientSocialHandle = formData.get('clientSocialHandle') as string | null;
  const paymentMethod = formData.get('paymentMethod') as string | null;

  // Find agent
  const agent = await prisma.user.findUnique({ where: { id: agentId }});
  if (!agent) throw new Error("Agent not found");

  // Create Client
  const client = await prisma.client.create({
    data: { name: clientName }
  });

  // Create Sale
  const sale = await prisma.sale.create({
    data: {
      clientId: client.id,
      agentId: agent.id,
      teamId: agent.teamId || '',
      targetAmount,
      status: saleStatus,
      customSaleId,
      product,
      productDescription,
      clientSocialHandle,
      approvalStatus: 'PENDING'
    }
  });

  // Create Advance Payment
  if (advanceAmount > 0) {
    await prisma.paymentTransaction.create({
      data: {
        saleId: sale.id,
        amount: advanceAmount,
        method: paymentMethod || undefined
      }
    });
  }

  // Create Project automatically for Operations Queue
  await prisma.project.create({
    data: {
      saleId: sale.id,
      status: saleStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'
    }
  });

  revalidatePath('/operations/projects');
  revalidatePath('/sales/new');
  
  return { success: true }
}
