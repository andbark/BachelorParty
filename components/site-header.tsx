"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-provider"
import { Beer, Users, Trophy, History } from "lucide-react"

export default function SiteHeader() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Beer className="h-6 w-6" />
            <span className="font-bold hidden md:inline-block">Bachelor Party Tracker</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Button
            variant="ghost"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setActiveTab("dashboard")}
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden md:inline-block">Players</span>
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setActiveTab("games")}
          >
            <Beer className="h-4 w-4 mr-2" />
            <span className="hidden md:inline-block">Games</span>
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setActiveTab("leaderboard")}
          >
            <Trophy className="h-4 w-4 mr-2" />
            <span className="hidden md:inline-block">Leaderboard</span>
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setActiveTab("history")}
          >
            <History className="h-4 w-4 mr-2" />
            <span className="hidden md:inline-block">History</span>
          </Button>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
