const words = [
  "Rescue",
  "Rehabilitate",
  "Rehome",
  "Repeat",
  "Rescue",
  "Rehabilitate",
  "Rehome",
  "Repeat",
];

export function Marquee() {
  return (
    <div className="marquee border-y border-paper/10 bg-ink py-5 text-paper sm:py-6">
      <div className="marquee-track">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className="flex items-center gap-12">
            <span className="font-display text-[1.6rem] tracking-[-0.01em] sm:text-[1.9rem]">
              {word}
            </span>
            <span
              aria-hidden="true"
              className="font-display-italic text-[1.8rem] text-clay-soft"
            >
              ✳
            </span>
          </span>
        ))}
      </div>
      <div className="marquee-track" aria-hidden="true">
        {words.map((word, index) => (
          <span key={`dup-${word}-${index}`} className="flex items-center gap-12">
            <span className="font-display text-[1.6rem] tracking-[-0.01em] sm:text-[1.9rem]">
              {word}
            </span>
            <span className="font-display-italic text-[1.8rem] text-clay-soft">
              ✳
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
