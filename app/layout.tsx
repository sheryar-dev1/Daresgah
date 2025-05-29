import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../src/context/AuthContext";
import ClientWrapper from "../src/components/ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School Management System",
  description: "A comprehensive school management system with role-based access control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientWrapper>
            {children}
            <Toaster position="top-right" />
          </ClientWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
