// Full-database backup/restore. Since this app's SQLite file is the only
// copy of the user's deals and buyers, a JSON export/import is the
// difference between "recoverable" and "gone forever" if the container,
// disk, or a misclick wipes it out.
export const BACKUP_VERSION = 1;

export type BackupBuyer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  targetStates: string | null;
  createdAt: string;
};

export type BackupDeal = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  sourceSite: string;
  purchasePrice: number;
  estimatedValue: number;
  rentComp: number | null;
  status: string;
  earnestMoney: number | null;
  inspectionDays: number | null;
  contractDate: string | null;
  assignmentFee: number | null;
  closingDate: string | null;
  notes: string | null;
  followUpDate: string | null;
  followUpNote: string | null;
  buyerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackupActivity = {
  id: string;
  dealId: string;
  type: string;
  message: string;
  createdAt: string;
};

export type BackupOutreach = {
  id: string;
  dealId: string;
  buyerId: string;
  sentAt: string;
};

export type BackupData = {
  version: number;
  exportedAt: string;
  buyers: BackupBuyer[];
  deals: BackupDeal[];
  activities: BackupActivity[];
  outreach: BackupOutreach[];
};

export type BackupSummary = {
  buyers: number;
  deals: number;
  activities: number;
  outreach: number;
};

export function summarizeBackup(data: BackupData): BackupSummary {
  return {
    buyers: data.buyers.length,
    deals: data.deals.length,
    activities: data.activities.length,
    outreach: data.outreach.length,
  };
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}
function isNumberOrNull(v: unknown): v is number | null {
  return v === null || typeof v === "number";
}
function isValidDateString(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(new Date(v).getTime());
}
function isValidDateStringOrNull(v: unknown): v is string | null {
  return v === null || isValidDateString(v);
}
// Backups exported before a field existed simply won't have that key —
// treat a missing key the same as an explicit null so old backups keep
// restoring instead of failing validation on fields they predate.
function isValidDateStringOrNullish(v: unknown): v is string | null | undefined {
  return v === undefined || isValidDateStringOrNull(v);
}
function isStringOrNullish(v: unknown): v is string | null | undefined {
  return v === undefined || isStringOrNull(v);
}

function validateBuyer(raw: unknown, index: number): { error: string } | { value: BackupBuyer } {
  if (typeof raw !== "object" || raw === null) return { error: `buyers[${index}] is not an object.` };
  const b = raw as Record<string, unknown>;
  if (!isString(b.id) || !isString(b.name)) {
    return { error: `buyers[${index}] is missing a valid id or name.` };
  }
  if (!isStringOrNull(b.email) || !isStringOrNull(b.phone) || !isStringOrNull(b.notes) || !isStringOrNull(b.targetStates)) {
    return { error: `buyers[${index}] has an invalid text field.` };
  }
  if (!isNumberOrNull(b.minPrice) || !isNumberOrNull(b.maxPrice)) {
    return { error: `buyers[${index}] has an invalid price field.` };
  }
  if (!isValidDateString(b.createdAt)) {
    return { error: `buyers[${index}] has an invalid createdAt date.` };
  }
  return {
    value: {
      id: b.id,
      name: b.name,
      email: b.email as string | null,
      phone: b.phone as string | null,
      notes: b.notes as string | null,
      minPrice: b.minPrice as number | null,
      maxPrice: b.maxPrice as number | null,
      targetStates: b.targetStates as string | null,
      createdAt: b.createdAt as string,
    },
  };
}

function validateDeal(raw: unknown, index: number): { error: string } | { value: BackupDeal } {
  if (typeof raw !== "object" || raw === null) return { error: `deals[${index}] is not an object.` };
  const d = raw as Record<string, unknown>;
  if (!isString(d.id) || !isString(d.address) || !isString(d.city) || !isString(d.state) || !isString(d.zip)) {
    return { error: `deals[${index}] is missing required address fields.` };
  }
  if (!isString(d.sourceSite) || !isString(d.status)) {
    return { error: `deals[${index}] is missing sourceSite or status.` };
  }
  if (typeof d.purchasePrice !== "number" || typeof d.estimatedValue !== "number") {
    return { error: `deals[${index}] has an invalid price.` };
  }
  if (!isNumberOrNull(d.rentComp) || !isNumberOrNull(d.earnestMoney) || !isNumberOrNull(d.inspectionDays) || !isNumberOrNull(d.assignmentFee)) {
    return { error: `deals[${index}] has an invalid numeric field.` };
  }
  if (!isValidDateStringOrNull(d.contractDate) || !isValidDateStringOrNull(d.closingDate)) {
    return { error: `deals[${index}] has an invalid date field.` };
  }
  if (!isStringOrNull(d.notes) || !isStringOrNull(d.buyerId)) {
    return { error: `deals[${index}] has an invalid text field.` };
  }
  if (!isValidDateStringOrNullish(d.followUpDate)) {
    return { error: `deals[${index}] has an invalid follow-up date.` };
  }
  if (!isStringOrNullish(d.followUpNote)) {
    return { error: `deals[${index}] has an invalid follow-up note.` };
  }
  if (!isValidDateString(d.createdAt) || !isValidDateString(d.updatedAt)) {
    return { error: `deals[${index}] has an invalid createdAt/updatedAt date.` };
  }
  return {
    value: {
      id: d.id,
      address: d.address,
      city: d.city,
      state: d.state,
      zip: d.zip,
      sourceSite: d.sourceSite,
      purchasePrice: d.purchasePrice,
      estimatedValue: d.estimatedValue,
      rentComp: d.rentComp as number | null,
      status: d.status,
      earnestMoney: d.earnestMoney as number | null,
      inspectionDays: d.inspectionDays as number | null,
      contractDate: d.contractDate as string | null,
      assignmentFee: d.assignmentFee as number | null,
      closingDate: d.closingDate as string | null,
      notes: d.notes as string | null,
      followUpDate: (d.followUpDate as string | null | undefined) ?? null,
      followUpNote: (d.followUpNote as string | null | undefined) ?? null,
      buyerId: d.buyerId as string | null,
      createdAt: d.createdAt as string,
      updatedAt: d.updatedAt as string,
    },
  };
}

