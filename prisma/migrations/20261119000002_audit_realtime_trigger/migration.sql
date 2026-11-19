-- Broadcast new audit entries to the admin console in realtime.
--
-- Audit rows are written by many services inside their own transactions, so a
-- database trigger is the only reliable way to cover every writer. The audit
-- page listens on the shared admin-realtime topic and shows a "new events" pill
-- instead of silently reshuffling the ledger.

DROP TRIGGER IF EXISTS "audit_logs_broadcast_change" ON "audit_logs";
CREATE TRIGGER "audit_logs_broadcast_change"
  AFTER INSERT ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_change();
