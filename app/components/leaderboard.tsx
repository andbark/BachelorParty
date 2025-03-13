"use client"

import { Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/store"

export function Leaderboard() {
  const players = useGameStore((state) => state.players)

  // Sort players by total winnings
  const sortedPlayers = [...players].sort((a, b) => b.totalWinnings - a.totalWinnings)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top winners by games and money</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPlayers.slice(0, 5).map((player, index) => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0
                      ? "bg-yellow-400 text-yellow-900"
                      : index === 1
                        ? "bg-gray-200 text-gray-700"
                        : index === 2
                          ? "bg-amber-700 text-amber-100"
                          : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-muted-foreground">{player.gamesWon} games won</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">${player.totalWinnings}</div>
                <div className="text-sm text-muted-foreground">total winnings</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
