import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

const highlights = [
  {
    icon: HeartHandshake,
    title: "Track your rescues",
    copy: "See every foster, vet visit, and adoption you help make possible.",
  },
  {
    icon: ShieldCheck,
    title: "Safe adoption records",
    copy: "Your applications and home checks stay private to the volunteer team.",
  },
  {
    icon: Sparkles,
    title: "Give with confidence",
    copy: "Follow donations down to the supplies they buy for the shelter.",
  },
];

export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-forest p-12 text-paper lg:order-1 lg:flex lg:flex-col lg:justify-center lg:gap-14">
      <Image
        src="/images/pet-2.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 0px, 50vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-forest/20 via-forest/55 to-forest/95"
      />

      <blockquote className="relative max-w-[26ch] font-display text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.02] tracking-[-0.03em]">
        “One rescue, one foster, one family at a{" "}
        <span className="font-display-italic text-clay-soft">time.</span>”
      </blockquote>

      <ul className="relative grid gap-5">
        {highlights.map(({ icon: Icon, title, copy }) => (
          <li key={title} className="flex gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-paper/20 bg-paper/5">
              <Icon className="h-4 w-4 text-clay-soft" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="mt-1 block max-w-[34ch] text-[0.8125rem] leading-[1.55] text-paper/60">
                {copy}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
