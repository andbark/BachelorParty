"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GameManager() {
  const [activeGames, setActiveGames] = useState([
    { id: "1", type: "Poker", players: ["Player 1", "Player 2", "Player 3"], status: "in_progress" },
    { id: "2", type: "Beer Pong", players: ["Player 2", "Player 4"], status: "in_progress" },
  ])

  const completeGame = (id: string) => {
    setActiveGames(activeGames.filter((game) => game.id !== id))
  }

  return (
    <div className="space-y-4">
      {activeGames.length === 0 ? (
        <p>No active games at the moment.</p>
      ) : (
        <div className="grid gap-4">
          {activeGames.map((game) => (
            <Card key={game.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{game.type}</h3>
                    <p className="text-sm text-muted-foreground">Players: {game.players.join(", ")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="default" size="sm" onClick={() => completeGame(game.id)}>
                      Complete Game
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
