-- "Delete for me": hide a message for one participant while keeping it for
-- everyone else. "Delete for everyone" keeps using messages.is_deleted.
CREATE TABLE "message_deletions" (
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_deletions_pkey" PRIMARY KEY ("message_id", "user_id")
);

CREATE INDEX "message_deletions_user_id_idx" ON "message_deletions"("user_id");

ALTER TABLE "message_deletions"
    ADD CONSTRAINT "message_deletions_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_deletions"
    ADD CONSTRAINT "message_deletions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
