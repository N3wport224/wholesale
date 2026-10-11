import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDealWhere } from "@/lib/deal-query";
import { dealsToCsv } from "@/lib/deal-logic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const where = buildDealWhere({
    q: searchParams.get("q") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    matchOnly: searchParams.get("matchOnly") ?? undefined,
  });

  const deals = await prisma.deal.findMany({
    where,
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = dealsToCsv(deals);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
