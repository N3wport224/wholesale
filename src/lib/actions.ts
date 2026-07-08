"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { SOURCE_SITES } from "@/lib/deal-logic";

export type ActionState = { error?: string };

const NO_ERROR: ActionState = {};

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function int(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function date(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  if (v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validateDealFields(formData: FormData) {
  const address = str(formData, "address");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const zip = str(formData, "zip");
  const purchasePrice = num(formData, "purchasePrice");
  const estimatedValue = num(formData, "estimatedValue");
  const rentComp = num(formData, "rentComp");

  if (!address || !city || !state || !zip) {
    return { error: "Address, city, state, and zip are all required." } as const;
  }
  if (state.length !== 2) {
    return { error: "State should be a 2-letter code, like TX." } as const;
  }
  if (purchasePrice === null || purchasePrice <= 0) {
    return { error: "Purchase price must be a number greater than 0." } as const;
  }
  if (estimatedValue === null || estimatedValue <= 0) {
    return { error: "Estimated value must be a number greater than 0." } as const;
  }
  if (rentComp !== null && rentComp < 0) {
    return { error: "Rent comp can't be negative." } as const;
  }

  const sourceSiteRaw = str(formData, "sourceSite");
  const sourceSite = (SOURCE_SITES as readonly string[]).includes(sourceSiteRaw)
    ? sourceSiteRaw
    : "Other";

  return {
    data: {
      address,
      city,
      state: state.toUpperCase(),
      zip,
      sourceSite,
      purchasePrice,
      estimatedValue,
      rentComp,
      notes: str(formData, "notes") || null,
    },
  } as const;
}

async function findDuplicateDeal(address: string, city: string, state: string) {
  const candidates = await prisma.deal.findMany({
    select: { id: true, address: true, city: true, state: true },
  });
  const norm = (s: string) => s.trim().toLowerCase();
  return candidates.find(
    (d) => norm(d.address) === norm(address) && norm(d.city) === norm(city) && norm(d.state) === norm(state)
  );
}

export async function createDeal(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = validateDealFields(formData);
  if ("error" in validated) return { error: validated.error };

  const duplicate = await findDuplicateDeal(validated.data.address, validated.data.city, validated.data.state);

  const deal = await prisma.deal.create({ data: validated.data });
  await logActivity(deal.id, "CREATED", `Deal sourced from ${validated.data.sourceSite}.`);

  revalidatePath("/");
  redirect(`/deals/${deal.id}${duplicate ? "?duplicate=1" : ""}`);
}

export async function updateDeal(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = validateDealFields(formData);
  if ("error" in validated) return { error: validated.error };

  await prisma.deal.update({ where: { id: dealId }, data: validated.data });
  await logActivity(dealId, "UPDATED", "Deal details updated.");

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}

export async function updateContractTerms(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Deal not found." };
  if (deal.status === "CLOSED") return { error: "This deal is already closed." };

  const earnestMoney = num(formData, "earnestMoney");
  const inspectionDays = int(formData, "inspectionDays");
  const contractDate = date(formData, "contractDate");

  if (earnestMoney !== null && earnestMoney < 0) {
    return { error: "Earnest money can't be negative." };
  }
  if (inspectionDays !== null && (inspectionDays < 1 || inspectionDays > 120)) {
    return { error: "Inspection period should be between 1 and 120 days." };
  }

  const wasDead = deal.status === "DEAD";

  await prisma.deal.update({
    where: { id: dealId },
    data: { earnestMoney, inspectionDays, contractDate, status: "UNDER_CONTRACT" },
  });
  await logActivity(
    dealId,
    "CONTRACT",
    wasDead
      ? "Deal reactivated and locked under contract."
      : "Locked under contract — earnest money and inspection terms saved."
  );

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  return NO_ERROR;
}

export async function assignBuyerToDeal(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Deal not found." };
  if (deal.status === "CLOSED") return { error: "This deal is already closed." };

  const buyerId = str(formData, "buyerId");
  const assignmentFee = num(formData, "assignmentFee");

  if (assignmentFee === null || assignmentFee < 0) {
    return { error: "Assignment fee must be 0 or greater." };
  }

  let buyer: { name: string } | null = null;
  if (buyerId) {
    buyer = await prisma.buyer.findUnique({ where: { id: buyerId }, select: { name: true } });
    if (!buyer) return { error: "Selected buyer no longer exists." };
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: { buyerId: buyerId || null, assignmentFee, status: "MARKETING" },
  });

  await logActivity(
    dealId,
    buyer ? "BUYER_ASSIGNED" : "STATUS_CHANGE",
    buyer
      ? `Assigned to ${buyer.name} for a $${assignmentFee.toLocaleString()} fee.`
      : "Moved to marketing."
  );

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/buyers");
  return NO_ERROR;
}

export async function closeDeal(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Deal not found." };
  if (deal.status === "CLOSED") return { error: "This deal is already closed." };

  const closingDate = date(formData, "closingDate") ?? new Date();

  await prisma.deal.update({
    where: { id: dealId },
    data: { closingDate, status: "CLOSED" },
  });
  await logActivity(
    dealId,
    "CLOSED",
    `Closed — collected ${deal.assignmentFee ? `$${deal.assignmentFee.toLocaleString()}` : "an assignment fee"}.`
  );

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  return NO_ERROR;
}

export async function markDealDead(dealId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { status: "DEAD" } });
  await logActivity(dealId, "STATUS_CHANGE", "Marked dead.");
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}

export async function updateDealNotes(dealId: string, formData: FormData) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { notes: str(formData, "notes") || null },
  });
  revalidatePath(`/deals/${dealId}`);
}

export async function deleteDeal(dealId: string) {
  await prisma.deal.delete({ where: { id: dealId } });
  revalidatePath("/");
  redirect("/");
}

function validateBuyerFields(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return { error: "Buyer name is required." } as const;

  const email = str(formData, "email");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "That email address doesn't look valid." } as const;
  }

  const minPrice = num(formData, "minPrice");
  const maxPrice = num(formData, "maxPrice");
  if (minPrice !== null && minPrice < 0) {
    return { error: "Minimum buy box price can't be negative." } as const;
  }
  if (maxPrice !== null && maxPrice < 0) {
    return { error: "Maximum buy box price can't be negative." } as const;
  }
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { error: "Minimum buy box price can't be greater than the maximum." } as const;
  }

  const targetStatesRaw = str(formData, "targetStates");
  const states = targetStatesRaw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (states.some((s) => s.length !== 2)) {
    return { error: "Target states should be 2-letter codes separated by commas, like TX, OK." } as const;
  }

  return {
    data: {
      name,
      email: email || null,
      phone: str(formData, "phone") || null,
      notes: str(formData, "notes") || null,
      minPrice,
      maxPrice,
      targetStates: states.length > 0 ? states.join(",") : null,
    },
  } as const;
}

export async function createBuyer(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = validateBuyerFields(formData);
  if ("error" in validated) return { error: validated.error };

  await prisma.buyer.create({ data: validated.data });
  revalidatePath("/buyers");
  return NO_ERROR;
}

export async function updateBuyer(
  buyerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = validateBuyerFields(formData);
  if ("error" in validated) return { error: validated.error };

  await prisma.buyer.update({ where: { id: buyerId }, data: validated.data });
  revalidatePath("/buyers");
  redirect("/buyers");
}

export async function deleteBuyer(buyerId: string) {
  await prisma.buyer.delete({ where: { id: buyerId } });
  revalidatePath("/buyers");
  revalidatePath("/");
}
