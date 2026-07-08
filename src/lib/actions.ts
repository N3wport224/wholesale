"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEAL_STATUSES, DealStatus } from "@/lib/deal-logic";

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
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function date(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  if (v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createDeal(formData: FormData) {
  const address = str(formData, "address");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const zip = str(formData, "zip");
  const purchasePrice = num(formData, "purchasePrice");
  const estimatedValue = num(formData, "estimatedValue");

  if (!address || !city || !state || !zip || purchasePrice === null || estimatedValue === null) {
    throw new Error("Address, city, state, zip, purchase price, and estimated value are required.");
  }

  const deal = await prisma.deal.create({
    data: {
      address,
      city,
      state,
      zip,
      sourceSite: str(formData, "sourceSite") || "Other",
      purchasePrice,
      estimatedValue,
      rentComp: num(formData, "rentComp"),
      notes: str(formData, "notes") || null,
    },
  });

  revalidatePath("/");
  redirect(`/deals/${deal.id}`);
}

export async function updateDealStatus(dealId: string, status: DealStatus) {
  if (!DEAL_STATUSES.includes(status)) throw new Error("Invalid status");
  await prisma.deal.update({ where: { id: dealId }, data: { status } });
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}

export async function updateContractTerms(dealId: string, formData: FormData) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      earnestMoney: num(formData, "earnestMoney"),
      inspectionDays: int(formData, "inspectionDays"),
      contractDate: date(formData, "contractDate"),
      status: "UNDER_CONTRACT",
    },
  });
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}

export async function assignBuyerToDeal(dealId: string, formData: FormData) {
  const buyerId = str(formData, "buyerId");
  const assignmentFee = num(formData, "assignmentFee");

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      buyerId: buyerId || null,
      assignmentFee,
      status: "MARKETING",
    },
  });
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}

export async function closeDeal(dealId: string, formData: FormData) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      closingDate: date(formData, "closingDate") ?? new Date(),
      status: "CLOSED",
    },
  });
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}

export async function markDealDead(dealId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { status: "DEAD" } });
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

export async function createBuyer(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("Buyer name is required.");

  await prisma.buyer.create({
    data: {
      name,
      email: str(formData, "email") || null,
      phone: str(formData, "phone") || null,
      notes: str(formData, "notes") || null,
    },
  });
  revalidatePath("/buyers");
}

export async function deleteBuyer(buyerId: string) {
  await prisma.buyer.delete({ where: { id: buyerId } });
  revalidatePath("/buyers");
}
