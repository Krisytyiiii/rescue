import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const instrumentItalic = Instrument_Serif({
  variable: "--font-instrument-serif-italic",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

export const metadata: Metadata = {
  title: "FuRescue — Every animal deserves a way home",
  description:
    "FuRescue is a volunteer-run animal rescue and adoption network in Mati City, Davao Oriental. Rescue, rehabilitate, rehome.",
  keywords: [
    "FuRescue",
    "animal rescue",
    "pet adoption",
    "Mati City",
    "Davao Oriental",
    "aspin",
    "animal shelter Philippines",
  ],
  openGraph: {
    title: "FuRescue — Every animal deserves a way home",
    description:
      "Rescue, rehabilitate, rehome. A volunteer-run animal rescue and adoption network in Mati City, Davao Oriental.",
    siteName: "FuRescue",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FuRescue — Every animal deserves a way home",
    description:
      "Rescue, rehabilitate, rehome. A volunteer-run animal rescue network in Mati City.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${instrumentItalic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
