const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Publishes a change event on the Supabase Realtime broadcast channel used by
 * the admin console. Broadcast is used instead of `postgres_changes` because
 * application sessions are our own JWT, so the browser's Supabase client is
 * `anon` and RLS blocks table-change reads.
 *
 * Best-effort: realtime is an enhancement, never a reason to fail a mutation.
 */
export async function broadcastAdminChange(table: string, topic = "admin-realtime") {
  if (!url || !key) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{ topic, event: "change", payload: { table } }],
      }),
    });
  } catch {
    // Ignore transport errors; the next mutation or refresh recovers.
  }
}
