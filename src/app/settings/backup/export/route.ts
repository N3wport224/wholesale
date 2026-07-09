import { prisma } from "@/lib/prisma";
import { BACKUP_VERSION, type BackupData } from "@/lib/backup";

export async function GET() {
  const [buyers, deals, activities, outreach] = await Promise.all([
    prisma.buyer.findMany(),
    prisma.deal.findMany(),
    prisma.dealActivity.findMany(),
    prisma.dealBuyerOutreach.findMany(),
  ]);

  const data: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    buyers: buyers.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      notes: b.notes,
      minPrice: b.minPrice,
      maxPrice: b.maxPrice,
      targetStates: b.targetStates,
      createdAt: b.createdAt.toISOString(),
    })),
    deals: deals.map((d) => ({
      id: d.id,
      address: d.address,
      city: d.city,
      state: d.state,
      zip: d.zip,
      sourceSite: d.sourceSite,
      purchasePrice: d.purchasePrice,
      estimatedValue: d.estimatedValue,
      rentComp: d.rentComp,
      status: d.status,
      earnestMoney: d.earnestMoney,
      inspectionDays: d.inspectionDays,
      contractDate: d.contractDate ? d.contractDate.toISOString() : null,
      assignmentFee: d.assignmentFee,
      closingDate: d.closingDate ? d.closingDate.toISOString() : null,
      notes: d.notes,
      followUpDate: d.followUpDate ? d.followUpDate.toISOString() : null,
      followUpNote: d.followUpNote,
      buyerId: d.buyerId,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    activities: activities.map((a) => ({
      id: a.id,
      dealId: a.dealId,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    outreach: outreach.map((o) => ({
      id: o.id,
      dealId: o.dealId,
      buyerId: o.buyerId,
      sentAt: o.sentAt.toISOString(),
    })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="wholesale-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
