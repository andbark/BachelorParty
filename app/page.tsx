"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { subscribeToPlayers, subscribeToGames, subscribeToGameHistory, subscribeToTeams } from "@/lib/realtime"

// Import existing components
import PlayerBalances from "@/components/playerbalances"
import Leaderboard from "@/components/leaderboard"
import GameHistory from "@/components/game-history"
import SiteHeader from "@/components/site-header"

// Import new components
import Teams from "@/components/teams"
import CreateGame from "@/components/create-game"
import CompleteGame from "@/components/complete-game"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to real-time updates
    const playersSubscription = subscribeToPlayers(() => {
      // This will be called whenever players data changes
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

      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Bachelor Party Tracker</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <CreateGame />
            <CompleteGame />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <PlayerBalances />
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Teams />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <GameHistory />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

