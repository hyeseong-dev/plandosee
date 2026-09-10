import type { Metadata } from "next";
import type { ReactNode } from "react";
import "wanted-sans/fonts/webfonts/variable/complete/WantedSansVariable.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "plandosee — 계획과 실제를 잇는 기록",
  description: "계획, 실행, 돌아보기를 한 흐름으로 기록하는 작은 정원",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
