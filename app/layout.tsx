import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/app/hooks/use-auth"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "The Network",
  description: "A new way to connect with professionals.",
  generator: 'v0.dev'
}

// Enable dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#374151",
                color: "#f3f4f6",
                border: "1px solid #4b5563",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
