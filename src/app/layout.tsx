import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { HeaderBreadcrumb } from "@/components/layouts/HeaderBreadcrumb";
import { ModeToggle } from "@/components/layouts/ModeToggle";
import { ThemeProvider } from "@/components/layouts/ThemeProvider";
import { Separator } from "@/components/ui/Separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/Sidebar";
import { Toaster } from "@/components/ui/Sonner";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description:
    "Manage customers, track relationships, and stay on top of contact history — a modern CRM dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                    />
                    <HeaderBreadcrumb />
                  </div>
                  <ModeToggle className="ml-auto pr-4" />
                </header>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
