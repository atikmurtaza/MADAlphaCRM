'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function approveSale(saleId: string, teamId: string) {
  await prisma.sale.update({
    where: { id: saleId },
    data: { approvalStatus: 'APPROVED' }
  });
  revalidatePath(`/portal/leader/${teamId}`);
}

export async function deleteSale(saleId: string, teamId: string) {
  // First delete related Project and Transactions if any (usually pending sales don't have them yet)
  await prisma.project.deleteMany({ where: { saleId } });
  await prisma.paymentTransaction.deleteMany({ where: { saleId } });
  
  await prisma.sale.delete({ where: { id: saleId } });
  revalidatePath(`/portal/leader/${teamId}`);
}

export async function updateSaleStatus(saleId: string, newStatus: string, teamId: string) {
  await prisma.sale.update({
    where: { id: saleId },
    data: { 
      status: newStatus,
      clearedAt: newStatus === 'COMPLETED' ? new Date() : null
    }
  });
  revalidatePath(`/portal/leader/${teamId}`);
}

export async function updateSaleLatestUpdate(saleId: string, latestUpdate: string, teamId: string) {
  await prisma.sale.update({
    where: { id: saleId },
    data: { latestUpdate }
  });
  revalidatePath(`/portal/leader/${teamId}`);
}

export async function createTeamMember(formData: FormData, teamId: string) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const position = formData.get('position') as string;
  const baseSalary = parseFloat(formData.get('baseSalary') as string);

  // Generate unique 4-char ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let employeeId = '';
  let uniqueFound = false;
  
  while (!uniqueFound) {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await prisma.usedEmployeeId.findUnique({ where: { employeeId: result } });
    if (!existing) {
      employeeId = result;
      uniqueFound = true;
    }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      position,
      employeeId,
      baseSalary,
      teamId
    }
  });

  await prisma.usedEmployeeId.create({
    data: {
      employeeId,
      userId: user.id
    }
  });

  revalidatePath(`/portal/leader/${teamId}`);
}

export async function toggleUserStatus(userId: string, currentStatus: boolean, teamId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !currentStatus }
  });
  revalidatePath(`/portal/leader/${teamId}`);
}

export async function tlCreateSale(formData: FormData, teamId: string) {
  const agentId = formData.get('agentId') as string;
  const clientName = formData.get('clientName') as string;
  const targetAmount = parseFloat(formData.get('targetAmount') as string);
  const status = formData.get('status') as string;
  
  const customSaleId = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const product = formData.get('product') as string | null;
  const productDescription = formData.get('productDescription') as string | null;
  const clientSocialHandle = formData.get('clientSocialHandle') as string | null;
  
  const advanceAmountStr = formData.get('advanceAmount') as string | null;
  const advanceAmount = advanceAmountStr ? parseFloat(advanceAmountStr) : 0;
  const paymentMethod = formData.get('paymentMethod') as string | null;

  const client = await prisma.client.create({
    data: { name: clientName }
  });

  const sale = await prisma.sale.create({
    data: {
      clientId: client.id,
      agentId,
      teamId,
      targetAmount,
      status,
      customSaleId,
      product,
      productDescription,
      clientSocialHandle,
      approvalStatus: 'APPROVED' // Since TL is creating it, it's pre-approved
    }
  });

  if (advanceAmount > 0) {
    await prisma.paymentTransaction.create({
      data: {
        saleId: sale.id,
        amount: advanceAmount,
        method: paymentMethod || 'Unknown'
      }
    });
  }

  revalidatePath(`/portal/leader/${teamId}`);
}
