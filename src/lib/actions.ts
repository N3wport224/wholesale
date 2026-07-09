"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  SOURCE_SITES,
  parseOptionalDate,
  parseOptionalInteger,
  parseOptionalNumber,
} from "@/lib/deal-logic";
import { parseCsv } from "@/lib/csv";

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

type DealRecordResult =
  | { error: string }
  | {
      data: {
        address: string;
        city: string;
        state: string;
        zip: string;
        sourceSite: string;
        purchasePrice: number;
        estimatedValue: number;
        rentComp: number | null;
        notes: string | null;
      };
    };

function validateDealRecord(record: Record<string, string | undefined>): DealRecordResult {
  const address = (record.address ?? "").trim();
  const city = (record.city ?? "").trim();
  const state = (record.state ?? "").trim();
  const zip = (record.zip ?? "").trim();
  const purchasePriceRaw = (record.purchasePrice ?? "").trim();
  const estimatedValueRaw = (record.estimatedValue ?? "").trim();
  const rentCompRaw = (record.rentComp ?? "").trim();

  const purchasePrice = purchasePriceRaw === "" ? null : Number(purchasePriceRaw);
  const estimatedValue = estimatedValueRaw === "" ? null : Number(estimatedValueRaw);
  const rentComp = rentCompRaw === "" ? null : Number(rentCompRaw);

  if (!address || !city || !state || !zip) {
    return { error: "Address, city, state, and zip are all required." } as const;
  }
  if (state.length !== 2) {
    return { error: "State should be a 2-letter code, like TX." } as const;
  }
  if (purchasePrice === null || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    return { error: "Purchase price must be a number greater than 0." } as const;
  }
  if (estimatedValue === null || !Number.isFinite(estimatedValue) || estimatedValue <= 0) {
    return { error: "Estimated value must be a number greater than 0." } as const;
  }
  if (rentComp !== null && (!Number.isFinite(rentComp) || rentComp < 0)) {
    return { error: "Rent comp can't be negative." } as const;
  }

  const sourceSiteRaw = (record.sourceSite ?? "").trim();
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
      notes: (record.notes ?? "").trim() || null,
    },
  } as const;
}

function validateDealFields(formData: FormData) {
  return validateDealRecord({
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    zip: str(formData, "zip"),
    sourceSite: str(formData, "sourceSite"),
    purchasePrice: str(formData, "purchasePrice"),
    estimatedValue: str(formData, "estimatedValue"),
    rentComp: str(formData, "rentComp"),
    notes: str(formData, "notes"),
  });
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

  const earnestMoneyField = parseOptionalNumber(str(formData, "earnestMoney"), "Earnest money");
  if ("error" in earnestMoneyField) return { error: earnestMoneyField.error };
  const earnestMoney = earnestMoneyField.value;
  if (earnestMoney !== null && earnestMoney < 0) {
    return { error: "Earnest money can't be negative." };
  }

  const inspectionDaysField = parseOptionalInteger(str(formData, "inspectionDays"), "Inspection period");
  if ("error" in inspectionDaysField) return { error: inspectionDaysField.error };
  const inspectionDays = inspectionDaysField.value;
  if (inspectionDays !== null && (inspectionDays < 1 || inspectionDays > 120)) {
    return { error: "Inspection period should be between 1 and 120 days." };
  }

  const contractDateField = parseOptionalDate(str(formData, "contractDate"), "Contract date");
  if ("error" in contractDateField) return { error: contractDateField.error };
  const contractDate = contractDateField.value;

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

export async function updateBuyerOutreach(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { error: "Deal not found." };

  const checkedIds = new Set(formData.getAll("buyerIds").map(String));
  const existing = await prisma.dealBuyerOutreach.findMany({ where: { dealId } });
  const existingIds = new Set(existing.map((o) => o.buyerId));

  const toAdd = [...checkedIds].filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((o) => !checkedIds.has(o.buyerId));

  if (toAdd.length > 0) {
    await prisma.dealBuyerOutreach.createMany({
      data: toAdd.map((buyerId) => ({ dealId, buyerId })),
    });
  }
  if (toRemove.length > 0) {
    await prisma.dealBuyerOutreach.deleteMany({
      where: { id: { in: toRemove.map((o) => o.id) } },
    });
  }

  if (toAdd.length > 0 || toRemove.length > 0) {
    const parts: string[] = [];
    if (toAdd.length > 0) {
      const addedBuyers = await prisma.buyer.findMany({
        where: { id: { in: toAdd } },
        select: { name: true },
      });
      parts.push(`sent to ${addedBuyers.map((b) => b.name).join(", ")}`);
    }
    if (toRemove.length > 0) parts.push(`removed ${toRemove.length} from the outreach list`);
    await logActivity(dealId, "OUTREACH", `Marketing outreach updated — ${parts.join("; ")}.`);
  }

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

  const closingDateField = parseOptionalDate(str(formData, "closingDate"), "Closing date");
  if ("error" in closingDateField) return { error: closingDateField.error };
  const closingDate = closingDateField.value ?? new Date();

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

export type ImportResult = {
  error?: string;
  summary?: { created: number; skipped: { row: number; reason: string }[] };
};

const IMPORT_COLUMN_ALIASES: Record<string, string> = {
  address: "address",
  city: "city",
  state: "state",
  zip: "zip",
  zipcode: "zip",
  "zip code": "zip",
  source: "sourceSite",
  sourcesite: "sourceSite",
  "source site": "sourceSite",
  purchaseprice: "purchasePrice",
  "purchase price": "purchasePrice",
  estimatedvalue: "estimatedValue",
  "estimated value": "estimatedValue",
  arv: "estimatedValue",
  rentcomp: "rentComp",
  "rent comp": "rentComp",
  rent: "rentComp",
  notes: "notes",
};

export async function importDeals(_prevState: ImportResult, formData: FormData): Promise<ImportResult> {
  const csvText = str(formData, "csv");
  if (!csvText) return { error: "Paste or upload some CSV data first." };

  const rows = parseCsv(csvText);
  if (rows.length < 2) return { error: "Couldn't find any data rows below the header." };

  const [headerRow, ...dataRows] = rows;
  const columns = headerRow.map((h) => IMPORT_COLUMN_ALIASES[h.trim().toLowerCase()] ?? null);

  const required = ["address", "city", "state", "zip", "purchasePrice", "estimatedValue"];
  if (required.some((col) => !columns.includes(col))) {
    return {
      error:
        "CSV header must include Address, City, State, Zip, Purchase Price, and Estimated Value columns.",
    };
  }

  const skipped: { row: number; reason: string }[] = [];
  let created = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2; // +1 for the header row, +1 to make it 1-indexed
    const values = dataRows[i];
    const record: Record<string, string> = {};
    columns.forEach((col, idx) => {
      if (col) record[col] = values[idx] ?? "";
    });

    const validated = validateDealRecord(record);
    if ("error" in validated) {
      skipped.push({ row: rowNum, reason: validated.error });
      continue;
    }

    const duplicate = await findDuplicateDeal(
      validated.data.address,
      validated.data.city,
      validated.data.state
    );
    if (duplicate) {
      skipped.push({ row: rowNum, reason: "Duplicate of an existing deal at this address." });
      continue;
    }

    const deal = await prisma.deal.create({ data: validated.data });
    await logActivity(deal.id, "CREATED", `Deal imported from CSV (row ${rowNum}).`);
    created++;
  }

  revalidatePath("/");
  return { summary: { created, skipped } };
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
  redirect("/buyers");
}
