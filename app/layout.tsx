import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Jashandeep Kaur | AI & Web Developer",
  description: "Personal portfolio of Jashandeep Kaur - AI & Web Developer specializing in RAG systems, Next.js, and full-stack development. Brisbane, Australia.",
  keywords: ["AI Developer", "Web Developer", "RAG Systems", "Next.js", "Full-Stack Developer", "Brisbane", "Jashandeep Kaur"],
  authors: [{ name: "Jashandeep Kaur" }],
  openGraph: {
    title: "Jashandeep Kaur | AI & Web Developer",
    description: "Building intelligent systems that bridge AI and human insight",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        <ThemeProvider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
          <Footer />
          <ChatbotWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
