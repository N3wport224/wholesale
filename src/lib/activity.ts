import { prisma } from "@/lib/prisma";

export type ActivityType =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGE"
  | "CONTRACT"
  | "BUYER_ASSIGNED"
  | "CLOSED"
  | "OUTREACH";

export async function logActivity(dealId: string, type: ActivityType, message: string) {
  await prisma.dealActivity.create({ data: { dealId, type, message } });
}
