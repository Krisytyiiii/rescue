"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PawMark, Wordmark } from "@/components/brand";
import { navLinks } from "@/lib/site";

export function SiteHeader() {
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-clay"
        style={{ scaleX: scrollYProgress }}
      />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled
            ? "border-b border-ink/10 bg-paper/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-[84px] lg:px-12">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="FuRescue home"
          >
            <PawMark className="h-8 w-8 text-ink transition-transform duration-500 group-hover:-rotate-6" />
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="link-line label !tracking-[0.13em] text-ink/70 transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full px-4 text-[0.8125rem] font-medium text-ink/75 transition-colors hover:text-ink sm:inline-flex"
            >
              Log in
            </Link>
            <a
              href="#support"
              className="hidden h-10 items-center gap-1.5 rounded-full border border-ink/15 px-5 text-[0.8125rem] font-medium transition-colors hover:border-ink/40 hover:bg-ink/[0.03] sm:inline-flex"
            >
              Donate
            </a>
            <a
              href="#adopt"
              className="group hidden h-10 items-center gap-1.5 rounded-full bg-ink pl-5 pr-3 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-moss sm:inline-flex"
            >
              Adopt a pet
              <span className="grid h-6 w-6 place-items-center rounded-full bg-paper/10 transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-4.5 w-4.5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-paper px-5 py-5 lg:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <PawMark className="h-8 w-8 text-ink" />
                <Wordmark />
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/15"
                aria-label="Close menu"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.6} />
              </button>
            </div>

            <nav
              className="mt-12 flex flex-1 flex-col"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline justify-between border-b border-ink/10 py-5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.05 }}
                >
                  <span className="font-display text-4xl tracking-[-0.02em]">
                    {link.label}
                  </span>
                  <span className="label text-ink/40">0{index + 1}</span>
                </motion.a>
              ))}
            </nav>

            <div className="space-y-3 pb-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-full border border-ink/20 text-sm font-medium"
              >
                Log in
              </Link>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a
                  href="#adopt"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-between rounded-full bg-ink px-6 text-sm font-medium text-paper"
                >
                  Meet the rescues
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a
                  href="#support"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center rounded-full border border-ink/20 px-6 text-sm font-medium"
                >
                  Donate
                </a>
              </div>
              <p className="label text-center !tracking-[0.1em] text-ink/45">
                Mati City · Davao Oriental
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
