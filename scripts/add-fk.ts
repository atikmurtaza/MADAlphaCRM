import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Add foreign key constraint securely
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD CONSTRAINT "User_auth_user_id_fkey" 
      FOREIGN KEY ("auth_user_id") 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
    `);
    console.log("Foreign key constraint added successfully.");
  } catch (error) {
    console.error("Error adding constraint (it might already exist):", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
