import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "contact.atikmurtaza@gmail.com";

  console.log(`Bootstrapping admin for ${email}...`);

  const authUserId = "1a7df8d1-4ef1-4d30-8372-3442b6b6b84c";
  
  // 2. Find or Create the CRM profile and make them an Admin
  const existingProfile = await prisma.user.findUnique({
    where: { email },
  });

  if (existingProfile) {
    console.log("Updating existing CRM profile...");
    await prisma.user.update({
      where: { email },
      data: {
        auth_user_id: authUserId,
        position: "Admin",
        isActive: true,
      },
    });
  } else {
    console.log("Creating new CRM profile...");
    await prisma.user.create({
      data: {
        name: "Atik Murtaza",
        email: email,
        auth_user_id: authUserId,
        position: "Admin",
        isActive: true,
      },
    });
  }

  console.log("✅ Successfully bootstrapped Admin account!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
