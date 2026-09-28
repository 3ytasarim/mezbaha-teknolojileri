"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import type { SubmissionStatus } from "@prisma/client";

const STATUSES: SubmissionStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"];

export async function updateQuoteStatusAction(formData: FormData) {
  await requireAdmin("EDITOR");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as SubmissionStatus;
  if (!id || !STATUSES.includes(status)) return;
  await prisma.quoteRequest.update({ where: { id }, data: { status } });
  revalidatePath("/admin/talepler/teklif");
}
