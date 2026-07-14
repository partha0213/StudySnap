import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudySnap — Photo to Explanation + Quiz",
  description:
    "Snap a photo of any confusing study material and get a clear explanation with an interactive quiz. Powered by Gemini AI.",
  keywords: [
    "study",
    "AI tutor",
    "Gemini",
    "photo explanation",
    "quiz generator",
    "education",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
