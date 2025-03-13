"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserIcon, Dice1Icon as DiceIcon, TrophyIcon, SunIcon, MoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

export function SiteHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Bachelor Party Tracker</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 ml-auto">
          <Button variant="ghost" asChild>
            <Link href="/players" className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>Players</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/games" className="flex items-center">
              <DiceIcon className="h-4 w-4 mr-2" />
              <span>Games</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/leaderboard" className="flex items-center">
              <TrophyIcon className="h-4 w-4 mr-2" />
              <span>Leaderboard</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
