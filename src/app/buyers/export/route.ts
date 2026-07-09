import { prisma } from "@/lib/prisma";
import { buyersToCsv } from "@/lib/deal-logic";

export async function GET() {
  const buyers = await prisma.buyer.findMany({
    include: { deals: true },
    orderBy: { name: "asc" },
  });

  const csv = buyersToCsv(buyers);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="buyers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
