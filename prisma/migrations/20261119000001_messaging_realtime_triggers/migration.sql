-- Broadcast messaging changes to the admin console in realtime.
--
-- API routes used to broadcast manually, which only covered admin-originated
-- mutations. A database trigger covers every writer (community replies, seeds,
-- future clients) and keeps the admin inbox live without polling.

CREATE OR REPLACE FUNCTION public.broadcast_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME),
    'change',
    'admin-realtime',
    false
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "conversations_broadcast_change" ON "conversations";
CREATE TRIGGER "conversations_broadcast_change"
  AFTER INSERT OR UPDATE OR DELETE ON "conversations"
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_change();

DROP TRIGGER IF EXISTS "messages_broadcast_change" ON "messages";
CREATE TRIGGER "messages_broadcast_change"
  AFTER INSERT OR UPDATE OR DELETE ON "messages"
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_change();

DROP TRIGGER IF EXISTS "conversation_participants_broadcast_change" ON "conversation_participants";
CREATE TRIGGER "conversation_participants_broadcast_change"
  AFTER INSERT OR UPDATE OR DELETE ON "conversation_participants"
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_change();

DROP TRIGGER IF EXISTS "notifications_broadcast_change" ON "notifications";
CREATE TRIGGER "notifications_broadcast_change"
  AFTER INSERT OR UPDATE OR DELETE ON "notifications"
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_change();
