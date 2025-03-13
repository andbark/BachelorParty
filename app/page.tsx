"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { subscribeToPlayers, subscribeToGames, subscribeToGameHistory, subscribeToTeams } from "@/lib/realtime"

// Import components
import PlayerBalances from "@/components/playerbalances"
import Leaderboard from "@/components/leaderboard"
import GameHistory from "@/components/game-history"
import Teams from "@/components/teams"
import SiteHeader from "@/components/site-header"
import CreateGame from "@/components/create-game"
import CompleteGame from "@/components/complete-game"

export default function Home() {
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to real-time updates
    const playersSubscription = subscribeToPlayers(() => {
      toast({
        title: "Players updated",
        description: "Player data has been updated in real-time",
      })
    })

    const gamesSubscription = subscribeToGames(() => {
      toast({
        title: "Games updated",
        description: "Game data has been updated in real-time",
      })
    })

    const historySubscription = subscribeToGameHistory(() => {
      toast({
        title: "Game history updated",
        description: "Game history has been updated in real-time",
      })
    })

    const teamsSubscription = subscribeToTeams(() => {
      toast({
        title: "Teams updated",
        description: "Team data has been updated in real-time",
      })
    })

    // Cleanup subscriptions on unmount
    return () => {
      playersSubscription.unsubscribe()
      gamesSubscription.unsubscribe()
      historySubscription.unsubscribe()
      teamsSubscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 container mx-auto py-6 space-y-8">
        {/* Game Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Bachelor Party Tracker</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <CreateGame />
            <CompleteGame />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Player Balances Section */}
            <section id="players" className="scroll-mt-16">
              <PlayerBalances />
            </section>

            {/* Teams Section */}
            <section id="teams" className="scroll-mt-16">
              <Teams />
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Leaderboard Section */}
            <section id="leaderboard" className="scroll-mt-16">
              <Leaderboard />
            </section>

            {/* Game History Section */}
            <section id="history" className="scroll-mt-16">
              <GameHistory />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
