export type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: string;
  sex: "Female" | "Male";
  size: string;
  image: string;
  alt: string;
  status: "Ready for adoption" | "Foster needed" | "Reserved";
  tags: string[];
  note: string;
  story: string;
  barangay: string;
};

export const navLinks = [
  { label: "Adopt", href: "#adopt" },
  { label: "Our work", href: "#work" },
  { label: "Field notes", href: "#stories" },
  { label: "Support", href: "#support" },
];

export const heroStats = [
  { value: 1284, label: "Animals rescued", suffix: "" },
  { value: 916, label: "Found families", suffix: "" },
  { value: 46, label: "Foster homes", suffix: "" },
];

export const pets: Pet[] = [
  {
    id: "tala",
    name: "Tala",
    species: "dog",
    breed: "Aspin",
    age: "2 years",
    sex: "Female",
    size: "Medium · 12 kg",
    image: "/images/pet-5.jpg",
    alt: "Tala, a beagle-mix rescue dog, smiling at the camera",
    status: "Ready for adoption",
    tags: ["Vaccinated", "Spayed", "Good with kids"],
    note: "Sleeps through thunderstorms. Will accept payment in belly rubs.",
    story:
      "Tala was found tied to a fence near the Mati public market during a downpour. She spent her first month at the clinic learning that hands could be kind. Now she walks politely on a leash, sits for treats, and has decided that every visitor is here specifically to see her.",
    barangay: "Barangay Central",
  },
  {
    id: "pancit",
    name: "Pancit",
    species: "cat",
    breed: "Domestic shorthair",
    age: "3 years",
    sex: "Male",
    size: "Small · 4 kg",
    image: "/images/pet-10.jpg",
    alt: "Pancit, a black and white rescue cat, resting on a bamboo rail",
    status: "Ready for adoption",
    tags: ["Vaccinated", "Neutered", "Litter-trained"],
    note: "A conversationalist. Has opinions about breakfast timing.",
    story:
      "Pancit turned up at a carinderia in Dahican and charmed the entire kitchen staff into sharing fish. He is calm around dogs, tidy with his litter box, and prefers to supervise household chores from the highest available surface.",
    barangay: "Dahican",
  },
  {
    id: "luna",
    name: "Luna",
    species: "cat",
    breed: "Domestic longhair",
    age: "1 year",
    sex: "Female",
    size: "Small · 3.5 kg",
    image: "/images/pet-11.jpg",
    alt: "Luna, a fluffy grey and white rescue cat, with a butterfly on her nose",
    status: "Reserved",
    tags: ["Vaccinated", "Spayed", "Quiet home"],
    note: "Spends her afternoons in sunbeams. Butterfly optional.",
    story:
      "Luna was the last of a litter born under a tricycle in Barangay Matiao. She is shy for the first ten minutes and devoted for the next ten years. Her new family is completing a home visit this week — we are keeping our fingers crossed.",
    barangay: "Matiao",
  },
  {
    id: "pepper",
    name: "Pepper",
    species: "dog",
    breed: "Aspin",
    age: "4 months",
    sex: "Male",
    size: "Small · 5 kg",
    image: "/images/pet-8.jpg",
    alt: "Pepper, a tan and white rescue puppy, sitting against an orange backdrop",
    status: "Foster needed",
    tags: ["Vaccinated", "Puppy", "Needs company"],
    note: "A four-month-old with the energy of a small fiesta.",
    story:
      "Pepper was found in a rice sack on the roadside in Bobon, the only survivor of his litter. He is healthy now, vaccinated, and absolutely certain that every human is his best friend. He needs a foster home with someone around during the day while we find his forever family.",
    barangay: "Bobon",
  },
  {
    id: "coco",
    name: "Coco",
    species: "dog",
    breed: "French bulldog mix",
    age: "2 years",
    sex: "Male",
    size: "Small · 9 kg",
    image: "/images/pet-12.jpg",
    alt: "Coco, a tan French bulldog mix, posing in a yellow sweater",
    status: "Ready for adoption",
    tags: ["Vaccinated", "Neutered", "Apartment-friendly"],
    note: "Wears a sweater better than most people. Snores beautifully.",
    story:
      "Coco was surrendered by a family who could no longer keep him. He is house-trained, walks well, and has never met a couch he did not immediately claim. He would do best as the only dog in a calm household.",
    barangay: "Barangay Central",
  },
  {
    id: "nala",
    name: "Nala",
    species: "cat",
    breed: "Domestic shorthair",
    age: "2 years",
    sex: "Female",
    size: "Small · 3.8 kg",
    image: "/images/pet-9.jpg",
    alt: "Nala, a tabby rescue cat, sitting on a sunlit staircase",
    status: "Ready for adoption",
    tags: ["Vaccinated", "Spayed", "Bonded pair"],
    note: "Graceful, curious, and slightly dramatic about dinner.",
    story:
      "Nala arrived with her brother after their colony was displaced by a road widening in Sainz. She is social, playful, and would love to be adopted with a feline friend — or into a home with a patient resident cat.",
    barangay: "Sainz",
  },
];

