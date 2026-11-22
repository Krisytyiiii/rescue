/* eslint-disable @next/next/no-img-element */
import { UserRound } from "lucide-react";

/**
 * A user's profile photo in a circle. Falls back to a generic person icon when
 * the account has not attached a photo.
 */
export function UserAvatar({
  src,
  alt = "",
  className = "h-9 w-9",
  rounded = "rounded-full",
  iconClassName = "h-1/2 w-1/2",
  fallbackClassName = "bg-ink/[0.06] text-ink/45",
}: {
  src?: string | null;
  alt?: string;
  /** Sizing and colour utilities for the circle itself. */
  className?: string;
  rounded?: string;
  iconClassName?: string;
  fallbackClassName?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden ${rounded} ${fallbackClassName} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserRound className={iconClassName} strokeWidth={1.8} />
      )}
    </span>
  );
}
