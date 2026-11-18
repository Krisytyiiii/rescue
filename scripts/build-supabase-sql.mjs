import fs from "node:fs";

const migrationPath = "prisma/migrations/20261118000000_init/migration.sql";
const sql = fs.readFileSync(migrationPath, "utf8");
const followUpSql = `
-- ===========================================================================
-- Follow-up migrations
-- ===========================================================================
ALTER TYPE "account_status" ADD VALUE IF NOT EXISTS 'pending';
`;

const barangays = [
  "Badas", "Bobon", "Buso", "Cabuaya", "Central (City Proper)", "Culian", "Dahican",
  "Danao", "Dawan", "Don Enrique Lopez", "Don Martin Marundan", "Don Salvador Lopez, Sr.",
  "Langka", "Lawigan", "Libudon", "Luban", "Macambol", "Mamali", "Matiao", "Mayo",
  "Sainz", "Sanghay", "Tagabakid", "Tagbinonga", "Taguibo", "Tamisan",
];

const roles = [
  ["community_user", "Residents who report animals, adopt, and submit adoption posts"],
  ["rescuer", "Field staff and partner volunteers handling assigned cases"],
  ["admin", "City Vet / animal welfare office with full system access"],
];

const esc = (value) => value.replaceAll("'", "''");

let seed = `
-- ===========================================================================
-- Reference data (idempotent)
-- ===========================================================================
`;

for (const [name, description] of roles) {
  seed += `INSERT INTO "roles" ("role_name", "description", "created_at", "updated_at") VALUES ('${name}', '${esc(description)}', now(), now())
ON CONFLICT ("role_name") DO UPDATE SET "description" = EXCLUDED."description", "updated_at" = now();
`;
}

seed += `
INSERT INTO "barangays" ("barangay_name", "created_at", "updated_at") VALUES
${barangays.map((name) => `  ('${esc(name)}', now(), now())`).join(",\n")}
ON CONFLICT ("barangay_name") DO NOTHING;
`;

fs.writeFileSync("prisma/supabase-init.sql", sql + followUpSql + seed);
console.log(`written prisma/supabase-init.sql (${(sql + followUpSql + seed).length} bytes)`);
