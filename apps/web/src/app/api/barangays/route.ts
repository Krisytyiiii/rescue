import { NextResponse } from "next/server";

import { prisma } from "@furescue/core";

/** Public reference data for signup and profile forms. */
export async function GET() {
  try {
    const barangays = await prisma.barangay.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, data: { barangays } });
  } catch (error) {
    console.error("[barangays]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Barangay list is unavailable right now.",
        },
      },
      { status: 500 },
    );
  }
}
