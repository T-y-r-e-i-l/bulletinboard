import type { Metadata } from "next"
import {
  Comic_Neue,
  Geist,
  Geist_Mono,
  Newsreader,
  Oswald,
  Permanent_Marker,
} from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-wall-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-wall-mono",
  subsets: ["latin"],
})

const newsreader = Newsreader({
  variable: "--font-wall-serif",
  subsets: ["latin"],
})

const oswald = Oswald({
  variable: "--font-wall-display",
  subsets: ["latin"],
})

const marker = Permanent_Marker({
  variable: "--font-wall-hand",
  weight: "400",
  subsets: ["latin"],
})

const comic = Comic_Neue({
  variable: "--font-wall-comic",
  weight: ["400", "700"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Publicpaste — today’s wall",
  description: "A public daily bulletin board. Anyone can pin something. It clears at midnight Pacific.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${oswald.variable} ${marker.variable} ${comic.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-hidden bg-background text-foreground">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
