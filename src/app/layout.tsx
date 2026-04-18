import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataStruct | Validador de Dados Históricos",
  description: "Estruturação e validação premium de dados históricos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen pt-24 pb-12`}>
        <Navbar />
        <main className="container mx-auto px-6 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  );
}
