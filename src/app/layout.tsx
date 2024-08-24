import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";
import { TripProvider } from './contexts/TripContext';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from "./contexts/LoadingContext";

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
      <body className={inter.className + " pt-12 flex flex-col min-h-screen"}>
        <AuthProvider>
          <TripProvider>
            <LoadingProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          
            <footer className="w-full bg-custom-kame text-custom-dark-green text-center p-3 mt-auto">
              <div>Copyright @2024 WeHelp #5</div>
            </footer>
            </LoadingProvider>
          </TripProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
