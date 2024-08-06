import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Authmodal from "./components/Authmodal";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "旅遊 X 拖拉",
  description: "Drag to Start Your Travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className + " pt-12"}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
