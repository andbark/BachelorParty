"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { Trophy } from "lucide-react"

type Player = {
  id: string
  name: string
  balance: number
  games_played: number
  games_won: number
  initial_balance: number
  winnings: number
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data, error } = await supabase.from("players").select("*")

    if (error) {
      toast({
        title: "Error fetching players",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    // Calculate winnings (current balance - initial balance)
    const playersWithWinnings =
      data?.map((player) => ({
        ...player,
        initial_balance: 300, // Assuming all players start with $300
        winnings: player.balance - 300,
      })) || []

    // Sort by winnings (descending)
    playersWithWinnings.sort((a, b) => b.winnings - a.winnings)

    setPlayers(playersWithWinnings)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === 0
                      ? "bg-yellow-500 text-yellow-950"
                      : index === 1
                        ? "bg-gray-300 text-gray-700"
                        : index === 2
                          ? "bg-amber-700 text-amber-50"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-medium">{player.name}</span>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${player.winnings > 0 ? "text-green-500" : player.winnings < 0 ? "text-red-500" : ""}`}
                >
                  {player.winnings > 0 ? "+" : ""}
                  {player.winnings}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.games_won}/{player.games_played} games
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