function validateActivity(raw: unknown, index: number): { error: string } | { value: BackupActivity } {
  if (typeof raw !== "object" || raw === null) return { error: `activities[${index}] is not an object.` };
  const a = raw as Record<string, unknown>;
  if (!isString(a.id) || !isString(a.dealId) || !isString(a.type) || !isString(a.message)) {
    return { error: `activities[${index}] is missing a required field.` };
  }
  if (!isValidDateString(a.createdAt)) {
    return { error: `activities[${index}] has an invalid createdAt date.` };
  }
  return { value: { id: a.id, dealId: a.dealId, type: a.type, message: a.message, createdAt: a.createdAt as string } };
}

function validateOutreach(raw: unknown, index: number): { error: string } | { value: BackupOutreach } {
  if (typeof raw !== "object" || raw === null) return { error: `outreach[${index}] is not an object.` };
  const o = raw as Record<string, unknown>;
  if (!isString(o.id) || !isString(o.dealId) || !isString(o.buyerId)) {
    return { error: `outreach[${index}] is missing a required field.` };
  }
  if (!isValidDateString(o.sentAt)) {
    return { error: `outreach[${index}] has an invalid sentAt date.` };
  }
  return { value: { id: o.id, dealId: o.dealId, buyerId: o.buyerId, sentAt: o.sentAt as string } };
}

export function validateBackupData(input: unknown): { data: BackupData } | { error: string } {
  if (typeof input !== "object" || input === null) {
    return { error: "That doesn't look like a backup file — expected a JSON object." };
  }
  const raw = input as Record<string, unknown>;
  if (raw.version !== BACKUP_VERSION) {
    return { error: `Unsupported backup version (expected ${BACKUP_VERSION}).` };
  }
  if (!Array.isArray(raw.buyers) || !Array.isArray(raw.deals) || !Array.isArray(raw.activities) || !Array.isArray(raw.outreach)) {
    return { error: "Backup file is missing one of buyers, deals, activities, or outreach." };
  }

  const buyers: BackupBuyer[] = [];
  for (let i = 0; i < raw.buyers.length; i++) {
    const result = validateBuyer(raw.buyers[i], i);
    if ("error" in result) return { error: result.error };
    buyers.push(result.value);
  }

  const deals: BackupDeal[] = [];
  for (let i = 0; i < raw.deals.length; i++) {
    const result = validateDeal(raw.deals[i], i);
    if ("error" in result) return { error: result.error };
    deals.push(result.value);
  }

  const activities: BackupActivity[] = [];
  for (let i = 0; i < raw.activities.length; i++) {
    const result = validateActivity(raw.activities[i], i);
    if ("error" in result) return { error: result.error };
    activities.push(result.value);
  }

  const outreach: BackupOutreach[] = [];
  for (let i = 0; i < raw.outreach.length; i++) {
    const result = validateOutreach(raw.outreach[i], i);
    if ("error" in result) return { error: result.error };
    outreach.push(result.value);
  }

  // Referential integrity: every deal.buyerId, activity.dealId, and
  // outreach.dealId/buyerId must point at a record actually in this backup,
  // or the restore would violate foreign keys partway through.
  const buyerIds = new Set(buyers.map((b) => b.id));
  const dealIds = new Set(deals.map((d) => d.id));
  for (const d of deals) {
    if (d.buyerId !== null && !buyerIds.has(d.buyerId)) {
      return { error: `Deal ${d.id} references a buyer that isn't in this backup.` };
    }
  }
  for (const a of activities) {
    if (!dealIds.has(a.dealId)) {
      return { error: `Activity ${a.id} references a deal that isn't in this backup.` };
    }
  }
  for (const o of outreach) {
    if (!dealIds.has(o.dealId) || !buyerIds.has(o.buyerId)) {
      return { error: `Outreach record ${o.id} references a deal or buyer that isn't in this backup.` };
    }
  }

  return {
    data: {
      version: raw.version,
      exportedAt: isString(raw.exportedAt) ? raw.exportedAt : new Date().toISOString(),
      buyers,
      deals,
      activities,
      outreach,
    },
  };
}
