export type HeroStat = {
  value: number;
  label: string;
  suffix: string;
};

export type RescuerProfile = {
  id: string;
  name: string;
  photo: string | null;
  barangay: string;
  rescues: number;
  memberSince: string;
};

export type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: string;
  sex: string;
  size: string;
  image: string | null;
  alt: string;
  status: "Ready for adoption" | "Reserved";
  tags: string[];
  note: string;
  story: string;
  barangay: string;
};

export const navLinks = [
  { label: "Adopt", href: "#adopt" },
  { label: "Our work", href: "#work" },
  { label: "Rescuers", href: "#rescuers" },
  { label: "Field notes", href: "#stories" },
];

export const steps = [
  {
    index: "01",
    title: "Report & rescue",
    icon: "siren" as const,
    copy: "A call comes in from a barangay, a market, or a beach. We log it, load the kit, and go. Every animal gets a name, a photo, and an open file from day one.",
  },
  {
    index: "02",
    title: "Treat & rehabilitate",
    icon: "stethoscope" as const,
    copy: "Partner vets handle vaccinations, sterilization, and recovery. Foster homes give each animal the quiet months they need to trust people again.",
  },
  {
    index: "03",
    title: "Match & rehome",
    icon: "house" as const,
    copy: "We screen every adopter, run home visits, and stay in touch long after the gate closes. No animal leaves without a plan — and a return promise.",
  },
];
