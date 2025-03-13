"use client"

import { Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useGameStore } from "../../lib/store"

export function PlayerBalances() {
  const players = useGameStore((state) => state.players)

  // Sort players by balance
  const sortedPlayers = [...players].sort((a, b) => b.balance - a.balance)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Player Balances
        </CardTitle>
        <CardDescription>Current balance for each player</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="font-medium">{player.name}</div>
              <div
                className={`font-bold ${player.balance >= 300 ? "text-green-600" : player.balance <= 0 ? "text-red-600" : ""}`}
              >
                ${player.balance}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
