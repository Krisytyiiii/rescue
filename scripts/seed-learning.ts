import "dotenv/config";

import { prisma } from "../packages/core/src/index.ts";

/**
 * Seeds the responsible pet ownership e-learning catalog:
 * five published courses covering ownership, dog behavior, basic training,
 * cat behavior, and health/community awareness.
 *
 * Idempotent: a course is skipped when a course with the same title exists.
 * Run with: npm run db:seed-learning
 */

interface SeedQuestion {
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface SeedLesson {
  title: string;
  contentBody: string;
  durationMinutes: number;
}

interface SeedCourse {
  title: string;
  category:
    | "responsible_ownership"
    | "dog_behavior"
    | "cat_behavior"
    | "basic_training"
    | "health_care";
  description: string;
  passingScore: number;
  lessons: SeedLesson[];
  questions: SeedQuestion[];
}

const COURSES: SeedCourse[] = [
  {
    title: "Responsible Pet Ownership 101",
    category: "responsible_ownership",
    description:
      "What it really takes to care for a dog or cat for life — readiness, daily needs, safety, and the commitments that come with adoption.",
    passingScore: 80,
    lessons: [
      {
        title: "What responsible ownership means",
        durationMinutes: 4,
        contentBody: `Responsible ownership is a promise that lasts the animal's whole life.

It means meeting five basic needs, often called the five freedoms:
• Freedom from hunger and thirst — fresh water and food suited to the animal.
• Freedom from discomfort — shade, shelter, and a safe place to rest.
• Freedom from pain, injury, and disease — vaccination, deworming, and vet care.
• Freedom to express normal behavior — sniffing, playing, scratching, and social contact.
• Freedom from fear and distress — gentle handling and a predictable routine.

Owning a pet is not a short project. Dogs can live 10–15 years and cats can live 12–18 years. Before adopting, ask yourself who will care for the animal when you are sick, busy, or away.

Try this today: write down the five freedoms and check which one your current or future pet needs most.`,
      },
      {
        title: "Before you adopt",
        durationMinutes: 4,
        contentBody: `A good adoption starts with an honest look at your household.

Check these before bringing an animal home:
• Permission — does your landlord or barangay allow pets?
• Time — feeding, walking, play, cleaning, and vet visits take daily time.
• Budget — food, vaccines, deworming, emergency care, and spay/neuter.
• Space and safety — secure windows, gates, and areas away from hazards.
• Agreement — everyone in the home must agree to the animal and share the work.

Adopting from a shelter gives a rescued animal a second chance and usually includes vaccination and health screening. Buying is not a requirement for a good pet.

Try this today: list the people who will help care for the pet and what each person will do.`,
      },
      {
        title: "Daily care basics",
        durationMinutes: 4,
        contentBody: `Every pet needs a steady daily routine.

Food and water: feed a consistent, appropriate diet and keep clean water available. Sudden diet changes can cause stomach upset.

Shelter: provide a dry, shaded, and secure place that is protected from rain and direct sun. Dogs need room to move; cats need vertical space and a quiet hiding spot.

Exercise and enrichment: dogs need walks and sniffing time. Cats need play that mimics hunting, plus scratching posts and climbing spaces.

Grooming and sanitation: brush regularly, clean ears when needed, and keep food bowls, bedding, and litter boxes clean.

Try this today: set fixed times for feeding, walking or play, and cleaning.`,
      },
      {
        title: "Identification and keeping pets safe",
        durationMinutes: 3,
        contentBody: `Most lost pets are found when they carry identification and stay contained.

• Use a properly fitted collar or harness with an ID tag showing your name and number.
• Ask your vet about microchipping and keep your contact details updated.
• Walk dogs on a leash and close gates and windows securely.
• Cats are safer indoors or in a screened enclosure, especially at night.
• Teach children to keep doors closed and never to chase a frightened animal.

If a pet goes missing, act quickly: search the neighborhood, post clear photos and the last known location, and contact your barangay and local rescue groups.

Try this today: check that your pet's ID tag is readable and your phone number is correct.`,
      },
      {
        title: "A lifetime of care",
        durationMinutes: 3,
        contentBody: `Responsible care continues through every stage of an animal's life.

• Spay or neuter to prevent unwanted litters and reduce roaming and health risks.
• Keep vaccinations and deworming up to date.
• Schedule a wellness check at least once a year, and more often for seniors.
• Plan for emergencies: know the nearest vet clinic and keep a small fund ready.
• If you must rehome an animal, never abandon it. Contact FuRescue or your barangay so it can be rehomed safely.
• Include your pet in your plans for moving house, travel, and emergencies.

Caring for an animal is a relationship, not a one-time event.

Try this today: put your vet's number and the nearest emergency clinic in your phone contacts.`,
      },
    ],
    questions: [
      {
        questionText: "Which of these is one of the five freedoms of animal welfare?",
        options: [
          "Freedom from all rules",
          "Freedom from hunger and thirst",
          "Freedom to roam anywhere",
          "Freedom from veterinary care",
        ],
        correctOption: 1,
        explanation:
          "The five freedoms include access to fresh water and a diet that keeps the animal healthy.",
      },
      {
        questionText: "What should you confirm before adopting a pet?",
        options: [
          "That the pet matches your furniture",
          "That your household agrees and can afford lifetime care",
          "That the pet will never need a vet",
          "That the pet can stay outside all day",
        ],
        correctOption: 1,
        explanation:
          "Adoption requires household agreement, time, space, and a budget for lifelong care.",
      },
      {
        questionText: "What is the safest way to walk a dog near a road?",
        options: [
          "Let the dog walk freely",
          "Use a sturdy leash and keep the dog close",
          "Carry the dog at all times",
          "Walk only at night without a leash",
        ],
        correctOption: 1,
        explanation:
          "A properly fitted leash keeps the dog safe from traffic and lets you guide it calmly.",
      },
      {
        questionText: "If you can no longer care for your pet, what should you do?",
        options: [
          "Abandon it where it was found",
          "Give it to a stranger without checking",
          "Rehome responsibly with FuRescue or your barangay",
          "Leave it at a market",
        ],
        correctOption: 2,
        explanation:
          "Responsible rehoming protects the animal. Abandonment is neglect and is punishable under animal welfare law.",
      },
      {
        questionText: "How long can a dog's care last?",
        options: [
          "A few weeks",
          "About one year",
          "10–15 years or more",
          "Until it stops being cute",
        ],
        correctOption: 2,
        explanation:
          "Dogs commonly live 10–15 years, so adoption is a long-term commitment.",
      },
    ],
  },
  {
    title: "Understanding Dog Behavior",
    category: "dog_behavior",
    description:
      "Read what dogs are telling you through posture, ears, tail, and movement — and know when they are calm, stressed, or unsafe to approach.",
    passingScore: 80,
    lessons: [
      {
        title: "How dogs communicate",
        durationMinutes: 4,
        contentBody: `Dogs speak with their whole bodies, not just their tails.

Watch these together:
• Ears — forward and relaxed when curious; pinned back when worried.
• Tail — loose and mid-height when relaxed; tucked when afraid; stiff and high when aroused.
• Posture — weight forward can mean alert; weight back can mean unsure.
• Face — lip licking, yawning, and whale eye (showing the whites) often signal stress.
• Movement — freezing, turning away, or moving in slow motion means the dog needs space.

A wagging tail is not always friendly. Check the whole body and the situation.

Try this today: watch a dog for one minute and name three signals you can see.`,
      },
      {
        title: "Calm signals and stress",
        durationMinutes: 4,
        contentBody: `Dogs use small signals to avoid conflict.

Common calm or stress signals:
• Looking away or turning the head
• Licking the nose or lips
• Yawning when not tired
• Shaking off after a tense moment
• Raising one paw or shifting weight
• Hiding behind a person or object

When signals are ignored, a dog may escalate to growling, snapping, or biting. Growling is information, not defiance — never punish it. Remove the dog from the stressful situation and give it space.

Try this today: notice one stress signal and give the dog distance instead of a correction.`,
      },
      {
        title: "Fear, anxiety, and aggression",
        durationMinutes: 4,
        contentBody: `Fear is the most common cause of aggression in dogs.

Signs a dog is afraid:
• Tucked tail and lowered body
• Ears flat against the head
• Trembling, panting, or drooling
• Trying to escape or hide
• Barking while backing away
• Growling or snapping when cornered

Punishment can suppress warning signs and make a bite more likely. Instead, reduce the trigger, create distance, and reward calm behavior. A veterinarian or certified behavior professional can help with severe anxiety.

Try this today: identify one situation your dog finds stressful and plan a calmer alternative.`,
      },
      {
        title: "Approaching dogs safely",
        durationMinutes: 4,
        contentBody: `Not every dog wants to meet you — and that is okay.

• Always ask the owner before approaching or touching a dog.
• Let the dog come to you. Crouch slightly, turn sideways, and avoid direct staring.
• Offer a closed fist for sniffing, then pet the shoulder or chest, not the head.
• Never approach a dog that is eating, sleeping, guarding puppies, or tied up.
• Teach children not to run toward dogs, scream, or hug them.
• If a loose dog approaches, stand still, avoid eye contact, and do not run.

For community strays, contact your barangay or FuRescue rather than trying to catch the animal yourself.

Try this today: practice asking an owner before greeting their dog.`,
      },
      {
        title: "Enrichment and mental health",
        durationMinutes: 3,
        contentBody: `A tired dog is often a calmer dog — but mental exercise matters as much as physical exercise.

• Let dogs sniff on walks; sniffing lowers stress.
• Use food puzzles, scatter feeding, or safe chew items.
• Teach simple tricks for short, positive sessions.
• Provide daily social contact and a predictable routine.
• Rotate toys so they stay interesting.
• Give a quiet place to rest away from noise and visitors.

Dogs that are bored or anxious may bark, chew, dig, or escape. Enrichment prevents many behavior problems.

Try this today: replace one walk with a sniff walk or a five-minute training game.`,
      },
    ],
    questions: [
      {
        questionText: "What does a tucked tail usually mean?",
        options: ["The dog is happy", "The dog is afraid or unsure", "The dog wants to fight", "The dog is hungry"],
        correctOption: 1,
        explanation: "A tucked tail is a common sign of fear or submission. Give the dog space.",
      },
      {
        questionText: "Which signal suggests a dog is stressed?",
        options: ["Relaxed ears and loose tail", "Lip licking and yawning", "Play bow", "Slow tail wag"],
        correctOption: 1,
        explanation: "Lip licking, yawning, and whale eye are common stress signals when there is no other cause.",
      },
      {
        questionText: "Why should you never punish a growl?",
        options: [
          "It makes the dog quieter",
          "It removes a warning sign and can lead to a bite",
          "Growling is always playful",
          "It teaches the dog to sing",
        ],
        correctOption: 1,
        explanation:
          "A growl warns that the dog is uncomfortable. Punishing it can suppress the warning without removing the fear.",
      },
      {
        questionText: "What is the safest way to greet an unfamiliar dog?",
        options: [
          "Run toward it and hug it",
          "Ask the owner, then let the dog approach you",
          "Stare directly into its eyes",
          "Reach over its head",
        ],
        correctOption: 1,
        explanation:
          "Always ask the owner first and let the dog choose to approach. Avoid looming over or staring.",
      },
      {
        questionText: "Which activity best supports a dog's mental health?",
        options: [
          "Keeping it in a small cage all day",
          "Sniff walks and food puzzles",
          "Only physical running",
          "Loud punishment",
        ],
        correctOption: 1,
        explanation: "Sniffing and problem-solving are mentally tiring and reduce stress.",
      },
    ],
  },
  {
    title: "Basic Dog Training",
    category: "basic_training",
    description:
      "Positive, force-free training for name recognition, sit, stay, recall, loose-leash walking, and crate and house training.",
    passingScore: 80,
    lessons: [
      {
        title: "Why positive reinforcement works",
        durationMinutes: 4,
        contentBody: `Dogs repeat behavior that is rewarded.

How to reward well:
• Reward immediately — within a second of the behavior.
• Use a marker word like "yes" or a clicker to mark the exact moment.
• Reward with small, soft treats, praise, or play, depending on what the dog values.
• Keep sessions short: 3–5 minutes is plenty for a puppy.
• End on a success, even a small one.

Avoid hitting, shouting, choke chains, and alpha rolls. They increase fear and damage trust, and they do not teach the dog what to do instead.

Try this today: reward your dog three times for behavior you like, without asking for anything.`,
      },
      {
        title: "Name recognition and attention",
        durationMinutes: 3,
        contentBody: `A dog that responds to its name can be redirected away from danger.

Steps:
1. Say the name once in a cheerful tone.
2. The instant the dog looks at you, mark ("yes") and reward.
3. Repeat in a quiet room, then add mild distractions.
4. Never use the name only for scolding — it should predict good things.

If the dog does not look, make a kiss sound or move a step away, then reward when it checks in.

Try this today: practice the name game for two minutes in three different rooms.`,
      },
      {
        title: "Sit, down, and stay",
        durationMinutes: 4,
        contentBody: `Build each skill in small steps.

Sit:
1. Hold a treat just above the nose.
2. Move it slightly back over the head.
3. Mark and reward the moment the rear touches the floor.
4. Add the word "sit" only after the behavior is reliable.

Down: lure from a sit with the treat moving down and forward along the floor.

Stay:
• Start with one second, then reward.
• Add duration, then distance, then distractions — one at a time.
• Return to the dog to reward instead of calling it out of the stay.

Try this today: practice three repetitions of sit and reward each one.`,
      },
      {
        title: "Recall and loose-leash walking",
        durationMinutes: 4,
        contentBody: `Recall keeps your dog safe. Never punish a dog for coming to you, even if it took a while.

Recall practice:
• Say the name, then the cue "come" in a happy voice.
• Reward generously every time.
• Start indoors, then move to a fenced area, then a quiet park.
• Use a long line instead of a retractable leash in open areas.

Loose-leash walking:
• Reward the dog for walking beside you.
• Stop moving when the leash tightens; move again when it loosens.
• Keep walks interesting with sniff breaks.
• Never yank or jerk the leash.

Try this today: reward your dog every time it checks in with you on a walk.`,
      },
      {
        title: "Crate and house training",
        durationMinutes: 3,
        contentBody: `A crate should be a safe den, never a punishment.

Crate basics:
• Leave the door open and feed meals inside.
• Add a soft bed and a safe chew toy.
• Close the door for seconds, then minutes, and reward calm behavior.
• Never use the crate to punish or for long confinement.

House training:
• Take the puppy out often — after meals, naps, and play.
• Reward outside immediately.
• Clean accidents with an enzyme cleaner and supervise indoors.
• Do not rub the dog's nose in accidents.

Try this today: feed one meal inside the crate with the door open.`,
      },
      {
        title: "Socialization and manners",
        durationMinutes: 3,
        contentBody: `Socialization means positive, gradual exposure — not flooding.

• Introduce new people, sounds, surfaces, and friendly animals one at a time.
• Keep experiences short and rewarding; stop before the dog is overwhelmed.
• Let the dog choose distance and approach at its own pace.
• Practice polite greetings: sit before meeting people, no jumping.
• Manage resource guarding by trading rather than snatching.

Puppies have an important socialization window, but adult dogs can still learn with patience.

Try this today: introduce one new safe object or surface and reward calm curiosity.`,
      },
    ],
    questions: [
      {
        questionText: "When should a reward be given during training?",
        options: [
          "A few minutes after the behavior",
          "Immediately after the behavior",
          "Only at the end of the day",
          "Only when the dog begs",
        ],
        correctOption: 1,
        explanation: "Rewards must be timely so the dog connects the reward with the behavior.",
      },
      {
        questionText: "Which tool is appropriate for basic training?",
        options: ["A choke chain", "A clicker or marker word with treats", "A rolled newspaper", "An alpha roll"],
        correctOption: 1,
        explanation:
          "Force-free training uses markers and rewards. Aversive tools increase fear and are not recommended.",
      },
      {
        questionText: "How should you start teaching stay?",
        options: [
          "With one second, then reward",
          "By leaving the dog for an hour",
          "By shouting if it moves",
          "Only outdoors near traffic",
        ],
        correctOption: 0,
        explanation: "Build duration gradually, starting with a moment of success.",
      },
      {
        questionText: "What should you do if the leash tightens during a walk?",
        options: [
          "Yank the leash",
          "Stop moving until it loosens",
          "Run faster",
          "Pick up the dog",
        ],
        correctOption: 1,
        explanation:
          "Stopping removes the reward of forward movement and teaches the dog that a loose leash works.",
      },
      {
        questionText: "What is the crate used for in training?",
        options: [
          "Punishment",
          "A safe resting space",
          "All-day confinement",
          "Storing food",
        ],
        correctOption: 1,
        explanation: "A crate should be a positive, safe den, never a punishment.",
      },
      {
        questionText: "What is the best way to socialize a nervous dog?",
        options: [
          "Force it into a crowd",
          "Gradual, positive exposure at the dog's pace",
          "Ignore all new experiences",
          "Punish fear",
        ],
        correctOption: 1,
        explanation: "Gradual exposure builds confidence; flooding can make fear worse.",
      },
    ],
  },
  {
    title: "Understanding Cat Behavior & Care",
    category: "cat_behavior",
    description:
      "Learn how cats communicate, what stress looks like, and how to set up a home that meets their need to scratch, climb, hide, and play.",
    passingScore: 80,
    lessons: [
      {
        title: "How cats communicate",
        durationMinutes: 4,
        contentBody: `Cats are subtle communicators.

• Tail — upright with a soft curve means friendly; puffed or whipping means fear or overstimulation.
• Ears — forward and relaxed when content; flattened or turned back when worried.
• Pupils — narrow in bright light; wide in dim light or when excited or scared.
• Slow blink — a sign of trust. Try blinking slowly back.
• Vocalizations — meows are mostly for people; hisses and growls mean back off.
• Scent — cats rub their cheeks and chin to mark familiar territory.

Try this today: slow-blink at your cat and see whether it blinks back.`,
      },
      {
        title: "Stress, hiding, and safe spaces",
        durationMinutes: 4,
        contentBody: `Cats feel safer when they can hide, climb, and control their space.

Signs of stress:
• Hiding for long periods
• Over-grooming or bald patches
• Not eating or using the litter box
• Spraying or marking
• Hiding from other cats in the home
• Sudden aggression when touched

Set up the home with:
• At least one quiet hiding spot per cat
• Vertical space: shelves, cat trees, or window perches
• Separate feeding, water, and litter areas
• More than one litter box when there are multiple cats

Try this today: create one quiet, elevated resting spot and leave it undisturbed.`,
      },
      {
        title: "Scratching and play",
        durationMinutes: 3,
        contentBody: `Scratching is normal — it stretches muscles, sheds claws, and marks territory.

Support it:
• Provide sturdy posts that do not wobble.
• Offer sisal, cardboard, and carpet textures.
• Place posts near sleeping areas and doorways.
• Reward use with praise or a treat.
• Trim nails gently and never declaw.

Play:
• Use wand toys that mimic prey.
• Let the cat catch and "kill" the toy at the end.
• Avoid hands as toys — it teaches biting.
• Two or three short sessions a day keep cats active and happy.

Try this today: play with your cat for five minutes and end with a successful catch.`,
      },
      {
        title: "Litter box and feeding basics",
        durationMinutes: 3,
        contentBody: `Litter box rules:
• One box per cat, plus one extra.
• Scoop daily and wash the box weekly.
• Place boxes away from food and noisy appliances.
• Most cats prefer unscented, fine clumping litter.
• Never punish a cat for accidents — check for illness or stress first.

Feeding:
• Cats are obligate carnivores; choose a complete cat food.
• Wet food supports hydration.
• Provide fresh water away from the food bowl.
• Feed measured portions at consistent times.
• Avoid sudden diet changes.

Try this today: count your litter boxes and clean one extra today.`,
      },
      {
        title: "Handling and vet visits",
        durationMinutes: 3,
        contentBody: `Low-stress handling makes vet visits easier for everyone.

• Leave the carrier out at home so it is familiar.
• Place a blanket and treats inside; never force the cat in at the last minute.
• Support the chest and hindquarters when lifting.
• Approach calmly and avoid sudden grabbing.
• Watch for pain signs: hiding, hunched posture, growling when touched, or reduced appetite.

Regular wellness checks help catch illness early. Ask your vet about vaccines, deworming, and spay/neuter.

Try this today: put the carrier in a quiet room with a treat and leave the door open.`,
      },
    ],
    questions: [
      {
        questionText: "What does a slow blink from a cat usually mean?",
        options: ["Aggression", "Trust and relaxation", "Hunger", "Illness"],
        correctOption: 1,
        explanation: "A slow blink is a friendly signal. Blinking back can build trust.",
      },
      {
        questionText: "How many litter boxes should a household with two cats have?",
        options: ["One", "Two", "Three", "None"],
        correctOption: 2,
        explanation: "The guideline is one box per cat plus one extra.",
      },
      {
        questionText: "Why do cats scratch?",
        options: [
          "To destroy furniture",
          "To stretch, shed claws, and mark territory",
          "Only out of anger",
          "Because they dislike their owner",
        ],
        correctOption: 1,
        explanation: "Scratching is normal behavior with physical and social purposes.",
      },
      {
        questionText: "Which is a sign of stress in a cat?",
        options: ["Slow blinking", "Hiding for long periods", "Play bowing", "Sleeping in a sunny spot"],
        correctOption: 1,
        explanation: "Prolonged hiding, appetite changes, and over-grooming can signal stress or illness.",
      },
      {
        questionText: "What is the best way to prepare a cat for a vet visit?",
        options: [
          "Force it into the carrier at the door",
          "Leave the carrier out at home so it feels familiar",
          "Skip the visit unless the cat is bleeding",
          "Punish it for hiding",
        ],
        correctOption: 1,
        explanation: "Familiar carrier training reduces fear and makes handling safer.",
      },
    ],
  },
  {
    title: "Health, Safety & Community Awareness",
    category: "health_care",
    description:
      "Vaccination, spay/neuter, parasite prevention, emergency signs, and the animal welfare laws that protect pets in the Philippines.",
    passingScore: 80,
    lessons: [
      {
        title: "Vaccination and anti-rabies",
        durationMinutes: 4,
        contentBody: `Vaccines protect both animals and people.

Core care for dogs:
• Anti-rabies vaccination, then boosters as advised by your vet.
• Distemper, parvovirus, and other core vaccines.
• Deworming on a schedule.

Core care for cats:
• Anti-rabies vaccination.
• Feline core vaccines such as panleukopenia and respiratory viruses.
• Deworming and flea/tick prevention.

Republic Act 9482, the Anti-Rabies Act of 2007, places duties on pet owners, including vaccination of dogs and proper handling after a bite. If a person is bitten, wash the wound with soap and water and seek medical care immediately.

Try this today: check your pet's vaccination record and note the next due date.`,
      },
      {
        title: "Spay, neuter, and population control",
        durationMinutes: 3,
        contentBody: `Spaying and neutering prevent unwanted litters and improve health.

Benefits:
• Fewer stray and abandoned animals
• Lower risk of some cancers and infections
• Less roaming, fighting, and marking
• Easier, calmer behavior in many pets

Common myths:
• "It makes pets fat" — weight depends mainly on food and activity.
• "Females should have one litter first" — not medically necessary.
• "It changes personality" — it reduces hormone-driven stress, not identity.

After surgery, provide a clean, quiet recovery space and follow the vet's instructions.

Try this today: ask your barangay or vet about low-cost spay/neuter programs.`,
      },
      {
        title: "Parasites and grooming",
        durationMinutes: 3,
        contentBody: `Parasites are common but preventable.

• Deworm regularly, especially for puppies and kittens.
• Use veterinarian-approved flea and tick prevention.
• Check ears for dirt, odor, or mites.
• Bathe as needed with pet-safe shampoo; do not over-bathe.
• Trim nails gently, avoiding the quick.
• Brush coats regularly, more often for long-haired animals.
• Wash bedding and food bowls often.

Ticks and fleas can spread disease, and some parasites can affect people. Keep pets and living areas clean.

Try this today: inspect your pet's ears, coat, and paws for parasites or irritation.`,
      },
      {
        title: "Recognizing illness and emergencies",
        durationMinutes: 4,
        contentBody: `Know the signs that need prompt veterinary care.

Warning signs:
• Not eating or drinking for more than a day
• Vomiting or diarrhea that continues
• Difficulty breathing, coughing, or pale gums
• Weakness, collapse, or seizures
• Straining to urinate — especially in male cats
• Sudden swelling, bleeding, or suspected poisoning
• Fever, shaking, or a hunched posture

First steps:
1. Stay calm and keep the animal warm and confined.
2. Call the nearest vet clinic and describe the symptoms.
3. Do not give human medicine unless a vet instructs you.
4. Transport safely in a carrier or with a secure leash.

Try this today: save the nearest emergency vet clinic's number in your phone.`,
      },
      {
        title: "Animal welfare law and reporting",
        durationMinutes: 4,
        contentBody: `Philippine law protects animals from cruelty and neglect.

Republic Act 8485, the Animal Welfare Act, as amended by RA 10631, prohibits:
• Torture, neglect, and abandonment
• Keeping animals in cruel conditions
• Using animals for fighting or illegal gambling
• Killing or injuring animals without justification

How to report:
• Document what you see — photos, location, date, and time.
• Report to your barangay or local animal welfare officer.
• Contact FuRescue or a reputable rescue group for assistance.
• Never confront a violent or armed person yourself.

Reporting is caring. It helps stop suffering and connects animals to care.

Try this today: save your barangay's contact and FuRescue's reporting channel.`,
      },
      {
        title: "Being a responsible community member",
        durationMinutes: 3,
        contentBody: `Good pet care extends beyond your own home.

• Keep dogs leashed in public and clean up after them.
• Prevent barking that disturbs neighbors by addressing boredom and stress.
• Do not feed strays irresponsibly — support managed feeding and sterilization instead.
• Respect local ordinances on pets and sanitation.
• Teach children to be gentle and to ask before approaching animals.
• Volunteer, donate, or foster when you can.
• Choose adoption and responsible rehoming over buying or abandoning.

A caring community keeps animals safer and reduces the number of strays on the street.

Try this today: share one thing you learned with a neighbor or family member.`,
      },
    ],
    questions: [
      {
        questionText: "Which law is the Anti-Rabies Act of 2007 in the Philippines?",
        options: ["RA 8485", "RA 9482", "RA 10631", "RA 9003"],
        correctOption: 1,
        explanation: "RA 9482 is the Anti-Rabies Act of 2007.",
      },
      {
        questionText: "What should you do right after an animal bite?",
        options: [
          "Ignore it",
          "Wash the wound with soap and water and seek medical care",
          "Apply human medicine without advice",
          "Wait a week",
        ],
        correctOption: 1,
        explanation:
          "Immediate wound washing and medical care are essential to prevent rabies.",
      },
      {
        questionText: "Which is a benefit of spay/neuter?",
        options: [
          "More stray animals",
          "Fewer unwanted litters and better health",
          "Guaranteed weight gain",
          "A change in the animal's identity",
        ],
        correctOption: 1,
        explanation: "Spay/neuter reduces overpopulation and lowers some health risks.",
      },
      {
        questionText: "Which sign needs urgent veterinary care?",
        options: ["Sleeping after play", "Straining to urinate", "Eating breakfast", "Purring"],
        correctOption: 1,
        explanation:
          "Straining to urinate, especially in male cats, can be a life-threatening emergency.",
      },
      {
        questionText: "What law protects animals from cruelty and neglect?",
        options: [
          "RA 8485, the Animal Welfare Act",
          "RA 9482 only",
          "The Clean Air Act",
          "No law exists",
        ],
        correctOption: 0,
        explanation:
          "RA 8485, as amended by RA 10631, prohibits animal cruelty and neglect.",
      },
      {
        questionText: "What is the responsible way to handle stray animals?",
        options: [
          "Chase them away",
          "Report to the barangay or a rescue group",
          "Feed them only once and forget them",
          "Catch them without experience",
        ],
        correctOption: 1,
        explanation:
          "Reporting and supporting managed care and sterilization is safer for animals and people.",
      },
      {
        questionText: "How can you help reduce the stray population?",
        options: [
          "Abandon unwanted pets",
          "Spay/neuter and support responsible adoption",
          "Feed strays without sterilization",
          "Breed pets for sale",
        ],
        correctOption: 1,
        explanation: "Spay/neuter and adoption directly reduce unwanted animals on the street.",
      },
      {
        questionText: "Which is NOT recommended when reporting animal cruelty?",
        options: [
          "Documenting details",
          "Confronting an armed person alone",
          "Contacting the barangay",
          "Contacting a rescue group",
        ],
        correctOption: 1,
        explanation:
          "Never put yourself in danger. Report to authorities and let them handle the situation.",
      },
    ],
  },
];

async function main() {
  const adminRole = await prisma.role.findFirst({ where: { roleName: "admin" } });
  const admin = adminRole
    ? await prisma.user.findFirst({
        where: { roleId: adminRole.id, deletedAt: null },
        select: { id: true },
      })
    : null;

  let created = 0;
  let skipped = 0;

  for (const course of COURSES) {
    const existing = await prisma.learningModule.findFirst({
      where: { title: course.title, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.learningModule.create({
      data: {
        title: course.title,
        category: course.category,
        description: course.description,
        isPublished: true,
        createdBy: admin?.id ?? null,
        lessons: {
          create: course.lessons.map((lesson, index) => ({
            title: lesson.title,
            contentType: "text",
            contentBody: lesson.contentBody,
            durationMinutes: lesson.durationMinutes,
            sortOrder: index,
          })),
        },
      },
    });
    created += 1;
  }

  // Courses no longer include quizzes; remove any legacy rows for seeded courses.
  await prisma.quiz.deleteMany({
    where: { module: { title: { in: COURSES.map((course) => course.title) } } },
  });

  console.log(
    `Learning catalog seeded: ${created} created, ${skipped} already present.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
