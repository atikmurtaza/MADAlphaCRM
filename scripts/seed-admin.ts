import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@madalpha.com';
  const adminPassword = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        position: 'Admin',
        roles: ['ADMIN'],
        emailVerified: new Date(),
        isApproved: true,
      }
    });
    console.log(`Created admin user: ${adminEmail} (password: admin123)`);
  } else {
    // Ensure they have the ADMIN role and are approved
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        roles: ['ADMIN'],
        isApproved: true,
        emailVerified: new Date(),
        password: adminPassword,
      }
    });
    console.log(`Updated admin user: ${adminEmail} (password reset to: admin123)`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
