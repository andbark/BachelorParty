"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PlayerManager() {
  const [players, setPlayers] = useState([
    { id: "1", name: "Player 1", balance: 300 },
    { id: "2", name: "Player 2", balance: 300 },
  ])

  const [newPlayerName, setNewPlayerName] = useState("")

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([
        ...players,
        {
          id: (players.length + 1).toString(),
          name: newPlayerName,
          balance: 300,
        },
      ])
      setNewPlayerName("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="playerName">Player Name</Label>
          <Input
            id="playerName"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
          />
        </div>
        <Button className="mt-auto" onClick={addPlayer}>
          Add Player
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {players.map((player) => (
          <Card key={player.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{player.name}</h3>
                <p className="text-sm text-muted-foreground">Balance: ${player.balance}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
