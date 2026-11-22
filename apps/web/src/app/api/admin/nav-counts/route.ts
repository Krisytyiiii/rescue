import { NextResponse } from "next/server";

import {
  adoptionsService,
  authService,
  messagingService,
  reportsService,
  rescuesService,
} from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

/**
 * Badge counters for the admin sidebar. Each value is the current amount of
 * "new" work on that page; the client subtracts what the admin has already
 * seen and only shows the remainder.
 */
export async function GET() {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  try {
    const [submitted, pendingRescuers, adoptions, messaging, pendingOffers] =
      await Promise.all([
        reportsService.list({ status: "submitted", pageSize: 1 }),
        authService.listPendingRescuers(),
        adoptionsService.getCounts(),
        messagingService.getCounts(auth.actor),
        rescuesService.countPendingOffers(),
      ]);

    return NextResponse.json({
      ok: true,
      data: {
        counts: {
          "/admin/reports": submitted.meta.total,
          "/admin/rescues": pendingOffers,
          "/admin/adoptions": adoptions.pending,
          "/admin/users": pendingRescuers.length,
          "/admin/messaging": messaging.unread,
        },
      },
    });
  } catch (error) {
    console.error("[admin/nav-counts]", error);
    return apiError(error, "Could not load navigation counts");
  }
}
