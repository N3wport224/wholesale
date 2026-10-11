import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, summarizeBackup, validateBackupData } from "./backup";

function validBackup() {
  return {
    version: BACKUP_VERSION,
    exportedAt: "2026-01-01T00:00:00.000Z",
    buyers: [
      {
        id: "buyer1",
        name: "Marcus Reid",
        email: "marcus@example.com",
        phone: "555-1234",
        notes: null,
        minPrice: 5000,
        maxPrice: 40000,
        targetStates: "TX,OK",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    deals: [
      {
        id: "deal1",
        address: "412 Birchwood Ave",
        city: "Tulsa",
        state: "OK",
        zip: "74106",
        sourceSite: "GSAAuctions.gov",
        purchasePrice: 6500,
        estimatedValue: 78000,
        rentComp: 950,
        status: "MARKETING",
        earnestMoney: 500,
        inspectionDays: 14,
        contractDate: "2026-01-05T00:00:00.000Z",
        assignmentFee: 12000,
        closingDate: null,
        notes: null,
        buyerId: "buyer1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-05T00:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "act1",
        dealId: "deal1",
        type: "CREATED",
        message: "Deal sourced.",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    outreach: [
      { id: "out1", dealId: "deal1", buyerId: "buyer1", sentAt: "2026-01-02T00:00:00.000Z" },
    ],
  };
}

describe("validateBackupData", () => {
  it("accepts a well-formed backup", () => {
    const result = validateBackupData(validBackup());
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.buyers).toHaveLength(1);
      expect(result.data.deals).toHaveLength(1);
    }
  });

  it("accepts a backup exported before the follow-up fields existed (missing keys default to null)", () => {
    // validBackup()'s deals don't include followUpDate/followUpNote at all —
    // simulating a backup downloaded before this feature shipped.
    const result = validateBackupData(validBackup());
    if (!("data" in result)) throw new Error("expected valid backup");
    expect(result.data.deals[0].followUpDate).toBeNull();
    expect(result.data.deals[0].followUpNote).toBeNull();
  });

  it("accepts a backup with follow-up fields present and preserves their values", () => {
    const backup = validBackup();
    Object.assign(backup.deals[0], {
      followUpDate: "2026-02-01T00:00:00.000Z",
      followUpNote: "Call about inspection report",
    });
    const result = validateBackupData(backup);
    if (!("data" in result)) throw new Error("expected valid backup");
    expect(result.data.deals[0].followUpDate).toBe("2026-02-01T00:00:00.000Z");
    expect(result.data.deals[0].followUpNote).toBe("Call about inspection report");
  });

  it("rejects a deal with an invalid follow-up date", () => {
    const backup = validBackup();
    Object.assign(backup.deals[0], { followUpDate: "not-a-date" });
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "deals[0] has an invalid follow-up date." });
  });

  it("rejects non-object input", () => {
    expect(validateBackupData(null)).toEqual({
      error: "That doesn't look like a backup file — expected a JSON object.",
    });
    expect(validateBackupData("just a string")).toEqual({
      error: "That doesn't look like a backup file — expected a JSON object.",
    });
  });

  it("rejects a mismatched version", () => {
    const result = validateBackupData({ ...validBackup(), version: 99 });
    expect("error" in result).toBe(true);
  });

  it("rejects a backup missing one of the four arrays", () => {
    const backup = validBackup();
    // @ts-expect-error intentionally corrupting the shape
    delete backup.outreach;
    const result = validateBackupData(backup);
    expect("error" in result).toBe(true);
  });

  it("rejects a buyer missing a name", () => {
    const backup = validBackup();
    // @ts-expect-error intentionally corrupting the shape
    delete backup.buyers[0].name;
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "buyers[0] is missing a valid id or name." });
  });

  it("rejects a deal with a non-numeric purchase price", () => {
    const backup = validBackup();
    // @ts-expect-error intentionally corrupting the shape
    backup.deals[0].purchasePrice = "not a number";
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "deals[0] has an invalid price." });
  });

  it("rejects a deal with an invalid date string", () => {
    const backup = validBackup();
    backup.deals[0].contractDate = "not-a-date";
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "deals[0] has an invalid date field." });
  });

  it("rejects a deal referencing a buyer not present in the backup", () => {
    const backup = validBackup();
    backup.deals[0].buyerId = "nonexistent-buyer";
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "Deal deal1 references a buyer that isn't in this backup." });
  });

  it("rejects an activity referencing a deal not present in the backup", () => {
    const backup = validBackup();
    backup.activities[0].dealId = "nonexistent-deal";
    const result = validateBackupData(backup);
    expect(result).toEqual({ error: "Activity act1 references a deal that isn't in this backup." });
  });

  it("rejects an outreach record referencing a missing deal or buyer", () => {
    const backup = validBackup();
    backup.outreach[0].buyerId = "nonexistent-buyer";
    const result = validateBackupData(backup);
    expect(result).toEqual({
      error: "Outreach record out1 references a deal or buyer that isn't in this backup.",
    });
  });

  it("accepts an empty backup (no data yet)", () => {
    const result = validateBackupData({
      version: BACKUP_VERSION,
      exportedAt: "2026-01-01T00:00:00.000Z",
      buyers: [],
      deals: [],
      activities: [],
      outreach: [],
    });
    expect("data" in result).toBe(true);
  });
});

describe("summarizeBackup", () => {
  it("counts each record type", () => {
    const result = validateBackupData(validBackup());
    if (!("data" in result)) throw new Error("expected valid backup");
    expect(summarizeBackup(result.data)).toEqual({ buyers: 1, deals: 1, activities: 1, outreach: 1 });
  });
});
