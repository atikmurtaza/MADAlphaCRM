import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { User as PrismaUser } from "@prisma/client";

export type AuthContext = {
  supabaseUser: any | null;
  crmProfile: PrismaUser | null;
  status: "UNAUTHENTICATED" | "PENDING_ASSIGNMENT" | "INACTIVE" | "ACTIVE";
};

/**
 * Resolves the current user's Supabase session and mapped CRM profile.
 * This should be called at the top of protected Server Actions and API Routes.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabaseUser: null, crmProfile: null, status: "UNAUTHENTICATED" };
  }

  const crmProfile = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
  });

  if (!crmProfile) {
    return { supabaseUser: user, crmProfile: null, status: "PENDING_ASSIGNMENT" };
  }

  if (!crmProfile.isActive) {
    return { supabaseUser: user, crmProfile, status: "INACTIVE" };
  }

  return { supabaseUser: user, crmProfile, status: "ACTIVE" };
}

/**
 * Helper to assert the user is fully active and authorized.
 * Throws an error if not ACTIVE.
 */
export async function assertActiveUser() {
  const context = await requireAuth();
  
  if (context.status === "UNAUTHENTICATED") throw new Error("Unauthorized");
  if (context.status === "PENDING_ASSIGNMENT") throw new Error("Pending Assignment");
  if (context.status === "INACTIVE") throw new Error("Account Inactive");

  return context.crmProfile!;
}
