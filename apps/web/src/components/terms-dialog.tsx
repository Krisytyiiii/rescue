"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "1. Community conduct",
    body: "Treat residents, rescuers, adopters, and animals with respect. Reports must be truthful and based on something you personally observed. False, malicious, or duplicate reports can lead to suspension.",
  },
  {
    title: "2. Reporting and field work",
    body: "Share accurate locations and photos for stray, injured, or abandoned animals. Rescuers may only accept assignments they can carry out safely and must record status updates honestly.",
  },
  {
    title: "3. Adoption guidelines",
    body: "Adoption applications are reviewed by the City Vet team. Animals are not property: approved adopters agree to provide food, shelter, veterinary care, and a safe environment, and to allow follow-up welfare checks.",
  },
  {
    title: "4. Privacy and media",
    body: "Do not upload other people's IDs or private details. Photos of animals are shared with the rescue team and may appear on public listings. Personal data is handled under the Data Privacy Act (RA 10173).",
  },
  {
    title: "5. Account approval and enforcement",
    body: "Resident accounts are active immediately. Rescuer accounts require administrator approval. Violations may result in warnings, suspension, or deactivation of your account.",
  },
];

export function TermsDialog({ open, onClose }: TermsDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="group flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
          <div>
            <p className="label text-clay">Volunteer agreement</p>
            <h2 id="terms-title" className="mt-1.5 font-display text-2xl text-ink">
              Code of conduct &amp; adoption guidelines
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="scrollbar-on-hover overflow-y-auto px-6 py-5">
          <p className="text-[0.875rem] leading-[1.7] text-ink/65">
            FuRescue is run by volunteers and the City Vet office of Mati City.
            By creating an account you agree to the following.
          </p>

          <div className="mt-5 space-y-4">
            {sections.map((section) => (
              <section key={section.title}>
                <h3 className="text-[0.875rem] font-semibold text-ink">{section.title}</h3>
                <p className="mt-1 text-[0.8125rem] leading-[1.7] text-ink/60">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-ink/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-full bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss"
          >
            I understand
          </button>
        </footer>
      </div>
    </div>
  );
}
