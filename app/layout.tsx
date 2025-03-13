import type React from "react"
import "./globals.css"

export const metadata = {
  title: "Bachelor Party Tracker",
  description: "Track games and balances for your bachelor party",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

