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
      <body className={inter.className + " pt-9 flex flex-col min-h-screen"}
      style={{ fontFamily: "'Inter', 'Noto Sans TC', 'sans-serif'" }}
      >
        <AuthProvider>
          <LoadingProvider>
            <TripProvider>
            
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          
            <footer className="p-1 sm:p-3  text-xs sm:text-base  w-full bg-custom-kame text-custom-dark-green opacity-40 sm:opacity-100 text-center mt-auto">
              <div>Copyright @2024 WeHelp #5 Drag to Travel</div>
            </footer>
            </TripProvider>
          </LoadingProvider>
          
        </AuthProvider>
      </body>
    </html>
  );
}
