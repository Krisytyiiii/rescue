import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Noun shown after the total, e.g. "animals". Defaults to "items". */
  itemLabel?: string;
  /** Client-side pagination handler. Omit when using `hrefForPage`. */
  onPageChange?: (page: number) => void;
  /** URL-driven pagination (server components). Omit when using `onPageChange`. */
  hrefForPage?: (page: number) => string;
  className?: string;
}

const BASE_CLASS =
  "inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors";
const DISABLED_CLASS =
  "inline-flex h-8 items-center rounded-lg border border-ink/[0.06] px-3 text-[0.75rem] font-medium text-ink/25";

/**
 * Shared admin pagination footer. It renders nothing unless there is more than
 * one page of data (i.e. the list is larger than `pageSize`).
 *
 * Use `onPageChange` for in-memory lists, or `hrefForPage` for URL-driven lists
 * rendered from a server component.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel = "items",
  onPageChange,
  hrefForPage,
  className = "",
}: PaginationProps) {
  if (total <= pageSize || totalPages <= 1) return null;

  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <p className="text-[0.75rem] text-ink/45">
        Page {page} of {totalPages} · {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <PaginationControl
          label="Previous"
          disabled={!canPrevious}
          page={page - 1}
          onPageChange={onPageChange}
          hrefForPage={hrefForPage}
        />
        <PaginationControl
          label="Next"
          next
          disabled={!canNext}
          page={page + 1}
          onPageChange={onPageChange}
          hrefForPage={hrefForPage}
        />
      </div>
    </div>
  );
}

function PaginationControl({
  label,
  page,
  disabled,
  next = false,
  onPageChange,
  hrefForPage,
}: {
  label: string;
  page: number;
  disabled: boolean;
  next?: boolean;
  onPageChange?: (page: number) => void;
  hrefForPage?: (page: number) => string;
}) {
  const content = (
    <>
      {label}
      {next && <ArrowUpRight className="h-3 w-3" strokeWidth={2} />}
    </>
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className={DISABLED_CLASS}>
        {content}
      </span>
    );
  }

  if (hrefForPage) {
    return (
      <Link href={hrefForPage(page)} className={`${BASE_CLASS} hover:border-ink/20 hover:text-ink`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPageChange?.(page)}
      className={`${BASE_CLASS} hover:border-ink/20 hover:text-ink`}
    >
      {content}
    </button>
  );
}
