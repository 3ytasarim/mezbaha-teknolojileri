import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import type { AdminRole } from "@prisma/client";

const ROLE_RANK: Record<AdminRole, number> = {
  EDITOR: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

export async function requireAdmin(minRole: AdminRole = "EDITOR"): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    redirect("/admin");
  }

  return user;
}
