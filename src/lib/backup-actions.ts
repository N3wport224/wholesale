"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { summarizeBackup, validateBackupData, type BackupSummary } from "@/lib/backup";

export type RestoreState = { error?: string; success?: BackupSummary };

const CONFIRM_PHRASE = "REPLACE ALL DATA";

export async function restoreBackup(_prevState: RestoreState, formData: FormData): Promise<RestoreState> {
  const raw = formData.get("backup");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Upload or paste a backup file first." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That file isn't valid JSON." };
  }

  const validated = validateBackupData(parsed);
  if ("error" in validated) return { error: validated.error };

  const confirmText = formData.get("confirm");
  if (confirmText !== CONFIRM_PHRASE) {
    return { error: `Type "${CONFIRM_PHRASE}" to confirm — this permanently replaces everything currently in the app.` };
  }

  const { data } = validated;

  await prisma.$transaction([
    prisma.dealBuyerOutreach.deleteMany(),
    prisma.dealActivity.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.buyer.deleteMany(),
    prisma.buyer.createMany({
      data: data.buyers.map((b) => ({ ...b, createdAt: new Date(b.createdAt) })),
    }),
    prisma.deal.createMany({
      data: data.deals.map((d) => ({
        ...d,
        contractDate: d.contractDate ? new Date(d.contractDate) : null,
        closingDate: d.closingDate ? new Date(d.closingDate) : null,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      })),
    }),
    prisma.dealActivity.createMany({
      data: data.activities.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })),
    }),
    prisma.dealBuyerOutreach.createMany({
      data: data.outreach.map((o) => ({ ...o, sentAt: new Date(o.sentAt) })),
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/buyers");
  revalidatePath("/analytics");

  return { success: summarizeBackup(data) };
}
