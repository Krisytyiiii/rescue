import { prisma } from "@furescue/core";

export interface BarangayOption {
  id: number;
  name: string;
}

/** Reference data for signup/profile forms. Never fails the page if DB is down. */
export async function getBarangayOptions(): Promise<BarangayOption[]> {
  try {
    const rows = await prisma.barangay.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  } catch {
    return [];
  }
}
