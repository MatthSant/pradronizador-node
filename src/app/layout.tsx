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
      <body className={`${inter.className} min-h-screen pt-12 pb-12 bg-[#f8f6ff]`}>
        <Navbar />
        <main className="w-full px-4 md:px-10 max-w-[1700px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
