import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds a realistic demo dataset for a small city-vet / rescue clinic:
 * staff and residents, rescued animals with health records and vaccinations,
 * community reports, rescue assignments, adoptions and follow-ups,
 * conversations, notifications, analytics and audit history.
 *
 * Everything is idempotent and keyed by deterministic codes / emails, so the
 * script can be re-run safely without creating duplicates.
 *
 * Run with: npm run db:seed-clinic
 */

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const today = () => new Date();

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

const STAFF_PASSWORD = "ClinicStaff123!";
const RESIDENT_PASSWORD = "Resident123!";

const STAFF = [
  {
    firstName: "Maria Isabel",
    middleName: "Reyes",
    lastName: "Santiago",
    email: "maria.santiago@furescue.demo",
    phoneNumber: "+639171000001",
    addressLine: "City Vet Office, Brgy. Central, Mati City",
    barangayName: "Central (City Proper)",
    roleName: "admin" as const,
  },
  {
    firstName: "Paolo",
    middleName: "Miguel",
    lastName: "Reyes",
    email: "paolo.reyes@furescue.demo",
    phoneNumber: "+639171000002",
    addressLine: "City Vet Office, Brgy. Central, Mati City",
    barangayName: "Central (City Proper)",
    roleName: "admin" as const,
  },
  {
    firstName: "Nestor",
    middleName: "B.",
    lastName: "Villanueva",
    email: "nestor.villanueva@furescue.demo",
    phoneNumber: "+639171000003",
    addressLine: "Purok 2, Brgy. Dahican, Mati City",
    barangayName: "Dahican",
    roleName: "rescuer" as const,
  },
  {
    firstName: "Lorna Mae",
    middleName: "C.",
    lastName: "Castillo",
    email: "lorna.castillo@furescue.demo",
    phoneNumber: "+639171000004",
    addressLine: "Purok 4, Brgy. Badas, Mati City",
    barangayName: "Badas",
    roleName: "rescuer" as const,
  },
  {
    firstName: "Jomar",
    middleName: "D.",
    lastName: "Abella",
    email: "jomar.abella@furescue.demo",
    phoneNumber: "+639171000005",
    addressLine: "Purok 1, Brgy. Matiao, Mati City",
    barangayName: "Matiao",
    roleName: "rescuer" as const,
  },
];

const RESIDENTS = [
  {
    firstName: "Angela",
    middleName: "Mae",
    lastName: "Dela Cruz",
    email: "angela.delacruz@furescue.demo",
    phoneNumber: "+639171000101",
    addressLine: "Purok 3, Brgy. Dahican, Mati City",
    barangayName: "Dahican",
  },
  {
    firstName: "Jose Miguel",
    middleName: "Ramos",
    lastName: "Bautista",
    email: "josemiguel.bautista@furescue.demo",
    phoneNumber: "+639171000102",
    addressLine: "Purok 5, Brgy. Dahican, Mati City",
    barangayName: "Dahican",
  },
  {
    firstName: "Rhea Mae",
    middleName: "L.",
    lastName: "Lim",
    email: "rhea.lim@furescue.demo",
    phoneNumber: "+639171000103",
    addressLine: "Purok 2, Brgy. Matiao, Mati City",
    barangayName: "Matiao",
  },
  {
    firstName: "Carlo",
    middleName: "P.",
    lastName: "Mendoza",
    email: "carlo.mendoza@furescue.demo",
    phoneNumber: "+639171000104",
    addressLine: "Sitio Baluno, Brgy. Badas, Mati City",
    barangayName: "Badas",
  },
  {
    firstName: "Grace",
    middleName: "T.",
    lastName: "Alonzo",
    email: "grace.alonzo@furescue.demo",
    phoneNumber: "+639171000105",
    addressLine: "Purok 6, Brgy. Central, Mati City",
    barangayName: "Central (City Proper)",
  },
];

const BARANGAY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Central (City Proper)": { lat: 6.9533, lng: 126.2166 },
  Dahican: { lat: 6.9266, lng: 126.2733 },
  Badas: { lat: 6.941, lng: 126.239 },
  Matiao: { lat: 6.96, lng: 126.22 },
  Dawan: { lat: 6.975, lng: 126.19 },
  Culian: { lat: 6.93, lng: 126.21 },
  Mamali: { lat: 6.899, lng: 126.176 },
  Luban: { lat: 6.923, lng: 126.154 },
};

/* -------------------------------------------------------------------------- */
/* Animals                                                                    */
/* -------------------------------------------------------------------------- */

type SeedAnimal = {
  code: string;
  name: string;
  species: "dog" | "cat";
  breedType: "aspin" | "puspin" | "mixed" | "other";
  sex: "male" | "female" | "unknown";
  estimatedAgeMonths: number;
  size: "small" | "medium" | "large";
  colorMarkings: string;
  temperament: string;
  weightKg: number;
  isNeutered: boolean;
  originType: "rescue_report" | "community_post" | "surrender" | "born_in_care";
  lifecycleStatus:
    | "reported"
    | "rescued"
    | "under_care"
    | "available"
    | "adoption_pending"
    | "adopted"
    | "returned_to_owner"
    | "deceased";
  listingStatus: "draft" | "pending_review" | "published" | "rejected" | "archived";
  intakeDaysAgo: number;
  adoptedDaysAgo?: number;
  sourceReportCode?: string;
  description: string;
  primaryPhotoUrl: string;
  gallery: string[];
  health: Array<{
    recordType: "checkup" | "illness" | "injury" | "treatment" | "surgery" | "deworming" | "spay_neuter" | "other";
    daysAgo: number;
    diagnosis?: string;
    treatment?: string;
    medication?: string;
    weightKg?: number;
    followUpInDays?: number;
    remarks?: string;
  }>;
  vaccinations: Array<{
    vaccineName: string;
    doseNumber?: number;
    givenDaysAgo: number;
    nextDueInDays?: number;
    batchLotNo?: string;
    status?: "completed" | "due" | "overdue";
  }>;
  heartRates: Array<{
    bpm: number;
    daysAgo: number;
    context?: "resting" | "post_activity" | "under_stress" | "during_exam";
    isFlagged?: boolean;
    notes?: string;
  }>;
};

const DOG_PHOTOS = [
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&q=80",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80",
  "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=1200&q=80",
];
const CAT_PHOTOS = [
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1200&q=80",
  "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=1200&q=80",
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&q=80",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1200&q=80",
  "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=1200&q=80",
];

