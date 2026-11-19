-- Assign conversations to an admin for ownership and hand-off.
ALTER TABLE "conversations"
  ADD COLUMN "assigned_to_user_id" UUID;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_assigned_to_user_id_fkey"
  FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "conversations_assigned_to_user_id_idx"
  ON "conversations" ("assigned_to_user_id");
