"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"

interface Player {
  id: string
  name: string
  balance: number
  created_at: string
}

export default function PlayerBalances() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Find the player with the highest balance for progress bar calculation
  const maxBalance = Math.max(...players.map((player) => player.balance), 300)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true)

        const { data, error } = await supabase.from("players").select("*").order("balance", { ascending: false })

        if (error) {
          throw error
        }

        setPlayers(data || [])
      } catch (error: any) {
        console.error("Error fetching players:", error)
        setError(`Failed to load players: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()

    // Set up real-time subscription
    const subscription = supabase
      .channel("players-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((current) => [...current, payload.new as Player])
          } else if (payload.eventType === "UPDATE") {
            setPlayers((current) =>
              current.map((player) => (player.id === payload.new.id ? (payload.new as Player) : player)),
            )
          } else if (payload.eventType === "DELETE") {
            setPlayers((current) => current.filter((player) => player.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading player balances...</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p>No players found. Add players to get started.</p>
        ) : (
          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.id} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{player.name}</span>
                  <span className="font-mono">${player.balance}</span>
                </div>
                <Progress value={(player.balance / maxBalance) * 100} className="h-2 [&>div]:bg-green-500" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

