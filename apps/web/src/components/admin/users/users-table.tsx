"use client";

import { Check, RotateCcw, ShieldBan } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

import { UserDetailDrawer } from "./user-detail-drawer";
import {
  ROLE_LABELS,
  ROLE_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  dateFormatter,
  formatLastLogin,
  initials,
  type UserRow,
  type UserStatus,
} from "./users-types";

interface UsersTableProps {
  rows: UserRow[];
  currentUserId: string;
}

interface ApproveTarget {
  id: string;
  fullName: string;
}

/**
 * Account directory. Every status action confirms in an overlay, closes it
 * instantly, and updates the row optimistically while the request runs.
 */
export function UsersTable({ rows, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [overrides, setOverrides] = useState<Record<string, UserStatus>>({});
  const [drawerRow, setDrawerRow] = useState<UserRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null);

  // Fresh server data replaces optimistic overrides.
  useEffect(() => {
    setOverrides({});
  }, [rows]);

  function statusOf(row: UserRow): UserStatus {
    return overrides[row.id] ?? row.accountStatus;
  }

  function successCopy(next: UserStatus, name: string) {
    switch (next) {
      case "suspended":
        return {
          title: "Account suspended",
          description: `${name} has been signed out and can’t sign in until reactivated.`,
        };
      case "deactivated":
        return {
          title: "Account deactivated",
          description: `${name} no longer has access. Their history is kept.`,
        };
      case "active":
        return {
          title: "Account reactivated",
          description: `${name} can sign in again.`,
        };
      default:
        return {
          title: "Account updated",
          description: `${name}’s account status was updated.`,
        };
    }
  }

  async function updateStatus(id: string, next: UserStatus, previous: UserStatus) {
    const name = rows.find((row) => row.id === id)?.fullName ?? "This account";
    setOverrides((current) => ({ ...current, [id]: next }));

    try {
      const response = await fetch(`/api/admin/users/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        setOverrides((current) => ({ ...current, [id]: previous }));
        toast.error("Couldn’t update this account", {
          description: `We couldn’t change the status for ${name}. Please try again.`,
        });
        return;
      }

      const copy = successCopy(next, name);
      toast.success(copy.title, { description: copy.description });
      router.refresh();
    } catch {
      setOverrides((current) => ({ ...current, [id]: previous }));
      toast.error("Couldn’t update this account", {
        description: `We couldn’t reach the server. Check your connection and try again.`,
      });
    }
  }

  async function approve(id: string, previous: UserStatus) {
    const name = rows.find((row) => row.id === id)?.fullName ?? "This rescuer";
    setOverrides((current) => ({ ...current, [id]: "active" }));

    try {
      const response = await fetch(`/api/admin/rescuers/${id}/approve`, { method: "POST" });

      if (!response.ok) {
        setOverrides((current) => ({ ...current, [id]: previous }));
        toast.error("Couldn’t approve this rescuer", {
          description: `We couldn’t approve ${name}. Please try again.`,
        });
        return;
      }

      toast.success("Rescuer approved", {
        description: `${name} can now claim rescue assignments.`,
      });
      router.refresh();
    } catch {
      setOverrides((current) => ({ ...current, [id]: previous }));
      toast.error("Couldn’t approve this rescuer", {
        description: "We couldn’t reach the server. Check your connection and try again.",
      });
    }
  }

  function rowAction(row: UserRow) {
    if (row.id === currentUserId) return null;
    const status = statusOf(row);

    if (status === "pending" && row.role === "rescuer") {
      return {
        label: "Approve",
        icon: Check,
        className: "bg-ink text-paper hover:bg-moss",
        run: () => setApproveTarget({ id: row.id, fullName: row.fullName }),
      };
    }
    if (status === "active") {
      return {
        label: "Suspend",
        icon: ShieldBan,
        className: "border border-ink/12 text-ink/60 hover:border-[#b42318]/30 hover:text-[#b42318]",
        run: () => setDrawerRow({ ...row, accountStatus: status }),
      };
    }
    if (status === "suspended" || status === "deactivated") {
      return {
        label: "Reactivate",
        icon: RotateCcw,
        className: "border border-ink/12 text-ink/60 hover:border-moss/30 hover:text-moss",
        run: () => setDrawerRow({ ...row, accountStatus: status }),
      };
    }
    return null;
  }

  return (
    <div className="px-4">
      <div className="overflow-x-auto rounded-lg border border-ink/[0.07]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/[0.07] bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
              <th className="px-3 py-2.5 font-semibold">User</th>
              <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Role</th>
              <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">Barangay</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Joined</th>
              <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Last login</th>
              <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = statusOf(row);
              const action = rowAction(row);
              const ActionIcon = action?.icon;

              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => setDrawerRow({ ...row, accountStatus: status })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDrawerRow({ ...row, accountStatus: status });
                    }
                  }}
                  className="cursor-pointer border-b border-ink/[0.05] text-[0.75rem] text-ink/70 transition-colors last:border-b-0 hover:bg-ink/[0.02] focus-visible:bg-ink/[0.03] focus-visible:outline-none"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.625rem] font-semibold text-ink/60">
                        {initials(row.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[0.8125rem] font-medium text-ink">
                            {row.fullName}
                          </span>
                          {row.id === currentUserId && (
                            <Badge tone="info" surface="light">
                              You
                            </Badge>
                          )}
                        </span>
                        <span className="block truncate text-[0.6875rem] text-ink/45">
                          {row.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <Badge tone={ROLE_TONES[row.role]} surface="light">
                      {ROLE_LABELS[row.role]}
                    </Badge>
                  </td>
                  <td className="hidden px-3 py-2.5 text-ink/55 lg:table-cell">
                    {row.barangay ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={STATUS_TONES[status]} surface="light">
                      {STATUS_LABELS[status]}
                    </Badge>
                  </td>
                  <td className="hidden px-3 py-2.5 text-ink/50 xl:table-cell">
                    {dateFormatter.format(new Date(row.createdAt))}
                  </td>
                  <td className="hidden px-3 py-2.5 text-ink/50 xl:table-cell">
                    {formatLastLogin(row.lastLoginAt)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {action && ActionIcon ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          action.run();
                        }}
                        className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.6875rem] font-medium transition-colors ${action.className}`}
                      >
                        <ActionIcon className="h-3 w-3" strokeWidth={2} />
                        {action.label}
                      </button>
                    ) : (
                      <span className="text-[0.6875rem] text-ink/25">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drawerRow && (
        <UserDetailDrawer
          userId={drawerRow.id}
          fallback={drawerRow}
          currentUserId={currentUserId}
          onClose={() => setDrawerRow(null)}
          onStatusChange={(id, next, previous) => {
            setDrawerRow(null);
            void updateStatus(id, next, previous);
          }}
          onApprove={(id, previous) => {
            setDrawerRow(null);
            void approve(id, previous);
          }}
        />
      )}

      <ConfirmDialog
        open={approveTarget !== null}
        onOpenChange={(value) => {
          if (!value) setApproveTarget(null);
        }}
        tone="success"
        title="Approve this rescuer?"
        description={
          approveTarget ? (
            <>
              <span className="font-medium text-ink">{approveTarget.fullName}</span> will be
              granted rescuer access and can claim rescue assignments.
            </>
          ) : null
        }
        confirmLabel="Approve rescuer"
        onConfirm={() => {
          if (!approveTarget) return;
          const target = approveTarget;
          const previous =
            rows.find((row) => row.id === target.id)?.accountStatus ?? "pending";
          setApproveTarget(null);
          void approve(target.id, previous);
        }}
      />
    </div>
  );
}
