-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "role_name" AS ENUM ('community_user', 'rescuer', 'admin');

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('active', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "species" AS ENUM ('dog', 'cat');

-- CreateEnum
CREATE TYPE "report_species" AS ENUM ('dog', 'cat', 'unknown');

-- CreateEnum
CREATE TYPE "breed_type" AS ENUM ('aspin', 'puspin', 'mixed', 'other');

-- CreateEnum
CREATE TYPE "sex" AS ENUM ('male', 'female', 'unknown');

-- CreateEnum
CREATE TYPE "animal_size" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "origin_type" AS ENUM ('rescue_report', 'community_post', 'surrender', 'born_in_care');

-- CreateEnum
CREATE TYPE "lifecycle_status" AS ENUM ('reported', 'rescued', 'under_care', 'available', 'adoption_pending', 'adopted', 'returned_to_owner', 'deceased');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('photo', 'video');

-- CreateEnum
CREATE TYPE "health_record_type" AS ENUM ('checkup', 'illness', 'injury', 'treatment', 'surgery', 'deworming', 'spay_neuter', 'other');

-- CreateEnum
CREATE TYPE "vaccination_status" AS ENUM ('completed', 'due', 'overdue');

-- CreateEnum
CREATE TYPE "measurement_context" AS ENUM ('resting', 'post_activity', 'under_stress', 'during_exam');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('stray', 'injured', 'abandoned');

-- CreateEnum
CREATE TYPE "urgency_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('submitted', 'verified', 'assigned', 'in_progress', 'rescued', 'unable_to_locate', 'rejected', 'closed');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('pending', 'accepted', 'declined', 'en_route', 'on_site', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "housing_type" AS ENUM ('house', 'apartment', 'boarding', 'other');

-- CreateEnum
CREATE TYPE "adoption_status" AS ENUM ('submitted', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'withdrawn', 'completed');

-- CreateEnum
CREATE TYPE "followup_method" AS ENUM ('in_app', 'phone', 'visit');

-- CreateEnum
CREATE TYPE "conversation_context_type" AS ENUM ('report', 'adoption_request', 'general');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('report_status', 'rescue_assignment', 'adoption_status', 'new_message', 'vaccination_due', 'announcement', 'system');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('in_app', 'push', 'email');

-- CreateEnum
CREATE TYPE "learning_category" AS ENUM ('dog_behavior', 'cat_behavior', 'basic_training', 'responsible_ownership', 'health_care');

-- CreateEnum
CREATE TYPE "lesson_content_type" AS ENUM ('text', 'video', 'image', 'pdf');

-- CreateEnum
CREATE TYPE "progress_status" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "analytics_species" AS ENUM ('dog', 'cat', 'all');

-- CreateEnum
CREATE TYPE "generated_report_kind" AS ENUM ('adoption_trends', 'rescue_efficiency', 'geographic_distribution', 'health_summary');

-- CreateEnum
CREATE TYPE "generated_report_format" AS ENUM ('pdf', 'xlsx', 'csv');

-- CreateTable
CREATE TABLE "roles" (
    "id" SMALLSERIAL NOT NULL,
    "role_name" "role_name" NOT NULL,
    "description" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barangays" (
    "id" SERIAL NOT NULL,
    "barangay_name" VARCHAR(80) NOT NULL,
    "center_latitude" DECIMAL(10,7),
    "center_longitude" DECIMAL(10,7),
    "boundary_geojson" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "barangays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" SMALLINT NOT NULL,
    "barangay_id" INTEGER,
    "first_name" VARCHAR(60) NOT NULL,
    "middle_name" VARCHAR(60),
    "last_name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "phone_number" VARCHAR(15),
    "password_hash" VARCHAR(255) NOT NULL,
    "address_line" VARCHAR(255),
    "profile_photo_url" VARCHAR(255),
    "email_verified_at" TIMESTAMPTZ(6),
    "account_status" "account_status" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" UUID NOT NULL,
    "animal_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60),
    "species" "species" NOT NULL,
    "breed_type" "breed_type" NOT NULL,
    "sex" "sex" NOT NULL,
    "estimated_age_months" SMALLINT,
    "size" "animal_size",
    "color_markings" VARCHAR(150),
    "temperament" VARCHAR(255),
    "weight_kg" DECIMAL(5,2),
    "is_neutered" BOOLEAN NOT NULL DEFAULT false,
    "microchip_no" VARCHAR(30),
    "origin_type" "origin_type" NOT NULL,
    "source_report_id" UUID,
    "posted_by_user_id" UUID,
    "lifecycle_status" "lifecycle_status" NOT NULL,
    "listing_status" "listing_status" NOT NULL DEFAULT 'draft',
    "intake_date" DATE,
    "adopted_date" DATE,
    "primary_photo_url" VARCHAR(255),
    "model_3d_url" VARCHAR(255),
    "model_3d_thumbnail_url" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_media" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "media_type" "media_type" NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(150),
    "sort_order" SMALLINT,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "animal_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "record_type" "health_record_type" NOT NULL,
    "record_date" DATE NOT NULL,
    "diagnosis" VARCHAR(255),
    "treatment" TEXT,
    "medication" VARCHAR(255),
    "weight_kg" DECIMAL(5,2),
    "attended_by" UUID,
    "follow_up_date" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "vaccine_name" VARCHAR(100) NOT NULL,
    "dose_number" SMALLINT,
    "date_given" DATE NOT NULL,
    "next_due_date" DATE,
    "batch_lot_no" VARCHAR(40),
    "administered_by" UUID,
    "status" "vaccination_status",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heart_rate_logs" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "health_record_id" UUID,
    "heart_rate_bpm" SMALLINT NOT NULL,
    "measurement_context" "measurement_context",
    "measured_at" TIMESTAMPTZ(6) NOT NULL,
    "recorded_by" UUID,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "heart_rate_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "report_code" VARCHAR(20) NOT NULL,
    "reporter_user_id" UUID,
    "report_type" "report_type" NOT NULL,
    "species" "report_species" NOT NULL,
    "description" TEXT NOT NULL,
    "urgency_level" "urgency_level" NOT NULL,
    "animal_count" SMALLINT NOT NULL DEFAULT 1,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "barangay_id" INTEGER,
    "location_landmark" VARCHAR(255),
    "status" "report_status" NOT NULL DEFAULT 'submitted',
    "rejection_reason" VARCHAR(255),
    "duplicate_of_report_id" UUID,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6) NOT NULL,
    "synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_media" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "media_type" "media_type" NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "file_size_kb" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_status_history" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "old_status" VARCHAR(30),
    "new_status" VARCHAR(30) NOT NULL,
    "changed_by" UUID,
    "remarks" VARCHAR(255),
    "changed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescue_operations" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "rescuer_user_id" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assignment_status" "assignment_status" NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "arrived_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "outcome_notes" TEXT,
    "animals_rescued" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rescue_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_requests" (
    "id" UUID NOT NULL,
    "request_code" VARCHAR(20) NOT NULL,
    "animal_id" UUID NOT NULL,
    "adopter_user_id" UUID NOT NULL,
    "housing_type" "housing_type" NOT NULL,
    "is_owned_property" BOOLEAN,
    "has_fenced_area" BOOLEAN,
    "household_members" SMALLINT,
    "has_other_pets" BOOLEAN,
    "other_pets_details" VARCHAR(255),
    "prior_pet_experience" TEXT,
    "reason_for_adopting" TEXT NOT NULL,
    "valid_id_url" VARCHAR(255) NOT NULL,
    "home_photo_url" VARCHAR(255),
    "status" "adoption_status" NOT NULL DEFAULT 'submitted',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "decision_remarks" VARCHAR(255),
    "interview_schedule" TIMESTAMPTZ(6),
    "release_date" DATE,
    "receipt_reference_no" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "adoption_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_followups" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "followup_date" DATE NOT NULL,
    "method" "followup_method",
    "animal_condition" VARCHAR(255),
    "remarks" TEXT,
    "conducted_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adoption_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","animal_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "context_type" "conversation_context_type" NOT NULL,
    "context_id" UUID,
    "subject" VARCHAR(150),
    "status" "conversation_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "message_body" TEXT NOT NULL,
    "attachment_url" VARCHAR(255),
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "notification_type" "notification_type" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "body" VARCHAR(255) NOT NULL,
    "reference_type" VARCHAR(30),
    "reference_id" UUID,
    "channel" "notification_channel" NOT NULL DEFAULT 'in_app',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_modules" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "category" "learning_category" NOT NULL,
    "description" TEXT,
    "cover_image_url" VARCHAR(255),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content_type" "lesson_content_type" NOT NULL,
    "content_body" TEXT,
    "media_url" VARCHAR(255),
    "duration_minutes" SMALLINT,
    "sort_order" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "passing_score" SMALLINT NOT NULL DEFAULT 70,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "question_text" VARCHAR(500) NOT NULL,
    "options_json" JSONB NOT NULL,
    "correct_option" SMALLINT NOT NULL,
    "explanation" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "status" "progress_status" NOT NULL DEFAULT 'not_started',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "score_percent" SMALLINT NOT NULL,
    "is_passed" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "barangay_id" INTEGER,
    "species" "analytics_species",
    "reports_received" INTEGER,
    "reports_resolved" INTEGER,
    "animals_rescued" INTEGER,
    "animals_adopted" INTEGER,
    "adoption_requests_received" INTEGER,
    "avg_response_hours" DECIMAL(6,2),
    "avg_resolution_hours" DECIMAL(6,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL,
    "report_kind" "generated_report_kind" NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "format" "generated_report_format",
    "file_url" VARCHAR(255),
    "generated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(30),
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "barangays_barangay_name_key" ON "barangays"("barangay_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_barangay_id_idx" ON "users"("barangay_id");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_token_hash_idx" ON "password_resets"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "animals_animal_code_key" ON "animals"("animal_code");

-- CreateIndex
CREATE UNIQUE INDEX "animals_microchip_no_key" ON "animals"("microchip_no");

-- CreateIndex
CREATE UNIQUE INDEX "animals_source_report_id_key" ON "animals"("source_report_id");

-- CreateIndex
CREATE INDEX "animals_lifecycle_status_species_idx" ON "animals"("lifecycle_status", "species");

-- CreateIndex
CREATE INDEX "animals_listing_status_species_idx" ON "animals"("listing_status", "species");

-- CreateIndex
CREATE INDEX "animals_posted_by_user_id_idx" ON "animals"("posted_by_user_id");

-- CreateIndex
CREATE INDEX "animal_media_animal_id_sort_order_idx" ON "animal_media"("animal_id", "sort_order");

-- CreateIndex
CREATE INDEX "health_records_animal_id_record_date_idx" ON "health_records"("animal_id", "record_date");

-- CreateIndex
CREATE INDEX "health_records_record_type_idx" ON "health_records"("record_type");

-- CreateIndex
CREATE INDEX "vaccinations_animal_id_date_given_idx" ON "vaccinations"("animal_id", "date_given");

-- CreateIndex
CREATE INDEX "vaccinations_next_due_date_status_idx" ON "vaccinations"("next_due_date", "status");

-- CreateIndex
CREATE INDEX "heart_rate_logs_animal_id_measured_at_idx" ON "heart_rate_logs"("animal_id", "measured_at");

-- CreateIndex
CREATE INDEX "heart_rate_logs_is_flagged_idx" ON "heart_rate_logs"("is_flagged");

-- CreateIndex
CREATE UNIQUE INDEX "reports_report_code_key" ON "reports"("report_code");

-- CreateIndex
CREATE INDEX "reports_status_barangay_id_submitted_at_idx" ON "reports"("status", "barangay_id", "submitted_at");

-- CreateIndex
CREATE INDEX "reports_reporter_user_id_submitted_at_idx" ON "reports"("reporter_user_id", "submitted_at");

-- CreateIndex
CREATE INDEX "reports_duplicate_of_report_id_idx" ON "reports"("duplicate_of_report_id");

-- CreateIndex
CREATE INDEX "report_media_report_id_idx" ON "report_media"("report_id");

-- CreateIndex
CREATE INDEX "report_status_history_report_id_changed_at_idx" ON "report_status_history"("report_id", "changed_at");

-- CreateIndex
CREATE INDEX "rescue_operations_report_id_assignment_status_idx" ON "rescue_operations"("report_id", "assignment_status");

-- CreateIndex
CREATE INDEX "rescue_operations_rescuer_user_id_assignment_status_idx" ON "rescue_operations"("rescuer_user_id", "assignment_status");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_requests_request_code_key" ON "adoption_requests"("request_code");

-- CreateIndex
CREATE INDEX "adoption_requests_animal_id_status_idx" ON "adoption_requests"("animal_id", "status");

-- CreateIndex
CREATE INDEX "adoption_requests_adopter_user_id_status_idx" ON "adoption_requests"("adopter_user_id", "status");

-- CreateIndex
CREATE INDEX "adoption_followups_request_id_followup_date_idx" ON "adoption_followups"("request_id", "followup_date");

-- CreateIndex
CREATE INDEX "favorites_animal_id_idx" ON "favorites"("animal_id");

-- CreateIndex
CREATE INDEX "conversations_context_type_context_id_idx" ON "conversations"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE INDEX "messages_sender_user_id_idx" ON "messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_is_read_idx" ON "notifications"("recipient_user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_reference_type_reference_id_idx" ON "notifications"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "learning_modules_category_is_published_idx" ON "learning_modules"("category", "is_published");

-- CreateIndex
CREATE INDEX "lessons_module_id_sort_order_idx" ON "lessons"("module_id", "sort_order");

-- CreateIndex
CREATE INDEX "quizzes_module_id_idx" ON "quizzes"("module_id");

-- CreateIndex
CREATE INDEX "quiz_questions_quiz_id_idx" ON "quiz_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "user_learning_progress_lesson_id_idx" ON "user_learning_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_progress_user_id_lesson_id_key" ON "user_learning_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_quiz_id_attempted_at_idx" ON "quiz_attempts"("user_id", "quiz_id", "attempted_at");

-- CreateIndex
CREATE INDEX "analytics_snapshots_snapshot_date_idx" ON "analytics_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_snapshot_date_barangay_id_species_key" ON "analytics_snapshots"("snapshot_date", "barangay_id", "species");

-- CreateIndex
CREATE INDEX "generated_reports_report_kind_date_from_date_to_idx" ON "generated_reports"("report_kind", "date_from", "date_to");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_source_report_id_fkey" FOREIGN KEY ("source_report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_posted_by_user_id_fkey" FOREIGN KEY ("posted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_media" ADD CONSTRAINT "animal_media_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_media" ADD CONSTRAINT "animal_media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_attended_by_fkey" FOREIGN KEY ("attended_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_administered_by_fkey" FOREIGN KEY ("administered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_rate_logs" ADD CONSTRAINT "heart_rate_logs_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_rate_logs" ADD CONSTRAINT "heart_rate_logs_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heart_rate_logs" ADD CONSTRAINT "heart_rate_logs_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_duplicate_of_report_id_fkey" FOREIGN KEY ("duplicate_of_report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_media" ADD CONSTRAINT "report_media_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_operations" ADD CONSTRAINT "rescue_operations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_operations" ADD CONSTRAINT "rescue_operations_rescuer_user_id_fkey" FOREIGN KEY ("rescuer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_operations" ADD CONSTRAINT "rescue_operations_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_adopter_user_id_fkey" FOREIGN KEY ("adopter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_followups" ADD CONSTRAINT "adoption_followups_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "adoption_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_followups" ADD CONSTRAINT "adoption_followups_conducted_by_fkey" FOREIGN KEY ("conducted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- FurRescue custom objects
-- Human-readable, concurrency-safe business codes.
-- ===========================================================================

CREATE SEQUENCE IF NOT EXISTS "report_code_seq";
CREATE SEQUENCE IF NOT EXISTS "animal_code_seq";
CREATE SEQUENCE IF NOT EXISTS "adoption_request_code_seq";

-- Heat-map / duplicate-detection lookup support.
CREATE INDEX IF NOT EXISTS "reports_geo_idx" ON "reports" ("latitude", "longitude");

-- Optional PostGIS upgrade path (run manually once you need true geography):
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   ALTER TABLE "reports" ADD COLUMN "location" geography(Point, 4326);
--   UPDATE "reports" SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography;
--   CREATE INDEX "reports_location_gix" ON "reports" USING GIST ("location");
--   ALTER TABLE "reports" ALTER COLUMN "latitude" DROP NOT NULL;
--   ALTER TABLE "reports" ALTER COLUMN "longitude" DROP NOT NULL;

-- ===========================================================================
-- Schema documentation (visible in Supabase Studio)
-- ===========================================================================

COMMENT ON TABLE "roles" IS 'Access roles: community_user, rescuer, admin';
COMMENT ON TABLE "barangays" IS 'Reference table: the 26 barangays of Mati City';
COMMENT ON TABLE "users" IS 'Community users, rescuers, and administrators';
COMMENT ON TABLE "password_resets" IS 'Single-use password reset tokens (hashed)';
COMMENT ON TABLE "animals" IS 'Animal profiles, intake, lifecycle, and public listing state';
COMMENT ON TABLE "animal_media" IS 'Photos and videos attached to an animal profile';
COMMENT ON TABLE "health_records" IS 'Medical visits: checkups, illness, injury, surgery, treatments';
COMMENT ON TABLE "vaccinations" IS 'Vaccination doses and next-due reminders';
COMMENT ON TABLE "heart_rate_logs" IS 'Manually recorded heart rate with abnormal-value flagging';
COMMENT ON TABLE "reports" IS 'Community stray/injured/abandoned reports with geo coordinates';
COMMENT ON TABLE "report_media" IS 'Photos and videos attached to a report';
COMMENT ON TABLE "report_status_history" IS 'Append-only audit of report status changes';
COMMENT ON TABLE "rescue_operations" IS 'Rescuer assignment and field progress per report';
COMMENT ON TABLE "adoption_requests" IS 'Adoption applications and admin review decisions';
COMMENT ON TABLE "adoption_followups" IS 'Post-adoption welfare checks';
COMMENT ON TABLE "favorites" IS 'Animals saved by a community user';
COMMENT ON TABLE "conversations" IS 'In-app chat threads linked to reports or applications';
COMMENT ON TABLE "conversation_participants" IS 'Members of a conversation with read receipts';
COMMENT ON TABLE "messages" IS 'Chat messages';
COMMENT ON TABLE "notifications" IS 'In-app, push, and email notification queue';
COMMENT ON TABLE "learning_modules" IS 'E-learning modules';
COMMENT ON TABLE "lessons" IS 'Ordered lessons inside a learning module';
COMMENT ON TABLE "quizzes" IS 'Module quizzes and passing score';
COMMENT ON TABLE "quiz_questions" IS 'Quiz questions, options, and correct answer';
COMMENT ON TABLE "user_learning_progress" IS 'Per-user lesson completion';
COMMENT ON TABLE "quiz_attempts" IS 'Append-only quiz attempt results';
COMMENT ON TABLE "analytics_snapshots" IS 'Nightly dashboard aggregates (citywide or per barangay)';
COMMENT ON TABLE "generated_reports" IS 'Exported PDF/Excel/CSV analytics reports';
COMMENT ON TABLE "audit_logs" IS 'Append-only who-did-what-when trail';