const ANIMALS: SeedAnimal[] = [
  {
    code: "FR-2026-9001",
    name: "Milo",
    species: "dog",
    breedType: "aspin",
    sex: "male",
    estimatedAgeMonths: 18,
    size: "small",
    colorMarkings: "Brown with white chest and a white-tipped tail",
    temperament: "Friendly after a slow introduction; nervous around loud tricycles",
    weightKg: 8.4,
    isNeutered: false,
    originType: "rescue_report",
    lifecycleStatus: "under_care",
    listingStatus: "draft",
    intakeDaysAgo: 12,
    sourceReportCode: "RPT-2026-9001",
    description:
      "Rescued near the Dahican shoreline with an infected cut on the left hind leg. Responds well to handling, eats normally, and is expected to be cleared for adoption after the wound heals.",
    primaryPhotoUrl: DOG_PHOTOS[1],
    gallery: [DOG_PHOTOS[1], DOG_PHOTOS[4]],
    health: [
      {
        recordType: "injury",
        daysAgo: 12,
        diagnosis: "Laceration, left hind leg with mild secondary infection",
        treatment: "Wound cleaning, debridement, bandage change every other day",
        medication: "Amoxicillin 250 mg BID for 7 days; meloxicam for pain",
        weightKg: 7.8,
        followUpInDays: 4,
        remarks: "Injured during intake; sedated briefly for cleaning.",
      },
      {
        recordType: "checkup",
        daysAgo: 5,
        diagnosis: "Wound granulating well, no discharge",
        treatment: "Bandage removed; continue oral antibiotics for 3 more days",
        medication: "Amoxicillin 250 mg BID",
        weightKg: 8.4,
        remarks: "Appetite good. Cleared for short leash walks.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 11, nextDueInDays: 354, batchLotNo: "AR-2026-118", status: "completed" },
      { vaccineName: "Deworming (pyrantel)", doseNumber: 1, givenDaysAgo: 11, nextDueInDays: 79, status: "completed" },
    ],
    heartRates: [
      { bpm: 112, daysAgo: 12, context: "under_stress", isFlagged: false, notes: "Elevated during intake exam; settled after rest" },
      { bpm: 92, daysAgo: 5, context: "resting", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9002",
    name: "Cocoa",
    species: "dog",
    breedType: "aspin",
    sex: "female",
    estimatedAgeMonths: 24,
    size: "medium",
    colorMarkings: "Chocolate brown with a white blaze on the forehead",
    temperament: "Calm, leash-trained, good with children",
    weightKg: 13.2,
    isNeutered: true,
    originType: "surrender",
    lifecycleStatus: "available",
    listingStatus: "published",
    intakeDaysAgo: 34,
    description:
      "Surrendered by a family relocating abroad. House-trained, knows sit and stay, and enjoys gentle sniff walks. Best as an only dog or with a calm canine companion.",
    primaryPhotoUrl: DOG_PHOTOS[0],
    gallery: [DOG_PHOTOS[0], DOG_PHOTOS[5]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 33,
        diagnosis: "Healthy adult female; mild tartar",
        treatment: "Dental scaling scheduled; routine care",
        weightKg: 13.6,
        remarks: "Bright, alert, and well-conditioned on intake.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 26,
        diagnosis: "Elective ovariohysterectomy",
        treatment: "Routine spay under general anesthesia, no complications",
        medication: "Cefalexin 500 mg BID for 5 days",
        weightKg: 13.1,
        remarks: "Recovered well; sutures removed after 10 days.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 30, nextDueInDays: 335, batchLotNo: "AR-2026-097", status: "completed" },
      { vaccineName: "DHPP (5-in-1)", doseNumber: 2, givenDaysAgo: 30, nextDueInDays: 335, batchLotNo: "DHPP-2026-44", status: "completed" },
      { vaccineName: "Deworming (pyrantel)", doseNumber: 1, givenDaysAgo: 30, nextDueInDays: -2, status: "overdue" },
    ],
    heartRates: [
      { bpm: 88, daysAgo: 33, context: "during_exam", isFlagged: false },
      { bpm: 76, daysAgo: 12, context: "resting", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9003",
    name: "Tala",
    species: "cat",
    breedType: "puspin",
    sex: "female",
    estimatedAgeMonths: 10,
    size: "small",
    colorMarkings: "Grey tabby with white paws and a white chin",
    temperament: "Curious and playful; shy with strangers at first",
    weightKg: 3.1,
    isNeutered: true,
    originType: "rescue_report",
    lifecycleStatus: "available",
    listingStatus: "published",
    intakeDaysAgo: 21,
    sourceReportCode: "RPT-2026-9002",
    description:
      "Found as a stray kitten behind the public market. Litter-trained, loves wand toys, and would do best indoors with a quiet hiding spot and a window perch.",
    primaryPhotoUrl: CAT_PHOTOS[0],
    gallery: [CAT_PHOTOS[0], CAT_PHOTOS[2]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 21,
        diagnosis: "Underweight but otherwise healthy",
        treatment: "Nutrition plan and observation",
        weightKg: 2.6,
        remarks: "Started on kitten-formula wet food.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 14,
        diagnosis: "Elective ovariohysterectomy",
        treatment: "Routine spay, no complications",
        weightKg: 2.9,
        remarks: "Good recovery; appetite returned next day.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 20, nextDueInDays: 345, batchLotNo: "AR-2026-121", status: "completed" },
      { vaccineName: "FVRCP", doseNumber: 2, givenDaysAgo: 20, nextDueInDays: 345, batchLotNo: "FV-2026-19", status: "completed" },
      { vaccineName: "Deworming (praziquantel)", doseNumber: 1, givenDaysAgo: 20, nextDueInDays: 6, status: "due" },
    ],
    heartRates: [
      { bpm: 168, daysAgo: 21, context: "under_stress", isFlagged: false, notes: "Nervous during intake" },
      { bpm: 152, daysAgo: 7, context: "resting", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9004",
    name: "Bruno",
    species: "dog",
    breedType: "mixed",
    sex: "male",
    estimatedAgeMonths: 36,
    size: "large",
    colorMarkings: "Black and tan shepherd mix with a scar above the right eye",
    temperament: "Confident and affectionate with people; selective with other dogs",
    weightKg: 22.5,
    isNeutered: true,
    originType: "rescue_report",
    lifecycleStatus: "available",
    listingStatus: "published",
    intakeDaysAgo: 47,
    sourceReportCode: "RPT-2026-9003",
    description:
      "Found tied to a fence along the highway. Strong on leash at first but improving quickly with reward-based training. Needs an adopter with secure fencing and previous large-dog experience.",
    primaryPhotoUrl: DOG_PHOTOS[2],
    gallery: [DOG_PHOTOS[2], DOG_PHOTOS[3]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 46,
        diagnosis: "Healthy; old healed scar above right eye",
        treatment: "Routine intake exam and observation",
        weightKg: 21.4,
        remarks: "No lameness. Tolerated handling well.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 38,
        diagnosis: "Elective orchiectomy",
        treatment: "Routine neuter, no complications",
        weightKg: 22.1,
        remarks: "Recovered in the clinic ward for two days.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 45, nextDueInDays: 320, batchLotNo: "AR-2026-088", status: "completed" },
      { vaccineName: "DHPP (5-in-1)", doseNumber: 2, givenDaysAgo: 45, nextDueInDays: 320, batchLotNo: "DHPP-2026-31", status: "completed" },
    ],
    heartRates: [
      { bpm: 104, daysAgo: 46, context: "during_exam", isFlagged: false },
      { bpm: 96, daysAgo: 15, context: "post_activity", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9005",
    name: "Mochi",
    species: "cat",
    breedType: "puspin",
    sex: "male",
    estimatedAgeMonths: 8,
    size: "small",
    colorMarkings: "Cream with pale orange points",
    temperament: "Very social, purrs when held",
    weightKg: 2.4,
    isNeutered: false,
    originType: "rescue_report",
    lifecycleStatus: "under_care",
    listingStatus: "draft",
    intakeDaysAgo: 9,
    sourceReportCode: "RPT-2026-9004",
    description:
      "Rescued from a drainage culvert with a respiratory infection. Responds to treatment and is gaining weight. Will be available after the second vet check and neuter.",
    primaryPhotoUrl: CAT_PHOTOS[4],
    gallery: [CAT_PHOTOS[4], CAT_PHOTOS[1]],
    health: [
      {
        recordType: "illness",
        daysAgo: 9,
        diagnosis: "Upper respiratory infection with mild conjunctivitis",
        treatment: "Nebulization and eye cleaning",
        medication: "Doxycycline oral suspension; eye ointment",
        weightKg: 2.1,
        followUpInDays: 5,
        remarks: "Sneezing and nasal discharge on intake.",
      },
      {
        recordType: "checkup",
        daysAgo: 3,
        diagnosis: "Improving; remaining mild nasal discharge",
        treatment: "Continue doxycycline for 4 more days",
        weightKg: 2.4,
        remarks: "Eating well and playful.",
      },
    ],
    vaccinations: [
      { vaccineName: "Deworming (pyrantel)", doseNumber: 1, givenDaysAgo: 8, nextDueInDays: 22, status: "completed" },
    ],
    heartRates: [
      { bpm: 192, daysAgo: 9, context: "under_stress", isFlagged: false },
      { bpm: 158, daysAgo: 3, context: "resting", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9006",
    name: "Bantay",
    species: "dog",
    breedType: "aspin",
    sex: "male",
    estimatedAgeMonths: 60,
    size: "medium",
    colorMarkings: "Golden brown with a darker muzzle",
    temperament: "Loyal and alert; wary of strangers",
    weightKg: 15.8,
    isNeutered: false,
    originType: "rescue_report",
    lifecycleStatus: "returned_to_owner",
    listingStatus: "archived",
    intakeDaysAgo: 40,
    sourceReportCode: "RPT-2026-9005",
    description:
      "Brought in as a stray but later identified through a barangay post. Returned to his owner with vaccination and licensing reminders.",
    primaryPhotoUrl: DOG_PHOTOS[5],
    gallery: [DOG_PHOTOS[5]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 40,
        diagnosis: "Healthy adult male; minor tick infestation",
        treatment: "Tick removal and spot-on treatment",
        weightKg: 15.2,
        remarks: "Owner claimed the dog after two days.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 39, nextDueInDays: 326, batchLotNo: "AR-2026-074", status: "completed" },
    ],
    heartRates: [{ bpm: 98, daysAgo: 40, context: "during_exam", isFlagged: false }],
  },
  {
    code: "FR-2026-9007",
    name: "Luna",
    species: "dog",
    breedType: "aspin",
    sex: "female",
    estimatedAgeMonths: 20,
    size: "small",
    colorMarkings: "White with light tan patches on both ears",
    temperament: "Gentle, quiet, and people-oriented",
    weightKg: 9.5,
    isNeutered: true,
    originType: "rescue_report",
    lifecycleStatus: "adopted",
    listingStatus: "archived",
    intakeDaysAgo: 90,
    adoptedDaysAgo: 24,
    sourceReportCode: "RPT-2026-9006",
    description:
      "Recovered from a skin condition and adopted by a family in Badas. Follow-up visits show a healthy, confident dog enjoying daily walks.",
    primaryPhotoUrl: DOG_PHOTOS[3],
    gallery: [DOG_PHOTOS[3], DOG_PHOTOS[1]],
    health: [
      {
        recordType: "illness",
        daysAgo: 88,
        diagnosis: "Generalized mange and secondary skin infection",
        treatment: "Medicated baths every 5 days and oral antibiotics",
        medication: "Cefalexin; ivermectin as prescribed",
        weightKg: 8.2,
        followUpInDays: 14,
        remarks: "Thin coat and itching on intake.",
      },
      {
        recordType: "checkup",
        daysAgo: 30,
        diagnosis: "Coat regrown, skin clear",
        treatment: "Cleared for adoption",
        weightKg: 9.5,
        remarks: "Healthy and sociable.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 60, nextDueInDays: 305, batchLotNo: "AR-2026-052", status: "completed" },
      { vaccineName: "DHPP (5-in-1)", doseNumber: 2, givenDaysAgo: 60, nextDueInDays: 305, batchLotNo: "DHPP-2026-18", status: "completed" },
    ],
    heartRates: [
      { bpm: 108, daysAgo: 88, context: "under_stress", isFlagged: false },
      { bpm: 84, daysAgo: 30, context: "resting", isFlagged: false },
    ],
  },
  {
    code: "FR-2026-9008",
    name: "Pip",
    species: "cat",
    breedType: "puspin",
    sex: "female",
    estimatedAgeMonths: 14,
    size: "small",
    colorMarkings: "Black with a small white patch on the chest",
    temperament: "Independent but affectionate on her own terms",
    weightKg: 3.4,
    isNeutered: true,
    originType: "community_post",
    lifecycleStatus: "adopted",
    listingStatus: "archived",
    intakeDaysAgo: 120,
    adoptedDaysAgo: 45,
    description:
      "Community cat surrendered by a feeder leaving for Manila. Adopted by a quiet household in Central and now enjoys a screened balcony.",
    primaryPhotoUrl: CAT_PHOTOS[3],
    gallery: [CAT_PHOTOS[3], CAT_PHOTOS[5]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 118,
        diagnosis: "Healthy adult female",
        treatment: "Routine intake care",
        weightKg: 3.3,
        remarks: "Relaxed during exam.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 110,
        diagnosis: "Elective ovariohysterectomy",
        treatment: "Routine spay, no complications",
        weightKg: 3.2,
        remarks: "Good recovery.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 112, nextDueInDays: 253, batchLotNo: "AR-2026-031", status: "completed" },
      { vaccineName: "FVRCP", doseNumber: 2, givenDaysAgo: 112, nextDueInDays: 253, batchLotNo: "FV-2026-07", status: "completed" },
    ],
    heartRates: [{ bpm: 148, daysAgo: 110, context: "resting", isFlagged: false }],
  },
  {
    code: "FR-2026-9009",
    name: "Choco",
    species: "dog",
    breedType: "aspin",
    sex: "male",
    estimatedAgeMonths: 14,
    size: "medium",
    colorMarkings: "Dark brown with cream paws",
    temperament: "Playful, energetic, loves squeaky toys",
    weightKg: 11.7,
    isNeutered: true,
    originType: "born_in_care",
    lifecycleStatus: "available",
    listingStatus: "published",
    intakeDaysAgo: 60,
    description:
      "Born in the clinic ward to a rescued mother. Well-socialized with staff and volunteers, crate-trained, and ready for an active family.",
    primaryPhotoUrl: DOG_PHOTOS[4],
    gallery: [DOG_PHOTOS[4], DOG_PHOTOS[0]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 58,
        diagnosis: "Healthy puppy; routine monitoring",
        treatment: "Growth monitoring",
        weightKg: 9.2,
        remarks: "Active and curious.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 20,
        diagnosis: "Elective orchiectomy",
        treatment: "Routine neuter, no complications",
        weightKg: 11.4,
        remarks: "Recovered quickly.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 25, nextDueInDays: 340, batchLotNo: "AR-2026-103", status: "completed" },
      { vaccineName: "DHPP (5-in-1)", doseNumber: 3, givenDaysAgo: 25, nextDueInDays: 340, batchLotNo: "DHPP-2026-39", status: "completed" },
      { vaccineName: "Deworming (pyrantel)", doseNumber: 2, givenDaysAgo: 25, nextDueInDays: 12, status: "due" },
    ],
    heartRates: [{ bpm: 118, daysAgo: 20, context: "post_activity", isFlagged: false }],
  },
  {
    code: "FR-2026-9010",
    name: "Sampaguita",
    species: "cat",
    breedType: "puspin",
    sex: "female",
    estimatedAgeMonths: 30,
    size: "small",
    colorMarkings: "White and ginger calico",
    temperament: "Sweet, talkative, prefers a quiet home",
    weightKg: 3.8,
    isNeutered: true,
    originType: "surrender",
    lifecycleStatus: "adoption_pending",
    listingStatus: "published",
    intakeDaysAgo: 52,
    description:
      "Surrendered by an elderly owner moving into care. Litter-trained, up to date on vaccines, and currently reserved pending a home visit.",
    primaryPhotoUrl: CAT_PHOTOS[1],
    gallery: [CAT_PHOTOS[1], CAT_PHOTOS[4]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 50,
        diagnosis: "Healthy; mild dental tartar",
        treatment: "Routine care; dental check in 6 months",
        weightKg: 3.9,
        remarks: "Friendly and easy to handle.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 48, nextDueInDays: 317, batchLotNo: "AR-2026-066", status: "completed" },
      { vaccineName: "FVRCP", doseNumber: 2, givenDaysAgo: 48, nextDueInDays: 317, batchLotNo: "FV-2026-12", status: "completed" },
    ],
    heartRates: [{ bpm: 146, daysAgo: 50, context: "during_exam", isFlagged: false }],
  },
  {
    code: "FR-2026-9011",
    name: "Rocky",
    species: "dog",
    breedType: "mixed",
    sex: "male",
    estimatedAgeMonths: 30,
    size: "large",
    colorMarkings: "Brindle with white socks",
    temperament: "Gentle giant; calm around volunteers",
    weightKg: 24.3,
    isNeutered: false,
    originType: "surrender",
    lifecycleStatus: "under_care",
    listingStatus: "draft",
    intakeDaysAgo: 6,
    description:
      "Surrendered with a fractured right foreleg after a motorcycle incident. Under pain management and awaiting orthopedic review.",
    primaryPhotoUrl: DOG_PHOTOS[5],
    gallery: [DOG_PHOTOS[5], DOG_PHOTOS[2]],
    health: [
      {
        recordType: "injury",
        daysAgo: 6,
        diagnosis: "Closed fracture, right radius",
        treatment: "Splint and strict rest; orthopedic consult booked",
        medication: "Tramadol and carprofen as prescribed",
        weightKg: 24.3,
        followUpInDays: 2,
        remarks: "Non-weight-bearing on the right front leg.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 5, nextDueInDays: 360, batchLotNo: "AR-2026-126", status: "completed" },
    ],
    heartRates: [
      { bpm: 196, daysAgo: 6, context: "under_stress", isFlagged: true, notes: "Pain-related elevation; vet notified" },
    ],
  },
  {
    code: "FR-2026-9012",
    name: "Ginger",
    species: "cat",
    breedType: "puspin",
    sex: "male",
    estimatedAgeMonths: 22,
    size: "small",
    colorMarkings: "Orange tabby with a kinked tail",
    temperament: "Bold and affectionate; talks a lot",
    weightKg: 4.1,
    isNeutered: true,
    originType: "community_post",
    lifecycleStatus: "available",
    listingStatus: "published",
    intakeDaysAgo: 30,
    description:
      "Neighborhood stray taken in by a foster volunteer. Neutered, vaccinated, and ready for an indoor home with plenty of vertical space.",
    primaryPhotoUrl: CAT_PHOTOS[2],
    gallery: [CAT_PHOTOS[2], CAT_PHOTOS[0]],
    health: [
      {
        recordType: "checkup",
        daysAgo: 28,
        diagnosis: "Healthy adult male; old tail kink",
        treatment: "Routine care",
        weightKg: 4.0,
        remarks: "No pain on tail palpation.",
      },
      {
        recordType: "spay_neuter",
        daysAgo: 22,
        diagnosis: "Elective orchiectomy",
        treatment: "Routine neuter, no complications",
        weightKg: 4.1,
        remarks: "Recovered well.",
      },
    ],
    vaccinations: [
      { vaccineName: "Anti-rabies", doseNumber: 1, givenDaysAgo: 26, nextDueInDays: 339, batchLotNo: "AR-2026-109", status: "completed" },
      { vaccineName: "FVRCP", doseNumber: 2, givenDaysAgo: 26, nextDueInDays: 339, batchLotNo: "FV-2026-15", status: "completed" },
    ],
    heartRates: [{ bpm: 156, daysAgo: 22, context: "resting", isFlagged: false }],
  },
];

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

type SeedReport = {
  code: string;
  reporterEmail: string | null;
  reportType: "stray" | "injured" | "abandoned";
  species: "dog" | "cat" | "unknown";
  urgencyLevel: "low" | "medium" | "high" | "critical";
  animalCount: number;
  barangayName: string;
  latitude: number;
  longitude: number;
  landmark: string;
  description: string;
  status:
    | "submitted"
    | "verified"
    | "assigned"
    | "in_progress"
    | "rescued"
    | "unable_to_locate"
    | "rejected"
    | "closed";
  submittedDaysAgo: number;
  verifiedDaysAgo?: number;
  rejectionReason?: string;
  photoUrl?: string;
  rescue?: {
    rescuerEmail: string;
    assignedDaysAgo: number;
    assignmentStatus: "pending" | "accepted" | "declined" | "en_route" | "on_site" | "completed" | "failed";
    acceptedDaysAgo?: number;
    arrivedDaysAgo?: number;
    completedDaysAgo?: number;
    outcomeNotes?: string;
    animalsRescued?: number;
  };
};

const REPORTS: SeedReport[] = [
  {
    code: "RPT-2026-9001",
    reporterEmail: "angela.delacruz@furescue.demo",
    reportType: "injured",
    species: "dog",
    urgencyLevel: "high",
    animalCount: 1,
    barangayName: "Dahican",
    latitude: 6.9421,
    longitude: 126.2537,
    landmark: "Under the parked tricycle beside the sari-sari store, ~80 m from the Dahican barangay hall",
    description:
      "Brown aspin with a deep cut on its left hind leg was seen limping near the Dahican barangay hall. The wound looks infected and the dog is visibly thin. It stays under a parked tricycle beside the sari-sari store and is approachable when offered food.",
    status: "in_progress",
    submittedDaysAgo: 12,
    verifiedDaysAgo: 12,
    photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80",
    rescue: {
      rescuerEmail: "nestor.villanueva@furescue.demo",
      assignedDaysAgo: 12,
      assignmentStatus: "on_site",
      acceptedDaysAgo: 12,
      arrivedDaysAgo: 11,
      outcomeNotes: "Dog secured and brought to the clinic for wound care. Awaiting owner search results.",
      animalsRescued: 1,
    },
  },
  {
    code: "RPT-2026-9002",
    reporterEmail: "grace.alonzo@furescue.demo",
    reportType: "stray",
    species: "cat",
    urgencyLevel: "medium",
    animalCount: 1,
    barangayName: "Central (City Proper)",
    latitude: 6.9528,
    longitude: 126.2171,
    landmark: "Behind the public market, near the loading bay",
    description:
      "Small grey tabby kitten living behind the public market. Appears about 3 months old, thin, and sneezing. Vendors have been giving it fish scraps but cannot take it home.",
    status: "rescued",
    submittedDaysAgo: 21,
    verifiedDaysAgo: 21,
    photoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80",
    rescue: {
      rescuerEmail: "lorna.castillo@furescue.demo",
      assignedDaysAgo: 21,
      assignmentStatus: "completed",
      acceptedDaysAgo: 21,
      arrivedDaysAgo: 21,
      completedDaysAgo: 20,
      outcomeNotes: "Kitten secured with a carrier and brought to the clinic. Now under observation.",
      animalsRescued: 1,
    },
  },
  {
    code: "RPT-2026-9003",
    reporterEmail: "carlo.mendoza@furescue.demo",
    reportType: "abandoned",
    species: "dog",
    urgencyLevel: "medium",
    animalCount: 1,
    barangayName: "Badas",
    latitude: 6.9398,
    longitude: 126.2382,
    landmark: "Tied to a fence along the national highway, near the Badas elementary school",
    description:
      "Black and tan shepherd mix tied to a fence with a short rope. No water bowl nearby. Residents say it has been there since yesterday and cries at night.",
    status: "rescued",
    submittedDaysAgo: 47,
    verifiedDaysAgo: 47,
    photoUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80",
    rescue: {
      rescuerEmail: "jomar.abella@furescue.demo",
      assignedDaysAgo: 47,
      assignmentStatus: "completed",
      acceptedDaysAgo: 46,
      arrivedDaysAgo: 46,
      completedDaysAgo: 46,
      outcomeNotes: "Dog secured and transported to the clinic. No microchip; owner not found.",
      animalsRescued: 1,
    },
  },
  {
    code: "RPT-2026-9004",
    reporterEmail: "angela.delacruz@furescue.demo",
    reportType: "injured",
    species: "cat",
    urgencyLevel: "critical",
    animalCount: 1,
    barangayName: "Matiao",
    latitude: 6.9602,
    longitude: 126.2204,
    landmark: "Drainage culvert across from the Matiao covered court",
    description:
      "Cream kitten stuck in a drainage culvert, breathing noisily and unable to climb out. Residents can hear it crying. Needs rescue before the afternoon rain.",
    status: "rescued",
    submittedDaysAgo: 9,
    verifiedDaysAgo: 9,
    photoUrl: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1200&q=80",
    rescue: {
      rescuerEmail: "nestor.villanueva@furescue.demo",
      assignedDaysAgo: 9,
      assignmentStatus: "completed",
      acceptedDaysAgo: 9,
      arrivedDaysAgo: 9,
      completedDaysAgo: 9,
      outcomeNotes: "Kitten extracted from the culvert and brought in for respiratory treatment.",
      animalsRescued: 1,
    },
  },
  {
    code: "RPT-2026-9005",
    reporterEmail: null,
    reportType: "stray",
    species: "dog",
    urgencyLevel: "low",
    animalCount: 1,
    barangayName: "Dawan",
    latitude: 6.9748,
    longitude: 126.1902,
    landmark: "Purok 3 basketball court, Dawan",
    description:
      "Golden brown aspin wandering near the basketball court. Wearing a blue collar but no tag. Barangay tanod says a resident may own it.",
    status: "closed",
    submittedDaysAgo: 40,
    verifiedDaysAgo: 40,
    photoUrl: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=1200&q=80",
    rescue: {
      rescuerEmail: "lorna.castillo@furescue.demo",
      assignedDaysAgo: 40,
      assignmentStatus: "completed",
      acceptedDaysAgo: 40,
      arrivedDaysAgo: 40,
      completedDaysAgo: 40,
      outcomeNotes: "Owner identified via barangay post. Dog returned home after proof of ownership.",
      animalsRescued: 1,
    },
  },
  {
    code: "RPT-2026-9006",
    reporterEmail: "rhea.lim@furescue.demo",
    reportType: "injured",
    species: "dog",
    urgencyLevel: "high",
    animalCount: 1,
    barangayName: "Culian",
    latitude: 6.9295,
    longitude: 126.2098,
    landmark: "Beside the Culian barangay road, near the water tank",
    description:
      "White aspin with tan ears hit by a motorcycle and dragging its back leg. Conscious and crying. Bystanders have moved it to the roadside but cannot transport it.",
    status: "assigned",
    submittedDaysAgo: 34,
    verifiedDaysAgo: 34,
    photoUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&q=80",
    rescue: {
      rescuerEmail: "jomar.abella@furescue.demo",
      assignedDaysAgo: 33,
      assignmentStatus: "en_route",
      acceptedDaysAgo: 33,
      outcomeNotes: "Team dispatched with a stretcher. ETA 15 minutes.",
      animalsRescued: 0,
    },
  },
  {
    code: "RPT-2026-9007",
    reporterEmail: "grace.alonzo@furescue.demo",
    reportType: "stray",
    species: "cat",
    urgencyLevel: "low",
    animalCount: 2,
    barangayName: "Central (City Proper)",
    latitude: 6.9511,
    longitude: 126.2158,
    landmark: "Alley between the bakery and hardware store",
    description:
      "Two adult cats regularly seen in the alley. Both appear healthy and are being fed by shop owners. Reporting in case they need vaccination or tnr support.",
    status: "rejected",
    submittedDaysAgo: 55,
    verifiedDaysAgo: 54,
    rejectionReason: "Healthy community cats already enrolled in the barangay TNR program.",
  },
  {
    code: "RPT-2026-9008",
    reporterEmail: "carlo.mendoza@furescue.demo",
    reportType: "stray",
    species: "dog",
    urgencyLevel: "medium",
    animalCount: 3,
    barangayName: "Luban",
    latitude: 6.9234,
    longitude: 126.1551,
    landmark: "Near the Luban primary school gate",
    description:
      "Three puppies roaming near the school gate during dismissal. No mother in sight. School staff are keeping them in a box for now.",
    status: "submitted",
    submittedDaysAgo: 4,
    photoUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80",
  },
  {
    code: "RPT-2026-9009",
    reporterEmail: "grace.alonzo@furescue.demo",
    reportType: "abandoned",
    species: "dog",
    urgencyLevel: "medium",
    animalCount: 1,
    barangayName: "Mamali",
    latitude: 6.8988,
    longitude: 126.1755,
    landmark: "Old waiting shed along the Mamali road",
    description:
      "Brown dog left tied to the waiting shed with a bag of rice and a bowl of water. Looks like it was abandoned overnight.",
    status: "verified",
    submittedDaysAgo: 2,
    verifiedDaysAgo: 1,
    photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80",
  },
];

/* -------------------------------------------------------------------------- */
/* Adoptions                                                                  */
/* -------------------------------------------------------------------------- */

type SeedAdoption = {
  code: string;
  animalCode: string;
  adopterEmail: string;
  status:
    | "submitted"
    | "under_review"
    | "interview_scheduled"
    | "approved"
    | "rejected"
    | "withdrawn"
    | "completed";
  housingType: "house" | "apartment" | "boarding" | "other";
  isOwnedProperty: boolean;
  hasFencedArea: boolean;
  householdMembers: number;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  priorPetExperience: string;
  reasonForAdopting: string;
  createdDaysAgo: number;
  reviewedDaysAgo?: number;
  decisionRemarks?: string;
  interviewInDays?: number;
  releaseDaysAgo?: number;
  receiptReferenceNo?: string;
  followups?: Array<{
    daysAgo: number;
    method: "in_app" | "phone" | "visit";
    animalCondition: string;
    remarks: string;
  }>;
};

const ADOPTIONS: SeedAdoption[] = [
  {
    code: "ADO-2026-9001",
    animalCode: "FR-2026-9002",
    adopterEmail: "josemiguel.bautista@furescue.demo",
    status: "under_review",
    housingType: "house",
    isOwnedProperty: true,
    hasFencedArea: true,
    householdMembers: 4,
    hasOtherPets: true,
    otherPetsDetails:
      "One 3-year-old male aspin named Totoy, neutered and up to date with vaccinations. He is friendly with other dogs and sleeps inside the house.",
    priorPetExperience:
      "I grew up with dogs at home and have cared for Totoy for the past three years, including his vaccinations and regular check-ups at the city vet.",
    reasonForAdopting:
      "Our family has been looking for a companion for Totoy and for my two children, ages 8 and 11. We have a fenced yard, someone is home during the day, and we can commit to feeding, walking, and vet visits.",
    createdDaysAgo: 5,
    reviewedDaysAgo: 4,
  },
  {
    code: "ADO-2026-9002",
    animalCode: "FR-2026-9004",
    adopterEmail: "rhea.lim@furescue.demo",
    status: "interview_scheduled",
    housingType: "house",
    isOwnedProperty: false,
    hasFencedArea: true,
    householdMembers: 3,
    hasOtherPets: false,
    priorPetExperience:
      "I had large dogs growing up in the province. This would be my first dog as an adult, and I have already spoken with a trainer about leash work.",
    reasonForAdopting:
      "I live in a rented house with a fully fenced yard and a landlord who allows pets. I want a walking companion and have the time and budget for a large dog.",
    createdDaysAgo: 9,
    reviewedDaysAgo: 8,
    interviewInDays: 2,
  },
  {
    code: "ADO-2026-9003",
    animalCode: "FR-2026-9007",
    adopterEmail: "carlo.mendoza@furescue.demo",
    status: "completed",
    housingType: "house",
    isOwnedProperty: true,
    hasFencedArea: true,
    householdMembers: 5,
    hasOtherPets: true,
    otherPetsDetails: "Two adult cats, both spayed and vaccinated. Used to dogs.",
    priorPetExperience:
      "We adopted a rescue dog in 2019 and cared for her until she passed at age 12. We are familiar with skin conditions and vet schedules.",
    reasonForAdopting:
      "Our home feels empty without a dog. We have a fenced yard, children who are gentle with animals, and a family vet we have used for years.",
    createdDaysAgo: 40,
    reviewedDaysAgo: 38,
    decisionRemarks: "Approved after home visit and vet reference check.",
    releaseDaysAgo: 24,
    receiptReferenceNo: "OR-2026-004821",
    followups: [
      {
        daysAgo: 14,
        method: "visit",
        animalCondition: "Healthy, coat fully regrown, ideal body weight",
        remarks: "Luna is relaxed at home and enjoys two short walks daily.",
      },
      {
        daysAgo: 4,
        method: "phone",
        animalCondition: "Doing well; no skin flare-ups",
        remarks: "Family reports good appetite and no behavioral concerns.",
      },
    ],
  },
  {
    code: "ADO-2026-9004",
    animalCode: "FR-2026-9003",
    adopterEmail: "angela.delacruz@furescue.demo",
    status: "submitted",
    housingType: "apartment",
    isOwnedProperty: false,
    hasFencedArea: false,
    householdMembers: 2,
    hasOtherPets: false,
    priorPetExperience:
      "I cared for two cats during college. Both lived indoors and were spayed and vaccinated.",
    reasonForAdopting:
      "My apartment is quiet and has screened windows. I work from home three days a week and want a companion cat. I have already bought a litter box and a cat tree.",
    createdDaysAgo: 1,
  },
  {
    code: "ADO-2026-9005",
    animalCode: "FR-2026-9008",
    adopterEmail: "grace.alonzo@furescue.demo",
    status: "completed",
    housingType: "apartment",
    isOwnedProperty: true,
    hasFencedArea: false,
    householdMembers: 2,
    hasOtherPets: false,
    priorPetExperience: "First-time cat owner; attended the clinic's responsible ownership session.",
    reasonForAdopting:
      "I live alone and want a calm companion. My unit has a screened balcony and my landlord allows one cat.",
    createdDaysAgo: 60,
    reviewedDaysAgo: 58,
    decisionRemarks: "Approved. Screened balcony and landlord permission verified.",
    releaseDaysAgo: 45,
    receiptReferenceNo: "OR-2026-004655",
    followups: [
      {
        daysAgo: 20,
        method: "in_app",
        animalCondition: "Healthy, playful, using litter box consistently",
        remarks: "Adopter sent photos; Pip has settled in well.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Conversations                                                              */
/* -------------------------------------------------------------------------- */

const CONVERSATIONS = [
  {
    subject: "Home visit schedule for Cocoa",
    contextType: "adoption_request" as const,
    contextAdoptionCode: "ADO-2026-9001",
    participantEmails: ["josemiguel.bautista@furescue.demo", "maria.santiago@furescue.demo"],
    assignedToEmail: "maria.santiago@furescue.demo",
    messages: [
      { from: "josemiguel.bautista@furescue.demo", body: "Good day! I submitted my application for Cocoa. When can we schedule the home visit?", minutesAgo: 240 },
      { from: "maria.santiago@furescue.demo", body: "Hello Jose Miguel. Your application looks complete. We can visit this Saturday between 9 and 11 in the morning — would that work?", minutesAgo: 205 },
      { from: "josemiguel.bautista@furescue.demo", body: "Saturday works for us. I'll make sure Totoy's vaccination record is ready to show you.", minutesAgo: 190 },
      { from: "maria.santiago@furescue.demo", body: "Perfect. Please keep Cocoa's meet-and-greet short since she can be shy at first. See you Saturday.", minutesAgo: 175 },
    ],
  },
  {
    subject: "Rescue update — Culian injured dog",
    contextType: "report" as const,
    contextReportCode: "RPT-2026-9006",
    participantEmails: [
      "rhea.lim@furescue.demo",
      "jomar.abella@furescue.demo",
      "maria.santiago@furescue.demo",
    ],
    assignedToEmail: "maria.santiago@furescue.demo",
    messages: [
      { from: "rhea.lim@furescue.demo", body: "The dog is still conscious but has not moved from the roadside. I placed a towel under its head.", minutesAgo: 95 },
      { from: "jomar.abella@furescue.demo", body: "We are en route with a stretcher and muzzle. Ten to fifteen minutes away.", minutesAgo: 80 },
      { from: "maria.santiago@furescue.demo", body: "Please keep the dog warm and avoid moving the back leg. Call the clinic when you arrive so we can prepare the exam room.", minutesAgo: 72 },
      { from: "rhea.lim@furescue.demo", body: "Understood. I'll stay until you arrive.", minutesAgo: 70 },
    ],
  },
  {
    subject: "Vaccination records for Tala",
    contextType: "general" as const,
    participantEmails: ["angela.delacruz@furescue.demo", "paolo.reyes@furescue.demo"],
    assignedToEmail: "paolo.reyes@furescue.demo",
    messages: [
      { from: "angela.delacruz@furescue.demo", body: "Hi! I'm interested in Tala. Could you share her vaccination and deworming schedule?", minutesAgo: 300 },
      { from: "paolo.reyes@furescue.demo", body: "Tala has her anti-rabies and FVRCP shots. Her next deworming is due in a week, and that is included in the adoption.", minutesAgo: 280 },
      { from: "angela.delacruz@furescue.demo", body: "That's great, thank you. I'd like to visit her this weekend if possible.", minutesAgo: 260 },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function main() {
  const [roles, barangayRows] = await Promise.all([
    prisma.role.findMany(),
    prisma.barangay.findMany(),
  ]);

  const roleByName = new Map(roles.map((role) => [role.roleName, role]));
  const barangayByName = new Map(barangayRows.map((barangay) => [barangay.name, barangay]));
  for (const roleName of ["admin", "rescuer", "community_user"] as const) {
    if (!roleByName.has(roleName)) {
      throw new Error(`Role "${roleName}" is not seeded. Run "npm run db:seed" first.`);
    }
  }
  if (barangayRows.length === 0) {
    throw new Error('No barangays seeded. Run "npm run db:seed" first.');
  }

  // Slightly improve map data for barangays referenced by the demo.
  await Promise.all(
    Object.entries(BARANGAY_COORDS).map(([name, coords]) => {
      const barangay = barangayByName.get(name);
      if (!barangay) return Promise.resolve();
      return prisma.barangay.update({
        where: { id: barangay.id },
        data: {
          centerLatitude: coords.lat,
          centerLongitude: coords.lng,
        },
      });
    }),
  );

  const staffHash = await hash(STAFF_PASSWORD, 12);
  const residentHash = await hash(RESIDENT_PASSWORD, 12);

  const usersByEmail = new Map<string, { id: string }>();

  for (const person of STAFF) {
    const role = roleByName.get(person.roleName)!;
    const barangay = barangayByName.get(person.barangayName) ?? barangayRows[0];
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {
        roleId: role.id,
        barangayId: barangay.id,
        accountStatus: "active",
        deletedAt: null,
      },
      create: {
        roleId: role.id,
        barangayId: barangay.id,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        email: person.email,
        phoneNumber: person.phoneNumber,
        addressLine: person.addressLine,
        passwordHash: staffHash,
        accountStatus: "active",
        emailVerifiedAt: today(),
      },
    });
    usersByEmail.set(person.email, user);
  }

  for (const person of RESIDENTS) {
    const role = roleByName.get("community_user")!;
    const barangay = barangayByName.get(person.barangayName) ?? barangayRows[0];
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {
        roleId: role.id,
        barangayId: barangay.id,
        accountStatus: "active",
        deletedAt: null,
      },
      create: {
        roleId: role.id,
        barangayId: barangay.id,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        email: person.email,
        phoneNumber: person.phoneNumber,
        addressLine: person.addressLine,
        passwordHash: residentHash,
        accountStatus: "active",
        emailVerifiedAt: today(),
      },
    });
    usersByEmail.set(person.email, user);
  }

  const admin = usersByEmail.get("maria.santiago@furescue.demo")!;
  const vet = usersByEmail.get("paolo.reyes@furescue.demo")!;

  // ---------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------
  const reportByCode = new Map<string, { id: string }>();

  for (const seed of REPORTS) {
    const barangay = barangayByName.get(seed.barangayName) ?? barangayRows[0];
    const submittedAt = daysAgo(seed.submittedDaysAgo);
    const verifiedAt = seed.verifiedDaysAgo ? daysAgo(seed.verifiedDaysAgo) : null;
    const reporterId = seed.reporterEmail ? usersByEmail.get(seed.reporterEmail)?.id ?? null : null;

    const report = await prisma.report.upsert({
      where: { reportCode: seed.code },
      update: { status: seed.status },
      create: {
        reportCode: seed.code,
        reporterUserId: reporterId,
        reportType: seed.reportType,
        species: seed.species,
        description: seed.description,
        urgencyLevel: seed.urgencyLevel,
        animalCount: seed.animalCount,
        latitude: seed.latitude,
        longitude: seed.longitude,
        barangayId: barangay.id,
        locationLandmark: seed.landmark,
        status: seed.status,
        rejectionReason: seed.rejectionReason ?? null,
        verifiedBy: verifiedAt ? admin.id : null,
        verifiedAt,
        submittedAt,
        syncedAt: submittedAt,
        ...(seed.photoUrl
          ? {
              media: {
                create: {
                  mediaType: "photo" as const,
                  fileUrl: seed.photoUrl,
                  fileSizeKb: 184,
                },
              },
            }
          : {}),
        statusHistory: {
          create: [
            { newStatus: "submitted", changedAt: submittedAt, remarks: "Report submitted" },
            ...(verifiedAt
              ? [
                  {
                    oldStatus: "submitted",
                    newStatus: "verified",
                    changedAt: verifiedAt,
                    changedBy: admin.id,
                    remarks: "Verified by clinic staff",
                  },
                ]
              : []),
            ...(seed.status !== "submitted" && seed.status !== "verified"
              ? [
                  {
                    oldStatus: "verified",
                    newStatus: seed.status,
                    changedAt: daysAgo(Math.max(0, seed.submittedDaysAgo - 1)),
                    changedBy: admin.id,
                    remarks: `Status updated to ${seed.status.replaceAll("_", " ")}`,
                  },
                ]
              : []),
          ],
        },
      },
      select: { id: true },
    });

    reportByCode.set(seed.code, report);
  }

  // Rescue assignments
  for (const seed of REPORTS) {
    if (!seed.rescue) continue;
    const report = reportByCode.get(seed.code);
    const rescuer = usersByEmail.get(seed.rescue.rescuerEmail);
    if (!report || !rescuer) continue;

    const existing = await prisma.rescueOperation.findFirst({
      where: { reportId: report.id, rescuerUserId: rescuer.id },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.rescueOperation.create({
      data: {
        reportId: report.id,
        rescuerUserId: rescuer.id,
        assignedBy: admin.id,
        assignmentStatus: seed.rescue.assignmentStatus,
        assignedAt: daysAgo(seed.rescue.assignedDaysAgo),
        acceptedAt:
          seed.rescue.acceptedDaysAgo !== undefined
            ? daysAgo(seed.rescue.acceptedDaysAgo)
            : null,
        arrivedAt:
          seed.rescue.arrivedDaysAgo !== undefined
            ? daysAgo(seed.rescue.arrivedDaysAgo)
            : null,
        completedAt:
          seed.rescue.completedDaysAgo !== undefined
            ? daysAgo(seed.rescue.completedDaysAgo)
            : null,
        outcomeNotes: seed.rescue.outcomeNotes ?? null,
        animalsRescued: seed.rescue.animalsRescued ?? null,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Animals and their health history
  // ---------------------------------------------------------------------
  const animalByCode = new Map<string, { id: string }>();

  for (const seed of ANIMALS) {
    const sourceReport = seed.sourceReportCode ? reportByCode.get(seed.sourceReportCode) : undefined;

    const animal = await prisma.animal.upsert({
      where: { animalCode: seed.code },
      update: {
        lifecycleStatus: seed.lifecycleStatus,
        listingStatus: seed.listingStatus,
      },
      create: {
        animalCode: seed.code,
        name: seed.name,
        species: seed.species,
        breedType: seed.breedType,
        sex: seed.sex,
        estimatedAgeMonths: seed.estimatedAgeMonths,
        size: seed.size,
        colorMarkings: seed.colorMarkings,
        temperament: seed.temperament,
        weightKg: seed.weightKg,
        isNeutered: seed.isNeutered,
        originType: seed.originType,
        sourceReportId: sourceReport?.id ?? null,
        postedByUserId: admin.id,
        lifecycleStatus: seed.lifecycleStatus,
        listingStatus: seed.listingStatus,
        intakeDate: daysAgo(seed.intakeDaysAgo),
        adoptedDate: seed.adoptedDaysAgo !== undefined ? daysAgo(seed.adoptedDaysAgo) : null,
        primaryPhotoUrl: seed.primaryPhotoUrl,
        description: seed.description,
        media: {
          create: seed.gallery.map((fileUrl, index) => ({
            mediaType: "photo" as const,
            fileUrl,
            caption: index === 0 ? `${seed.name} at the clinic` : `${seed.name} — photo ${index + 1}`,
            sortOrder: index,
            uploadedBy: admin.id,
          })),
        },
      },
      select: { id: true },
    });

    animalByCode.set(seed.code, animal);

    const existingMedia = await prisma.animalMedia.count({ where: { animalId: animal.id } });
    if (existingMedia === 0) {
      await prisma.animalMedia.createMany({
        data: seed.gallery.map((fileUrl, index) => ({
          animalId: animal.id,
          mediaType: "photo" as const,
          fileUrl,
          caption: index === 0 ? `${seed.name} at the clinic` : `${seed.name} — photo ${index + 1}`,
          sortOrder: index,
          uploadedBy: admin.id,
        })),
      });
    }

    const existingHealth = await prisma.healthRecord.count({ where: { animalId: animal.id } });
    if (existingHealth === 0) {
      for (const record of seed.health) {
        await prisma.healthRecord.create({
          data: {
            animalId: animal.id,
            recordType: record.recordType,
            recordDate: daysAgo(record.daysAgo),
            diagnosis: record.diagnosis ?? null,
            treatment: record.treatment ?? null,
            medication: record.medication ?? null,
            weightKg: record.weightKg ?? null,
            attendedBy: vet.id,
            followUpDate:
              record.followUpInDays !== undefined
                ? new Date(Date.now() + record.followUpInDays * DAY)
                : null,
            remarks: record.remarks ?? null,
          },
        });
      }
    }

    const existingVaccinations = await prisma.vaccination.count({ where: { animalId: animal.id } });
    if (existingVaccinations === 0) {
      for (const vaccine of seed.vaccinations) {
        await prisma.vaccination.create({
          data: {
            animalId: animal.id,
            vaccineName: vaccine.vaccineName,
            doseNumber: vaccine.doseNumber ?? null,
            dateGiven: daysAgo(vaccine.givenDaysAgo),
            nextDueDate:
              vaccine.nextDueInDays !== undefined
                ? new Date(Date.now() + vaccine.nextDueInDays * DAY)
                : null,
            batchLotNo: vaccine.batchLotNo ?? null,
            administeredBy: vet.id,
            status: vaccine.status ?? "completed",
          },
        });
      }
    }

    const existingHeartRates = await prisma.heartRateLog.count({ where: { animalId: animal.id } });
    if (existingHeartRates === 0) {
      for (const rate of seed.heartRates) {
        await prisma.heartRateLog.create({
          data: {
            animalId: animal.id,
            heartRateBpm: rate.bpm,
            measurementContext: rate.context ?? null,
            measuredAt: daysAgo(rate.daysAgo),
            recordedBy: vet.id,
            isFlagged: rate.isFlagged ?? false,
            notes: rate.notes ?? null,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Adoption requests and follow-ups
  // ---------------------------------------------------------------------
  for (const seed of ADOPTIONS) {
    const animal = animalByCode.get(seed.animalCode);
    const adopter = usersByEmail.get(seed.adopterEmail);
    if (!animal || !adopter) continue;

    const createdAt = daysAgo(seed.createdDaysAgo);
    const request = await prisma.adoptionRequest.upsert({
      where: { requestCode: seed.code },
      update: { status: seed.status },
      create: {
        requestCode: seed.code,
        animalId: animal.id,
        adopterUserId: adopter.id,
        housingType: seed.housingType,
        isOwnedProperty: seed.isOwnedProperty,
        hasFencedArea: seed.hasFencedArea,
        householdMembers: seed.householdMembers,
        hasOtherPets: seed.hasOtherPets,
        otherPetsDetails: seed.otherPetsDetails ?? null,
        priorPetExperience: seed.priorPetExperience,
        reasonForAdopting: seed.reasonForAdopting,
        validIdUrl:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
        homePhotoUrl:
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
        status: seed.status,
        reviewedBy: seed.reviewedDaysAgo !== undefined ? admin.id : null,
        reviewedAt: seed.reviewedDaysAgo !== undefined ? daysAgo(seed.reviewedDaysAgo) : null,
        decisionRemarks: seed.decisionRemarks ?? null,
        interviewSchedule:
          seed.interviewInDays !== undefined
            ? new Date(Date.now() + seed.interviewInDays * DAY)
            : null,
        releaseDate: seed.releaseDaysAgo !== undefined ? daysAgo(seed.releaseDaysAgo) : null,
        receiptReferenceNo: seed.receiptReferenceNo ?? null,
        createdAt,
      },
      select: { id: true },
    });

    for (const followup of seed.followups ?? []) {
      const existing = await prisma.adoptionFollowup.findFirst({
        where: { requestId: request.id, followupDate: daysAgo(followup.daysAgo) },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.adoptionFollowup.create({
        data: {
          requestId: request.id,
          followupDate: daysAgo(followup.daysAgo),
          method: followup.method,
          animalCondition: followup.animalCondition,
          remarks: followup.remarks,
          conductedBy: admin.id,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Conversations and messages
  // ---------------------------------------------------------------------
  const adoptionByCode = await prisma.adoptionRequest.findMany({
    where: { requestCode: { in: ADOPTIONS.map((item) => item.code) } },
    select: { id: true, requestCode: true },
  });
  const adoptionIdByCode = new Map(adoptionByCode.map((item) => [item.requestCode, item.id]));

  for (const seed of CONVERSATIONS) {
    const existing = await prisma.conversation.findFirst({
      where: { subject: seed.subject },
      select: { id: true },
    });
    if (existing) continue;

    const participantIds = seed.participantEmails
      .map((email) => usersByEmail.get(email)?.id)
      .filter((id): id is string => Boolean(id));
    if (participantIds.length === 0) continue;

    const contextId =
      seed.contextType === "adoption_request" && seed.contextAdoptionCode
        ? adoptionIdByCode.get(seed.contextAdoptionCode) ?? null
        : seed.contextType === "report" && seed.contextReportCode
          ? reportByCode.get(seed.contextReportCode)?.id ?? null
          : null;

    const conversation = await prisma.conversation.create({
      data: {
        contextType: seed.contextType,
        contextId,
        subject: seed.subject,
        status: "open",
        assignedToUserId: seed.assignedToEmail
          ? usersByEmail.get(seed.assignedToEmail)?.id ?? null
          : null,
        participants: {
          create: participantIds.map((userId) => ({ userId, lastReadAt: today() })),
        },
      },
    });

    for (const [index, message] of seed.messages.entries()) {
      const senderId = usersByEmail.get(message.from)?.id;
      if (!senderId) continue;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: senderId,
          messageBody: message.body,
          sentAt: new Date(Date.now() - (message.minutesAgo ?? (seed.messages.length - index) * 30) * 60_000),
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  const notificationSeeds = [
    {
      recipientId: admin.id,
      type: "report_status" as const,
      title: "New stray report in Luban",
      body: "RPT-2026-9008 · Luban · 3 puppies reported near the primary school gate.",
      referenceType: "report",
      referenceCode: "RPT-2026-9008",
      isRead: false,
    },
    {
      recipientId: admin.id,
      type: "adoption_status" as const,
      title: "New adoption application for Tala",
      body: "ADO-2026-9004 · Angela Dela Cruz applied for FR-2026-9003 (Tala).",
      referenceType: "adoption_request",
      referenceCode: "ADO-2026-9004",
      isRead: false,
    },
    {
      recipientId: admin.id,
      type: "vaccination_due" as const,
      title: "Vaccination overdue — Cocoa",
      body: "FR-2026-9002: Deworming (pyrantel) is overdue. Schedule a clinic visit.",
      referenceType: "animal",
      referenceCode: "FR-2026-9002",
      isRead: false,
    },
    {
      recipientId: admin.id,
      type: "rescue_assignment" as const,
      title: "Rescue team en route to Culian",
      body: "RPT-2026-9006 assigned to Jomar Abella. Injured dog on the roadside.",
      referenceType: "report",
      referenceCode: "RPT-2026-9006",
      isRead: true,
    },
    {
      recipientId: usersByEmail.get("nestor.villanueva@furescue.demo")!.id,
      type: "rescue_assignment" as const,
      title: "New rescue assignment — Dahican",
      body: "RPT-2026-9001: injured aspin near the Dahican barangay hall.",
      referenceType: "report",
      referenceCode: "RPT-2026-9001",
      isRead: true,
    },
    {
      recipientId: usersByEmail.get("angela.delacruz@furescue.demo")!.id,
      type: "adoption_status" as const,
      title: "Application received for Tala",
      body: "We received your application ADO-2026-9004. Our team will review it within two working days.",
      referenceType: "adoption_request",
      referenceCode: "ADO-2026-9004",
      isRead: false,
    },
    {
      recipientId: usersByEmail.get("josemiguel.bautista@furescue.demo")!.id,
      type: "adoption_status" as const,
      title: "Home visit scheduled",
      body: "Your application for Cocoa is under review. A home visit is proposed for Saturday, 9–11 AM.",
      referenceType: "adoption_request",
      referenceCode: "ADO-2026-9001",
      isRead: false,
    },
    {
      recipientId: usersByEmail.get("carlo.mendoza@furescue.demo")!.id,
      type: "adoption_status" as const,
      title: "Follow-up visit completed",
      body: "Thank you for welcoming Luna. Her 30-day follow-up check looks great.",
      referenceType: "adoption_request",
      referenceCode: "ADO-2026-9003",
      isRead: true,
    },
  ];

  const reportIds = new Map(
    (
      await prisma.report.findMany({
        where: { reportCode: { in: notificationSeeds.filter((n) => n.referenceType === "report").map((n) => n.referenceCode) } },
        select: { id: true, reportCode: true },
      })
    ).map((row) => [row.reportCode, row.id]),
  );
  const animalIds = new Map(
    (
      await prisma.animal.findMany({
        where: { animalCode: { in: notificationSeeds.filter((n) => n.referenceType === "animal").map((n) => n.referenceCode) } },
        select: { id: true, animalCode: true },
      })
    ).map((row) => [row.animalCode, row.id]),
  );

  for (const seed of notificationSeeds) {
    const existing = await prisma.notification.findFirst({
      where: { recipientUserId: seed.recipientId, title: seed.title },
      select: { id: true },
    });
    if (existing) continue;

    const referenceId =
      seed.referenceType === "report"
        ? reportIds.get(seed.referenceCode) ?? null
        : seed.referenceType === "animal"
          ? animalIds.get(seed.referenceCode) ?? null
          : adoptionIdByCode.get(seed.referenceCode) ?? null;

    await prisma.notification.create({
      data: {
        recipientUserId: seed.recipientId,
        notificationType: seed.type,
        title: seed.title,
        body: seed.body,
        referenceType: seed.referenceType,
        referenceId,
        channel: "in_app",
        isRead: seed.isRead,
        readAt: seed.isRead ? daysAgo(1) : null,
        sentAt: daysAgo(seed.isRead ? 2 : 0.2),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Analytics snapshots (rolling last 14 days for the clinic's main barangays)
  // ---------------------------------------------------------------------
  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);
    snapshotDate.setDate(snapshotDate.getDate() - dayOffset);
    const barangay = barangayByName.get(dayOffset % 2 === 0 ? "Dahican" : "Central (City Proper)");
    if (!barangay) continue;

    const existing = await prisma.analyticsSnapshot.findFirst({
      where: { snapshotDate, barangayId: barangay.id, species: "all" },
      select: { id: true },
    });
    if (existing) continue;

    const base = 1 + ((dayOffset * 3) % 4);
    await prisma.analyticsSnapshot.create({
      data: {
        snapshotDate,
        barangayId: barangay.id,
        species: "all",
        reportsReceived: base + 1,
        reportsResolved: Math.max(0, base - 1),
        animalsRescued: Math.max(0, base - 1),
        animalsAdopted: dayOffset % 5 === 0 ? 1 : 0,
        adoptionRequestsReceived: dayOffset % 3 === 0 ? 1 : 0,
        avgResponseHours: 1.5 + (dayOffset % 4) * 0.75,
        avgResolutionHours: 18 + (dayOffset % 5) * 6.5,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Generated reports
  // ---------------------------------------------------------------------
  const generatedReportSeeds = [
    {
      reportKind: "rescue_efficiency" as const,
      dateFrom: daysAgo(30),
      dateTo: today(),
      format: "pdf" as const,
      fileUrl: "https://example.com/reports/furescue-rescue-efficiency-30d.pdf",
    },
    {
      reportKind: "adoption_trends" as const,
      dateFrom: daysAgo(90),
      dateTo: today(),
      format: "xlsx" as const,
      fileUrl: "https://example.com/reports/furescue-adoption-trends-90d.xlsx",
    },
    {
      reportKind: "health_summary" as const,
      dateFrom: daysAgo(30),
      dateTo: today(),
      format: "csv" as const,
      fileUrl: "https://example.com/reports/furescue-health-summary-30d.csv",
    },
  ];

  for (const seed of generatedReportSeeds) {
    const existing = await prisma.generatedReport.findFirst({
      where: {
        reportKind: seed.reportKind,
        dateFrom: seed.dateFrom,
        dateTo: seed.dateTo,
        format: seed.format,
      },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.generatedReport.create({
      data: {
        reportKind: seed.reportKind,
        dateFrom: seed.dateFrom,
        dateTo: seed.dateTo,
        format: seed.format,
        fileUrl: seed.fileUrl,
        generatedBy: admin.id,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Audit log history
  // ---------------------------------------------------------------------
  const auditSeeds = [
    {
      action: "create_user",
      entityType: "user",
      entityId: admin.id,
      newValue: { role: "admin", email: "maria.santiago@furescue.demo" },
      daysAgo: 180,
    },
    {
      action: "create_animal",
      entityType: "animal",
      entityId: animalByCode.get("FR-2026-9002")?.id ?? null,
      newValue: { animalCode: "FR-2026-9002", name: "Cocoa" },
      daysAgo: 34,
    },
    {
      action: "create_vaccination",
      entityType: "vaccination",
      entityId: animalByCode.get("FR-2026-9002")?.id ?? null,
      newValue: { animalCode: "FR-2026-9002", vaccine: "Deworming (pyrantel)" },
      daysAgo: 30,
    },
    {
      action: "update_report_status",
      entityType: "report",
      entityId: reportByCode.get("RPT-2026-9003")?.id ?? null,
      newValue: { reportCode: "RPT-2026-9003", status: "rescued" },
      daysAgo: 46,
    },
    {
      action: "approve_adoption",
      entityType: "adoption_request",
      entityId: adoptionIdByCode.get("ADO-2026-9003") ?? null,
      newValue: { requestCode: "ADO-2026-9003", status: "completed" },
      daysAgo: 24,
    },
  ];

  for (const seed of auditSeeds) {
    const existing = await prisma.auditLog.findFirst({
      where: { action: seed.action, entityId: seed.entityId ?? undefined },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: seed.action,
        entityType: seed.entityType,
        entityId: seed.entityId,
        newValue: seed.newValue,
        ipAddress: "127.0.0.1",
        createdAt: daysAgo(seed.daysAgo),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------
  const [animalCount, reportCount, adoptionCount, conversationCount, notificationCount] =
    await Promise.all([
      prisma.animal.count({ where: { animalCode: { startsWith: "FR-2026-9" } } }),
      prisma.report.count({ where: { reportCode: { startsWith: "RPT-2026-9" } } }),
      prisma.adoptionRequest.count({ where: { requestCode: { startsWith: "ADO-2026-9" } } }),
      prisma.conversation.count({ where: { subject: { in: CONVERSATIONS.map((item) => item.subject) } } }),
      prisma.notification.count({ where: { title: { in: notificationSeeds.map((item) => item.title) } } }),
    ]);

  console.log("Clinic demo data seeded.");
  console.log(`  animals:       ${animalCount}`);
  console.log(`  reports:       ${reportCount}`);
  console.log(`  adoptions:     ${adoptionCount}`);
  console.log(`  conversations: ${conversationCount}`);
  console.log(`  notifications: ${notificationCount}`);
  console.log("");
  console.log("Demo logins:");
  console.log(`  Admin / Vet:  maria.santiago@furescue.demo  /  ${STAFF_PASSWORD}`);
  console.log(`  Rescuer:      nestor.villanueva@furescue.demo  /  ${STAFF_PASSWORD}`);
  console.log(`  Resident:     angela.delacruz@furescue.demo  /  ${RESIDENT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
