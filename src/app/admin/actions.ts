"use server";

import { prisma } from "@/lib/prisma";
import { assertActiveUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function assignProfile(authUserId: string, crmProfileId: string) {
  try {
    // 1. Authorize: Only Admins can assign profiles
    const adminUser = await assertActiveUser();
    if (adminUser.position !== "Admin" && adminUser.position !== "SuperAdmin") {
      return { error: "Unauthorized: You do not have permission to assign profiles." };
    }

    // 2. Transactional Assignment
    await prisma.$transaction(async (tx) => {
      // Validate profile exists and is unassigned
      const profile = await tx.user.findUnique({
        where: { id: crmProfileId },
      });

      if (!profile) {
        throw new Error("The selected CRM profile does not exist.");
      }

      if (profile.auth_user_id) {
        throw new Error("This CRM profile is already linked to another authenticated user.");
      }

      // Execute assignment
      await tx.user.update({
        where: { id: crmProfileId },
        data: { auth_user_id: authUserId },
      });
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Assignment error:", error);
    return { error: error.message || "Failed to assign profile." };
  }
}

export async function updateUserRoles(
  crmProfileId: string, 
  position: string, 
  roles: string[],
  teamId: string,
  departmentId: string,
  leadsTeams: string[],
  accessibleEmployeeIds: string[]
) {
  try {
    const adminUser = await assertActiveUser();
    if (adminUser.position !== "Admin" && adminUser.position !== "SuperAdmin") {
      return { error: "Unauthorized: You do not have permission to modify roles." };
    }

    // Only map scopes if the user actually holds the corresponding role
    const hasEmployee = position === "Employee" || roles.includes("Employee");
    const hasExecutionManager = position === "Execution Manager" || roles.includes("Execution Manager");
    const hasTeamLeader = position === "Team Leader" || roles.includes("Team Leader");

    await prisma.user.update({
      where: { id: crmProfileId },
      data: {
        position,
        roles,
        teamId: hasEmployee && teamId ? teamId : null,
        departmentId: hasExecutionManager && departmentId ? departmentId : null,
        leadsTeams: hasTeamLeader ? {
          set: leadsTeams.map(id => ({ id }))
        } : {
          set: [] // Clear led teams if they are no longer a Team Leader
        },
        accessibleEmployees: hasEmployee ? {
          set: accessibleEmployeeIds.map(id => ({ id }))
        } : {
          set: []
        }
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Role update error:", error);
    return { error: error.message || "Failed to update roles." };
  }
}
