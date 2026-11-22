import type { ReactNode } from "react";
import Svg, { Circle, Path } from "react-native-svg";

import { Brand } from "@/constants/theme";

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </Svg>
  );
}

export function EyeIcon({
  hidden,
  size = 19,
  color = Brand.ink55,
}: {
  hidden: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {hidden ? (
        <>
          <Path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
          <Path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <Path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <Circle cx="12" cy="12" r="3" />
        </>
      )}
    </Svg>
  );
}

export function CheckIcon({
  size = 14,
  color = Brand.moss,
  strokeWidth = 2.2,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function ArrowUpRightIcon({
  size = 16,
  color = Brand.paper,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M7 17 17 7" />
      <Path d="M7 7h10v10" />
    </Svg>
  );
}

export function BellIcon({
  size = 18,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function StrokeIcon({
  size,
  color,
  strokeWidth = 1.7,
  children,
}: {
  size: number;
  color: string;
  strokeWidth?: number;
  children: ReactNode;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function HomeIcon({
  size = 22,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M3 10.5 12 3l9 7.5" />
      <Path d="M5 9.5V21h14V9.5" />
      <Path d="M9.5 21v-6h5v6" />
    </StrokeIcon>
  );
}

export function CompassIcon({
  size = 22,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </StrokeIcon>
  );
}

export function PlusCircleIcon({
  size = 22,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v8" />
      <Path d="M8 12h8" />
    </StrokeIcon>
  );
}

export function ChatIcon({
  size = 22,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H8l-4 3v-14A2.5 2.5 0 0 1 6.5 3.5h11A2.5 2.5 0 0 1 20 6v8.5Z" />
    </StrokeIcon>
  );
}

export function PersonIcon({
  size = 22,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="12" cy="8" r="3.6" />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </StrokeIcon>
  );
}

export function ChevronLeftIcon({
  size = 18,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m15 6-6 6 6 6" />
    </Svg>
  );
}

export function ChevronDownIcon({
  size = 16,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function MapPinIcon({
  size = 20,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <Circle cx="12" cy="10" r="3" />
    </StrokeIcon>
  );
}

export function PawIcon({
  size = 20,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="6.5" cy="9.5" r="2" />
      <Circle cx="11" cy="5.5" r="2" />
      <Circle cx="15.5" cy="5.5" r="2" />
      <Circle cx="19" cy="9.5" r="2" />
      <Path d="M12.8 11.5c-2.3 0-4.6 2-4.6 4.3 0 1.6 1.2 2.7 2.8 2.7.9 0 1.4-.4 1.8-.4s.9.4 1.8.4c1.6 0 2.8-1.1 2.8-2.7 0-2.3-2.3-4.3-4.6-4.3Z" />
    </StrokeIcon>
  );
}

export function ExpandIcon({
  size = 16,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M9 4H4v5" />
      <Path d="M15 4h5v5" />
      <Path d="M9 20H4v-5" />
      <Path d="M15 20h5v-5" />
    </StrokeIcon>
  );
}

export function CloseIcon({
  size = 18,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="m6 6 12 12" />
      <Path d="M18 6 6 18" />
    </StrokeIcon>
  );
}

export function LocateIcon({
  size = 18,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="12" cy="12" r="6" />
      <Circle cx="12" cy="12" r="1.6" />
      <Path d="M12 2v3" />
      <Path d="M12 19v3" />
      <Path d="M2 12h3" />
      <Path d="M19 12h3" />
    </StrokeIcon>
  );
}

export function SearchIcon({
  size = 18,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="m16 16 4.5 4.5" />
    </StrokeIcon>
  );
}

export function SendIcon({
  size = 18,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M21 3 10 14" />
      <Path d="M21 3 14.5 21 10 14 3 9.5 21 3Z" />
    </StrokeIcon>
  );
}

export function PaperclipIcon({
  size = 18,
  color = Brand.ink55,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7-7" />
    </StrokeIcon>
  );
}
