'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function updateProjectDetails(projectId: string, field: string, value: any, emUserId: string) {
  const data: any = {};
  data[field] = value;

  await prisma.project.update({
    where: { id: projectId },
    data
  });
  
  revalidatePath(`/operations/${emUserId}/projects`);
}

export async function updateSaleStatus(saleId: string, status: string, emUserId: string) {
  await prisma.sale.update({
    where: { id: saleId },
    data: { 
      status,
      clearedAt: status === 'COMPLETED' ? new Date() : null
    }
  });
  
  revalidatePath(`/operations/${emUserId}/projects`);
}

export async function assignExecutionManager(projectId: string, employeeId: string, emUserId: string) {
  // First, remove existing assignment for this project if any
  await prisma.projectAssignment.deleteMany({
    where: { projectId }
  });

  // If a specific employee is chosen, assign them
  if (employeeId) {
    await prisma.projectAssignment.create({
      data: {
        projectId,
        employeeId,
        role: 'ASSISTANT_EXECUTION_MANAGER'
      }
    });
  }

  revalidatePath(`/operations/${emUserId}/projects`);
}

export async function createAssistantEM(formData: FormData, emUserId: string) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const baseSalary = parseFloat(formData.get('baseSalary') as string);

  await prisma.user.create({
    data: {
      name,
      email,
      position: 'Assistant Execution Manager',
      baseSalary
    }
  });

  revalidatePath(`/operations/${emUserId}/projects`);
}
