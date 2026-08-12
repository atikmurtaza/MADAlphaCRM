import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (action === "drop") {
    console.log("Dropping cross-schema FK constraint...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."User" DROP CONSTRAINT IF EXISTS "User_auth_user_id_fkey";`);
    console.log("Done.");
  } else if (action === "add") {
    console.log("Adding cross-schema FK constraint...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."User" 
      ADD CONSTRAINT "User_auth_user_id_fkey" 
      FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log("Done.");
  } else {
    console.log("Please specify 'drop' or 'add'");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
