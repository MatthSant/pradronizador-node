import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { PipelineProvider } from "@/providers/PipelineContext";

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
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-[#f8f6ff]`}>
        <PipelineProvider>
          <Navbar />
          <main className="w-full px-4 md:px-10 max-w-[1700px] mx-auto pt-32 pb-20">
            {children}
          </main>
        </PipelineProvider>
      </body>
    </html>
  );
}