export const steps = [
  {
    index: "01",
    title: "Report & rescue",
    icon: "siren" as const,
    copy: "A call comes in from a barangay, a market, or a beach. We log it, load the kit, and go. Every animal gets a name, a photo, and an open file from day one.",
    detail: "Average response time: 3.5 hours",
  },
  {
    index: "02",
    title: "Treat & rehabilitate",
    icon: "stethoscope" as const,
    copy: "Partner vets handle vaccinations, sterilization, and recovery. Foster homes give each animal the quiet months they need to trust people again.",
    detail: "1,180+ animals treated in 2025",
  },
  {
    index: "03",
    title: "Match & rehome",
    icon: "house" as const,
    copy: "We screen every adopter, run home visits, and stay in touch long after the gate closes. No animal leaves without a plan — and a return promise.",
    detail: "93% of adoptions remain stable",
  },
];

export const fieldNotes = [
  {
    id: "migo",
    image: "/images/pet-3.jpg",
    alt: "Migo, a chocolate brown rescue dog, licking his nose",
    tag: "Adopted · March 2026",
    title: "Found under a jeepney. Now he owns the beach.",
    copy: "Migo was eight weeks old and too weak to stand when a driver flagged us down on the highway. Last month his family sent us a video of him sprinting through the sand at Dahican.",
    meta: "Migo · Aspin · Mati City",
  },
  {
    id: "luna-letter",
    image: "/images/pet-11.jpg",
    alt: "Luna, a long-haired rescue cat, in warm evening light",
    tag: "Foster win · February 2026",
    title: "Four months of hiding. Then, a lap.",
    copy: "Luna came to us shut down and silent. Her foster family did nothing dramatic — just fed her, sat nearby, and waited. On a Tuesday she climbed onto the sofa and fell asleep.",
    meta: "Luna · Domestic longhair · Matiao",
  },
  {
    id: "community",
    image: "/images/pet-4.jpg",
    alt: "A rescue cat and dog resting together in a garden",
    tag: "Community · 2026",
    title: "The quiet work of opening a door.",
    copy: "Forty-six households in Mati City now foster for us. Some take one animal, some take five. All of them make a city where fewer animals wake up alone.",
    meta: "Foster network · Davao Oriental",
  },
];

export const testimonials = [
  {
    quote:
      "They didn't just hand us a dog. They checked in for months, answered every anxious text, and helped us become the family Tala needed.",
    name: "Ana & Paul",
    role: "Adopted Tala · Barangay Central",
  },
  {
    quote:
      "I started as a volunteer driver for one weekend. That was two years ago. The way this team shows up for animals here — it changes how you see the whole city.",
    name: "Jessa M.",
    role: "Rescue driver & foster · Dahican",
  },
];
