'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getCompensationProfiles() {
  const users = await prisma.user.findMany({
    where: { position: 'Employee' },
    include: {
      compensationProfiles: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })
  
  return users.map(u => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    profile: u.compensationProfiles[0] || null
  }))
}

export async function updateCompensationProfile(userId: string, data: any) {
  // We close the old profile and create a new one to preserve history
  const activeProfile = await prisma.compensationProfile.findFirst({
    where: { userId, validTo: null },
    orderBy: { createdAt: 'desc' }
  })
  
  if (activeProfile) {
    await prisma.compensationProfile.update({
      where: { id: activeProfile.id },
      data: { validTo: new Date() }
    })
  }

  await prisma.compensationProfile.create({
    data: {
      userId,
      baseSalaryCap: Number(data.baseSalaryCap),
      ratePerUnit: Number(data.ratePerUnit),
      commissionRate: Number(data.commissionRate),
      bonusThreshold1: Number(data.bonusThreshold1),
      bonusAmount1: Number(data.bonusAmount1),
      bonusThresholdStep: Number(data.bonusThresholdStep),
      bonusAmountStep: Number(data.bonusAmountStep),
      emCommissionThreshold: Number(data.emCommissionThreshold || 10000),
      emCommissionRate1: Number(data.emCommissionRate1 || 10),
      emCommissionRate2: Number(data.emCommissionRate2 || 5),
      leadershipCommissionRate: Number(data.leadershipCommissionRate || 10)
    }
  })
  
  return { success: true }
}
